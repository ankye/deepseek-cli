import type { AgentDefinition, AgentId, AgentInstance, AgentInstanceId, AgentManager, SessionId } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const defaultAgent: AgentDefinition = {
  id: asId<"agent">("agent-default"),
  name: "default",
  version: "1.0.0",
  source: "built-in",
  modelProfileId: asId<"modelProfile">("model-deepseek-default"),
  promptProfile: "coding-agent",
  scopes: {
    capabilities: ["*"],
    context: ["workspace", "session"],
    memory: ["working", "session", "project"],
    policy: ["default"],
    skills: ["trusted"],
    commands: ["*"],
    hooks: ["trusted"]
  }
};

export class InMemoryAgentManager implements AgentManager {
  private readonly definitions = new Map<string, AgentDefinition>([[defaultAgent.id, defaultAgent]]);
  private readonly instances = new Map<string, AgentInstance>();

  async register(definition: AgentDefinition): Promise<void> {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Agent definition already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
  }

  async getDefault(): Promise<AgentDefinition> {
    return defaultAgent;
  }

  async createInstance(definitionId: AgentId, sessionId: SessionId): Promise<AgentInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Unknown agent definition: ${definitionId}`);
    }
    const instance: AgentInstance = {
      id: asId<"agentInstance">(`agent-instance-${sessionId}`) as AgentInstanceId,
      definition,
      sessionId,
      status: "running"
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
}
