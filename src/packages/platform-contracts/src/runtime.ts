import type { JsonObject, RedactedError, TraceContext } from "./common.js";
import type { AgentId, SessionId, TaskId, TurnId } from "./ids.js";
import type { AgentManager } from "./agent.js";
import type { CapabilityRegistry } from "./capability.js";
import type { CacheManager, MemoryManager } from "./memory.js";
import type { CodeIntelligenceService } from "./code-intelligence.js";
import type { CommandSystem } from "./command.js";
import type { ConcurrencyOrchestrator } from "./concurrency.js";
import type { ConfigStore } from "./config.js";
import type { ContextEngine } from "./context.js";
import type { CredentialManager } from "./credential.js";
import type { DistributionUpdateManager } from "./distribution.js";
import type { EvolutionEngine } from "./evolution.js";
import type { ExtensionManager } from "./extension.js";
import type { HookSystem } from "./hook.js";
import type { McpGateway } from "./mcp.js";
import type { ModelGateway } from "./model.js";
import type { ObservabilitySink } from "./observability.js";
import type { PlatformRuntime } from "./platform.js";
import type { PluginManager } from "./plugin.js";
import type { ApprovalBroker, PolicyEngine, SandboxRuntime } from "./policy.js";
import type { ProtocolRouter } from "./protocol.js";
import type { RemoteRuntimeConnectivity } from "./remote.js";
import type { RuntimeMessageBus } from "./bus.js";
import type { RegressionHarness } from "./testing.js";
import type { SessionStore } from "./session.js";
import type { SkillSystem } from "./skill.js";
import type { UsageBudgetManager } from "./usage.js";
import type { WorkflowOrchestrator } from "./workflow.js";
import type { WorkspaceStateManager } from "./workspace.js";

export type RuntimeEventKind =
  | "session.started"
  | "turn.started"
  | "workflow.step"
  | "bus.recorded"
  | "model.delta"
  | "usage.updated"
  | "turn.completed"
  | "runtime.error"
  | "runtime.disposed";

export interface RuntimeRequest extends JsonObject {
  readonly prompt: string;
  readonly sessionId?: SessionId;
  readonly agentId?: AgentId;
}

export interface RuntimeEvent extends JsonObject {
  readonly kind: RuntimeEventKind;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly taskId?: TaskId;
  readonly agentId?: AgentId;
  readonly trace: TraceContext;
  readonly data: JsonObject;
  readonly error?: RedactedError;
}

export interface StartSessionRequest {
  readonly workspaceRoot?: string;
  readonly agentId?: AgentId;
}

export interface RunTurnRequest {
  readonly sessionId?: SessionId;
  readonly prompt: string;
  readonly agentId?: AgentId;
}

export interface RuntimeDependencies {
  readonly protocol: ProtocolRouter;
  readonly bus: RuntimeMessageBus;
  readonly workflow: WorkflowOrchestrator;
  readonly concurrency: ConcurrencyOrchestrator;
  readonly agents: AgentManager;
  readonly models: ModelGateway;
  readonly capabilities: CapabilityRegistry;
  readonly commands: CommandSystem;
  readonly skills: SkillSystem;
  readonly hooks: HookSystem;
  readonly mcp: McpGateway;
  readonly plugins: PluginManager;
  readonly extensions: ExtensionManager;
  readonly context: ContextEngine;
  readonly memory: MemoryManager;
  readonly cache: CacheManager;
  readonly credentials: CredentialManager;
  readonly usage: UsageBudgetManager;
  readonly workspaceState: WorkspaceStateManager;
  readonly policy: PolicyEngine;
  readonly approvals: ApprovalBroker;
  readonly sandbox: SandboxRuntime;
  readonly sessions: SessionStore;
  readonly platform: PlatformRuntime;
  readonly evolution: EvolutionEngine;
  readonly codeIntelligence: CodeIntelligenceService;
  readonly remote: RemoteRuntimeConnectivity;
  readonly distribution: DistributionUpdateManager;
  readonly config: ConfigStore;
  readonly observability: ObservabilitySink;
  readonly regression: RegressionHarness;
}

export interface AgentRuntime {
  startSession(request?: StartSessionRequest): Promise<SessionId>;
  runTurn(request: RunTurnRequest): AsyncIterable<RuntimeEvent>;
  interrupt(sessionId: SessionId, reason: string): Promise<void>;
  dispose(): Promise<void>;
}
