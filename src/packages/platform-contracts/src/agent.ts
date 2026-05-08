import type { JsonObject } from "./common.js";
import type { AgentId, AgentInstanceId, ModelProfileId, SessionId } from "./ids.js";

export type AgentSource = "built-in" | "user" | "workspace" | "extension" | "plugin";
export type AgentInstanceStatus = "idle" | "running" | "interrupted" | "disposed";

export interface AgentScopes {
  readonly capabilities: readonly string[];
  readonly context: readonly string[];
  readonly memory: readonly string[];
  readonly policy: readonly string[];
  readonly skills: readonly string[];
  readonly commands: readonly string[];
  readonly hooks: readonly string[];
}

export interface AgentDefinition {
  readonly id: AgentId;
  readonly name: string;
  readonly version: string;
  readonly source: AgentSource;
  readonly modelProfileId: ModelProfileId;
  readonly promptProfile: string;
  readonly scopes: AgentScopes;
  readonly delegation?: JsonObject;
}

export interface AgentInstance {
  readonly id: AgentInstanceId;
  readonly definition: AgentDefinition;
  readonly sessionId: SessionId;
  readonly status: AgentInstanceStatus;
}

export interface AgentManager {
  register(definition: AgentDefinition): Promise<void>;
  getDefault(): Promise<AgentDefinition>;
  createInstance(definitionId: AgentId, sessionId: SessionId): Promise<AgentInstance>;
  getInstance(instanceId: AgentInstanceId): Promise<AgentInstance | undefined>;
  listDefinitions(): Promise<readonly AgentDefinition[]>;
}
