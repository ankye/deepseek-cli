import type {
  AgentLoopRequest,
  AgentLoopReferenceContextItem,
  ContextGraphNode,
  ContextPipelineManifest,
  ContextProjectionResult,
  JsonObject,
  RedactedError,
  RuntimeCompactBoundaryEvidence,
  RuntimeMemoryCollectionEvidence,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  SymbolReference,
  TraceContext
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createCompactBoundaryEvidence } from "@deepseek/memory-cache-management";
import { kernelError } from "./errors.js";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { memoryContextCandidates } from "./memory-context.js";
import { countTokens, stableHash } from "./trace.js";

export interface AgentLoopContextProjection extends JsonObject {
  readonly projection: ContextProjectionResult;
  readonly resolvedReferenceCount: number;
  readonly unresolvedReferences: readonly JsonObject[];
  readonly memoryEvidence?: RuntimeMemoryCollectionEvidence;
  readonly compactBoundary?: RuntimeCompactBoundaryEvidence;
}

const projectionReferenceEvidence = new WeakMap<ContextProjectionResult, {
  readonly resolvedReferenceCount: number;
  readonly unresolvedReferences: readonly JsonObject[];
  readonly memoryEvidence?: RuntimeMemoryCollectionEvidence;
  readonly codeEvidence?: RuntimeMemoryCollectionEvidence;
}>();

const PAGEINDEX_EVIDENCE_USAGE_QUALIFIER = "Treat this as historical recall evidence; verify against current workspace state before relying on it because it may be stale or incomplete.";

export function projectionEventData(projection: ContextProjectionResult): JsonObject {
  const referenceEvidence = projectionReferenceEvidence.get(projection);
  return {
    schemaVersion: projection.schemaVersion,
    status: projection.status,
    selectedNodeCount: projection.selectedNodes.length,
    excludedNodeCount: projection.excludedNodes.length,
    estimatedTokens: projection.estimatedTokens,
    budget: projection.budget,
    redaction: projection.redaction,
    redactionEvidence: projectionRedactionEvidence(projection),
    ...(referenceEvidence
      ? {
          referenceEvidence: {
            resolvedReferenceCount: referenceEvidence.resolvedReferenceCount,
            unresolvedReferences: referenceEvidence.unresolvedReferences,
            redaction: { class: "internal", fields: ["unresolvedReferences.targetId"] }
          }
        }
      : {}),
    ...(referenceEvidence?.memoryEvidence ? { memoryEvidence: referenceEvidence.memoryEvidence } : {}),
    ...(referenceEvidence?.codeEvidence ? { codeEvidence: referenceEvidence.codeEvidence } : {}),
    cache: projection.cache,
    ...(projection.pipeline ? { pipeline: pipelineEventData(projection.pipeline) } : {}),
    replayFingerprint: projection.replayFingerprint
  };
}

function pipelineEventData(pipeline: ContextPipelineManifest): JsonObject {
  return {
    schemaVersion: pipeline.schemaVersion,
    manifestId: pipeline.manifestId,
    pipelineFingerprint: pipeline.pipelineFingerprint,
    layers: pipeline.layers,
    prefixHashes: pipeline.prefixHashes,
    blockCount: pipeline.blocks.length,
    excludedBlockCount: pipeline.excludedBlocks.length,
    tokenTotals: pipeline.tokenTotals,
    cacheHintSummary: pipeline.cacheHintSummary,
    diagnostics: pipeline.diagnostics,
    redaction: { class: "internal", fields: ["layers.blockIds", "layers.blockHashes", "prefixHashes.blockIds", "prefixHashes.blockHashes", "diagnostics"] }
  };
}

