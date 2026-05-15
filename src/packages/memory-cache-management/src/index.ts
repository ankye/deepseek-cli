import type {
  CacheEntry,
  CacheKey,
  CacheManager,
  ContextProjectionResult,
  JsonObject,
  MemoryId,
  MemoryEntry,
  MemoryManager,
  MemoryScope,
  RuntimeCompactBoundaryEvidence,
  RuntimeToolResultEvidence,
  SessionId,
  ToolResultFeedback
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export const PROJECTION_CACHE_NAMESPACE = "context.projection";
export const TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE = "turn.tool-result-evidence";

export interface ProjectionCacheInput {
  readonly requestFingerprint: string;
  readonly dependencyFingerprints: readonly string[];
}

export function projectionCacheKey(input: ProjectionCacheInput): CacheKey {
  return asId<"cacheKey">(`${PROJECTION_CACHE_NAMESPACE}:${stableHash(`${input.requestFingerprint}:${[...input.dependencyFingerprints].sort().join("|")}`)}`);
}

export function createProjectionCacheEntry(input: ProjectionCacheInput, value: ContextProjectionResult, createdAt = new Date(0).toISOString()): CacheEntry<ContextProjectionResult> {
  return {
    key: projectionCacheKey(input),
    namespace: PROJECTION_CACHE_NAMESPACE,
    value,
    createdAt,
    invalidation: [...input.dependencyFingerprints].sort()
  };
}

export interface MemoryCandidateFingerprintInput {
  readonly entry: MemoryEntry;
  readonly sessionId?: SessionId;
}

export function memoryCandidateFingerprint(input: MemoryCandidateFingerprintInput): string {
  return `memory:${input.entry.scope}:${input.entry.id}:${stableHash(JSON.stringify({
    sessionId: input.sessionId ?? "",
    id: input.entry.id,
    scope: input.entry.scope,
    contentHash: stableHash(input.entry.content),
    provenance: input.entry.provenance,
    redaction: input.entry.redaction,
    confidence: input.entry.confidence ?? null,
    ttlMs: input.entry.ttlMs ?? null
  }))}`;
}

export interface CompactBoundaryInput {
  readonly projectionFingerprint: string;
  readonly sessionId: SessionId;
  readonly turnId?: string;
  readonly selectedNodeCount: number;
  readonly excludedNodeCount: number;
  readonly selectedTokens: number;
  readonly excludedTokens: number;
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
}

export function createCompactBoundaryEvidence(input: CompactBoundaryInput): RuntimeCompactBoundaryEvidence {
  const pressure = input.softLimitTokens !== undefined && input.selectedTokens >= input.softLimitTokens ? "soft" : "hard";
  return {
    schemaVersion: "1.0.0",
    fingerprint: `compact:${stableHash(JSON.stringify(input))}`,
    projectionFingerprint: input.projectionFingerprint,
    pressure,
    selectedNodeCount: input.selectedNodeCount,
    excludedNodeCount: input.excludedNodeCount,
    selectedTokens: input.selectedTokens,
    excludedTokens: input.excludedTokens,
    hardLimitTokens: input.hardLimitTokens,
    ...(input.softLimitTokens !== undefined ? { softLimitTokens: input.softLimitTokens } : {}),
    redaction: { class: "internal" }
  };
}

export interface ToolResultEvidenceInput {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly capabilityId?: string;
  readonly terminalKind: string;
  readonly feedback: ToolResultFeedback;
}

export function createToolResultEvidence(input: ToolResultEvidenceInput): RuntimeToolResultEvidence {
  const previewHash = stableHash(input.feedback.preview.text);
  return {
    schemaVersion: "1.0.0",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    ...(input.capabilityId ? { capabilityId: input.capabilityId } : {}),
    status: input.feedback.status,
    terminalKind: input.terminalKind,
    previewHash,
    previewBytes: input.feedback.preview.byteLength,
    previewTruncated: input.feedback.preview.truncated,
    diagnosticCount: input.feedback.diagnostics.length,
    replayHash: stableHash(JSON.stringify({
      toolCallId: input.toolCallId,
      toolName: input.toolName,
      capabilityId: input.capabilityId ?? "",
      status: input.feedback.status,
      terminalKind: input.terminalKind,
      previewHash,
      diagnosticCodes: input.feedback.diagnostics.map((diagnostic) => diagnostic.code).sort()
    })),
    redaction: { class: "internal", fields: ["previewHash"] }
  };
}

export function createToolResultEvidenceCacheEntry(evidence: RuntimeToolResultEvidence, createdAt = new Date(0).toISOString()): CacheEntry<RuntimeToolResultEvidence> {
  return {
    key: asId<"cacheKey">(`${TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE}:${evidence.replayHash}`),
    namespace: TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE,
    value: evidence,
    createdAt,
    invalidation: [
      `tool:${evidence.toolName}`,
      ...(evidence.capabilityId ? [`capability:${evidence.capabilityId}`] : []),
      `tool-call:${evidence.toolCallId}`
    ]
  };
}

export class InMemoryMemoryManager implements MemoryManager {
  private readonly entries: { readonly entry: MemoryEntry; readonly sessionId?: SessionId }[] = [];

  async put(entry: MemoryEntry, sessionId?: SessionId): Promise<void> {
    this.entries.push({ entry, ...(sessionId ? { sessionId } : {}) });
  }

  async query(scope: MemoryScope, sessionId?: SessionId): Promise<readonly MemoryEntry[]> {
    return this.entries
      .filter((record) => record.entry.scope === scope && (sessionId === undefined || record.sessionId === undefined || record.sessionId === sessionId))
      .map((record) => record.entry);
  }
}

export class InMemoryCacheManager implements CacheManager {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: CacheKey): Promise<CacheEntry<T> | undefined> {
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    const frozenInvalidation = Object.isFrozen(entry.invalidation) ? entry.invalidation : Object.freeze([...entry.invalidation]);
    const frozenEntry: CacheEntry<T> = Object.isFrozen(entry)
      ? entry
      : Object.freeze({ ...entry, invalidation: frozenInvalidation });
    return frozenEntry;
  }

  async set<T>(entry: CacheEntry<T>): Promise<void> {
    this.entries.set(entry.key, entry as CacheEntry<unknown>);
  }

  async invalidate(namespace: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.entries) {
      if (entry.namespace === namespace) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }
}

