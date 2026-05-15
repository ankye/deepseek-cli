import type {
  AgentCreateInstanceOptions,
  AgentDefinition,
  AgentId,
  AgentInstance,
  AgentInstanceId,
  AgentInstanceStatus,
  AgentLifecycleRecord,
  AgentLifecycleState,
  AgentLifecycleTransitionKind,
  AgentLifecycleTransitionRequest,
  AgentManager,
  AgentModeBinding,
  AgentModeName,
  AgentProductRole,
  AgentScopes,
  CompatibilityMetadata,
  RedactedError,
  SessionId
} from "@deepseek/platform-contracts";
import { AGENT_COMPATIBILITY, AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION, AGENT_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

const agentDefinitionCompatibility: AgentDefinition["compatibility"] = {
  schemaVersion: AGENT_SCHEMA_VERSION,
  supportedAgentModes: ["default", "evidence", "planner", "implementer", "verifier", "coordinator", "worker", "repair", "synthesis"],
  defaultAgentMode: "default",
  modeContractVersion: AGENT_MODE_SCHEMA_VERSION,
  redaction: { class: "internal" },
  compatibility: AGENT_COMPATIBILITY
};

const defaultAgent: AgentDefinition = {
  schemaVersion: AGENT_SCHEMA_VERSION,
  id: asId<"agent">("agent-default"),
  name: "default",
  version: "1.0.0",
  source: "built-in",
  modelProfileId: asId<"modelProfile">("model-deepseek-default"),
  promptProfile: "coding-agent",
  productRole: "default-coding-agent",
  defaultAgentMode: "default",
  supportedAgentModes: agentDefinitionCompatibility.supportedAgentModes,
  scopes: {
    capabilities: ["*"],
    context: ["workspace", "session"],
    memory: ["working", "session", "project"],
    policy: ["default"],
    skills: ["trusted"],
    commands: ["*"],
    hooks: ["trusted"],
    mcp: ["trusted"],
    modelProfiles: ["default"],
    hostCapabilities: ["terminal", "filesystem", "process"]
  },
  delegation: {
    canDelegate: true,
    acceptsDelegation: true,
    maxWorkers: 4,
    allowedChildModes: ["evidence", "planner", "implementer", "verifier", "worker", "repair", "synthesis"],
    requiredWorkOrderFields: ["purpose", "originalUserGoal", "taskSummary", "targets", "doneCriteria", "verificationExpectations"],
    resultRouting: "structured-event"
  },
  redaction: { class: "internal" },
  compatibility: agentDefinitionCompatibility
};

const modeProductRoles: Record<AgentModeName, AgentProductRole> = {
  default: "default-coding-agent",
  evidence: "evidence-researcher",
  planner: "planner",
  implementer: "implementer",
  verifier: "verifier",
  coordinator: "coordinator",
  worker: "worker",
  repair: "repairer",
  synthesis: "synthesizer"
};

const modeCapabilityAllowLists: Record<AgentModeName, readonly string[] | undefined> = {
  default: undefined,
  evidence: ["file.read", "file.list", "search.text", "git.status", "web.fetch", "web.search", "skill.list", "mcp.read"],
  planner: ["file.read", "file.list", "search.text", "git.status", "todo.plan", "skill.list", "mcp.read"],
  implementer: undefined,
  verifier: ["file.read", "file.list", "search.text", "git.status", "git.diff", "test.run", "shell.run", "web.fetch", "skill.list", "mcp.read"],
  coordinator: ["todo.plan", "agent.spawn", "agent.continue", "agent.stop", "git.status", "git.diff", "skill.list"],
  worker: undefined,
  repair: undefined,
  synthesis: ["file.read", "file.list", "search.text", "git.status", "git.diff", "skill.list"]
};

const modeCommandAllowLists: Record<AgentModeName, readonly string[] | undefined> = {
  default: undefined,
  evidence: ["file.read", "file.list", "search.text", "git.status", "web.fetch", "web.search"],
  planner: ["file.read", "file.list", "search.text", "git.status", "todo.plan"],
  implementer: undefined,
  verifier: ["file.read", "file.list", "search.text", "git.status", "git.diff", "test.run", "shell.run"],
  coordinator: ["todo.plan", "agent.spawn", "agent.continue", "agent.stop", "git.status", "git.diff"],
  worker: undefined,
  repair: undefined,
  synthesis: ["file.read", "file.list", "search.text", "git.status", "git.diff"]
};

export function createAgentValidationError(code: string, message: string, field?: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal" },
    ...(field ? { details: { field } } : {})
  };
}