function projectionRedactionEvidence(projection: ContextProjectionResult): readonly JsonObject[] {
  return projection.excludedNodes
    .filter((node) => node.secretDecision || node.reason === "unsafe-secret" || node.reason === "policy-denied")
    .map((node) => ({
      nodeId: node.id,
      reason: node.reason,
      action: node.secretDecision?.action ?? "exclude",
      reasonCode: node.secretDecision?.reasonCode ?? "context.secret.excluded",
      redactedText: node.secretDecision?.redactedText ?? "[REDACTED]",
      classification: node.secretDecision
        ? {
            detected: node.secretDecision.classification.detected,
            kind: node.secretDecision.classification.kind,
            exposure: node.secretDecision.classification.exposure,
            reasonCode: node.secretDecision.classification.reasonCode,
            occurrences: node.secretDecision.classification.occurrences,
            redactionClass: node.secretDecision.classification.redactionClass
          }
        : {
            detected: true,
            kind: "generic-secret",
            exposure: "unsafe",
            reasonCode: "secret.detected",
            occurrences: 1,
            redactionClass: "secret"
          },
      redaction: { class: "secret", fields: ["redactedText"] }
    }));
}

export async function* projectAgentLoopContext(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  trace: TraceContext
): AsyncGenerator<RuntimeEvent, AgentLoopContextProjection | undefined, void> {
  const budget = await deps.usage.contextBudget({
    sessionId,
    purpose: "model-request",
    requestedInputTokens: countTokens(request.prompt),
    reservedOutputTokens: 1024
  });

  const started = agentLoopEvent("context.projection.started", sessionId, turnId, trace, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    purpose: "model-request",
    promptHash: stableHash(request.prompt),
    budget
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  const referenceCandidates = await referenceContextCandidates(deps, request, sessionId, turnId);
  const memoryCandidates = await memoryContextCandidates(deps, request, sessionId, turnId);
  const codeReferenceCandidates = await codeReferenceContextCandidates(deps, request, sessionId, turnId);
  const candidateNodes = [
    ...referenceCandidates.nodes,
    ...memoryCandidates.nodes,
    ...codeReferenceCandidates.nodes
  ];

  const memoryCollected = agentLoopEvent("context.memory.collected", sessionId, turnId, trace, {
    ...memoryCandidates.evidence,
    codeEvidence: codeReferenceCandidates.evidence
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, memoryCollected);
  yield memoryCollected;

  const projection = await deps.context.projectGraph({
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId,
    purpose: "model-request",
    prompt: request.prompt,
    budget: {
      hardLimitTokens: budget.hardLimitTokens,
      ...(budget.softLimitTokens !== undefined ? { softLimitTokens: budget.softLimitTokens } : {}),
      reservedOutputTokens: budget.reservedOutputTokens
    },
    scope: {
      sessionId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      availableRedactionClasses: ["public", "internal", "sensitive"]
    },
    ...(candidateNodes.length > 0 ? { candidateNodes } : {}),
    ...(request.contextPipeline?.enabled ? { pipeline: { enabled: true } } : {}),
    trace,
    policy: {
      redaction: "fail-closed",
      ...(request.referenceContext
        ? {
            referenceContext: {
              setCount: request.referenceContext.setCount,
              itemCount: request.referenceContext.itemCount,
              resolvedReferenceCount: referenceCandidates.nodes.length,
              unresolvedReferences: [
                ...referenceCandidates.unresolved,
                ...codeReferenceCandidates.unresolved
              ]
            }
          }
        : {})
    },
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  });
  projectionReferenceEvidence.set(projection, {
    resolvedReferenceCount: referenceCandidates.nodes.length,
    unresolvedReferences: [
      ...referenceCandidates.unresolved,
      ...codeReferenceCandidates.unresolved
    ],
    memoryEvidence: memoryCandidates.evidence,
    codeEvidence: codeReferenceCandidates.evidence
  });

  const compactBoundary = compactBoundaryForProjection(projection, sessionId, turnId);
  if (compactBoundary) {
    const compactEvent = agentLoopEvent("context.compact.boundary", sessionId, turnId, trace, compactBoundary, request.agentId);
    await recordRuntimeAdapterEvent(deps, compactEvent);
    yield compactEvent;
  }

  if (projection.cache.hit) {
    const cacheHit = agentLoopEvent("context.projection.cache-hit", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, cacheHit);
    yield cacheHit;
  }
  if (projection.status === "degraded") {
    const degraded = agentLoopEvent("context.projection.degraded", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
  }
  if (projection.status === "rejected") {
    const rejected = agentLoopEvent("context.projection.rejected", sessionId, turnId, trace, projectionEventData(projection), request.agentId, projection.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
    await recordRuntimeAdapterEvent(deps, rejected);
    yield rejected;
    return {
      projection,
      resolvedReferenceCount: referenceCandidates.nodes.length,
      unresolvedReferences: [
        ...referenceCandidates.unresolved,
        ...codeReferenceCandidates.unresolved
      ],
      memoryEvidence: memoryCandidates.evidence,
      ...(compactBoundary ? { compactBoundary } : {})
    };
  }

  const completed = agentLoopEvent("context.projection.completed", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
  await recordRuntimeAdapterEvent(deps, completed);
  yield completed;
  return {
    projection,
    resolvedReferenceCount: referenceCandidates.nodes.length,
    unresolvedReferences: [
      ...referenceCandidates.unresolved,
      ...codeReferenceCandidates.unresolved
    ],
    memoryEvidence: memoryCandidates.evidence,
    ...(compactBoundary ? { compactBoundary } : {})
  };
}

async function codeReferenceContextCandidates(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId
): Promise<{ readonly nodes: readonly ContextGraphNode[]; readonly unresolved: readonly JsonObject[]; readonly evidence: RuntimeMemoryCollectionEvidence }> {
  const symbols = symbolQueriesFor(request.prompt);
  const nodes: ContextGraphNode[] = [];
  const unresolved: JsonObject[] = [];
  const diagnostics: RedactedError[] = [];
  for (const symbol of symbols) {
    try {
      const [definitions, references] = await Promise.all([
        deps.codeIntelligence.definitions(symbol),
        deps.codeIntelligence.references(symbol)
      ]);
      const entries = [
        ...definitions.map((entry) => ({ relation: "definition" as const, entry })),
        ...references.map((entry) => ({ relation: "reference" as const, entry }))
      ];
      if (entries.length === 0) {
        unresolved.push({ symbol, reason: "code-reference-not-found", redaction: { class: "internal", fields: ["symbol"] } });
        continue;
      }
      entries.slice(0, 12).forEach((item, index) => {
        nodes.push(codeReferenceNode(item.entry, item.relation, request, sessionId, turnId, index));
      });
    } catch (error) {
      diagnostics.push({
        code: "CODE_REFERENCE_LOOKUP_FAILED",
        message: error instanceof Error ? error.message : "Code reference lookup failed",
        retryable: true,
        redaction: { class: "internal" },
        details: { symbol }
      });
      unresolved.push({ symbol, reason: "code-reference-lookup-failed", redaction: { class: "internal", fields: ["symbol"] } });
    }
  }
  return {
    nodes,
    unresolved,
    evidence: {
      schemaVersion: "1.0.0",
      status: diagnostics.length > 0 || unresolved.length > 0 ? "degraded" : "completed",
      scopes: [],
      scopeCounts: { symbols: symbols.length, unresolved: unresolved.length },
      candidateCount: nodes.length,
      degradedScopes: [],
      diagnostics,
      replayFingerprint: stableHash(JSON.stringify({
        symbols,
        unresolved,
        fingerprints: nodes.flatMap((node) => node.dependencyFingerprints)
      })),
      redaction: { class: "internal", fields: ["diagnostics.details", "scopeCounts.symbols"] }
    }
  };
}

function codeReferenceNode(
  entry: SymbolReference,
  relation: "definition" | "reference",
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  index: number
): ContextGraphNode {
  const path = entry.path || "<unknown>";
  const line = entry.line ?? 1;
  const content = `${relation} ${entry.name} ${path}:${line} kind=${entry.kind ?? "unknown"}`;
  const key = `${relation}:${entry.name}:${path}:${line}:${entry.kind ?? "unknown"}`;
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`context-code-${sanitizeId(relation)}-${stableHash(key)}`),
    kind: "file",
    source: "code-intelligence",
    lifecycle: "turn",
    scope: {
      sessionId,
      turnId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      workspaceRoot: request.workspaceRoot,
      host: request.caller
    },
    priority: 590 - index,
    content,
    contentRef: `code-intelligence:${relation}:${path}:${line}`,
    estimatedTokens: countTokens(content),
    redaction: { class: "internal", fields: ["content", "contentRef"] },
    provenance: {
      source: "runtime.code-intelligence",
      relation,
      symbol: entry.name,
      path,
      line,
      provider: entry.provenance?.provider ?? "unknown",
      redaction: { class: "internal", fields: ["symbol", "path"] }
    },
    dependencyFingerprints: [`code-reference:${stableHash(key)}`],
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: "1970-01-01T00:00:00.000Z"
  };
}

function symbolQueriesFor(prompt: string): readonly string[] {
  const matches = [...prompt.matchAll(/`([A-Za-z_$][\w$]*)`|\b(?:symbol|function|class|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/gi)]
    .map((match) => match[1] ?? match[2])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return [...new Set(matches)].slice(0, 4);
}

function compactBoundaryForProjection(
  projection: ContextProjectionResult,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId
): RuntimeCompactBoundaryEvidence | undefined {
  if (projection.status === "rejected") return undefined;
  const softLimit = projection.budget.softLimitTokens;
  const selectedTokens = projection.budget.selectedTokens;
  const excludedTokens = projection.budget.excludedTokens;
  const softPressure = softLimit !== undefined && selectedTokens >= softLimit;
  const budgetExceeded = projection.excludedNodes.some((node) => node.reason === "budget-exceeded");
  if (!softPressure && !budgetExceeded) return undefined;
  return createCompactBoundaryEvidence({
    projectionFingerprint: projection.replayFingerprint,
    sessionId,
    turnId,
    selectedNodeCount: projection.selectedNodes.length,
    excludedNodeCount: projection.excludedNodes.length,
    selectedTokens,
    excludedTokens,
    hardLimitTokens: projection.budget.hardLimitTokens,
    ...(softLimit !== undefined ? { softLimitTokens: softLimit } : {})
  });
}

export async function referenceContextCandidates(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId
): Promise<{ readonly nodes: readonly ContextGraphNode[]; readonly unresolved: readonly JsonObject[] }> {
  const context = request.referenceContext;
  if (!context) return { nodes: [], unresolved: [] };
  const nodes: ContextGraphNode[] = [];
  const unresolved: JsonObject[] = [];
  for (const set of context.sets) {
    for (const item of set.items) {
      if (item.kind === "turn" && item.target.kind === "turn") {
        const pageNode = pageIndexTurnReferenceNode(item, request, sessionId, turnId, set.id);
        if (pageNode) {
          nodes.push(pageNode);
        } else {
          unresolved.push(unresolvedReference(item, "pageindex-metadata-incomplete"));
        }
        continue;
      }
      if (item.kind !== "file" || item.target.kind !== "file") {
        unresolved.push(unresolvedReference(item, "unsupported-reference-kind"));
        continue;
      }
      const inputPath = item.target.path ?? item.target.id;
      const resolved = deps.platform.resolveWorkspacePath(request.workspaceRoot, inputPath);
      if (!resolved.ok || !resolved.value) {
        unresolved.push(unresolvedReference(item, "path-resolution-failed"));
        continue;
      }
      const resolvedPath = resolved.value;
      if (!resolvedPath.safe) {
        unresolved.push(unresolvedReference(item, "unsafe-workspace-path"));
        continue;
      }
      let content: string;
      try {
        content = await deps.platform.readFile(resolvedPath.path);
      } catch {
        unresolved.push(unresolvedReference(item, "file-read-failed"));
        continue;
      }
      nodes.push({
        schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
        id: asId<"contextNode">(`context-reference-${sanitizeId(item.id)}`),
        kind: "file",
        source: "host",
        lifecycle: "turn",
        scope: {
          sessionId,
          turnId,
          ...(request.agentId ? { agentId: request.agentId } : {}),
          workspaceRoot: request.workspaceRoot,
          host: request.caller
        },
        priority: referencePriority(item),
        content: formatReferenceContent(item, resolvedPath.relativePath, content),
        contentRef: `file:${resolvedPath.relativePath}`,
        estimatedTokens: item.budget?.estimatedTokens ?? countTokens(content),
        redaction: { class: "internal", fields: ["content", "contentRef"] },
        provenance: {
          source: context.source,
          referenceSetId: set.id,
          referenceId: item.id,
          targetId: item.target.id,
          targetKind: item.target.kind,
          label: item.label,
          path: resolvedPath.relativePath,
          order: item.order,
          itemProvenance: item.provenance,
          redaction: { class: "internal", fields: ["targetId", "label", "path"] }
        },
        dependencyFingerprints: [
          `reference:${item.id}`,
          `file:${resolvedPath.relativePath}:${stableHash(content)}`
        ],
        compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
        createdAt: "1970-01-01T00:00:00.000Z"
      });
    }
  }
  return { nodes, unresolved };
}

function pageIndexTurnReferenceNode(
  item: AgentLoopReferenceContextItem,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  referenceSetId: string
): ContextGraphNode | undefined {
  const metadata = item.target.metadata;
  if (!metadata) return undefined;
  const pageId = stringMetadata(metadata, "pageId");
  const promptPreview = stringMetadata(metadata, "promptPreview");
  const assistantPreview = stringMetadata(metadata, "assistantPreview");
  if (!pageId || !promptPreview || !assistantPreview) return undefined;
  const sourceTurnId = item.target.turnId ?? item.target.id;
  const sourceSessionId = item.target.sessionId ?? sessionId;
  const scope = stringMetadata(metadata, "scope") ?? "session";
  const status = stringMetadata(metadata, "status") ?? "unknown";
  const traceId = stringMetadata(metadata, "traceId") ?? "";
  const createdAt = stringMetadata(metadata, "createdAt") ?? "1970-01-01T00:00:00.000Z";
  const freshnessStatus = stringMetadata(metadata, "freshnessStatus") ?? "unknown";
  const freshnessEvidence = freshnessEvidenceMetadata(metadata);
  const rankingReason = stringMetadata(metadata, "rankingReason") ?? "deterministic-text-match";
  const matchedFields = stringArrayMetadata(metadata, "matchedFields");
  const sequence = numberMetadata(metadata, "sequence");
  const deterministicScore = numberMetadata(metadata, "deterministicScore");
  const content = formatPageIndexTurnSummary({
    pageId,
    scope,
    usageQualifier: PAGEINDEX_EVIDENCE_USAGE_QUALIFIER,
    sourceSessionId,
    sourceTurnId,
    status,
    traceId,
    createdAt,
    freshnessStatus,
    freshnessEvidence,
    rankingReason,
    matchedFields,
    sequence,
    deterministicScore,
    promptPreview,
    assistantPreview
  });
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`context-pageindex-${sanitizeId(pageId)}`),
    kind: "summary",
    source: "host",
    lifecycle: "turn",
    scope: {
      sessionId,
      turnId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      workspaceRoot: request.workspaceRoot,
      host: request.caller
    },
    priority: 850 - item.order,
    content,
    contentRef: `pageindex:${pageId}`,
    estimatedTokens: item.budget?.estimatedTokens ?? countTokens(content),
    redaction: { class: "internal", fields: ["content", "contentRef"] },
    provenance: {
      source: request.referenceContext?.source ?? "cli.palette.references",
      referenceSetId,
      referenceId: item.id,
      targetId: item.target.id,
      targetKind: item.target.kind,
      label: item.label,
      pageId,
      scope,
      usageQualifier: PAGEINDEX_EVIDENCE_USAGE_QUALIFIER,
      sourceSessionId,
      sourceTurnId,
      status,
      traceId,
      createdAt,
      freshnessStatus,
      freshnessEvidence,
      rankingReason,
      matchedFields,
      order: item.order,
      itemProvenance: item.provenance,
      redaction: { class: "internal", fields: ["targetId", "label", "traceId"] }
    },
    dependencyFingerprints: [
      `reference:${item.id}`,
      `pageindex:${scope}:${pageId}:${stableHash(`${PAGEINDEX_EVIDENCE_USAGE_QUALIFIER}\n${createdAt}\n${freshnessStatus}\n${formatFreshnessEvidence(freshnessEvidence)}\n${rankingReason}\n${matchedFields.join(",")}\n${promptPreview}\n${assistantPreview}`)}`
    ],
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: "1970-01-01T00:00:00.000Z"
  };
}

function unresolvedReference(item: AgentLoopReferenceContextItem, reason: string): JsonObject {
  return {
    referenceId: item.id,
    targetId: item.target.id,
    targetKind: item.target.kind,
    reason,
    redaction: { class: "internal", fields: ["targetId"] }
  };
}

function formatReferenceContent(item: AgentLoopReferenceContextItem, path: string, content: string): string {
  return [
    `Reference ${item.id} (${item.label})`,
    `Path: ${path}`,
    content
  ].join("\n");
}

function referencePriority(item: AgentLoopReferenceContextItem): number {
  return 900 - item.order;
}

function formatPageIndexTurnSummary(input: {
  readonly pageId: string;
  readonly scope: string;
  readonly usageQualifier: string;
  readonly sourceSessionId: string;
  readonly sourceTurnId: string;
  readonly status: string;
  readonly traceId: string;
  readonly createdAt: string;
  readonly freshnessStatus: string;
  readonly freshnessEvidence: JsonObject;
  readonly rankingReason: string;
  readonly matchedFields: readonly string[];
  readonly sequence: number | undefined;
  readonly deterministicScore: number | undefined;
  readonly promptPreview: string;
  readonly assistantPreview: string;
}): string {
  return [
    `PageIndex recall ${input.pageId}`,
    `Usage: ${input.usageQualifier}`,
    `Source: scope=${input.scope} session=${input.sourceSessionId} turn=${input.sourceTurnId} status=${input.status}${input.sequence !== undefined ? ` sequence=${input.sequence}` : ""}${input.traceId ? ` trace=${input.traceId}` : ""}`,
    `Evidence: createdAt=${input.createdAt} freshness=${input.freshnessStatus} matchedFields=${input.matchedFields.length > 0 ? input.matchedFields.join(",") : "none"} rankingReason=${input.rankingReason}`,
    `Freshness evidence: ${formatFreshnessEvidence(input.freshnessEvidence)}`,
    input.deterministicScore !== undefined ? `Score: deterministic=${input.deterministicScore}` : undefined,
    `User prompt preview: ${input.promptPreview}`,
    `Assistant preview: ${input.assistantPreview}`
  ].filter((line): line is string => typeof line === "string").join("\n");
}

function stringMetadata(metadata: JsonObject, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function freshnessEvidenceMetadata(metadata: JsonObject): JsonObject {
  const direct = metadata.freshnessEvidence;
  if (isJsonObject(direct)) return direct;
  const quality = metadata.evidenceQuality;
  if (!isJsonObject(quality)) return {};
  const evidence: Record<string, string | number> = {};
  const reason = stringMetadata(quality, "staleReason");
  const scope = stringMetadata(quality, "staleScope");
  const staleMutationTurnId = stringMetadata(quality, "staleMutationTurnId");
  const pageWatermark = numberMetadata(quality, "workspaceCheckpointWatermark");
  const currentWatermark = numberMetadata(quality, "currentWorkspaceCheckpointWatermark");
  if (reason) evidence.reason = reason;
  if (scope) evidence.scope = scope;
  if (staleMutationTurnId) evidence.staleMutationTurnId = staleMutationTurnId;
  if (pageWatermark !== undefined) evidence.workspaceCheckpointWatermark = pageWatermark;
  if (currentWatermark !== undefined) evidence.currentWorkspaceCheckpointWatermark = currentWatermark;
  return evidence;
}

function formatFreshnessEvidence(evidence: JsonObject): string {
  const parts = [
    ["reason", stringMetadata(evidence, "reason")],
    ["scope", stringMetadata(evidence, "scope")],
    ["staleMutationTurnId", stringMetadata(evidence, "staleMutationTurnId")],
    ["workspaceCheckpointWatermark", numberMetadata(evidence, "workspaceCheckpointWatermark")],
    ["currentWorkspaceCheckpointWatermark", numberMetadata(evidence, "currentWorkspaceCheckpointWatermark")]
  ]
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberMetadata(metadata: JsonObject, key: string): number | undefined {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArrayMetadata(metadata: JsonObject, key: string): readonly string[] {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0).sort() : [];
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "-");
}