export function scopedMemoryKey(sessionId: SessionId, name: string): string {
  return `${sessionId}:${name}`;
}

export type MemoryReadWriteOperation =
  | {
      readonly action: "write";
      readonly sessionId?: SessionId;
      readonly id?: MemoryId;
      readonly scope: MemoryScope;
      readonly content: string;
      readonly provenance?: JsonObject;
      readonly redaction?: MemoryEntry["redaction"];
      readonly ttlMs?: number;
      readonly confidence?: number;
    }
  | {
      readonly action: "read";
      readonly sessionId?: SessionId;
      readonly scope: MemoryScope;
      readonly limit?: number;
    };

export interface MemoryReadWriteRecord extends JsonObject {
  readonly id: MemoryId;
  readonly scope: MemoryScope;
  readonly content: string;
  readonly provenance: JsonObject;
  readonly replayFingerprint: string;
  readonly redaction: MemoryEntry["redaction"];
}

export interface MemoryReadWriteResult extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly familyId: "memory.read-write";
  readonly action: MemoryReadWriteOperation["action"];
  readonly status: "completed" | "rejected";
  readonly scope: MemoryScope;
  readonly sessionId?: SessionId;
  readonly recordCount: number;
  readonly records: readonly MemoryReadWriteRecord[];
  readonly diagnostics: readonly string[];
  readonly replayFingerprint: string;
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export async function executeMemoryReadWrite(manager: MemoryManager, operation: MemoryReadWriteOperation): Promise<MemoryReadWriteResult> {
  if (operation.action === "write") {
    const entry: MemoryEntry = {
      id: operation.id ?? asId<"memory">(`memory-${stableHash(`${operation.scope}:${operation.sessionId ?? ""}:${operation.content}`)}`),
      scope: operation.scope,
      content: redactMemoryContent(operation.content),
      provenance: {
        source: "memory.read-write",
        contentHash: stableHash(operation.content),
        ...(operation.provenance ?? {})
      },
      redaction: operation.redaction ?? memoryRedactionFor(operation.content),
      ...(operation.ttlMs !== undefined ? { ttlMs: operation.ttlMs } : {}),
      ...(operation.confidence !== undefined ? { confidence: operation.confidence } : {})
    };
    await manager.put(entry, operation.sessionId);
    const record = memoryEvidenceRecord(entry, operation.sessionId);
    return memoryResult(operation, [record], []);
  }

  const limit = Math.max(0, operation.limit ?? 50);
  const entries = (await manager.query(operation.scope, operation.sessionId)).slice(0, limit);
  const records = entries.map((entry) => memoryEvidenceRecord(entry, operation.sessionId));
  const diagnostics = entries.length === limit && limit > 0 ? ["memory.read-write.output-bounded"] : [];
  return memoryResult(operation, records, diagnostics);
}

