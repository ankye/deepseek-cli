import type { Clock, JsonObject, RedactedError, TraceContext } from "./common.js";
import type { AgentId, CapabilityId, IdFactory, SessionId, TaskId, TurnId, WorkflowId } from "./ids.js";
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
import type { ToolIntentPreflightService } from "./tool-intent.js";
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
  | "kernel.lifecycle"
  | "kernel.request.accepted"
  | "execution.envelope.created"
  | "execution.rejected"
  | "workflow.opened"
  | "workflow.closed"
  | "policy.decided"
  | "sandbox.selected"
  | "scheduler.queued"
  | "scheduler.started"
  | "scheduler.completed"
  | "scheduler.failed"
  | "scheduler.cancelled"
  | "scheduler.timed-out"
  | "kernel.observability.degraded"
  | "capability.started"
  | "capability.output"
  | "capability.completed"
  | "capability.failed"
  | "capability.cancelled"
  | "session.started"
  | "turn.started"
  | "workflow.step"
  | "bus.recorded"
  | "model.delta"
  | "usage.updated"
  | "turn.completed"
  | "runtime.error"
  | "runtime.disposed";

export type ExecutionInvocationKind =
  | "capability"
  | "model"
  | "command"
  | "skill"
  | "hook"
  | "mcp"
  | "sandbox"
  | "plugin"
  | "subagent";

export type ExecutionOutcomeStatus = "completed" | "failed" | "cancelled" | "timed-out" | "rejected";

export type RuntimeKernelState = "created" | "running" | "shutting-down" | "shutdown";

export type KernelErrorCode =
  | "KERNEL_CONFIGURATION_ERROR"
  | "KERNEL_NOT_RUNNING"
  | "KERNEL_SHUTDOWN"
  | "KERNEL_CAPABILITY_NOT_FOUND"
  | "KERNEL_ENVELOPE_INVALID"
  | "KERNEL_INVALID_TIMEOUT"
  | "KERNEL_MALFORMED_TRACE"
  | "KERNEL_POLICY_DENIED"
  | "KERNEL_SCHEDULER_TIMEOUT"
  | "KERNEL_QUEUE_BACKPRESSURE"
  | "KERNEL_CANCELLED"
  | "KERNEL_EXECUTOR_FAILED"
  | "KERNEL_EVENT_PERSISTENCE_FAILED"
  | "KERNEL_OBSERVABILITY_DEGRADED"
  | "KERNEL_LEGACY_EXECUTION_REJECTED";

export interface KernelError extends RedactedError {
  readonly code: KernelErrorCode;
}

export interface ExecutionEnvelope extends JsonObject {
  readonly invocationId: string;
  readonly capabilityId: CapabilityId;
  readonly capabilityVersion: string;
  readonly kind: ExecutionInvocationKind;
  readonly caller: string;
  readonly parentInvocationId?: string;
  readonly sessionId?: SessionId;
  readonly workflowId?: WorkflowId;
  readonly taskId?: TaskId;
  readonly agentId?: AgentId;
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly redactionClass: string;
  readonly provenance: JsonObject;
  readonly trust: string;
  readonly permissions: readonly string[];
  readonly sideEffect: string;
  readonly policyContext: JsonObject;
  readonly approvalRequired: boolean;
  readonly sandboxProfile?: string;
  readonly resourceLocks: readonly string[];
  readonly timeoutMs: number;
  readonly deadlineAt?: string;
  readonly cancellation: JsonObject;
  readonly retryPolicy: JsonObject;
  readonly idempotency: JsonObject;
  readonly trace: TraceContext;
  readonly telemetry: JsonObject;
  readonly replayPolicy: JsonObject;
  readonly createdAt: string;
}

export interface RuntimeKernelRequest {
  readonly capabilityId: CapabilityId;
  readonly input: JsonObject;
  readonly caller: string;
  readonly sessionId?: SessionId;
  readonly agentId?: AgentId;
  readonly parentInvocationId?: string;
  readonly timeoutMs?: number;
  readonly trace?: TraceContext;
}

export interface RuntimeKernelResult extends JsonObject {
  readonly envelope: ExecutionEnvelope;
  readonly status: ExecutionOutcomeStatus;
  readonly output?: JsonObject;
  readonly error?: KernelError;
}

export interface RuntimeKernelLogger {
  debug(message: string, metadata?: JsonObject): void;
  error(message: string, error: KernelError, metadata?: JsonObject): void;
}

export interface RuntimeKernelDependencies {
  readonly bus: RuntimeMessageBus;
  readonly workflow: WorkflowOrchestrator;
  readonly scheduler: ConcurrencyOrchestrator;
  readonly capabilities: CapabilityRegistry;
  readonly policy: PolicyEngine;
  readonly sandbox: SandboxRuntime;
  readonly sessions: SessionStore;
  readonly observability: ObservabilitySink;
  readonly clock: Clock;
  readonly ids: IdFactory;
  readonly logger: RuntimeKernelLogger;
}

export interface RuntimeKernel {
  start(): Promise<void>;
  execute(request: RuntimeKernelRequest): AsyncIterable<RuntimeEvent>;
  cancel(invocationId: string, reason: string): Promise<void>;
  shutdown(reason?: string): Promise<void>;
  state(): RuntimeKernelState;
}

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
  readonly toolIntentPreflight: ToolIntentPreflightService;
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
