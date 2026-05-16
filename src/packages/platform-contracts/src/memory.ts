import type { JsonObject, RedactionMetadata } from "./common.js";
import type { AgentId, CacheKey, MemoryId, SessionId } from "./ids.js";

export type MemoryScope = "working" | "session" | "project" | "user" | "semantic" | "skill";

export interface MemoryEntry {
  readonly id: MemoryId;
  readonly scope: MemoryScope;
  readonly content: string;
  readonly provenance: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly ttlMs?: number;
  readonly confidence?: number;
}

export interface CacheEntry<T = unknown> {
  readonly key: CacheKey;
  readonly namespace: string;
  readonly value: T;
  readonly createdAt: string;
  readonly ttlMs?: number;
  readonly invalidation: readonly string[];
}

export interface MemoryManager {
  put(entry: MemoryEntry, sessionId?: SessionId): Promise<void>;
  query(scope: MemoryScope, sessionId?: SessionId): Promise<readonly MemoryEntry[]>;
}

export type PermanentMemoryState = "candidate" | "promoted" | "dismissed" | "deleted";
export type PermanentMemoryPromotionMode = "manual" | "auto";
export type PermanentMemoryCandidateKind = "fact" | "preference" | "project-decision" | "workflow-procedure" | "correction" | "accepted-cli-event";
export type PermanentMemoryFreshnessStatus = "fresh" | "stale" | "conflicted" | "unverifiable";
export type PermanentMemoryConflictStatus = "none" | "current-instruction-overrides" | "workspace-evidence-overrides" | "source-deleted" | "duplicate";
export type PermanentMemoryDurability = "memory" | "local-json" | "local-jsonl" | "sqlite" | "external";
export type PermanentMemoryHookFailurePolicy = "isolate" | "enforce";

export interface PermanentMemoryScopeSelector extends JsonObject {
  readonly scope: Exclude<MemoryScope, "working" | "session">;
  readonly userId?: string;
  readonly workspaceRoot?: string;
  readonly pathPrefix?: string;
  readonly agentId?: AgentId;
  readonly sessionId?: SessionId;
  readonly threadId?: string;
}

