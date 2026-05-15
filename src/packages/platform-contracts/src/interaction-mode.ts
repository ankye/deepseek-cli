import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext } from "./common.js";
import type { SessionId, TurnId } from "./ids.js";

export const INTERACTION_MODE_SCHEMA_VERSION = "1.0.0";

export type InteractionModeName =
  | "one-shot"
  | "chat"
  | "interactive"
  | "command-palette"
  | "result-list"
  | "approval"
  | "review-diff"
  | "background-task"
  | "headless"
  | "remote"
  | "degraded";

export type InteractionModeInitiator = "user" | "host" | "runtime" | "policy" | "resume" | "extension" | "test";
export type InteractionModeTransitionReason =
  | "command-requested"
  | "terminal-profile"
  | "runtime-phase"
  | "approval-required"
  | "result-list-focused"
  | "review-started"
  | "background-task-started"
  | "headless-output"
  | "remote-host"
  | "resume-restore"
  | "unsupported-degraded"
  | "policy-denied"
  | "unknown";

export type InteractionModeDegradationReason =
  | "unsupported-mode"
  | "non-tty"
  | "ci"
  | "redirected-io"
  | "no-color"
  | "unknown-width"
  | "raw-input-unavailable"
  | "remote-unsafe-command"
  | "permission-ui-unavailable"
  | "host-capability-missing";

export type InteractionCommandVisibility = "visible" | "hidden" | "disabled" | "rejected";
export type ModeCompletionStatus = "complete" | "partial" | "planned" | "disabled" | "unsupported";

export interface InteractionModeDescriptor extends JsonObject {
  readonly schemaVersion: typeof INTERACTION_MODE_SCHEMA_VERSION;
  readonly mode: InteractionModeName;
  readonly label: string;
  readonly description?: string;
  readonly supportedHosts: readonly string[];
  readonly supportedOutputs: readonly string[];
  readonly requiresTty: boolean;
  readonly allowsRawInput: boolean;
  readonly modelVisible: false;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface InteractionModeState extends JsonObject {
  readonly schemaVersion: typeof INTERACTION_MODE_SCHEMA_VERSION;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly mode: InteractionModeName;
  readonly previousMode?: InteractionModeName;
  readonly activeTargetId?: string;
  readonly activeResultListId?: string;
  readonly degraded: boolean;
  readonly degradationReasons: readonly InteractionModeDegradationReason[];
  readonly availableTransitions: readonly InteractionModeName[];
  readonly diagnostics: readonly RedactedError[];
  readonly trace?: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface InteractionModeTransition extends JsonObject {
  readonly schemaVersion: typeof INTERACTION_MODE_SCHEMA_VERSION;
  readonly transitionId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly previousMode: InteractionModeName;
  readonly nextMode: InteractionModeName;
  readonly reason: InteractionModeTransitionReason;
  readonly initiator: InteractionModeInitiator;
  readonly at: string;
  readonly trace?: TraceContext;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface InteractionModeCommandVisibility extends JsonObject {
  readonly schemaVersion: typeof INTERACTION_MODE_SCHEMA_VERSION;
  readonly commandId: string;
  readonly mode: InteractionModeName;
  readonly visibility: InteractionCommandVisibility;
  readonly reason?: InteractionModeDegradationReason | InteractionModeTransitionReason;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface InteractionModeCompletionMatrixEntry extends JsonObject {
  readonly schemaVersion: typeof INTERACTION_MODE_SCHEMA_VERSION;
  readonly mode: InteractionModeName;
  readonly status: ModeCompletionStatus;
  readonly implementedSurfaces: readonly string[];
  readonly missingAcceptanceEvidence: readonly string[];
  readonly nextTasks: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export const INTERACTION_MODE_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