export interface CompactSummaryInput {
  readonly sessionId: SessionId;
  readonly segments: readonly string[];
  readonly maxTokens: number;
  readonly reservedOutputTokens?: number;
}

export interface CompactSummaryResult extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly familyId: "compact.summary";
  readonly status: "completed" | "degraded";
  readonly sessionId: SessionId;
  readonly summary: string;
  readonly selectedSegmentCount: number;
  readonly excludedSegmentCount: number;
  readonly selectedTokens: number;
  readonly excludedTokens: number;
  readonly maxTokens: number;
  readonly reservedOutputTokens: number;
  readonly diagnostics: readonly string[];
  readonly replayFingerprint: string;
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export function createCompactSummary(input: CompactSummaryInput): CompactSummaryResult {
  const maxTokens = Math.max(0, input.maxTokens);
  const reservedOutputTokens = Math.max(0, input.reservedOutputTokens ?? 0);
  const budget = Math.max(0, maxTokens - reservedOutputTokens);
  const selected: string[] = [];
  let selectedTokens = 0;
  let excludedTokens = 0;
  for (const segment of input.segments) {
    const redacted = redactMemoryContent(segment);
    const tokens = countTokens(redacted);
    if (selectedTokens + tokens > budget) {
      excludedTokens += tokens;
      continue;
    }
    selected.push(redacted);
    selectedTokens += tokens;
  }
  const summary = selected.join("\n").trim();
  const diagnostics = selected.length < input.segments.length ? ["compact.summary.budget-excluded-segments"] : [];
  return {
    schemaVersion: "1.0.0",
    familyId: "compact.summary",
    status: diagnostics.length > 0 ? "degraded" : "completed",
    sessionId: input.sessionId,
    summary,
    selectedSegmentCount: selected.length,
    excludedSegmentCount: input.segments.length - selected.length,
    selectedTokens,
    excludedTokens,
    maxTokens,
    reservedOutputTokens,
    diagnostics,
    replayFingerprint: `compact.summary:${stableHash(JSON.stringify({
      sessionId: input.sessionId,
      summaryHash: stableHash(summary),
      selectedTokens,
      excludedTokens,
      maxTokens,
      reservedOutputTokens
    }))}`,
    redaction: { class: "internal", fields: ["summary"] }
  };
}

function memoryResult(operation: MemoryReadWriteOperation, records: readonly MemoryReadWriteRecord[], diagnostics: readonly string[]): MemoryReadWriteResult {
  return {
    schemaVersion: "1.0.0",
    familyId: "memory.read-write",
    action: operation.action,
    status: "completed",
    scope: operation.scope,
    ...(operation.sessionId ? { sessionId: operation.sessionId } : {}),
    recordCount: records.length,
    records,
    diagnostics,
    replayFingerprint: `memory.read-write:${stableHash(JSON.stringify({
      action: operation.action,
      scope: operation.scope,
      sessionId: operation.sessionId ?? "",
      records: records.map((record) => record.replayFingerprint),
      diagnostics
    }))}`,
    redaction: { class: "internal", fields: ["records.content", "records.provenance"] }
  };
}

function memoryEvidenceRecord(entry: MemoryEntry, sessionId?: SessionId): MemoryReadWriteRecord {
  return {
    id: entry.id,
    scope: entry.scope,
    content: redactMemoryContent(entry.content),
    provenance: {
      ...entry.provenance,
      ...(sessionId ? { sessionId } : {}),
      contentHash: stableHash(entry.content)
    },
    replayFingerprint: memoryCandidateFingerprint({ entry, ...(sessionId ? { sessionId } : {}) }),
    redaction: entry.redaction
  };
}

function memoryRedactionFor(content: string): MemoryEntry["redaction"] {
  return isSecretLike(content) ? { class: "secret", fields: ["content"] } : { class: "internal", fields: ["content"] };
}

function redactMemoryContent(content: string): string {
  return content
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED:secret]`;
    });
}

function isSecretLike(content: string): boolean {
  return redactMemoryContent(content) !== content;
}

function countTokens(content: string): number {
  const trimmed = content.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
