import type {
  CacheManager,
  CodeIntelligenceService,
  ContextEngine,
  ContextGraphNode,
  ContextNode,
  ContextNodeExclusionReason,
  ContextNodeId,
  ContextProjection,
  ContextProjectionBudgetDecision,
  ContextProjectionCacheMetadata,
  ContextProjectionRedactionSummary,
  ContextProjectionRequest,
  ContextProjectionResult,
  ExcludedContextNode,
  JsonObject,
  ProjectedContextNode,
  RedactionClass,
  RedactionMetadata,
  SessionId
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { PROJECTION_CACHE_NAMESPACE, createProjectionCacheEntry, projectionCacheKey } from "@deepseek/memory-cache-management";
import type { ProjectionCacheInput } from "@deepseek/memory-cache-management";
import { createSecretRedactionDecision, redactSecretText } from "@deepseek/policy-sandbox";

export const CONTEXT_PROJECTION_CACHE_NAMESPACE = PROJECTION_CACHE_NAMESPACE;

export interface InMemoryContextEngineOptions {
  readonly cache?: CacheManager;
  readonly codeIntelligence?: CodeIntelligenceService;
}

export class InMemoryContextEngine implements ContextEngine {
  private readonly nodes = new Map<string, ContextGraphNode[]>();
  private readonly projectionCache = new Map<string, ContextProjectionResult>();
  private readonly cache?: CacheManager;
  private readonly codeIntelligence?: CodeIntelligenceService;

  constructor(options: InMemoryContextEngineOptions = {}) {
    if (options.cache) this.cache = options.cache;
    if (options.codeIntelligence) this.codeIntelligence = options.codeIntelligence;
  }

  async addNode(sessionId: SessionId, node: ContextNode): Promise<void> {
    const current = this.nodes.get(sessionId) ?? [];
    current.push(normalizeStoredNode(sessionId, node));
    this.nodes.set(sessionId, current);
  }

  async project(sessionId: SessionId, prompt: string): Promise<ContextProjection> {
    const request = createProjectionRequest({
      sessionId,
      prompt,
      hardLimitTokens: 8192,
      softLimitTokens: 6144,
      availableRedactionClasses: ["public", "internal", "sensitive"]
    });
    const projection = await this.projectGraph(request);
    return {
      prompt: projection.prompt,
      nodes: projection.selectedNodes.map((node) => ({
        id: node.id,
        kind: node.kind,
        content: node.content,
        metadata: {
          source: node.source,
          priority: node.priority,
          estimatedTokens: node.estimatedTokens,
          redactionClass: node.redaction.class
        }
      }))
    };
  }

  async projectGraph(request: ContextProjectionRequest): Promise<ContextProjectionResult> {
    if (request.schemaVersion !== CONTEXT_PROJECTION_SCHEMA_VERSION) {
      return rejectedProjection(request, "unsupported-schema", "Unsupported context projection schema version");
    }

    const baseCandidates = this.candidatesFor(request);
    const candidates = await this.enrichCandidates(request, baseCandidates);
    const cacheInput = buildProjectionCacheInput(request, candidates);
    const cacheKey = projectionCacheKey(cacheInput);
    if (this.cache) {
      const cached = await this.cache.get<ContextProjectionResult>(cacheKey);
      if (cached) {
        return freezeProjection({
          ...cached.value,
          cache: {
            ...cached.value.cache,
            hit: true
          },
          replayFingerprint: `${cached.value.replayFingerprint}:cache-hit`
        });
      }
    } else {
      const local = this.projectionCache.get(cacheKey);
      if (local) {
        return freezeProjection({
          ...local,
          cache: {
            ...local.cache,
            hit: true
          },
          replayFingerprint: `${local.replayFingerprint}:cache-hit`
        });
      }
    }

    const filtered = filterCandidates(request, candidates);
    const ordered = filtered.eligible.sort(compareNodes);
    const selected: ProjectedContextNode[] = [];
    const excluded: ExcludedContextNode[] = [...filtered.excluded];
    let selectedTokens = 0;
    let excludedTokens = excluded.reduce((total, node) => total + node.estimatedTokens, 0);
    const hardLimit = Math.max(0, request.budget.hardLimitTokens);
    const softLimit = request.budget.softLimitTokens;

    for (const node of ordered) {
      const estimatedTokens = estimateNodeTokens(node);
      if (selectedTokens + estimatedTokens > hardLimit) {
        excluded.push(excludedNode(node, "budget-exceeded", estimatedTokens));
        excludedTokens += estimatedTokens;
        continue;
      }
      selected.push(projectedNode(node, estimatedTokens));
      selectedTokens += estimatedTokens;
    }

    const budget = budgetDecision(request, selectedTokens, excludedTokens);
    const rejectedByBudget = selected.length === 0 && candidates.length > 0 && excluded.some((node) => node.reason === "budget-exceeded");
    const status = rejectedByBudget ? "rejected" : budget.status === "degraded" || excluded.length > 0 ? "degraded" : "completed";
    const redaction = redactionSummary(selected, excluded, filtered.secretLikeBlocked);
    const cache: ContextProjectionCacheMetadata = {
      namespace: CONTEXT_PROJECTION_CACHE_NAMESPACE,
      key: cacheKey,
      hit: false,
      dependencyFingerprints: dependencyFingerprints(candidates)
    };
    const result: ContextProjectionResult = {
      schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
      status,
      sessionId: request.sessionId,
      ...(request.turnId ? { turnId: request.turnId } : {}),
      prompt: selected.map((node) => node.content).join("\n"),
      selectedNodes: selected,
      excludedNodes: excluded,
      estimatedTokens: selectedTokens,
      budget: rejectedByBudget ? { ...budget, status: "rejected", reason: "hard-budget-exceeded" } : budget,
      redaction,
      cache,
      ordering: {
        strategy: "priority-recency-stable",
        tieBreak: ["priority", "createdAt", "id"]
      },
      replayFingerprint: replayFingerprint(request, selected, excluded),
      ...(rejectedByBudget ? { error: projectionError("CONTEXT_PROJECTION_BUDGET_EXCEEDED", "Context projection exceeded hard budget") } : {})
    };
    const frozen = freezeProjection(result);
    if (frozen.status !== "rejected") {
      if (this.cache) {
        await this.cache.set(createProjectionCacheEntry(cacheInput, frozen, new Date(0).toISOString()));
      } else {
        this.projectionCache.set(cacheKey, frozen);
      }
    }
    return frozen;
  }

  private candidatesFor(request: ContextProjectionRequest): readonly ContextGraphNode[] {
    const stored = this.nodes.get(request.sessionId) ?? [];
    const promptNode = normalizeGraphNode(request.sessionId, {
      schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
      id: asId<"contextNode">(`context-current-${request.sessionId}-${request.turnId ?? "turn"}`),
      kind: "user",
      source: "user",
      lifecycle: "turn",
      scope: {
        sessionId: request.sessionId,
        ...(request.turnId ? { turnId: request.turnId } : {}),
        ...(request.scope.agentId ? { agentId: request.scope.agentId } : {}),
        ...(request.scope.workspaceRoot ? { workspaceRoot: request.scope.workspaceRoot } : {}),
        ...(request.scope.host ? { host: request.scope.host } : {})
      },
      priority: 1000,
      content: request.prompt,
      estimatedTokens: countTokens(request.prompt),
      redaction: classifyRedaction(request.prompt, { class: "public" }),
      provenance: { source: "runtime.prompt" },
      dependencyFingerprints: [`prompt:${stableHash(request.prompt)}`],
      compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
      createdAt: "1970-01-01T00:00:00.000Z"
    });
    const requested = request.candidateNodes ?? [];
    return [...stored, ...requested.map((node) => normalizeGraphNode(request.sessionId, node)), promptNode];
  }

  private async enrichCandidates(
    request: ContextProjectionRequest,
    candidates: readonly ContextGraphNode[]
  ): Promise<readonly ContextGraphNode[]> {
    if (!this.codeIntelligence) return candidates;
    try {
      const enrich = await this.codeIntelligence.contextNodes({
        sessionId: request.sessionId,
        root: request.scope.workspaceRoot ?? "/workspace",
        includeDiagnostics: true,
        includeSymbols: true
      });
      if (!enrich.ok || !enrich.value) return candidates;
      const seen = new Set(candidates.map((node) => String(node.id)));
      const extras: ContextGraphNode[] = [];
      for (const node of enrich.value.nodes) {
        const id = String(node.id);
        if (seen.has(id)) continue;
        seen.add(id);
        extras.push(normalizeGraphNode(request.sessionId, node));
      }
      return extras.length > 0 ? [...candidates, ...extras] : candidates;
    } catch {
      return candidates;
    }
  }
}

export interface ProjectionRequestInput {
  readonly sessionId: SessionId;
  readonly prompt: string;
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
  readonly availableRedactionClasses?: readonly RedactionClass[];
}

export function createProjectionRequest(input: ProjectionRequestInput): ContextProjectionRequest {
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId: input.sessionId,
    purpose: "model-request",
    prompt: input.prompt,
    budget: {
      hardLimitTokens: input.hardLimitTokens,
      ...(input.softLimitTokens !== undefined ? { softLimitTokens: input.softLimitTokens } : {}),
      reservedOutputTokens: 1024
    },
    scope: {
      sessionId: input.sessionId,
      availableRedactionClasses: input.availableRedactionClasses ?? ["public", "internal"]
    },
    trace: {
      traceId: asId<"trace">(`trace-context-${input.sessionId}`),
      spanId: asId<"span">(`span-context-${input.sessionId}`),
      correlationId: asId<"correlation">(`corr-context-${input.sessionId}`),
      sessionId: input.sessionId
    },
    policy: { redaction: "fail-closed" },
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  };
}