export interface PermanentMemorySourceEvidence extends JsonObject {
  readonly sourceKind:
    | "pageindex"
    | "lossless-context"
    | "runtime-event"
    | "user-explicit"
    | "workspace"
    | "hook"
    | "import"
    | "mcp"
    | "web"
    | "connector"
    | "browser-screen"
    | "third-party-document";
  readonly sourceId: string;
  readonly sourceHash?: string;
  readonly sourceClass?: string;
  readonly capturedAt?: string;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryFreshness extends JsonObject {
  readonly status: PermanentMemoryFreshnessStatus;
  readonly checkedAt?: string;
  readonly evidenceIds: readonly string[];
  readonly reason?: string;
}

export interface PermanentMemoryConflict extends JsonObject {
  readonly status: PermanentMemoryConflictStatus;
  readonly conflictingEvidenceIds: readonly string[];
  readonly reason?: string;
}

export interface PermanentMemoryProcedureMetadata extends JsonObject {
  readonly routeTo: "memory" | "skill" | "procedure";
  readonly skillName?: string;
  readonly procedureId?: string;
  readonly reason?: string;
}

export interface PermanentMemoryGovernance extends JsonObject {
  readonly promotionMode: PermanentMemoryPromotionMode;
  readonly approvalRequired: boolean;
  readonly approved: boolean;
  readonly actor?: string;
  readonly reason?: string;
  readonly policyId?: string;
  readonly reviewedAt?: string;
}

export interface PermanentMemoryEntry extends MemoryEntry, JsonObject {
  readonly state: PermanentMemoryState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly sourceSessionId?: SessionId;
  readonly tags: readonly string[];
  readonly governance: PermanentMemoryGovernance;
  readonly candidateKind?: PermanentMemoryCandidateKind;
  readonly scopeSelector?: PermanentMemoryScopeSelector;
  readonly sourceEvidence?: readonly PermanentMemorySourceEvidence[];
  readonly freshness?: PermanentMemoryFreshness;
  readonly conflict?: PermanentMemoryConflict;
  readonly procedure?: PermanentMemoryProcedureMetadata;
  readonly deletedAt?: string;
}

export interface PermanentMemorySettings extends JsonObject {
  readonly enabled: boolean;
  readonly providerId: string;
  readonly requirePromotionApproval: boolean;
  readonly maxQueryResults: number;
  readonly readEnabled?: boolean;
  readonly generateEnabled?: boolean;
  readonly injectEnabled?: boolean;
  readonly autoPromoteEnabled?: boolean;
  readonly backgroundExtractionEnabled?: boolean;
  readonly minimumCandidateChars?: number;
  readonly maxCandidatesPerTurn?: number;
  readonly extractionLockId?: string;
  readonly excludedSourceKinds?: readonly string[];
}

export interface PermanentMemoryCandidateInput extends JsonObject {
  readonly scope: Exclude<MemoryScope, "working" | "session">;
  readonly content: string;
  readonly provenance?: JsonObject;
  readonly sessionId?: SessionId;
  readonly tags?: readonly string[];
  readonly confidence?: number;
  readonly promotionMode?: PermanentMemoryPromotionMode;
  readonly candidateKind?: PermanentMemoryCandidateKind;
  readonly scopeSelector?: PermanentMemoryScopeSelector;
  readonly sourceEvidence?: readonly PermanentMemorySourceEvidence[];
  readonly procedure?: PermanentMemoryProcedureMetadata;
}

export interface PermanentMemoryPromotionDecision extends JsonObject {
  readonly approved: boolean;
  readonly actor?: string;
  readonly reason?: string;
  readonly tags?: readonly string[];
  readonly confidence?: number;
}

export interface PermanentMemoryQuery extends JsonObject {
  readonly scope?: Exclude<MemoryScope, "working" | "session">;
  readonly query?: string;
  readonly includeCandidates?: boolean;
  readonly includeDismissed?: boolean;
  readonly includeConflicted?: boolean;
  readonly includeStale?: boolean;
  readonly scopeSelector?: PermanentMemoryScopeSelector;
  readonly path?: string;
  readonly limit?: number;
}

export interface PermanentMemoryMutationResult extends JsonObject {
  readonly ok: boolean;
  readonly status: "completed" | "rejected" | "disabled" | "not-found";
  readonly entry?: PermanentMemoryEntry;
  readonly diagnostics: readonly string[];
}

export type PermanentMemoryHookEventKind =
  | "permanent-memory.candidate.created"
  | "permanent-memory.candidate.enriched"
  | "permanent-memory.entry.retrieved"
  | "permanent-memory.candidate.promoted"
  | "permanent-memory.candidate.dismissed"
  | "permanent-memory.entry.injected"
  | "permanent-memory.entry.updated"
  | "permanent-memory.entry.deleted"
  | "permanent-memory.settings.updated"
  | "permanent-memory.exported"
  | "permanent-memory.imported"
  | "permanent-memory.migration.checked"
  | "permanent-memory.migrated"
  | "permanent-memory.scored";

export interface PermanentMemoryHookEvent extends JsonObject {
  readonly kind: PermanentMemoryHookEventKind;
  readonly providerId: string;
  readonly replayId: string;
  readonly entry?: PermanentMemoryEntry;
  readonly settings?: PermanentMemorySettings;
  readonly payload?: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryHookManifest extends JsonObject {
  readonly hookId: string;
  readonly events: readonly PermanentMemoryHookEventKind[];
  readonly timeoutMs: number;
  readonly maxRetries?: number;
  readonly failurePolicy: PermanentMemoryHookFailurePolicy;
  readonly permissions: readonly string[];
  readonly replayId: string;
}

export interface PermanentMemoryHookResult extends JsonObject {
  readonly status: "completed" | "failed" | "timed-out";
  readonly diagnostics: readonly string[];
  readonly patch?: PermanentMemoryUpdatePatch;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryHook {
  readonly manifest?: PermanentMemoryHookManifest;
  invoke(event: PermanentMemoryHookEvent): Promise<PermanentMemoryHookResult | void>;
}

export interface PermanentMemoryProviderManifest extends JsonObject {
  readonly providerId: string;
  readonly durability: PermanentMemoryDurability;
  readonly locality: "local" | "remote" | "hybrid";
  readonly scopes: readonly Exclude<MemoryScope, "working" | "session">[];
  readonly encryption: "none" | "host" | "provider";
  readonly provenance: boolean;
  readonly deleteSemantics: "soft-delete" | "hard-delete" | "tombstone";
  readonly exportImport: boolean;
  readonly migrations: boolean;
  readonly hookSupport: boolean;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryUpdatePatch extends JsonObject {
  readonly content?: string;
  readonly tags?: readonly string[];
  readonly confidence?: number;
  readonly freshness?: PermanentMemoryFreshness;
  readonly conflict?: PermanentMemoryConflict;
  readonly governance?: Partial<PermanentMemoryGovernance>;
  readonly procedure?: PermanentMemoryProcedureMetadata;
}

export interface PermanentMemoryExplainResult extends JsonObject {
  readonly ok: boolean;
  readonly status: "completed" | "not-found";
  readonly entry?: PermanentMemoryEntry;
  readonly sourceEvidence: readonly PermanentMemorySourceEvidence[];
  readonly diagnostics: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryAuditRecord extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly auditId: string;
  readonly at: string;
  readonly action: string;
  readonly entryId?: MemoryId;
  readonly providerId: string;
  readonly status: "completed" | "rejected" | "disabled" | "not-found" | "failed";
  readonly diagnostics: readonly string[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryExportBundle extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly providerManifest: PermanentMemoryProviderManifest;
  readonly settings: PermanentMemorySettings;
  readonly entries: readonly PermanentMemoryEntry[];
  readonly audit: readonly PermanentMemoryAuditRecord[];
  readonly exportedAt: string;
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryImportResult extends JsonObject {
  readonly ok: boolean;
  readonly importedCount: number;
  readonly skippedCount: number;
  readonly diagnostics: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface PermanentMemoryManager extends MemoryManager {
  manifest(): PermanentMemoryProviderManifest;
  settings(): Promise<PermanentMemorySettings>;
  setEnabled(enabled: boolean): Promise<PermanentMemorySettings>;
  configure(settings: Partial<PermanentMemorySettings>): Promise<PermanentMemorySettings>;
  putCandidate(input: PermanentMemoryCandidateInput): Promise<PermanentMemoryMutationResult>;
  promote(id: MemoryId, decision: PermanentMemoryPromotionDecision): Promise<PermanentMemoryMutationResult>;
  dismiss(id: MemoryId, reason?: string): Promise<PermanentMemoryMutationResult>;
  update(id: MemoryId, patch: PermanentMemoryUpdatePatch): Promise<PermanentMemoryMutationResult>;
  delete(id: MemoryId, reason?: string): Promise<PermanentMemoryMutationResult>;
  explain(id: MemoryId): Promise<PermanentMemoryExplainResult>;
  queryPermanent(query: PermanentMemoryQuery): Promise<readonly PermanentMemoryEntry[]>;
  export(): Promise<PermanentMemoryExportBundle>;
  import(bundle: PermanentMemoryExportBundle): Promise<PermanentMemoryImportResult>;
  audit(limit?: number): Promise<readonly PermanentMemoryAuditRecord[]>;
}

export interface PermanentMemoryProvider extends PermanentMemoryManager {}

export interface CacheManager {
  get<T>(key: CacheKey): Promise<CacheEntry<T> | undefined>;
  set<T>(entry: CacheEntry<T>): Promise<void>;
  invalidate(namespace: string, reason: string): Promise<number>;
}
