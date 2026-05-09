import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionClass, RedactionMetadata, TraceContext } from "./common.js";
import type { AgentId, ContextNodeId, ModelProfileId, SessionId, TurnId } from "./ids.js";
import type { SandboxAuditEvidence, SecretRedactionDecision } from "./security.js";

export const CONTEXT_PROJECTION_SCHEMA_VERSION = "1.0.0";

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
  readonly replayFingerprint: string;
  readonly error?: RedactedError;
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
