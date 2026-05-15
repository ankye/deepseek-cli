import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { AgentModeBinding, AgentModeName, AgentProductRole } from "./agent-mode.js";
import type { AgentId, AgentInstanceId, ModelProfileId, SessionId } from "./ids.js";

export const AGENT_SCHEMA_VERSION = "1.0.0";

export type AgentSource = "built-in" | "user" | "workspace" | "extension" | "plugin";
export type AgentInstanceStatus = "idle" | "running" | "interrupted" | "stopped" | "completed" | "failed" | "disposed";
export type AgentLifecycleState = "spawned" | "running" | "continued" | "stopped" | "resumed" | "completed" | "failed" | "disposed";
export type AgentLifecycleTransitionKind = "spawn" | "continue" | "stop" | "resume" | "complete" | "fail" | "dispose";

export interface AgentScopes extends JsonObject {
  readonly capabilities: readonly string[];
  readonly context: readonly string[];
  readonly memory: readonly string[];
  readonly policy: readonly string[];
  readonly skills: readonly string[];
  readonly commands: readonly string[];
  readonly hooks: readonly string[];
  readonly mcp?: readonly string[];
  readonly modelProfiles?: readonly string[];
  readonly hostCapabilities?: readonly string[];
}

export interface AgentDelegationMetadata extends JsonObject {
  readonly canDelegate: boolean;
  readonly acceptsDelegation: boolean;
  readonly maxWorkers?: number;
  readonly allowedChildModes: readonly AgentModeName[];
  readonly requiredWorkOrderFields: readonly string[];
  readonly resultRouting: "structured-event" | "direct";
}

export interface AgentCompatibilityMetadata extends JsonObject {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly supportedAgentModes: readonly AgentModeName[];
  readonly defaultAgentMode: AgentModeName;
  readonly modeContractVersion: string;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentDefinition {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly id: AgentId;
  readonly name: string;
  readonly version: string;
  readonly source: AgentSource;
  readonly modelProfileId: ModelProfileId;
  readonly promptProfile: string;
  readonly productRole: AgentProductRole;
  readonly defaultAgentMode: AgentModeName;
  readonly supportedAgentModes: readonly AgentModeName[];
  readonly scopes: AgentScopes;
  readonly delegation?: AgentDelegationMetadata;
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: AgentCompatibilityMetadata;
}

export interface AgentCreateInstanceOptions extends JsonObject {
  readonly mode?: AgentModeName;
  readonly productRole?: AgentProductRole;
  readonly parentAgentId?: AgentId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegationDecisionId?: string;
  readonly continuationOf?: AgentInstanceId;
  readonly scopeProjection?: AgentScopes;
  readonly lifecycleState?: AgentLifecycleState;
  readonly metadata?: JsonObject;
}

export interface AgentLifecycleRecord extends JsonObject {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly lifecycleEventId: string;
  readonly instanceId: AgentInstanceId;
  readonly transition: AgentLifecycleTransitionKind;
  readonly previousStatus: AgentInstanceStatus;
  readonly nextStatus: AgentInstanceStatus;
  readonly previousLifecycleState: AgentLifecycleState;
  readonly nextLifecycleState: AgentLifecycleState;
  readonly workOrderId?: string;
  readonly reason?: string;
  readonly at: string;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentLifecycleTransitionRequest extends JsonObject {
  readonly transition: AgentLifecycleTransitionKind;
  readonly workOrderId?: string;
  readonly reason?: string;
  readonly at?: string;
  readonly metadata?: JsonObject;
}

export interface AgentInstance {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly id: AgentInstanceId;
  readonly definition: AgentDefinition;
  readonly sessionId: SessionId;
  readonly status: AgentInstanceStatus;
  readonly lifecycleState: AgentLifecycleState;
  readonly mode: AgentModeName;
  readonly productRole: AgentProductRole;
  readonly modeBinding: AgentModeBinding;
  readonly parentAgentId?: AgentId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegationDecisionId?: string;
  readonly continuationOf?: AgentInstanceId;
  readonly scopes: AgentScopes;
  readonly lifecycleEvents: readonly AgentLifecycleRecord[];
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentManager {
  register(definition: AgentDefinition): Promise<void>;
  getDefault(): Promise<AgentDefinition>;
  createInstance(definitionId: AgentId, sessionId: SessionId, options?: AgentCreateInstanceOptions): Promise<AgentInstance>;
  getInstance(instanceId: AgentInstanceId): Promise<AgentInstance | undefined>;
  listDefinitions(): Promise<readonly AgentDefinition[]>;
  validateDefinition(definition: AgentDefinition): Promise<readonly RedactedError[]>;
  projectScopes(definitionId: AgentId, mode: AgentModeName): Promise<AgentScopes>;
  transitionInstance(instanceId: AgentInstanceId, request: AgentLifecycleTransitionRequest): Promise<AgentInstance>;
}

export const AGENT_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: AGENT_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