export interface ProjectIndexDocumentInput {
  readonly path: string;
  readonly content: string;
  readonly language?: string;
  readonly redactionClass?: RedactionClass;
}

export interface ProjectIndexRefreshRequest {
  readonly sessionId: SessionId;
  readonly workspaceRoot: string;
  readonly documents: readonly ProjectIndexDocumentInput[];
  readonly indexId?: string;
}

export interface ProjectIndexQueryRequest {
  readonly sessionId: SessionId;
  readonly workspaceRoot: string;
  readonly query: string;
  readonly limit?: number;
  readonly indexId?: string;
  readonly documentsFingerprint?: string;
}

export interface ProjectIndexEntry extends JsonObject {
  readonly path: string;
  readonly language: string;
  readonly contentHash: string;
  readonly excerpt: string;
  readonly estimatedTokens: number;
  readonly redaction: RedactionMetadata;
}

export interface ProjectIndexRefreshResult extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly familyId: "context.project-index";
  readonly status: "completed";
  readonly indexId: string;
  readonly sessionId: SessionId;
  readonly workspaceRoot: string;
  readonly documentCount: number;
  readonly documentsFingerprint: string;
  readonly replayFingerprint: string;
  readonly diagnostics: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export interface ProjectIndexQueryResult extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly familyId: "context.project-index";
  readonly status: "completed" | "degraded";
  readonly indexId: string;
  readonly sessionId: SessionId;
  readonly workspaceRoot: string;
  readonly query: string;
  readonly resultCount: number;
  readonly entries: readonly ProjectIndexEntry[];
  readonly contextNodes: readonly ContextGraphNode[];
  readonly stale: boolean;
  readonly diagnostics: readonly string[];
  readonly replayFingerprint: string;
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export class DeterministicProjectIndex {
  private readonly indexes = new Map<string, { readonly refresh: ProjectIndexRefreshResult; readonly documents: readonly ProjectIndexEntry[] }>();

  refresh(request: ProjectIndexRefreshRequest): ProjectIndexRefreshResult {
    const documents = request.documents
      .map((document) => indexEntry(document))
      .sort((left, right) => left.path.localeCompare(right.path));
    const documentsFingerprint = stableHash(JSON.stringify(documents.map((document) => [document.path, document.contentHash])));
    const indexId = request.indexId ?? `project-index-${stableHash(`${request.sessionId}:${request.workspaceRoot}`)}`;
    const refresh: ProjectIndexRefreshResult = {
      schemaVersion: "1.0.0",
      familyId: "context.project-index",
      status: "completed",
      indexId,
      sessionId: request.sessionId,
      workspaceRoot: request.workspaceRoot,
      documentCount: documents.length,
      documentsFingerprint,
      replayFingerprint: `context.project-index.refresh:${stableHash(JSON.stringify({
        indexId,
        sessionId: request.sessionId,
        workspaceRoot: request.workspaceRoot,
        documentsFingerprint
      }))}`,
      diagnostics: [],
      redaction: { class: "internal", fields: ["workspaceRoot", "documents.path", "documents.excerpt"] }
    };
    this.indexes.set(indexKey(request.sessionId, request.workspaceRoot, indexId), { refresh, documents });
    return refresh;
  }

  query(request: ProjectIndexQueryRequest): ProjectIndexQueryResult {
    const indexId = request.indexId ?? `project-index-${stableHash(`${request.sessionId}:${request.workspaceRoot}`)}`;
    const index = this.indexes.get(indexKey(request.sessionId, request.workspaceRoot, indexId));
    const stale = Boolean(index && request.documentsFingerprint && request.documentsFingerprint !== index.refresh.documentsFingerprint);
    const diagnostics: string[] = [];
    if (!index) diagnostics.push("context.project-index.missing-index");
    if (stale) diagnostics.push("context.project-index.stale-index");
    const limit = Math.max(0, request.limit ?? 20);
    const query = request.query.trim().toLowerCase();
    const entries = (index?.documents ?? [])
      .filter((entry) => query.length === 0 || entry.path.toLowerCase().includes(query) || entry.excerpt.toLowerCase().includes(query))
      .slice(0, limit);
    if (index && entries.length === limit && limit > 0) diagnostics.push("context.project-index.output-bounded");
    const contextNodes = entries.map((entry, position) => projectIndexNode(request.sessionId, request.workspaceRoot, entry, position, index?.refresh.documentsFingerprint ?? "missing"));
    return {
      schemaVersion: "1.0.0",
      familyId: "context.project-index",
      status: diagnostics.length > 0 ? "degraded" : "completed",
      indexId,
      sessionId: request.sessionId,
      workspaceRoot: request.workspaceRoot,
      query: request.query,
      resultCount: entries.length,
      entries,
      contextNodes,
      stale,
      diagnostics,
      replayFingerprint: `context.project-index.query:${stableHash(JSON.stringify({
        indexId,
        sessionId: request.sessionId,
        workspaceRoot: request.workspaceRoot,
        query: request.query,
        entries: entries.map((entry) => [entry.path, entry.contentHash]),
        stale,
        diagnostics
      }))}`,
      redaction: { class: "internal", fields: ["workspaceRoot", "entries.path", "entries.excerpt", "contextNodes.content"] }
    };
  }
}