export function isAgentModeSupported(definition: AgentDefinition, mode: AgentModeName): boolean {
  return definition.supportedAgentModes.includes(mode);
}

export function projectAgentScopes(definition: AgentDefinition, mode: AgentModeName): AgentScopes {
  const capabilityAllowList = modeCapabilityAllowLists[mode];
  const commandAllowList = modeCommandAllowLists[mode];
  const capabilities = projectList(definition.scopes.capabilities, capabilityAllowList);
  const commands = projectList(definition.scopes.commands, commandAllowList);

  if (mode === "coordinator") {
    return {
      ...definition.scopes,
      capabilities,
      commands,
      context: projectList(definition.scopes.context, ["workspace", "session", "agent-results"]),
      memory: projectList(definition.scopes.memory, ["working", "session"]),
      policy: mergeUnique(projectList(definition.scopes.policy, ["default", "delegation"]), ["delegation"]),
      skills: projectList(definition.scopes.skills, ["trusted"]),
      hooks: projectList(definition.scopes.hooks, ["trusted"]),
      mcp: projectList(definition.scopes.mcp ?? [], ["trusted", "read-only"]),
      modelProfiles: projectList(definition.scopes.modelProfiles ?? [], ["default", "coordinator"]),
      hostCapabilities: projectList(definition.scopes.hostCapabilities ?? [], ["terminal", "process"])
    };
  }

  if (mode === "verifier") {
    return {
      ...definition.scopes,
      capabilities,
      commands,
      context: projectList(definition.scopes.context, ["workspace", "session", "artifacts", "diagnostics"]),
      memory: projectList(definition.scopes.memory, ["working", "session"]),
      policy: mergeUnique(projectList(definition.scopes.policy, ["default", "read-only", "verification"]), ["verification"]),
      skills: projectList(definition.scopes.skills, ["trusted"]),
      hooks: projectList(definition.scopes.hooks, ["trusted"]),
      mcp: projectList(definition.scopes.mcp ?? [], ["trusted", "read-only"]),
      modelProfiles: projectList(definition.scopes.modelProfiles ?? [], ["default", "verifier"]),
      hostCapabilities: projectList(definition.scopes.hostCapabilities ?? [], ["terminal", "filesystem", "process"])
    };
  }

  if (mode === "planner" || mode === "evidence" || mode === "synthesis") {
    return {
      ...definition.scopes,
      capabilities,
      commands,
      memory: projectList(definition.scopes.memory, ["working", "session", "project"]),
      policy: mergeUnique(projectList(definition.scopes.policy, ["default", "read-only"]), ["read-only"]),
      mcp: projectList(definition.scopes.mcp ?? [], ["trusted", "read-only"])
    };
  }

  if (mode === "implementer" || mode === "worker" || mode === "repair") {
    return {
      ...definition.scopes,
      capabilities,
      commands,
      policy: mergeUnique(definition.scopes.policy, ["checkpoint-required", "bounded-write-scope"]),
      mcp: definition.scopes.mcp ?? []
    };
  }

  return {
    ...definition.scopes,
    capabilities,
    commands,
    mcp: definition.scopes.mcp ?? []
  };
}

export class InMemoryAgentManager implements AgentManager {
  private readonly definitions = new Map<string, AgentDefinition>([[defaultAgent.id, defaultAgent]]);
  private readonly instances = new Map<string, AgentInstance>();

