import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext } from "./common.js";
import type { AgentId, SessionId, TurnId } from "./ids.js";

export const SELF_REPAIR_SCHEMA_VERSION = "1.0.0";

export type SelfRepairFailureSource =
  | "provider-error"
  | "tool-error"
  | "workspace-error"
  | "build-test-error"
  | "task-output-error"
  | "agent-strategy-error";

export type SelfRepairFailureStatus = "observed" | "classified" | "planned" | "attempted" | "verified" | "stopped";
export type SelfRepairRepairability = "repairable" | "not-repairable" | "needs-user" | "unknown";
export type SelfRepairSafetyClass = "safe-read" | "safe-write" | "requires-approval" | "unsafe";
export type SelfRepairAffectedScope = "model" | "tool" | "workspace" | "artifact" | "test" | "architecture" | "unknown";
export type SelfRepairActionType = "model-feedback" | "rerun-check" | "deterministic-repair" | "revert" | "escalate" | "fail-closed";
export type SelfRepairVerificationStatus = "not-run" | "passed" | "failed" | "skipped";
export type SelfRepairVerificationDecision = "complete" | "retry" | "revert" | "escalate" | "fail";
export type SelfRepairHypothesisStatus = "accepted" | "rejected";
export type SelfRepairStopReason =
  | "completed"
  | "disabled"
  | "not-repairable"
  | "budget-exhausted"
  | "unsafe"
  | "checkpoint-unavailable"
  | "repeated-noop"
  | "verification-failed"
  | "escalated"
  | "terminal-failure";

export interface SelfRepairCompatibility extends CompatibilityMetadata {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly minReaderVersion: "1.0.0";
}

export interface SelfRepairConfig extends JsonObject {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  readonly requireCheckpointForWrites: boolean;
  readonly verificationMode: "minimal" | "targeted" | "broad";
}

export interface SelfRepairFailureClassification extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly classificationId: string;
  readonly failureSource: SelfRepairFailureSource;
  readonly status: SelfRepairFailureStatus;
  readonly repairability: SelfRepairRepairability;
  readonly safetyClass: SelfRepairSafetyClass;
  readonly affectedScope: SelfRepairAffectedScope;
  readonly severity: "info" | "warn" | "error";
  readonly evidenceFingerprints: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly trace: TraceContext;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairVerificationSummary extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly verificationId: string;
  readonly command?: string;
  readonly status: SelfRepairVerificationStatus;
  readonly exitCode?: number;
  readonly stdoutPreview?: string;
  readonly stderrPreview?: string;
  readonly elapsedMs?: number;
  readonly outputDigest?: string;
  readonly decision?: SelfRepairVerificationDecision;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairModelHypothesis extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly hypothesisId: string;
  readonly classificationId: string;
  readonly status: SelfRepairHypothesisStatus;
  readonly hypothesisPreview: string;
  readonly proposedActionType?: SelfRepairActionType;
  readonly evidenceFingerprints: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly trace: TraceContext;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairPlan extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly planId: string;
  readonly classificationId: string;
  readonly attemptId: string;
  readonly actionType: SelfRepairActionType;
  readonly targetScope: SelfRepairAffectedScope;
  readonly expectedVerification: readonly string[];
  readonly stopCriteria: readonly SelfRepairStopReason[];
  readonly requiresCheckpoint: boolean;
  readonly evidenceFingerprints: readonly string[];
  readonly trace: TraceContext;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairAttemptRecord extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly attemptId: string;
  readonly planId: string;
  readonly status: "started" | "completed" | "failed" | "skipped";
  readonly actionType: SelfRepairActionType;
  readonly toolIds: readonly string[];
  readonly touchedFiles: readonly string[];
  readonly materialChangeFingerprint?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly verification: readonly SelfRepairVerificationSummary[];
  readonly trace: TraceContext;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairOutcomeSummary extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly enabled: boolean;
  readonly activated: boolean;
  readonly attemptCount: number;
  readonly successCount: number;
  readonly repeatedNoopCount: number;
  readonly stopReason: SelfRepairStopReason;
  readonly classifications: readonly SelfRepairFailureClassification[];
  readonly attempts: readonly SelfRepairAttemptRecord[];
  readonly verification: readonly SelfRepairVerificationSummary[];
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface SelfRepairRuntimeEventBase extends JsonObject {
  readonly schemaVersion: typeof SELF_REPAIR_SCHEMA_VERSION;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly agentId?: AgentId;
  readonly trace: TraceContext;
  readonly compatibility: SelfRepairCompatibility;
  readonly redaction: RedactionMetadata;
}

export const SELF_REPAIR_COMPATIBILITY: SelfRepairCompatibility = {
  schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
