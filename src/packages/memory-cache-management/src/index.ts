import type {
  CacheEntry,
  CacheKey,
  CacheManager,
  ContextProjectionResult,
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
  private readonly entries: MemoryEntry[] = [];

  async put(entry: MemoryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async query(scope: MemoryScope): Promise<readonly MemoryEntry[]> {
    return this.entries.filter((entry) => entry.scope === scope);
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

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