function normalizeStoredNode(sessionId: SessionId, node: ContextNode): ContextGraphNode {
  return normalizeGraphNode(sessionId, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: node.id,
    kind: node.kind,
    source: stringField(node.metadata, "source", "host") as ContextGraphNode["source"],
    lifecycle: stringField(node.metadata, "lifecycle", "session") as ContextGraphNode["lifecycle"],
    scope: {
      sessionId,
      ...(typeof node.metadata.workspaceRoot === "string" ? { workspaceRoot: node.metadata.workspaceRoot } : {})
    },
    priority: numberField(node.metadata, "priority", 100),
    content: node.content,
    ...(typeof node.metadata.contentRef === "string" ? { contentRef: node.metadata.contentRef } : {}),
    ...(typeof node.metadata.estimatedTokens === "number" ? { estimatedTokens: node.metadata.estimatedTokens } : {}),
    redaction: { class: stringField(node.metadata, "redactionClass", "internal") as RedactionClass },
    provenance: isJsonObject(node.metadata.provenance) ? node.metadata.provenance : { source: "context.addNode" },
    dependencyFingerprints: stringArrayField(node.metadata, "dependencyFingerprints", [`node:${node.id}`]),
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: stringField(node.metadata, "createdAt", "1970-01-01T00:00:00.000Z"),
    secretDecision: createSecretRedactionDecision(node.content, { class: stringField(node.metadata, "redactionClass", "internal") as RedactionClass }),
    ...(node.metadata.stale === true ? { stale: true } : {}),
    ...(node.metadata.invalidated === true ? { invalidated: true } : {})
  });
}

