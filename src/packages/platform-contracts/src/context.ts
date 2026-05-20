import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionClass, RedactionMetadata, TraceContext } from "./common.js";
import type { AgentId, ContextNodeId, ModelProfileId, SessionId, TurnId } from "./ids.js";
import type { SandboxAuditEvidence, SecretRedactionDecision } from "./security.js";

export const CONTEXT_PROJECTION_SCHEMA_VERSION = "1.0.0";
export const CONTEXT_PIPELINE_SCHEMA_VERSION = "1.0.0";
export const CONTEXT_PIPELINE_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: CONTEXT_PIPELINE_SCHEMA_VERSION,
  minReaderVersion: "0.1.0"
};
export const CONTEXT_PIPELINE_LAYER_ORDER = ["kernel", "project", "session", "current-turn"] as const;

export type ContextNodeKind = "user" | "assistant" | "tool-result" | "rule" | "summary" | "file" | "diagnostic" | "memory-ref";
export type ContextNodeLifecycle = "turn" | "session" | "project" | "global";
export type ContextNodeSource = "user" | "assistant" | "tool" | "workspace" | "memory" | "system" | "host" | "code-intelligence" | "skill-system";
export type ContextProjectionPurpose = "model-request" | "tool-preflight" | "summary" | "replay" | "test";
export type ContextProjectionStatus = "completed" | "degraded" | "rejected";
export type ContextProjectionEventKind =
  | "context.projection.started"
  | "context.projection.cache-hit"
  | "context.projection.degraded"
  | "context.projection.rejected"
  | "context.projection.completed";
export type ContextNodeExclusionReason =
  | "stale"
  | "outside-scope"
  | "policy-denied"
  | "redaction-unavailable"
  | "invalidated"
  | "budget-exceeded"
  | "unsupported-schema"
  | "empty-content"
  | "duplicate"
  | "unsafe-secret";

export interface ContextNode extends JsonObject {
  readonly id: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly content: string;
  readonly metadata: JsonObject;
}

export interface ContextGraphNodeScope extends JsonObject {
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly agentId?: AgentId;
  readonly workspaceRoot?: string;
  readonly host?: string;
}

export interface ContextGraphNode extends JsonObject {
  readonly schemaVersion: string;
  readonly id: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly source: ContextNodeSource;
  readonly lifecycle: ContextNodeLifecycle;
  readonly scope: ContextGraphNodeScope;
  readonly priority: number;
  readonly content: string;
  readonly contentRef?: string;
  readonly estimatedTokens?: number;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly dependencyFingerprints: readonly string[];
  readonly compatibility: CompatibilityMetadata;
  readonly createdAt: string;
  readonly secretDecision?: SecretRedactionDecision;
  readonly auditEvidence?: SandboxAuditEvidence;
  readonly stale?: boolean;
  readonly invalidated?: boolean;
}

export interface ContextProjectionBudget extends JsonObject {
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
  readonly reservedOutputTokens?: number;
}

export interface ContextProjectionBudgetDecision extends JsonObject {
  readonly status: "allowed" | "degraded" | "rejected";
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
  readonly reservedOutputTokens: number;
  readonly selectedTokens: number;
  readonly excludedTokens: number;
  readonly reason: string;
}

export interface ContextProjectionScope extends JsonObject {
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly agentId?: AgentId;
  readonly host?: string;
  readonly workspaceRoot?: string;
  readonly availableRedactionClasses: readonly RedactionClass[];
}

export interface ContextProjectionRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly modelProfileId?: ModelProfileId;
  readonly purpose: ContextProjectionPurpose;
  readonly prompt: string;
  readonly budget: ContextProjectionBudget;
  readonly scope: ContextProjectionScope;
  readonly candidateNodes?: readonly ContextGraphNode[];
  readonly pipeline?: {
    readonly enabled?: boolean;
  };
  readonly trace: TraceContext;
  readonly policy: JsonObject;
  readonly compatibility: CompatibilityMetadata;
}

