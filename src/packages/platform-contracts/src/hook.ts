import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, SerializableResult, TraceContext } from "./common.js";
import type { HookId, SessionId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export const HOOK_SCHEMA_VERSION = "1.0.0";
export const PLUGIN_LIFECYCLE_HOOK_DEFAULT_TIMEOUT_MS = 2_000;
export const PLUGIN_LIFECYCLE_HOOK_POINTS = [
  "plugin.discovery.before",
  "plugin.discovery.after",
  "plugin.validation.before",
  "plugin.validation.after",
  "plugin.install.before",
  "plugin.install.after",
  "plugin.enable.before",
  "plugin.enable.after",
  "plugin.activation.before",
  "plugin.activation.after",
  "plugin.update.before",
  "plugin.update.after",
  "plugin.rollback.before",
  "plugin.rollback.after",
  "plugin.disable.before",
  "plugin.disable.after",
  "plugin.uninstall.before",
  "plugin.uninstall.after",
  "plugin.health.before",
  "plugin.health.after"
] as const;

export type HookSourceKind = "built-in" | "user" | "workspace" | "extension" | "plugin" | "catalog";
export type PluginLifecycleHookPoint = (typeof PLUGIN_LIFECYCLE_HOOK_POINTS)[number];
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
  | PluginLifecycleHookPoint
  | "host-render.before"
  | "host-render.after"
  | string;
export type HookIsolationMode = "in-process-observe-only" | "sandboxed" | "external";
export type HookFailurePolicy = "continue" | "block" | "disable" | "rollback-requested";
export type PluginLifecycleHookOutputKind =
  | "observation"
  | "diagnostic"
  | "policy-suggestion"
  | "activation-suggestion"
  | "health-suggestion"
  | "config-suggestion"
  | "governed-capability-request";
export type HookOutputKind =
  | PluginLifecycleHookOutputKind
  | "context"
  | "workflow-suggestion"
  | "capability-request"
  | "host-render-hint";
export type HookInvocationStatus = "completed" | "blocked" | "rollback-requested" | "failed" | "skipped" | "rejected";
export type HookExecutionStatus = "completed" | "failed" | "timed-out" | "skipped" | "disabled" | "inert";

export interface PluginLifecycleHookPointDescriptor extends JsonObject {
  readonly point: PluginLifecycleHookPoint;
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly allowedOutputKinds: readonly PluginLifecycleHookOutputKind[];
  readonly defaultTimeoutMs: number;
  readonly defaultFailurePolicy: HookFailurePolicy;
  readonly defaultOrdering: HookOrdering;
  readonly blockingAllowed: boolean;
  readonly requiresPolicy: boolean;
}

export interface HookOrdering extends JsonObject {
  readonly priority: number;
  readonly after?: readonly string[];
  readonly before?: readonly string[];
}

export const PLUGIN_LIFECYCLE_HOOK_POINT_CATALOG: readonly PluginLifecycleHookPointDescriptor[] =
  PLUGIN_LIFECYCLE_HOOK_POINTS.map((point) => ({
    point,
    inputSchema: {
      type: "object",
      required: ["pluginId", "lifecycleState", "trigger"]
    },
    outputSchema: {
      type: "object",
      allowedOutputKinds: [
        "observation",
        "diagnostic",
        "policy-suggestion",
        "activation-suggestion",
        "health-suggestion",
        "config-suggestion",
        "governed-capability-request"
      ]
    },
    allowedOutputKinds: [
      "observation",
      "diagnostic",
      "policy-suggestion",
      "activation-suggestion",
      "health-suggestion",
      "config-suggestion",
      "governed-capability-request"
    ],
    defaultTimeoutMs: PLUGIN_LIFECYCLE_HOOK_DEFAULT_TIMEOUT_MS,
    defaultFailurePolicy: point.endsWith(".before") ? "block" : "continue",
    defaultOrdering: { priority: 0 },
    blockingAllowed:
      point.endsWith(".before") &&
      !point.startsWith("plugin.discovery.") &&
      !point.startsWith("plugin.validation."),
    requiresPolicy: point.endsWith(".before")
  }));

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