function normalizeGraphNode(sessionId: SessionId, node: ContextGraphNode): ContextGraphNode {
  const content = String(node.content ?? "");
  const redaction = classifyRedaction(content, node.redaction);
  const secretDecision = node.secretDecision ?? createSecretRedactionDecision(content, redaction);
  return {
    ...node,
    schemaVersion: node.schemaVersion || CONTEXT_PROJECTION_SCHEMA_VERSION,
    scope: {
      ...node.scope,
      sessionId: node.scope.sessionId ?? sessionId
    },
    priority: Number.isFinite(node.priority) ? node.priority : 0,
    content,
    estimatedTokens: node.estimatedTokens ?? countTokens(content),
    redaction,
    secretDecision,
    dependencyFingerprints: node.dependencyFingerprints.length > 0 ? node.dependencyFingerprints : [`node:${node.id}`],
    compatibility: node.compatibility ?? { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: node.createdAt || "1970-01-01T00:00:00.000Z"
  };
}

function filterCandidates(request: ContextProjectionRequest, candidates: readonly ContextGraphNode[]): {
  readonly eligible: ContextGraphNode[];
  readonly excluded: ExcludedContextNode[];
  readonly secretLikeBlocked: number;
} {
  const eligible: ContextGraphNode[] = [];
  const excluded: ExcludedContextNode[] = [];
  const seen = new Set<string>();
  let secretLikeBlocked = 0;
  for (const node of candidates) {
    const reason = exclusionReason(request, node, seen);
    if (reason) {
      if (reason === "unsafe-secret" || reason === "policy-denied") secretLikeBlocked++;
      excluded.push(excludedNode(node, reason));
      continue;
    }
    seen.add(String(node.id));
    eligible.push(node);
  }
  return { eligible, excluded, secretLikeBlocked };
}

function exclusionReason(request: ContextProjectionRequest, node: ContextGraphNode, seen: Set<string>): ContextNodeExclusionReason | undefined {
  if (seen.has(String(node.id))) return "duplicate";
  if (node.schemaVersion !== CONTEXT_PROJECTION_SCHEMA_VERSION) return "unsupported-schema";
  if (node.content.trim().length === 0) return "empty-content";
  if (node.stale) return "stale";
  if (node.invalidated) return "invalidated";
  if (node.scope.sessionId && node.scope.sessionId !== request.sessionId) return "outside-scope";
  if (node.scope.agentId && request.scope.agentId && node.scope.agentId !== request.scope.agentId) return "outside-scope";
  if (node.secretDecision && ["deny", "exclude", "rewrite"].includes(node.secretDecision.action)) return "policy-denied";
  if (isSecretLike(node.content) || node.redaction.class === "secret") return "unsafe-secret";
  if (!request.scope.availableRedactionClasses.includes(node.redaction.class)) return "redaction-unavailable";
  return undefined;
}

function compareNodes(left: ContextGraphNode, right: ContextGraphNode): number {
  if (right.priority !== left.priority) return right.priority - left.priority;
  const rightTime = Date.parse(right.createdAt);
  const leftTime = Date.parse(left.createdAt);
  if (rightTime !== leftTime) return rightTime - leftTime;
  return String(left.id).localeCompare(String(right.id));
}

function projectedNode(node: ContextGraphNode, estimatedTokens = estimateNodeTokens(node)): ProjectedContextNode {
  return {
    id: node.id,
    kind: node.kind,
    source: node.source,
    content: redactContent(node.content, node.redaction),
    estimatedTokens,
    priority: node.priority,
    redaction: node.redaction,
    provenance: node.provenance,
    dependencyFingerprints: node.dependencyFingerprints,
    ...(node.secretDecision ? { secretDecision: node.secretDecision } : {}),
    ...(node.auditEvidence ? { auditEvidence: node.auditEvidence } : {})
  };
}

function excludedNode(node: ContextGraphNode, reason: ContextNodeExclusionReason, estimatedTokens = estimateNodeTokens(node)): ExcludedContextNode {
  return {
    id: node.id,
    kind: node.kind,
    source: node.source,
    estimatedTokens,
    priority: node.priority,
    reason,
    redaction: { class: node.redaction.class },
    ...(node.secretDecision ? { secretDecision: node.secretDecision } : {}),
    ...(node.auditEvidence ? { auditEvidence: node.auditEvidence } : {})
  };
}

function budgetDecision(request: ContextProjectionRequest, selectedTokens: number, excludedTokens: number): ContextProjectionBudgetDecision {
  const softLimit = request.budget.softLimitTokens;
  const reservedOutputTokens = request.budget.reservedOutputTokens ?? 0;
  const status = selectedTokens > request.budget.hardLimitTokens ? "rejected" : softLimit !== undefined && selectedTokens > softLimit ? "degraded" : "allowed";
  return {
    status,
    hardLimitTokens: request.budget.hardLimitTokens,
    ...(softLimit !== undefined ? { softLimitTokens: softLimit } : {}),
    reservedOutputTokens,
    selectedTokens,
    excludedTokens,
    reason: status === "allowed" ? "within-budget" : status === "degraded" ? "soft-budget-exceeded" : "hard-budget-exceeded"
  };
}

function redactionSummary(selected: readonly ProjectedContextNode[], excluded: readonly ExcludedContextNode[], secretLikeBlocked: number): ContextProjectionRedactionSummary {
  const classes = [...new Set([...selected.map((node) => node.redaction.class), ...excluded.map((node) => node.redaction.class)])].sort() as RedactionClass[];
  return {
    selected: selected.length,
    redacted: selected.filter((node) => node.content.includes("[REDACTED]")).length,
    excluded: excluded.length,
    classes,
    secretLikeBlocked
  };
}

function rejectedProjection(request: ContextProjectionRequest, reason: ContextNodeExclusionReason, message: string): ContextProjectionResult {
  return freezeProjection({
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    status: "rejected",
    sessionId: request.sessionId,
    ...(request.turnId ? { turnId: request.turnId } : {}),
    prompt: "",
    selectedNodes: [],
    excludedNodes: [],
    estimatedTokens: 0,
    budget: {
      status: "rejected",
      hardLimitTokens: request.budget.hardLimitTokens,
      ...(request.budget.softLimitTokens !== undefined ? { softLimitTokens: request.budget.softLimitTokens } : {}),
      reservedOutputTokens: request.budget.reservedOutputTokens ?? 0,
      selectedTokens: 0,
      excludedTokens: 0,
      reason
    },
    redaction: { selected: 0, redacted: 0, excluded: 0, classes: [], secretLikeBlocked: 0 },
    cache: {
      namespace: CONTEXT_PROJECTION_CACHE_NAMESPACE,
      key: "projection-rejected",
      hit: false,
      dependencyFingerprints: [],
      invalidationReason: reason
    },
    ordering: {
      strategy: "priority-recency-stable",
      tieBreak: ["priority", "createdAt", "id"]
    },
    replayFingerprint: `rejected:${reason}:${request.sessionId}`,
    error: projectionError("CONTEXT_PROJECTION_REJECTED", message, { reason })
  });
}

function projectionError(code: string, message: string, details: JsonObject = {}): import("@deepseek/platform-contracts").RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "public" },
    details
  };
}