export interface ProjectedContextNode extends JsonObject {
  readonly id: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly source: ContextNodeSource;
  readonly content: string;
  readonly estimatedTokens: number;
  readonly priority: number;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly dependencyFingerprints: readonly string[];
  readonly secretDecision?: SecretRedactionDecision;
  readonly auditEvidence?: SandboxAuditEvidence;
}

export interface ExcludedContextNode extends JsonObject {
  readonly id: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly source: ContextNodeSource;
  readonly estimatedTokens: number;
  readonly priority: number;
  readonly reason: ContextNodeExclusionReason;
  readonly redaction: RedactionMetadata;
  readonly secretDecision?: SecretRedactionDecision;
  readonly auditEvidence?: SandboxAuditEvidence;
}

export interface ContextProjectionRedactionSummary extends JsonObject {
  readonly selected: number;
  readonly redacted: number;
  readonly excluded: number;
  readonly classes: readonly RedactionClass[];
  readonly secretLikeBlocked: number;
}

export interface ContextProjectionCacheMetadata extends JsonObject {
  readonly namespace: string;
  readonly key: string;
  readonly hit: boolean;
  readonly dependencyFingerprints: readonly string[];
  readonly invalidationReason?: string;
}

export interface ContextProjectionOrderingMetadata extends JsonObject {
  readonly strategy: "priority-recency-stable";
  readonly tieBreak: readonly string[];
}

export interface ContextProjectionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ContextProjectionStatus;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly prompt: string;
  readonly selectedNodes: readonly ProjectedContextNode[];
  readonly excludedNodes: readonly ExcludedContextNode[];
  readonly estimatedTokens: number;
  readonly budget: ContextProjectionBudgetDecision;
  readonly redaction: ContextProjectionRedactionSummary;
  readonly cache: ContextProjectionCacheMetadata;
  readonly ordering: ContextProjectionOrderingMetadata;
  readonly pipeline?: ContextPipelineManifest;
  readonly replayFingerprint: string;
  readonly error?: RedactedError;
}

export type ContextPipelineLayerId = typeof CONTEXT_PIPELINE_LAYER_ORDER[number];
export type ContextBlockCachePolicy = "stable" | "ephemeral" | "no-store" | "ttl";
export type ContextPrefixStability = "stable" | "changed" | "unavailable";
export type ContextStatuslineCacheStatus = "available" | "estimated" | "unavailable";

export interface ContextCacheHint extends JsonObject {
  readonly policy: ContextBlockCachePolicy;
  readonly ttlMs?: number;
  readonly freshness?: "static" | "session" | "turn" | "volatile";
}

export interface ContextBlockReplayMetadata extends JsonObject {
  readonly fingerprint: string;
  readonly sourceProjectionFingerprint?: string;
  readonly sourceBlockHashes?: readonly string[];
}

export interface ContextBlock extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly id: string;
  readonly layer: ContextPipelineLayerId;
  readonly order: number;
  readonly sourceNodeId?: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly source: ContextNodeSource;
  readonly hash: string;
  readonly content?: string;
  readonly contentRef?: string;
  readonly contentPreview?: string;
  readonly estimatedTokens: number;
  readonly dependencyFingerprints: readonly string[];
  readonly provenance: JsonObject;
  readonly cacheHint: ContextCacheHint;
  readonly replay: ContextBlockReplayMetadata;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextPipelineLayer extends JsonObject {
  readonly id: ContextPipelineLayerId;
  readonly order: number;
  readonly blockIds: readonly string[];
  readonly blockHashes: readonly string[];
  readonly layerHash: string;
  readonly prefixHash: string;
  readonly estimatedTokens: number;
}

