import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext } from "./common.js";
import type { AgentId, AgentInstanceId, SessionId, TaskId, TurnId } from "./ids.js";
import type { InteractionModeName, ModeCompletionStatus } from "./interaction-mode.js";
import type { ModelReasoningEffort, ModelReasoningProviderEffort } from "./model.js";

export const AGENT_MODE_SCHEMA_VERSION = "1.0.0";

export type AgentModeName =
  | "default"
  | "evidence"
  | "planner"
  | "implementer"
  | "verifier"
  | "coordinator"
  | "worker"
  | "repair"
  | "synthesis";

export type AgentProductRole =
  | "default-coding-agent"
  | "evidence-researcher"
  | "planner"
  | "implementer"
  | "verifier"
  | "coordinator"
  | "worker"
  | "repairer"
  | "synthesizer";

export type AgentPhaseName = "classify" | "evidence" | "plan" | "execute" | "verify" | "repair" | "synthesize" | "complete";
export type AgentPhaseStatus = "required" | "running" | "completed" | "skipped" | "failed" | "blocked";
export type AgentPhaseSkipReason = "simple-task" | "low-risk" | "budget-unavailable" | "provider-unavailable" | "policy-denied" | "user-disabled" | "not-applicable";
export type AgentLoopBudgetKind = "evidence" | "verification" | "repair" | "delegation" | "model-iteration";
export type AgentWorkerLifecycleStatus = "spawned" | "running" | "continued" | "stopped" | "cancelled" | "completed" | "failed" | "disposed";
export type AgentWorkerStopReason = "user-changed-request" | "wrong-direction" | "budget-exhausted" | "policy-denied" | "superseded" | "manual-stop" | "unknown";
export type AgentVerifierVerdict = "pass" | "fail" | "partial";
export type AgentDelegationDecisionKind = "spawn" | "continue" | "stop" | "skip";
export type AgentDelegationReasonCode =
  | "parallel-independent-work"
  | "high-context-overlap"
  | "fresh-verification"
  | "wrong-approach-retry"
  | "trivial-delegation-rejected"
  | "budget-unavailable"
  | "policy-denied";

export interface AgentModeBinding extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly agentId: AgentId;
  readonly agentInstanceId?: AgentInstanceId;
  readonly mode: AgentModeName;
  readonly productRole: AgentProductRole;
  readonly interactionMode?: InteractionModeName;
  readonly scopeIds: readonly string[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentLoopBudget extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly kind: AgentLoopBudgetKind;
  readonly requested: number;
  readonly allowed: number;
  readonly consumed: number;
  readonly remaining: number;
  readonly stopReason?: string;
  readonly policy: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentPhasePlanItem extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly phase: AgentPhaseName;
  readonly status: AgentPhaseStatus;
  readonly required: boolean;
  readonly skipReason?: AgentPhaseSkipReason;
  readonly mode: AgentModeName;
  readonly budgets: readonly AgentLoopBudget[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentPhasePlan extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly planId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly interactionMode: InteractionModeName;
  readonly agentMode: AgentModeName;
  readonly phases: readonly AgentPhasePlanItem[];
  readonly budgets: readonly AgentLoopBudget[];
  readonly reason: string;
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentWorkOrderTarget extends JsonObject {
  readonly kind: string;
  readonly id: string;
  readonly path?: string;
  readonly label?: string;
  readonly metadata?: JsonObject;
}

export interface AgentWorkOrder extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly workOrderId: string;
  readonly parentSessionId?: SessionId;
  readonly parentAgentId?: AgentId;
  readonly targetAgentId?: AgentId;
  readonly mode: AgentModeName;
  readonly purpose: string;
  readonly originalUserGoal: string;
  readonly taskSummary: string;
  readonly evidenceIds: readonly string[];
  readonly targets: readonly AgentWorkOrderTarget[];
  readonly allowedTools: readonly string[];
  readonly permissionScope: JsonObject;
  readonly doneCriteria: readonly string[];
  readonly verificationExpectations: readonly string[];
  readonly scratchpadScope?: JsonObject;
  readonly checkpointPolicy?: JsonObject;
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentDelegationDecision extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly decisionId: string;
  readonly kind: AgentDelegationDecisionKind;
  readonly reasonCode: AgentDelegationReasonCode;
  readonly parentSessionId?: SessionId;
  readonly parentAgentId?: AgentId;
  readonly workerAgentId?: AgentId;
  readonly workerInstanceId?: AgentInstanceId;
  readonly workOrderId?: string;
  readonly contextOverlapScore?: number;
  readonly evidenceIds: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentWorkerLifecycleEvent extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly workerEventId: string;
  readonly status: AgentWorkerLifecycleStatus;
  readonly sessionId: SessionId;
  readonly workerSessionId?: SessionId;
  readonly parentAgentId?: AgentId;
  readonly workerAgentId?: AgentId;
  readonly workerInstanceId?: AgentInstanceId;
  readonly taskId?: TaskId;
  readonly workOrderId?: string;
  readonly stopReason?: AgentWorkerStopReason;
  readonly delegationDecision?: AgentDelegationDecision;
  readonly at: string;
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentWorkerResult extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly resultId: string;
  readonly workerSessionId: SessionId;
  readonly parentSessionId?: SessionId;
  readonly workerAgentId?: AgentId;
  readonly workerInstanceId?: AgentInstanceId;
  readonly taskId?: TaskId;
  readonly workOrderId?: string;
  readonly status: "completed" | "failed" | "cancelled" | "stopped" | "timed-out" | "rejected";
  readonly summary: string;
  readonly assistantTextPreview?: string;
  readonly evidenceIds: readonly string[];
  readonly changedScope: readonly string[];
  readonly usage: JsonObject;
  readonly verifierVerdict?: AgentVerifierVerdict;
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentVerifierResult extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly verifierResultId: string;
  readonly verdict: AgentVerifierVerdict;
  readonly sessionId: SessionId;
  readonly verifierAgentId?: AgentId;
  readonly checkedTargets: readonly AgentWorkOrderTarget[];
  readonly commandEvidenceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly unverifiedAreas: readonly string[];
  readonly summary: string;
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentReasoningEffortMapping extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly requestedEffort?: ModelReasoningEffort;
  readonly providerEffort?: ModelReasoningProviderEffort;
  readonly provider: string;
  readonly model: string;
  readonly mapped: boolean;
  readonly supported: boolean;
  readonly reason?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentModeSessionSummary extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly interactionMode?: InteractionModeName;
  readonly agentMode?: AgentModeName;
  readonly phasePlanId?: string;
  readonly phaseStatuses: readonly AgentPhasePlanItem[];
  readonly budgets: readonly AgentLoopBudget[];
  readonly delegationDecisions: readonly AgentDelegationDecision[];
  readonly workerResults: readonly AgentWorkerResult[];
  readonly verifierResults: readonly AgentVerifierResult[];
  readonly reasoningEffort?: AgentReasoningEffortMapping;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentModeCompletionMatrixEntry extends JsonObject {
  readonly schemaVersion: typeof AGENT_MODE_SCHEMA_VERSION;
  readonly mode: AgentModeName;
  readonly productRole: AgentProductRole;
  readonly status: ModeCompletionStatus;
  readonly implementedSurfaces: readonly string[];
  readonly missingAcceptanceEvidence: readonly string[];
  readonly nextTasks: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export const AGENT_MODE_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: AGENT_MODE_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