  async register(definition: AgentDefinition): Promise<void> {
    const errors = await this.validateDefinition(definition);
    if (errors.length > 0) {
      throw new Error(`Invalid agent definition ${definition.id}: ${errors.map((error) => error.code).join(", ")}`);
    }
    if (this.definitions.has(definition.id)) {
      throw new Error(`Agent definition already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
  }

  async getDefault(): Promise<AgentDefinition> {
    return defaultAgent;
  }

  async createInstance(definitionId: AgentId, sessionId: SessionId, options: AgentCreateInstanceOptions = {}): Promise<AgentInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Unknown agent definition: ${definitionId}`);
    }
    const mode = options.mode ?? definition.defaultAgentMode;
    if (!isAgentModeSupported(definition, mode)) {
      throw new Error(`Unsupported agent mode for ${definition.id}: ${mode}`);
    }
    if (options.workOrderId && !definition.delegation?.acceptsDelegation) {
      throw new Error(`Agent definition does not accept delegated work orders: ${definition.id}`);
    }

    const scopes = options.scopeProjection ?? projectAgentScopes(definition, mode);
    const lifecycleState = options.lifecycleState ?? "spawned";
    const status = statusForLifecycle(lifecycleState);
    const instanceId = asId<"agentInstance">(`agent-instance-${sessionId}-${this.instances.size + 1}`) as AgentInstanceId;
    const modeBinding = createModeBinding(definition, instanceId, mode, options.productRole ?? modeProductRoles[mode], scopes);
    const lifecycleEvents = [
      createLifecycleRecord({
        instanceId,
        transition: "spawn",
        previousStatus: "idle",
        nextStatus: status,
        previousLifecycleState: "spawned",
        nextLifecycleState: lifecycleState,
        ...(options.workOrderId ? { workOrderId: options.workOrderId } : {}),
        at: "1970-01-01T00:00:00.000Z"
      })
    ];
    const instance: AgentInstance = {
      schemaVersion: AGENT_SCHEMA_VERSION,
      id: instanceId,
      definition,
      sessionId,
      status,
      lifecycleState,
      mode,
      productRole: options.productRole ?? modeProductRoles[mode],
      modeBinding,
      ...(options.parentAgentId ? { parentAgentId: options.parentAgentId } : {}),
      ...(options.parentSessionId ? { parentSessionId: options.parentSessionId } : {}),
      ...(options.childSessionId ? { childSessionId: options.childSessionId } : {}),
      ...(options.workOrderId ? { workOrderId: options.workOrderId } : {}),
      ...(options.delegationDecisionId ? { delegationDecisionId: options.delegationDecisionId } : {}),
      ...(options.continuationOf ? { continuationOf: options.continuationOf } : {}),
      scopes,
      lifecycleEvents,
      ...(options.metadata ? { metadata: options.metadata } : {}),
      redaction: { class: "internal" },
      compatibility: AGENT_COMPATIBILITY
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  async getInstance(instanceId: AgentInstanceId): Promise<AgentInstance | undefined> {
    return this.instances.get(instanceId);
  }

  async listDefinitions(): Promise<readonly AgentDefinition[]> {
    return [...this.definitions.values()];
  }

  async validateDefinition(definition: AgentDefinition): Promise<readonly RedactedError[]> {
    const errors: RedactedError[] = [];
    if (definition.schemaVersion !== AGENT_SCHEMA_VERSION) {
      errors.push(createAgentValidationError("AGENT_SCHEMA_VERSION_UNSUPPORTED", "Agent definition schemaVersion is unsupported.", "schemaVersion"));
    }
    if (definition.supportedAgentModes.length === 0) {
      errors.push(createAgentValidationError("AGENT_MODES_REQUIRED", "Agent definition must declare at least one supported agent mode.", "supportedAgentModes"));
    }
    if (!definition.supportedAgentModes.includes(definition.defaultAgentMode)) {
      errors.push(createAgentValidationError("AGENT_DEFAULT_MODE_UNSUPPORTED", "Agent default mode must be included in supportedAgentModes.", "defaultAgentMode"));
    }
    for (const [field, values] of Object.entries(definition.scopes)) {
      if (Array.isArray(values) && values.some((value) => typeof value !== "string" || value.length === 0)) {
        errors.push(createAgentValidationError("AGENT_SCOPE_INVALID", "Agent scopes must contain only non-empty strings.", `scopes.${field}`));
      }
    }
    if (definition.delegation) {
      if (definition.delegation.allowedChildModes.length === 0 && definition.delegation.canDelegate) {
        errors.push(createAgentValidationError("AGENT_DELEGATION_CHILD_MODES_REQUIRED", "Delegating agents must declare allowed child modes.", "delegation.allowedChildModes"));
      }
      if (definition.delegation.requiredWorkOrderFields.length === 0 && definition.delegation.acceptsDelegation) {
        errors.push(createAgentValidationError("AGENT_DELEGATION_WORK_ORDER_FIELDS_REQUIRED", "Delegated agents must declare required work order fields.", "delegation.requiredWorkOrderFields"));
      }
    }
    return errors;
  }

  async projectScopes(definitionId: AgentId, mode: AgentModeName): Promise<AgentScopes> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Unknown agent definition: ${definitionId}`);
    }
    if (!isAgentModeSupported(definition, mode)) {
      throw new Error(`Unsupported agent mode for ${definition.id}: ${mode}`);
    }
    return projectAgentScopes(definition, mode);
  }

  async transitionInstance(instanceId: AgentInstanceId, request: AgentLifecycleTransitionRequest): Promise<AgentInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Unknown agent instance: ${instanceId}`);
    }
    const nextLifecycleState = lifecycleForTransition(request.transition);
    const nextStatus = statusForLifecycle(nextLifecycleState);
    const record = createLifecycleRecord({
      instanceId,
      transition: request.transition,
      previousStatus: instance.status,
      nextStatus,
      previousLifecycleState: instance.lifecycleState,
      nextLifecycleState,
      ...(request.workOrderId ?? instance.workOrderId ? { workOrderId: request.workOrderId ?? instance.workOrderId } : {}),
      ...(request.reason ? { reason: request.reason } : {}),
      at: request.at ?? new Date(0).toISOString()
    });
    const updated: AgentInstance = {
      ...instance,
      status: nextStatus,
      lifecycleState: nextLifecycleState,
      ...(request.workOrderId ? { workOrderId: request.workOrderId } : {}),
      ...(request.metadata ? { metadata: { ...(instance.metadata ?? {}), ...request.metadata } } : {}),
      lifecycleEvents: [...instance.lifecycleEvents, record]
    };
    this.instances.set(instanceId, updated);
    return updated;
  }
}

