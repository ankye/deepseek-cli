export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type Id<Name extends string> = Brand<string, `${Name}Id`>;

export type MessageId = Id<"message">;
export type CorrelationId = Id<"correlation">;
export type CausationId = Id<"causation">;
export type SessionId = Id<"session">;
export type TurnId = Id<"turn">;
export type TaskId = Id<"task">;
export type WorkflowId = Id<"workflow">;
export type StepId = Id<"step">;
export type AgentId = Id<"agent">;
export type AgentInstanceId = Id<"agentInstance">;
export type CapabilityId = Id<"capability">;
export type CommandId = Id<"command">;
export type SkillId = Id<"skill">;
export type HookId = Id<"hook">;
export type McpServerId = Id<"mcpServer">;
export type PluginId = Id<"plugin">;
export type ExtensionId = Id<"extension">;
export type ModelProviderId = Id<"modelProvider">;
export type ModelProfileId = Id<"modelProfile">;
export type ContextNodeId = Id<"contextNode">;
export type MemoryId = Id<"memory">;
export type CacheKey = Id<"cacheKey">;
export type CredentialRef = Id<"credentialRef">;
export type WorkspaceId = Id<"workspace">;
export type AuditId = Id<"audit">;
export type TraceId = Id<"trace">;
export type SpanId = Id<"span">;

export function asId<Name extends string>(value: string): Id<Name> {
  return value as Id<Name>;
}

export interface IdFactory {
  create<Name extends string>(scope: Name): Id<Name>;
}
