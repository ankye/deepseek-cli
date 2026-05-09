import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, SerializableResult, TraceContext } from "./common.js";
import type { HookId, SessionId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export const HOOK_SCHEMA_VERSION = "1.0.0";

export type HookSourceKind = "built-in" | "user" | "workspace" | "extension" | "plugin" | "catalog";
export type HookLifecyclePoint =
  | "user-input.before"
  | "user-input.after"
  | "model-call.before"
  | "model-call.after"
  | "tool-execution.before"
  | "tool-execution.after"
  | "skill-activation.before"
  | "skill-activation.after"
  | "workflow-step.before"
  | "workflow-step.after"
  | "file-edit.before"
  | "file-edit.after"
  | "session.before"
  | "session.after"
  | "plugin-lifecycle.before"
  | "plugin-lifecycle.after"
  | "host-render.before"
  | "host-render.after"
  | string;
export type HookIsolationMode = "in-process-observe-only" | "sandboxed" | "external";
export type HookFailurePolicy = "continue" | "block" | "disable" | "rollback-requested";
export type HookOutputKind = "observation" | "context" | "policy-suggestion" | "workflow-suggestion" | "capability-request" | "host-render-hint";
export type HookInvocationStatus = "completed" | "blocked" | "rollback-requested" | "failed" | "skipped" | "rejected";
export type HookExecutionStatus = "completed" | "failed" | "timed-out" | "skipped" | "disabled" | "inert";

export interface HookOrdering extends JsonObject {
  readonly priority: number;
  readonly after?: readonly string[];
  readonly before?: readonly string[];
}

export interface HookManifest extends JsonObject {
  readonly schemaVersion?: string;
  readonly id: HookId;
  readonly name: string;
  readonly version: string;
  readonly point: HookLifecyclePoint;
  readonly source: HookSourceKind | string;
  readonly trust: TrustStatus;
  readonly ordering: HookOrdering;
  readonly timeoutMs: number;
  readonly failurePolicy: HookFailurePolicy;
  readonly isolation: HookIsolationMode;
  readonly permissions: readonly string[];
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly enabled?: boolean;
  readonly description?: string;
  readonly compatibility?: CompatibilityMetadata;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface HookSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly id: HookId;
  readonly name: string;
  readonly version: string;
  readonly point: HookLifecyclePoint;
  readonly source: string;
  readonly trust: TrustStatus;
  readonly enabled: boolean;
  readonly ordering: HookOrdering;
  readonly timeoutMs: number;
  readonly failurePolicy: HookFailurePolicy;
  readonly isolation: HookIsolationMode;
  readonly permissions: readonly string[];
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
}

export interface HookValidationResult extends JsonObject {
  readonly schemaVersion: string;
  readonly ok: boolean;
  readonly diagnostics: readonly RedactedError[];
  readonly normalized?: HookManifest;
  readonly redaction: RedactionMetadata;
}

export interface HookOutputRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly hookId: HookId;
  readonly kind: HookOutputKind;
  readonly payload: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly replayFingerprint: string;
}

export interface HookInvocationRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly point: HookLifecyclePoint;
  readonly input: JsonObject;
  readonly sessionId?: SessionId;
  readonly trace?: TraceContext;
  readonly timeoutMs?: number;
}

export interface HookExecutionRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly hookId: HookId;
  readonly name: string;
  readonly point: HookLifecyclePoint;
  readonly status: HookExecutionStatus;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly outputs: readonly HookOutputRecord[];
  readonly diagnostics: readonly RedactedError[];
  readonly failurePolicy: HookFailurePolicy;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface HookInvocationResult extends JsonObject {
  readonly schemaVersion: string;
  readonly point: HookLifecyclePoint;
  readonly status: HookInvocationStatus;
  readonly orderedHookIds: readonly HookId[];
  readonly executions: readonly HookExecutionRecord[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface HookOrderProjectionRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly point: HookLifecyclePoint;
  readonly includeInert?: boolean;
}

export interface HookOrderProjectionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly point: HookLifecyclePoint;
  readonly ordered: readonly HookSummary[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface HookHandlerContext extends JsonObject {
  readonly manifest: HookManifest;
  readonly request: HookInvocationRequest;
  readonly trace?: TraceContext;
  readonly signal?: JsonObject;
}

export type HookHandler = (
  input: JsonObject,
  context: HookHandlerContext
) => Promise<SerializableResult<HookOutputRecord | readonly HookOutputRecord[]>>;

export interface HookSystem {
  validateManifest(manifest: HookManifest): Promise<HookValidationResult>;
  registerHook(manifest: HookManifest, handler?: HookHandler): Promise<HookSummary>;
  listHooks(point?: HookLifecyclePoint): Promise<readonly HookSummary[]>;
  projectOrder(request: HookOrderProjectionRequest): Promise<HookOrderProjectionResult>;
  invokeHooks(request: HookInvocationRequest): Promise<HookInvocationResult>;
}