function createModeBinding(
  definition: AgentDefinition,
  instanceId: AgentInstanceId,
  mode: AgentModeName,
  productRole: AgentProductRole,
  scopes: AgentScopes
): AgentModeBinding {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    agentId: definition.id,
    agentInstanceId: instanceId,
    mode,
    productRole,
    scopeIds: [
      ...scopes.capabilities.map((scope) => `capability:${scope}`),
      ...scopes.context.map((scope) => `context:${scope}`),
      ...scopes.policy.map((scope) => `policy:${scope}`)
    ],
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function createLifecycleRecord(input: {
  readonly instanceId: AgentInstanceId;
  readonly transition: AgentLifecycleTransitionKind;
  readonly previousStatus: AgentInstanceStatus;
  readonly nextStatus: AgentInstanceStatus;
  readonly previousLifecycleState: AgentLifecycleState;
  readonly nextLifecycleState: AgentLifecycleState;
  readonly workOrderId?: string;
  readonly reason?: string;
  readonly at: string;
}): AgentLifecycleRecord {
  return {
    schemaVersion: AGENT_SCHEMA_VERSION,
    lifecycleEventId: `agent-lifecycle:${input.instanceId}:${input.transition}:${input.at}`,
    instanceId: input.instanceId,
    transition: input.transition,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    previousLifecycleState: input.previousLifecycleState,
    nextLifecycleState: input.nextLifecycleState,
    ...(input.workOrderId ? { workOrderId: input.workOrderId } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    at: input.at,
    diagnostics: [],
    redaction: { class: "internal" },
    compatibility: AGENT_COMPATIBILITY
  };
}

function lifecycleForTransition(transition: AgentLifecycleTransitionKind): AgentLifecycleState {
  switch (transition) {
    case "spawn":
      return "spawned";
    case "continue":
      return "continued";
    case "stop":
      return "stopped";
    case "resume":
      return "resumed";
    case "complete":
      return "completed";
    case "fail":
      return "failed";
    case "dispose":
      return "disposed";
  }
}

function statusForLifecycle(lifecycle: AgentLifecycleState): AgentInstanceStatus {
  switch (lifecycle) {
    case "spawned":
    case "running":
    case "continued":
    case "resumed":
      return "running";
    case "stopped":
      return "stopped";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "disposed":
      return "disposed";
  }
}

function projectList(current: readonly string[], allowList: readonly string[] | undefined): readonly string[] {
  if (!allowList) return current;
  if (current.includes("*")) return allowList;
  return current.filter((item) => allowList.includes(item));
}

function mergeUnique(left: readonly string[], right: readonly string[]): readonly string[] {
  return [...new Set([...left, ...right])];
}

export { defaultAgent };
