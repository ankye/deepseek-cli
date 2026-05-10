import type { Clock, JsonObject, RedactedError, TraceContext } from "./common.js";
import type { AgentId, CapabilityId, CredentialRef, IdFactory, ModelProviderId, ModelProfileId, SessionId, TaskId, TurnId, WorkflowId } from "./ids.js";
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
import type { ModelGateway, ModelProfile, ModelReasoningOptions } from "./model.js";
import type { ToolIntentPreflightService } from "./tool-intent.js";
import type { ObservabilitySink } from "./observability.js";
import type { PlatformRuntime } from "./platform.js";
import type { PluginManager } from "./plugin.js";
import type { ApprovalBroker, PolicyEngine, SandboxRuntime } from "./policy.js";
import type { ResourceScope, SandboxAuditEvidence, SandboxRequirement, SecretRedactionDecision } from "./security.js";
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
  | "agent.loop.started"
  | "agent.loop.completed"
  | "agent.loop.failed"
  | "agent.loop.cancelled"
  | "model.requested"
  | "context.projection.started"
  | "context.projection.cache-hit"
  | "context.projection.degraded"
  | "context.projection.rejected"
  | "context.projection.completed"
  | "workflow.step"
  | "bus.recorded"
  | "model.delta"
  | "model.reasoning"
  | "model.reasoning.persisted"
  | "model.tool.intent"
  | "model.tool.repaired"
  | "model.tool.rejected"
  | "model.tool.result"
  | "model.finished"
  | "model.done"
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
  readonly secretExposure: SecretRedactionDecision;
  readonly resourceScope: ResourceScope;
  readonly sandboxRequirements: SandboxRequirement;
  readonly audit: SandboxAuditEvidence;
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
  readonly platform: PlatformRuntime;
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

export type AgentLoopOutputMode = "text" | "json" | "jsonl";
export type AgentLoopTerminalStatus = "completed" | "failed" | "cancelled" | "timed-out" | "rejected";

export interface AgentLoopLimits extends JsonObject {
  readonly maxModelIterations: number;
  readonly maxToolCalls: number;
  readonly turnTimeoutMs: number;
  readonly toolTimeoutMs: number;
  readonly maxOutputBytes: number;
  readonly maxRetries: number;
}

export type AgentLoopToolProjection = "read-only" | "read-write" | "all";

export interface AgentLoopRequest extends JsonObject {
  readonly prompt: string;
  readonly sessionId?: SessionId;
  readonly agentId?: AgentId;
  readonly caller: string;
  readonly workspaceRoot: string;
  readonly outputMode: AgentLoopOutputMode;
  readonly profile: ModelProfile;
  readonly credentialRef?: CredentialRef;
  readonly reasoning?: ModelReasoningOptions;
  readonly timeoutMs?: number;
  readonly limits?: Partial<AgentLoopLimits>;
  readonly live?: boolean;
  readonly toolProjection?: AgentLoopToolProjection;
  readonly trace?: TraceContext;
}

export interface AgentLoopControl {
  readonly signal?: AbortSignal;
}

export interface AgentLoopSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly status: AgentLoopTerminalStatus;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly traceId: string;
  readonly assistantText: string;
  readonly iterations: number;
  readonly toolCalls: number;
  readonly modelProvider?: ModelProviderId;
  readonly modelProfile?: ModelProfileId;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
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

export interface RunAgentLoopRequest extends AgentLoopRequest {}

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
  readonly webFetch?: import("./core-tools.js").WebFetchProvider;
  readonly webSearch?: import("./core-tools.js").WebSearchProvider;
  readonly backgroundTasks?: import("./core-tools.js").BackgroundTaskManager;
  readonly agentSpawner?: import("./core-tools.js").AgentSpawner;
}

export interface AgentRuntime {
  startSession(request?: StartSessionRequest): Promise<SessionId>;
  runTurn(request: RunTurnRequest): AsyncIterable<RuntimeEvent>;
  interrupt(sessionId: SessionId, reason: string): Promise<void>;
  dispose(): Promise<void>;
}