function freezeProjection(result: ContextProjectionResult): ContextProjectionResult {
  for (const node of result.selectedNodes) Object.freeze(node);
  for (const node of result.excludedNodes) Object.freeze(node);
  Object.freeze(result.selectedNodes);
  Object.freeze(result.excludedNodes);
  Object.freeze(result.budget);
  Object.freeze(result.redaction);
  Object.freeze(result.cache);
  Object.freeze(result.ordering);
  return Object.freeze(result);
}

function estimateNodeTokens(node: ContextGraphNode): number {
  return node.estimatedTokens ?? countTokens(node.content);
}

function countTokens(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function dependencyFingerprints(nodes: readonly ContextGraphNode[]): readonly string[] {
  return [...new Set(nodes.flatMap((node) => node.dependencyFingerprints))].sort();
}

function buildProjectionCacheInput(request: ContextProjectionRequest, candidates: readonly ContextGraphNode[]): ProjectionCacheInput {
  const requestFingerprint = stableHash(JSON.stringify({
    schemaVersion: request.schemaVersion,
    sessionId: request.sessionId,
    turnId: request.turnId ?? "",
    purpose: request.purpose,
    prompt: request.prompt,
    budget: request.budget,
    scope: request.scope,
    candidates: candidates.map((node) => ({
      id: node.id,
      priority: node.priority,
      createdAt: node.createdAt,
      stale: node.stale === true,
      invalidated: node.invalidated === true,
      content: stableHash(node.content)
    }))
  }));
  return {
    requestFingerprint,
    dependencyFingerprints: dependencyFingerprints(candidates)
  };
}

function replayFingerprint(request: ContextProjectionRequest, selected: readonly ProjectedContextNode[], excluded: readonly ExcludedContextNode[]): string {
  return stableHash(JSON.stringify({
    sessionId: request.sessionId,
    purpose: request.purpose,
    selected: selected.map((node) => [node.id, node.estimatedTokens]),
    excluded: excluded.map((node) => [node.id, node.reason])
  }));
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function classifyRedaction(content: string, redaction: RedactionMetadata): RedactionMetadata {
  const decision = createSecretRedactionDecision(content, redaction);
  if (decision.classification.detected) return { class: "secret", fields: ["content"] };
  return redaction;
}

function isSecretLike(value: string): boolean {
  return createSecretRedactionDecision(value).classification.detected;
}

function redactContent(value: string, redaction: RedactionMetadata): string {
  if (redaction.class !== "secret") return value;
  return redactSecretText(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(metadata: JsonObject, key: string, fallback: string): string {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberField(metadata: JsonObject, key: string, fallback: number): number {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArrayField(metadata: JsonObject, key: string, fallback: readonly string[]): readonly string[] {
  const value = metadata[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : fallback;
}

function indexEntry(document: ProjectIndexDocumentInput): ProjectIndexEntry {
  const redaction = { class: document.redactionClass ?? "internal" } satisfies RedactionMetadata;
  const excerpt = redactContent(firstWords(document.content, 40), redaction);
  return {
    path: document.path,
    language: document.language ?? languageForPath(document.path),
    contentHash: stableHash(document.content),
    excerpt,
    estimatedTokens: countTokens(document.content),
    redaction
  };
}

function projectIndexNode(sessionId: SessionId, workspaceRoot: string, entry: ProjectIndexEntry, position: number, documentsFingerprint: string): ContextGraphNode {
  return normalizeGraphNode(sessionId, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`project-index-${stableHash(`${workspaceRoot}:${entry.path}`)}`),
    kind: "file",
    source: "workspace",
    lifecycle: "session",
    scope: { sessionId, workspaceRoot },
    priority: 900 - position,
    content: `${entry.path}\n${entry.excerpt}`,
    estimatedTokens: entry.estimatedTokens,
    redaction: entry.redaction,
    provenance: {
      source: "context.project-index",
      path: entry.path,
      language: entry.language,
      contentHash: entry.contentHash
    },
    dependencyFingerprints: [`project-index:${documentsFingerprint}`, `file:${entry.contentHash}`],
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: new Date(0).toISOString()
  });
}

function indexKey(sessionId: SessionId, workspaceRoot: string, indexId: string): string {
  return `${sessionId}:${workspaceRoot}:${indexId}`;
}

function firstWords(content: string, maxWords: number): string {
  const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
  return words.slice(0, maxWords).join(" ");
}

function languageForPath(path: string): string {
  const extension = path.split(".").at(-1)?.toLowerCase();
  if (extension === "ts" || extension === "tsx") return "typescript";
  if (extension === "js" || extension === "jsx") return "javascript";
  if (extension === "json") return "json";
  if (extension === "md") return "markdown";
  return "text";
}