export interface ContextPrefixHash extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly id: string;
  readonly layer: ContextPipelineLayerId;
  readonly order: number;
  readonly blockIds: readonly string[];
  readonly blockHashes: readonly string[];
  readonly layerHash: string;
  readonly prefixHash: string;
  readonly estimatedTokens: number;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextPipelineExclusion extends JsonObject {
  readonly id: string;
  readonly sourceNodeId?: ContextNodeId;
  readonly layer?: ContextPipelineLayerId;
  readonly reason: ContextNodeExclusionReason | "volatile-tail" | "stable-summary-created";
  readonly estimatedTokens: number;
  readonly dependencyFingerprints: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ContextPipelineTokenTotals extends JsonObject {
  readonly selectedTokens: number;
  readonly excludedTokens: number;
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
}

export interface ContextPipelineCacheHintSummary extends JsonObject {
  readonly stable: number;
  readonly ephemeral: number;
  readonly noStore: number;
  readonly ttlBound: number;
}

export interface ContextPipelineDiagnostic extends JsonObject {
  readonly code: string;
  readonly message: string;
  readonly layer?: ContextPipelineLayerId;
  readonly blockId?: string;
  readonly affectedTokens?: number;
  readonly redaction: RedactionMetadata;
}

export interface ContextPipelineCacheEvidence extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly pipelineFingerprint: string;
  readonly status: ContextStatuslineCacheStatus;
  readonly hitTokens?: number;
  readonly missTokens?: number;
  readonly hitRate?: number;
  readonly provider?: JsonObject;
  readonly hintApplied?: boolean;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextPipelineManifest extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly manifestId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly layers: readonly ContextPipelineLayer[];
  readonly blocks: readonly ContextBlock[];
  readonly excludedBlocks: readonly ContextPipelineExclusion[];
  readonly prefixHashes: readonly ContextPrefixHash[];
  readonly tokenTotals: ContextPipelineTokenTotals;
  readonly cacheHintSummary: ContextPipelineCacheHintSummary;
  readonly pipelineFingerprint: string;
  readonly cacheEvidence?: ContextPipelineCacheEvidence;
  readonly diagnostics: readonly ContextPipelineDiagnostic[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextPipelineManifestComparison extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly status: "stable" | "changed";
  readonly previousFingerprint: string;
  readonly currentFingerprint: string;
  readonly firstChangedLayer?: ContextPipelineLayerId;
  readonly firstChangedBlockId?: string;
  readonly affectedTokens: number;
  readonly stableLayerCount: number;
  readonly changedLayerCount: number;
  readonly rawContentInspected: false;
  readonly diagnostics: readonly ContextPipelineDiagnostic[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextStatuslineTelemetry extends JsonObject {
  readonly schemaVersion: typeof CONTEXT_PIPELINE_SCHEMA_VERSION;
  readonly modelId: string;
  readonly modelProfileId?: string;
  readonly thinkingMode: string;
  readonly cache: {
    readonly status: ContextStatuslineCacheStatus;
    readonly hitRate?: number;
    readonly hitTokens?: number;
    readonly missTokens?: number;
  };
  readonly context: {
    readonly selectedTokens: number;
    readonly hardLimitTokens: number;
    readonly softLimitTokens?: number;
    readonly budgetPressure: "normal" | "soft" | "hard";
  };
  readonly prefix: {
    readonly stability: ContextPrefixStability;
    readonly stableLayerCount: number;
    readonly changedLayerCount: number;
    readonly pipelineFingerprint?: string;
  };
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export function contextPipelineLayerOrder(layer: ContextPipelineLayerId): number {
  return CONTEXT_PIPELINE_LAYER_ORDER.indexOf(layer);
}

export function contextPipelineBlockStableId(layer: ContextPipelineLayerId, sourceId: string, blockHash: string): string {
  return `context-block:${layer}:${sourceId}:${blockHash}`;
}

export function contextPipelinePrefixStableId(layer: ContextPipelineLayerId, prefixHash: string): string {
  return `context-prefix:${layer}:${prefixHash}`;
}

export interface ContextProjectionEvent extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: ContextProjectionEventKind;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly trace: TraceContext;
  readonly data: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ContextGraph extends JsonObject {
  readonly sessionId: SessionId;
  readonly nodes: readonly ContextNode[];
}

export interface ContextProjection extends JsonObject {
  readonly prompt: string;
  readonly nodes: readonly ContextNode[];
}

export interface ContextEngine {
  addNode(sessionId: SessionId, node: ContextNode): Promise<void>;
  project(sessionId: SessionId, prompt: string): Promise<ContextProjection>;
  projectGraph(request: ContextProjectionRequest): Promise<ContextProjectionResult>;
}
