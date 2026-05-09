import type {
  AgentRuntime,
  AgentLoopLimits,
  AgentLoopRequest,
  AgentLoopSummary,
  BusEnvelope,
  AgentId,
  CapabilityExecutionContext,
  CapabilityManifest,
  ContextProjectionResult,
  Id,
  JsonObject,
  KernelError,
  ModelChatMessage,
  ModelProviderEventMetadata,
  ModelStreamEvent,
  PolicyDecision,
  RunTurnRequest,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel,
  RuntimeKernelDependencies,
  RuntimeKernelLogger,
  RuntimeKernelRequest,
  RuntimeKernelState,
  SessionEvent,
  SessionId,
  StartSessionRequest,
  TaskEvent,
  TraceContext,
  ToolIntentDiagnostic,
  TaskId
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { PlatformExecutionContext } from "@deepseek/platform-contracts";
import { registerCoreCodingToolsForRuntime } from "@deepseek/core-coding-tools";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision,
  redactJsonSecrets
} from "@deepseek/policy-sandbox";

class DeterministicClock {
  now(): Date {
    return new Date(0);
  }
}

class DeterministicIdFactory {
  private next = 1;

  create<Name extends string>(scope: Name): Id<Name> {
    return asId<Name>(`${scope}-${this.next++}`);
  }
}

class NoopRuntimeKernelLogger implements RuntimeKernelLogger {
  debug(): void {}
  error(): void {}
}

export function kernelError(code: KernelError["code"], message: string, details: JsonObject = {}): KernelError {
  return {
    code,
    message: redactSecretTextForRuntime(message),
    retryable: false,
    redaction: { class: "public" },
    details: redactJsonSecrets(details) as JsonObject
  };
}

export const runtimeEchoCapability: CapabilityManifest = {
  id: asId<"capability">("runtime.echo"),
  name: "Runtime Echo",
  source: "builtin",
  version: "1.0.0",
  trust: "trusted",
  sideEffect: "none",
  permissions: [],
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string" },
      prompt: { type: "string" }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      text: { type: "string" }
    }
  },
  enabled: true,
  secretExposure: createSecretRedactionDecision("", { class: "public" }),
  resourceScope: analyzeResourceScope({}, "none"),
  sandboxRequirements: createSandboxRequirement({
    sideEffect: "none",
    resourceScope: analyzeResourceScope({}, "none"),
    timeoutMs: 30_000,
    permissions: []
  }),
  audit: createSandboxAuditEvidence({
    decision: "manifest",
    reasonCode: "manifest.runtime-echo",
    subject: "runtime",
    resource: "runtime.echo",
    sandboxProfile: "none"
  }),
  security: {
    modelVisible: true,
    executorVisible: false,
    outputRedaction: "secret-aware"
  }
};

export async function registerRuntimeBuiltins(deps: Pick<RuntimeDependencies, "capabilities">): Promise<void> {
  if (await deps.capabilities.get(runtimeEchoCapability.id)) return;
  await deps.capabilities.register(runtimeEchoCapability, async (input: JsonObject, context: CapabilityExecutionContext) => {
    if (context.signal.aborted) {
      return {
        ok: false,
        error: {
          code: "CAPABILITY_ABORTED",
          message: context.cancellationReason ?? "Capability execution aborted",
          retryable: false,
          redaction: { class: "public" }
        }
      };
    }
    const text = typeof input.text === "string" ? input.text : typeof input.prompt === "string" ? input.prompt : "";
    return {
      ok: true,
      value: {
        text,
        envelopeId: context.envelope.invocationId,
        traceId: context.trace.traceId
      }
    };
  });
}

export async function registerRuntimeCoreTools(deps: Pick<RuntimeDependencies, "capabilities" | "platform" | "workspaceState">, workspaceRoot: string): Promise<void> {
  await registerCoreCodingToolsForRuntime(deps, workspaceRoot);
}

export interface ExecutionEnvelopeBuildInput {
  readonly request: RuntimeKernelRequest;
  readonly manifest: CapabilityManifest;
  readonly sessionId: SessionId;
  readonly workflowId?: string;
  readonly taskId?: string;
  readonly invocationId: string;
  readonly trace: TraceContext;
  readonly createdAt: string;
  readonly platformContext?: PlatformExecutionContext;
}

export function buildExecutionEnvelope(input: ExecutionEnvelopeBuildInput): import("@deepseek/platform-contracts").ExecutionEnvelope {
  const timeoutMs = input.request.timeoutMs ?? 30_000;
  const resourceLocks = resourceLocksFor(input.manifest.sideEffect, input.request.input);
  const resourceScope = analyzeResourceScope(input.request.input, input.manifest.sideEffect);
  const secretExposure = createSecretRedactionDecision(input.request.input, { class: "internal" });
  const requestedSandboxProfile = input.platformContext?.sandboxProfile ?? input.manifest.sandboxRequirements?.profile;
  const sandboxRequirements = createSandboxRequirement({
    sideEffect: input.manifest.sideEffect,
    resourceScope,
    timeoutMs,
    permissions: input.manifest.permissions,
    ...(requestedSandboxProfile ? { profile: requestedSandboxProfile } : {})
  });
  const audit = createSandboxAuditEvidence({
    decision: "pending",
    reasonCode: "execution.envelope.created",
    subject: input.request.caller,
    resource: String(input.manifest.id),
    sandboxProfile: sandboxRequirements.profile,
    trace: input.trace,
    metadata: {
      capabilityId: input.manifest.id,
      sideEffect: input.manifest.sideEffect
    }
  });
  return {
    invocationId: input.invocationId,
    capabilityId: input.manifest.id,
    capabilityVersion: input.manifest.version,
    kind: "capability" as const,
    caller: input.request.caller,
    ...(input.request.parentInvocationId ? { parentInvocationId: input.request.parentInvocationId } : {}),
    sessionId: input.sessionId,
    ...(input.workflowId ? { workflowId: asId<"workflow">(input.workflowId) } : {}),
    ...(input.taskId ? { taskId: asId<"task">(input.taskId) } : {}),
    ...(input.request.agentId ? { agentId: input.request.agentId } : {}),
    inputSchema: input.manifest.inputSchema,
    outputSchema: input.manifest.outputSchema,
    redactionClass: "internal",
    provenance: { source: input.manifest.source },
    trust: input.manifest.trust,
    permissions: input.manifest.permissions,
    sideEffect: input.manifest.sideEffect,
    policyContext: {
      caller: input.request.caller,
      capabilityId: input.manifest.id,
      sideEffect: input.manifest.sideEffect,
      secretExposure,
      resourceScope,
      sandboxRequirements,
      audit,
      ...(input.platformContext ? { platform: input.platformContext } : {})
    },
    approvalRequired: input.manifest.sideEffect !== "none" && input.manifest.sideEffect !== "read",
    resourceLocks,
    timeoutMs,
    deadlineAt: new Date(new Date(input.createdAt).getTime() + timeoutMs).toISOString(),
    cancellation: {
      cancellable: true,
      propagation: "abort-signal",
      reasonSchema: { type: "string" }
    },
    retryPolicy: { maxAttempts: 1, strategy: "none" },
    idempotency: { key: `${input.invocationId}:${input.manifest.version}`, scope: "invocation" },
    trace: input.trace,
    telemetry: { eventSchemaVersion: "1.0.0", traceRequired: true },
    replayPolicy: { replayable: true, snapshot: "normalized", deterministic: true },
    secretExposure,
    resourceScope,
    sandboxRequirements,
    audit,
    createdAt: input.createdAt
  };
}

export function validateExecutionEnvelope(envelope: unknown): readonly KernelError[] {
  const errors: KernelError[] = [];
  if (!envelope || typeof envelope !== "object") {
    return [kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope must be an object")];
  }
  const candidate = envelope as Record<string, unknown>;
  for (const key of [
    "invocationId",
    "capabilityId",
    "capabilityVersion",
    "kind",
    "caller",
    "sessionId",
    "workflowId",
    "taskId",
    "inputSchema",
    "outputSchema",
    "redactionClass",
    "provenance",
    "trust",
    "permissions",
    "sideEffect",
    "policyContext",
    "approvalRequired",
    "resourceLocks",
    "timeoutMs",
    "deadlineAt",
    "cancellation",
    "retryPolicy",
    "idempotency",
    "trace",
    "telemetry",
    "replayPolicy",
    "secretExposure",
    "resourceScope",
    "sandboxRequirements",
    "audit",
    "createdAt"
  ]) {
    if (candidate[key] === undefined || candidate[key] === null || candidate[key] === "") {
      errors.push(kernelError("KERNEL_ENVELOPE_INVALID", `Execution envelope missing ${key}`, { key }));
    }
  }
  if (candidate.kind !== "capability") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope kind must be capability", { kind: String(candidate.kind) }));
  }
  if (!["none", "read", "write", "network", "process"].includes(String(candidate.sideEffect))) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope has unsupported sideEffect", { sideEffect: String(candidate.sideEffect) }));
  }
  if (typeof candidate.timeoutMs !== "number" || !Number.isFinite(candidate.timeoutMs) || candidate.timeoutMs <= 0 || candidate.timeoutMs > 600_000) {
    errors.push(kernelError("KERNEL_INVALID_TIMEOUT", "Execution envelope timeoutMs must be between 1 and 600000", {
      timeoutMs: typeof candidate.timeoutMs === "number" ? candidate.timeoutMs : String(candidate.timeoutMs)
    }));
  }
  if (typeof candidate.deadlineAt !== "string" || Number.isNaN(Date.parse(candidate.deadlineAt))) {
    errors.push(kernelError("KERNEL_INVALID_TIMEOUT", "Execution envelope deadlineAt must be a valid ISO date"));
  }
  const trace = candidate.trace as Record<string, unknown> | undefined;
  if (!trace || typeof trace !== "object" || typeof trace.traceId !== "string" || typeof trace.spanId !== "string" || typeof trace.correlationId !== "string" || typeof trace.sessionId !== "string") {
    errors.push(kernelError("KERNEL_MALFORMED_TRACE", "Execution envelope trace must include traceId, spanId, correlationId, and sessionId"));
  }
  if (!candidate.inputSchema || typeof candidate.inputSchema !== "object") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope inputSchema must be an object"));
  }
  if (!candidate.outputSchema || typeof candidate.outputSchema !== "object") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope outputSchema must be an object"));
  }
  if (!Array.isArray(candidate.permissions)) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope permissions must be an array"));
  }
  if (!Array.isArray(candidate.resourceLocks)) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope resourceLocks must be an array"));
  }
  if (!candidate.policyContext || typeof candidate.policyContext !== "object" || typeof (candidate.policyContext as Record<string, unknown>).caller !== "string") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope policyContext must include caller"));
  }
  if (!candidate.secretExposure || typeof candidate.secretExposure !== "object" || typeof (candidate.secretExposure as Record<string, unknown>).action !== "string") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope secretExposure decision is required"));
  }
  const resourceScope = candidate.resourceScope as Record<string, unknown> | undefined;
  if (!resourceScope || typeof resourceScope !== "object" || typeof resourceScope.schemaVersion !== "string" || !Array.isArray(resourceScope.paths)) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope resourceScope metadata is required"));
  }
  const sandboxRequirements = candidate.sandboxRequirements as Record<string, unknown> | undefined;
  if (!sandboxRequirements || typeof sandboxRequirements !== "object" || typeof sandboxRequirements.schemaVersion !== "string" || !Array.isArray(sandboxRequirements.capabilities)) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope sandboxRequirements metadata is required"));
  }
  if (!candidate.audit || typeof candidate.audit !== "object" || typeof (candidate.audit as Record<string, unknown>).reasonCode !== "string") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope audit metadata is required"));
  }
  if (["write", "network", "process"].includes(String(candidate.sideEffect))) {
    if (!sandboxRequirements || !Array.isArray(sandboxRequirements.capabilities) || sandboxRequirements.capabilities.length === 0) {
      errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Side-effecting envelope must declare sandbox capabilities"));
    }
    if (!resourceScope || !Array.isArray(resourceScope.paths)) {
      errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Side-effecting envelope must declare resource paths"));
    }
  }
  const cancellation = candidate.cancellation as Record<string, unknown> | undefined;
  if (!cancellation || typeof cancellation !== "object" || cancellation.cancellable !== true || cancellation.propagation !== "abort-signal") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope cancellation metadata must require abort-signal propagation"));
  }
  const retryPolicy = candidate.retryPolicy as Record<string, unknown> | undefined;
  if (!retryPolicy || typeof retryPolicy.maxAttempts !== "number" || retryPolicy.maxAttempts < 1) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope retryPolicy.maxAttempts must be positive"));
  }
  const idempotency = candidate.idempotency as Record<string, unknown> | undefined;
  if (!idempotency || typeof idempotency.key !== "string" || !idempotency.key) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope idempotency.key is required"));
  }
  const replayPolicy = candidate.replayPolicy as Record<string, unknown> | undefined;
  if (!replayPolicy || replayPolicy.replayable !== true || replayPolicy.snapshot !== "normalized") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope replayPolicy must be replayable normalized metadata"));
  }
  const telemetry = candidate.telemetry as Record<string, unknown> | undefined;
  if (!telemetry || typeof telemetry.eventSchemaVersion !== "string") {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope telemetry.eventSchemaVersion is required"));
  }
  if (typeof candidate.createdAt !== "string" || Number.isNaN(Date.parse(candidate.createdAt))) {
    errors.push(kernelError("KERNEL_ENVELOPE_INVALID", "Execution envelope createdAt must be a valid ISO date"));
  }
  return errors;
}

function resourceLocksFor(sideEffect: CapabilityManifest["sideEffect"], input: JsonObject): readonly string[] {
  const locks: string[] = [];
  const path = typeof input.path === "string" ? input.path : undefined;
  const cwd = typeof input.cwd === "string" ? input.cwd : typeof input.workspaceRoot === "string" ? input.workspaceRoot : undefined;
  if (sideEffect === "write" && path) locks.push(`workspace:${path}`);
  if (sideEffect === "process" && cwd) locks.push(`process:${cwd}`);
  return locks;
}

function policyMetadataFor(envelope: import("@deepseek/platform-contracts").ExecutionEnvelope, input: JsonObject): JsonObject {
  const cwd = typeof input.cwd === "string" ? input.cwd : typeof input.workspaceRoot === "string" ? input.workspaceRoot : undefined;
  return {
    envelopeId: envelope.invocationId,
    sideEffect: envelope.sideEffect,
    permissions: envelope.permissions,
    capabilityId: envelope.capabilityId,
    timeoutMs: envelope.timeoutMs,
    resourceLocks: envelope.resourceLocks,
    secretExposure: envelope.secretExposure,
    resourceScope: envelope.resourceScope,
    sandboxRequirements: envelope.sandboxRequirements,
    audit: envelope.audit,
    ...(typeof input.command === "string" ? { command: input.command, args: Array.isArray(input.args) ? input.args.map(String) : [] } : {}),
    ...(cwd ? { cwd } : {}),
    ...(typeof input.workspaceRoot === "string" ? { workspaceRoot: input.workspaceRoot } : {}),
    ...(typeof input.shellProfile === "string" ? { shellProfile: input.shellProfile } : {}),
    ...(input.requireSandbox === true ? { requireSandbox: true } : {})
  };
}

export class InProcessRuntimeKernel implements RuntimeKernel {
  private lifecycle: RuntimeKernelState = "created";
  private readonly activeTasks = new Map<string, string>();
  private readonly cancelled = new Map<string, string>();

  constructor(private readonly deps: RuntimeKernelDependencies) {
    const missing = [
      "bus",
      "workflow",
      "scheduler",
      "capabilities",
      "policy",
      "sandbox",
      "sessions",
      "observability",
      "platform",
      "clock",
      "ids",
      "logger"
    ].filter((key) => (deps as unknown as Record<string, unknown>)[key] === undefined);
    if (missing.length > 0) {
      throw new Error(kernelError("KERNEL_CONFIGURATION_ERROR", `Missing runtime kernel dependencies: ${missing.join(", ")}`).message);
    }
  }

  async start(): Promise<void> {
    if (this.lifecycle === "shutdown") {
      throw new Error("KERNEL_SHUTDOWN");
    }
    if (this.lifecycle === "running") return;
    this.lifecycle = "running";
    await this.publishLifecycle("started");
  }

  async *execute(request: RuntimeKernelRequest): AsyncIterable<RuntimeEvent> {
    if (this.lifecycle === "created") await this.start();
    if (this.lifecycle !== "running") {
      yield this.rejectedEvent(request, kernelError("KERNEL_NOT_RUNNING", `Runtime kernel is ${this.lifecycle}`));
      return;
    }

    const sessionId = request.sessionId ?? (await this.deps.sessions.create({ caller: request.caller }));
    const trace = request.trace ?? this.trace(sessionId, "kernel");
    const accepted = this.event("kernel.request.accepted", sessionId, trace, {
      capabilityId: request.capabilityId,
      caller: request.caller
    }, request.agentId);
    await this.recordEvent(accepted);
    yield accepted;

    const invocationId = String(this.deps.ids.create("invocation"));
    const binding = await this.deps.capabilities.resolveExecutable(request.capabilityId);
    if (!binding) {
      const rejected = this.event(
        "execution.rejected",
        sessionId,
        trace,
        { capabilityId: request.capabilityId, envelopeId: invocationId, reason: "capability-not-found" },
        request.agentId,
        undefined,
        kernelError("KERNEL_CAPABILITY_NOT_FOUND", `Capability not found: ${String(request.capabilityId)}`)
      );
      await this.recordEvent(rejected);
      yield rejected;
      return;
    }
    const workflow = await this.deps.workflow.openInvocation({
      sessionId,
      capabilityId: binding.manifest.id,
      envelopeId: invocationId,
      ...(request.agentId ? { ownerAgentId: request.agentId } : {}),
      completionCriteria: { terminalEvents: ["capability.completed", "capability.failed", "capability.cancelled"] }
    });
    const workflowOpened = this.event("workflow.opened", sessionId, trace, {
      workflowId: workflow.workflowId,
      taskId: workflow.taskId,
      stepId: workflow.stepId,
      capabilityId: workflow.capabilityId,
      envelopeId: workflow.envelopeId
    }, request.agentId, workflow.taskId);
    await this.recordEvent(workflowOpened);
    yield workflowOpened;

    const envelope = buildExecutionEnvelope({
      request,
      manifest: binding.manifest,
      sessionId,
      workflowId: String(workflow.workflowId),
      taskId: String(workflow.taskId),
      invocationId,
      trace,
      createdAt: this.deps.clock.now().toISOString(),
      platformContext: await this.platformExecutionContext(binding.manifest.sideEffect, request.timeoutMs ?? 30_000, request.input)
    });
    const validationErrors = validateExecutionEnvelope(envelope);
    const envelopeEvent = this.event("execution.envelope.created", sessionId, trace, { envelope }, request.agentId, workflow.taskId);
    await this.recordEvent(envelopeEvent);
    yield envelopeEvent;
    if (validationErrors.length > 0) {
      const rejected = this.event("execution.rejected", sessionId, trace, { envelopeId: invocationId, errors: validationErrors }, request.agentId, workflow.taskId, validationErrors[0]);
      await this.recordEvent(rejected);
      yield rejected;
      yield await this.closeWorkflow(workflow, "rejected", { envelopeId: invocationId });
      return;
    }

    const platform = envelope.policyContext.platform as PlatformExecutionContext | undefined;
    const policyDecision = await this.deps.policy.decide({
      subject: request.caller,
      action: `execute:${String(binding.manifest.id)}`,
      resource: String(binding.manifest.id),
      metadata: {
        ...policyMetadataFor(envelope, request.input)
      },
      ...(platform ? { platform } : {}),
      secret: envelope.secretExposure,
      resourceScope: envelope.resourceScope,
      sandbox: envelope.sandboxRequirements,
      auditEvidence: envelope.audit
    });
    for (const event of await this.policyEvents(policyDecision, sessionId, trace, envelope, request.agentId, workflow.taskId)) {
      await this.recordEvent(event);
      yield event;
    }
    if (policyDecision.action !== "allow") {
      const rejected = this.event(
        "execution.rejected",
        sessionId,
        trace,
        {
          envelopeId: invocationId,
          policy: {
            action: policyDecision.action,
            reason: policyDecision.reason,
            audit: policyDecision.audit ?? {},
            sandboxProfile: policyDecision.sandboxProfile ?? ""
          }
        },
        request.agentId,
        workflow.taskId,
        kernelError("KERNEL_POLICY_DENIED", policyDecision.reason)
      );
      await this.recordEvent(rejected);
      yield rejected;
      yield await this.closeWorkflow(workflow, "rejected", { envelopeId: invocationId, policy: policyDecision.action });
      return;
    }

    this.activeTasks.set(invocationId, String(workflow.taskId));
    const schedulerEvents: RuntimeEvent[] = [];
    const unsubscribeScheduler = this.deps.scheduler.subscribe((event) => {
      if (event.taskId !== workflow.taskId) return;
      schedulerEvents.push(this.schedulerEventToRuntimeEvent(event, sessionId, trace, invocationId, request.agentId, workflow.taskId));
    });
    let drainedSchedulerEvents = 0;
    const drainSchedulerEvents = async function* (kernel: InProcessRuntimeKernel): AsyncIterable<RuntimeEvent> {
      while (drainedSchedulerEvents < schedulerEvents.length) {
        const event = schedulerEvents[drainedSchedulerEvents++];
        if (!event) continue;
        await kernel.recordEvent(event);
        yield event;
      }
    };
    try {
      const started = this.event("capability.started", sessionId, trace, { envelopeId: invocationId, capabilityId: binding.manifest.id }, request.agentId, workflow.taskId);
      await this.recordEvent(started);
      yield started;

      const scheduled = this.deps.scheduler.run(
        {
          id: workflow.taskId,
          name: String(binding.manifest.id),
          deadlineMs: envelope.timeoutMs,
          trace,
          metadata: { envelopeId: invocationId, capabilityId: binding.manifest.id }
        },
        (taskContext) => binding.execute(request.input, {
          envelope,
          trace,
          signal: taskContext.signal,
          ...(taskContext.cancellationReason ? { cancellationReason: taskContext.cancellationReason } : {}),
          metadata: {
            taskId: workflow.taskId,
            workflowId: workflow.workflowId,
            capabilityId: binding.manifest.id
          }
        })
      );
      await Promise.resolve();
      for await (const event of drainSchedulerEvents(this)) yield event;
      const result = await scheduled;
      for await (const event of drainSchedulerEvents(this)) yield event;

      if (result.ok) {
        const output = this.event("capability.output", sessionId, trace, { envelopeId: invocationId, output: result.value ?? {} }, request.agentId, workflow.taskId);
        const completed = this.event("capability.completed", sessionId, trace, {
          envelopeId: invocationId,
          capabilityId: binding.manifest.id,
          output: result.value ?? {},
          replay: {
            traceId: trace.traceId,
            snapshot: "normalized"
          }
        }, request.agentId, workflow.taskId);
        await this.recordEvent(output);
        yield output;
        await this.recordEvent(completed);
        yield completed;
        yield await this.closeWorkflow(workflow, "completed", { envelopeId: invocationId });
      } else {
        const failed = this.event("capability.failed", sessionId, trace, { envelopeId: invocationId, capabilityId: binding.manifest.id }, request.agentId, workflow.taskId, this.toKernelError(result.error));
        await this.recordEvent(failed);
        yield failed;
        yield await this.closeWorkflow(workflow, "failed", { envelopeId: invocationId });
      }
    } catch (error) {
      for await (const event of drainSchedulerEvents(this)) yield event;
      const reason = this.cancelled.get(invocationId);
      const message = error instanceof Error ? error.message : "Unknown executor failure";
      const schedulerTimeout = error instanceof Error && error.name === "SCHEDULER_TASK_TIMEOUT";
      const schedulerCancelled = error instanceof Error && error.name === "SCHEDULER_TASK_CANCELLED";
      const schedulerBackpressure = error instanceof Error && error.name === "SCHEDULER_QUEUE_BACKPRESSURE";
      const code = schedulerBackpressure
        ? "KERNEL_QUEUE_BACKPRESSURE"
        : schedulerTimeout || reason === "timeout"
          ? "KERNEL_SCHEDULER_TIMEOUT"
          : schedulerCancelled || reason
            ? "KERNEL_CANCELLED"
            : "KERNEL_EXECUTOR_FAILED";
      const terminalReason = schedulerTimeout ? "timeout" : reason ?? (schedulerCancelled ? "cancelled" : "executor-failed");
      const kind = schedulerCancelled || schedulerTimeout || reason ? "capability.cancelled" : "capability.failed";
      const failed = this.event(kind, sessionId, trace, { envelopeId: invocationId, capabilityId: binding.manifest.id, reason: terminalReason }, request.agentId, workflow.taskId, kernelError(code, message));
      await this.recordEvent(failed);
      yield failed;
      yield await this.closeWorkflow(workflow, schedulerTimeout || reason === "timeout" ? "timed-out" : schedulerCancelled || reason ? "cancelled" : "failed", { envelopeId: invocationId });
    } finally {
      for await (const event of drainSchedulerEvents(this)) yield event;
      unsubscribeScheduler();
      this.activeTasks.delete(invocationId);
    }
  }

  async cancel(invocationId: string, reason: string): Promise<void> {
    this.cancelled.set(invocationId, reason);
    const taskId = this.activeTasks.get(invocationId);
    if (taskId) {
      await this.deps.scheduler.cancel(asId<"task">(taskId), reason);
    }
  }

  async shutdown(reason = "shutdown"): Promise<void> {
    if (this.lifecycle === "shutdown") return;
    this.lifecycle = "shutting-down";
    for (const invocationId of this.activeTasks.keys()) {
      await this.cancel(invocationId, reason);
    }
    this.lifecycle = "shutdown";
    await this.publishLifecycle("shutdown");
  }

  state(): RuntimeKernelState {
    return this.lifecycle;
  }

  private async closeWorkflow(
    workflow: Awaited<ReturnType<RuntimeKernelDependencies["workflow"]["openInvocation"]>>,
    status: Parameters<RuntimeKernelDependencies["workflow"]["closeInvocation"]>[1],
    metadata: JsonObject
  ): Promise<RuntimeEvent> {
    const event = await this.deps.workflow.closeInvocation(workflow, status, metadata);
    await this.recordEvent(event);
    return event;
  }

  private async policyEvents(
    decision: PolicyDecision,
    sessionId: SessionId,
    trace: TraceContext,
    envelope: ReturnType<typeof buildExecutionEnvelope>,
    agentId?: AgentId,
    taskId?: RuntimeEvent["taskId"]
  ): Promise<readonly RuntimeEvent[]> {
    const policy = this.event("policy.decided", sessionId, trace, {
      envelopeId: envelope.invocationId,
      action: decision.action,
      reason: decision.reason,
      audit: decision.audit ?? {}
    }, agentId, taskId);
    const sandbox = this.event("sandbox.selected", sessionId, trace, {
      envelopeId: envelope.invocationId,
      profile: decision.sandboxProfile ?? "development"
    }, agentId, taskId);
    return [policy, sandbox];
  }

  private async platformExecutionContext(sideEffect: string, timeoutMs: number, input: JsonObject = {}): Promise<PlatformExecutionContext> {
    const descriptor = await this.deps.platform.descriptor();
    const requestedShell = typeof input.shellProfile === "string" ? input.shellProfile as Parameters<RuntimeKernelDependencies["platform"]["resolveShell"]>[0] : undefined;
    const shell = sideEffect === "process" ? (await this.deps.platform.resolveShell(requestedShell)).value : undefined;
    const processProvider = sideEffect === "process" ? await this.deps.platform.resolveProcessProvider() : undefined;
    const secureStorage = await this.deps.platform.secureStorageCapability();
    const normalizedSideEffect = sideEffect === "read" || sideEffect === "write" || sideEffect === "network" || sideEffect === "process" ? sideEffect : "none";
    const resourceScope = analyzeResourceScope(input, normalizedSideEffect);
    const sandboxRequirements = createSandboxRequirement({
      sideEffect: normalizedSideEffect,
      resourceScope,
      timeoutMs,
      permissions: []
    });
    return {
      descriptor,
      ...(shell ? { shell } : {}),
      ...(processProvider ? { processProvider } : {}),
      secureStorage,
      environmentScope: "scoped",
      timeoutMs,
      resourceLocks: [],
      sandboxProfile: "development",
      sandboxCapabilities: descriptor.sandbox,
      resourceScope,
      sandboxRequirements,
      redaction: { class: "internal", fields: ["descriptor.diagnostics", "secureStorage"] }
    };
  }

  private rejectedEvent(request: RuntimeKernelRequest, error: KernelError): RuntimeEvent {
    const sessionId = request.sessionId ?? asId<"session">("session-unbound");
    return this.event("execution.rejected", sessionId, request.trace ?? this.trace(sessionId, "rejected"), { capabilityId: request.capabilityId }, request.agentId, undefined, error);
  }

  private toKernelError(error?: import("@deepseek/platform-contracts").RedactedError): KernelError {
    if (!error) return kernelError("KERNEL_EXECUTOR_FAILED", "Executor returned failure");
    return kernelError("KERNEL_EXECUTOR_FAILED", error.message, {
      originalCode: error.code,
      retryable: error.retryable
    });
  }

  private async publishLifecycle(state: string): Promise<void> {
    const sessionId = asId<"session">("session-kernel");
    const trace = this.trace(sessionId, "lifecycle");
    await this.recordEvent(this.event("kernel.lifecycle", sessionId, trace, { state }));
  }

  private schedulerEventToRuntimeEvent(event: TaskEvent, sessionId: SessionId, trace: TraceContext, envelopeId: string, agentId?: AgentId, taskId?: TaskId): RuntimeEvent {
    const eventTrace = event.trace ?? trace;
    const kind = `scheduler.${event.status === "running" ? "started" : event.status}` as RuntimeEvent["kind"];
    return this.event(kind, sessionId, eventTrace, {
      envelopeId,
      taskId: event.taskId,
      status: event.status,
      reason: event.reason ?? ""
    }, agentId, taskId ?? event.taskId);
  }

  private async recordEvent(event: RuntimeEvent): Promise<void> {
    try {
      await this.appendSessionEvent(event.sessionId, event.kind, event.data);
      await this.deps.bus.publish(this.toBusEnvelope(event));
    } catch (error) {
      throw new Error(kernelError("KERNEL_EVENT_PERSISTENCE_FAILED", error instanceof Error ? error.message : "Replayable event persistence failed", {
        eventKind: event.kind
      }).message);
    }
    try {
      await this.deps.observability.emit({
        kind: event.kind.includes("failed") || event.kind.includes("rejected") ? "audit" : "trace",
        at: this.deps.clock.now().toISOString(),
        name: event.kind,
        fields: event.data
      });
    } catch (error) {
      if (event.kind === "kernel.observability.degraded") return;
      const degraded = this.event(
        "kernel.observability.degraded",
        event.sessionId,
        event.trace,
        {
          sourceEventKind: event.kind,
          reason: error instanceof Error ? error.message : "Observability emit failed"
        },
        event.agentId,
        event.taskId,
        kernelError("KERNEL_OBSERVABILITY_DEGRADED", "Observability emit failed")
      );
      await this.appendSessionEvent(degraded.sessionId, degraded.kind, degraded.data);
      await this.deps.bus.publish(this.toBusEnvelope(degraded));
    }
  }

  private async appendSessionEvent(sessionId: SessionId, kind: string, payload: JsonObject): Promise<void> {
    const events = await this.deps.sessions.events(sessionId);
    await this.deps.sessions.append({
      sessionId,
      sequence: events.length + 1,
      kind,
      at: this.deps.clock.now().toISOString(),
      payload,
      redaction: { class: "internal" }
    });
  }

  private event(
    kind: RuntimeEvent["kind"],
    sessionId: SessionId,
    trace: TraceContext,
    data: JsonObject,
    agentId?: AgentId,
    taskId?: RuntimeEvent["taskId"],
    error?: KernelError
  ): RuntimeEvent {
    return {
      kind,
      sessionId,
      ...(taskId ? { taskId } : {}),
      ...(agentId ? { agentId } : {}),
      trace,
      data: redactJsonSecrets(data) as JsonObject,
      ...(error ? { error } : {})
    };
  }

  private toBusEnvelope(event: RuntimeEvent): BusEnvelope {
    return {
      protocolVersion: "1",
      schemaVersion: "1.0.0",
      id: String(this.deps.ids.create("bus")),
      type: "event",
      createdAt: this.deps.clock.now().toISOString(),
      trace: event.trace,
      redaction: { class: "internal" },
      compatibility: { schemaVersion: "1.0.0" },
      payload: {
        kind: event.kind,
        data: event.data,
        ...(event.error ? { error: event.error } : {})
      },
      topic: { name: "runtime.event", owner: "runtime", trustBoundary: "core" },
      producer: "runtime-kernel",
      correlationId: event.trace.correlationId,
      sessionId: event.sessionId,
      replayable: true
    };
  }

  private trace(sessionId: SessionId, scope: string): TraceContext {
    return {
      traceId: asId<"trace">(`trace-${scope}-${sessionId}`),
      spanId: asId<"span">(`span-${scope}-${sessionId}`),
      correlationId: asId<"correlation">(`corr-${scope}-${sessionId}`),
      sessionId
    };
  }
}

export function createRuntimeKernel(
  deps: RuntimeDependencies,
  options: Partial<Pick<RuntimeKernelDependencies, "clock" | "ids" | "logger">> = {}
): RuntimeKernel {
  return new InProcessRuntimeKernel({
    bus: deps.bus,
    workflow: deps.workflow,
    scheduler: deps.concurrency,
    capabilities: deps.capabilities,
    policy: deps.policy,
    sandbox: deps.sandbox,
    sessions: deps.sessions,
    observability: deps.observability,
    platform: deps.platform,
    clock: options.clock ?? new DeterministicClock(),
    ids: options.ids ?? new DeterministicIdFactory(),
    logger: options.logger ?? new NoopRuntimeKernelLogger()
  });
}

export async function createDefaultRuntimeKernel(deps: RuntimeDependencies): Promise<RuntimeKernel> {
  await registerRuntimeBuiltins(deps);
  return createRuntimeKernel(deps);
}

export class HeadlessAgentRuntime implements AgentRuntime {
  private disposed = false;
  private kernel: RuntimeKernel | undefined;

  constructor(private readonly deps: RuntimeDependencies) {}

  async startSession(request: StartSessionRequest = {}): Promise<SessionId> {
    const sessionId = await this.deps.sessions.create({
      workspaceRoot: request.workspaceRoot ?? "",
      agentId: request.agentId ?? ""
    });
    await this.appendSessionEvent(sessionId, "session.started", { workspaceRoot: request.workspaceRoot ?? "" });
    return sessionId;
  }

  async *runTurn(request: RunTurnRequest): AsyncIterable<RuntimeEvent> {
    if (this.disposed) {
      throw new Error("Runtime disposed");
    }

    const sessionId = request.sessionId ?? (await this.startSession(request.agentId ? { agentId: request.agentId } : {}));
    if (!this.kernel) {
      this.kernel = await createDefaultRuntimeKernel(this.deps);
    }
    yield* executeProjectedRuntimeTurn(this.deps, this.kernel, {
      capabilityId: runtimeEchoCapability.id,
      caller: "headless-runtime",
      input: { prompt: request.prompt },
      prompt: request.prompt,
      sessionId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      timeoutMs: 30_000
    });
  }

  async interrupt(sessionId: SessionId, reason: string): Promise<void> {
    await this.appendSessionEvent(sessionId, "runtime.interrupted", { reason });
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    if (this.kernel) {
      await this.kernel.shutdown("runtime-disposed");
      this.kernel = undefined;
    }
  }

  private async appendSessionEvent(sessionId: SessionId, kind: string, payload: JsonObject): Promise<void> {
    const events = await this.deps.sessions.events(sessionId);
    const event: SessionEvent = {
      sessionId,
      sequence: events.length + 1,
      kind,
      at: new Date(0).toISOString(),
      payload,
      redaction: { class: "internal" }
    };
    await this.deps.sessions.append(event);
  }
}

export function createHeadlessRuntime(deps: RuntimeDependencies): AgentRuntime {
  return new HeadlessAgentRuntime(deps);
}

export interface ProjectedRuntimeTurnRequest extends RuntimeKernelRequest {
  readonly prompt: string;
}

const defaultAgentLoopLimits: AgentLoopLimits = {
  maxModelIterations: 4,
  maxToolCalls: 8,
  turnTimeoutMs: 120_000,
  toolTimeoutMs: 30_000,
  maxOutputBytes: 16_000,
  maxRetries: 0
};

export async function* runAgentLoop(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: AgentLoopRequest
): AsyncIterable<RuntimeEvent> {
  const sessionId = request.sessionId ?? await deps.sessions.create({ caller: request.caller, workspaceRoot: request.workspaceRoot });
  const trace = request.trace ?? runtimeTrace(sessionId, "agent-loop");
  const turnId = asId<"turn">(`turn-${stableHash(`${sessionId}:${request.prompt}`)}`);
  const limits = { ...defaultAgentLoopLimits, ...(request.limits ?? {}) };
  const diagnostics: import("@deepseek/platform-contracts").RedactedError[] = [];
  let assistantText = "";
  let iterations = 0;
  let toolCalls = 0;
  let terminalEmitted = false;
  const messages: ModelChatMessage[] = [{ role: "user", content: request.prompt }];

  const started = agentLoopEvent("agent.loop.started", sessionId, turnId, trace, {
    schemaVersion: "1.0.0",
    caller: request.caller,
    outputMode: request.outputMode,
    workspaceRoot: request.workspaceRoot,
    model: request.profile.model,
    limits
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  const turnStarted = agentLoopEvent("turn.started", sessionId, turnId, trace, {
    promptHash: stableHash(request.prompt),
    caller: request.caller
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, turnStarted);
  yield turnStarted;

  for await (const projectionEvent of projectAgentLoopContext(deps, request, sessionId, turnId, trace)) {
    yield projectionEvent;
    if (projectionEvent.kind === "context.projection.rejected") {
      diagnostics.push(projectionEvent.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
      const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
      const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, summary.diagnostics[0]);
      await recordRuntimeAdapterEvent(deps, failed);
      yield failed;
      terminalEmitted = true;
      return;
    }
  }

  while (iterations < limits.maxModelIterations) {
    iterations += 1;
    const visibleCapabilities = await deps.capabilities.listModelVisible();
    const modelRequested = agentLoopEvent("model.requested", sessionId, turnId, trace, {
      iteration: iterations,
      model: request.profile.model,
      visibleToolCount: visibleCapabilities.length
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, modelRequested);
    yield modelRequested;

    let requestedTool = false;
    for await (const modelEvent of deps.models.stream({
      profile: request.profile,
      prompt: messages.map((message) => `${message.role}: ${message.content}`).join("\n"),
      messages,
      tools: visibleCapabilities.map(modelToolSchema),
      ...(request.credentialRef ? { credentialRef: request.credentialRef } : {}),
      ...(request.reasoning ? { reasoning: request.reasoning } : {}),
      timeoutMs: request.timeoutMs ?? limits.turnTimeoutMs,
      metadata: {
        agentLoop: true,
        sessionId,
        turnId,
        trace,
        outputMode: request.outputMode,
        live: request.live === true
      }
    })) {
      if (modelEvent.kind === "delta") {
        assistantText += modelEvent.text;
        const event = agentLoopEvent("model.delta", sessionId, turnId, trace, {
          text: modelEvent.text,
          iteration: iterations,
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "reasoning") {
        const event = agentLoopEvent("model.reasoning", sessionId, turnId, trace, {
          text: modelEvent.text,
          redaction: modelEvent.redaction,
          iteration: iterations,
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "usage") {
        const event = agentLoopEvent("usage.updated", sessionId, turnId, trace, {
          inputTokens: modelEvent.inputTokens,
          outputTokens: modelEvent.outputTokens,
          metadata: modelEvent.metadata ?? {}
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "tool-call") {
        requestedTool = true;
        if (toolCalls >= limits.maxToolCalls) {
          const error = kernelError("KERNEL_QUEUE_BACKPRESSURE", "Agent loop tool-call limit exceeded", { maxToolCalls: limits.maxToolCalls });
          diagnostics.push(error);
          const rejected = agentLoopEvent("model.tool.rejected", sessionId, turnId, trace, {
            reason: "tool-call-limit",
            maxToolCalls: limits.maxToolCalls,
            toolName: modelEvent.name
          }, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, rejected);
          yield rejected;
          const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
          const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, failed);
          yield failed;
          terminalEmitted = true;
          return;
        }
        toolCalls += 1;
        const intentEvent = agentLoopEvent("model.tool.intent", sessionId, turnId, trace, {
          toolCallId: modelEvent.id ?? "",
          name: modelEvent.name,
          input: modelEvent.input,
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, intentEvent);
        yield intentEvent;
        messages.push({
          role: "assistant",
          content: "",
          toolCalls: [{
            id: modelEvent.id ?? `tool-${iterations}-${toolCalls}`,
            name: modelEvent.name,
            input: modelEvent.input
          }]
        });

        const descriptor = await deps.platform.descriptor();
        const preflight = await deps.toolIntentPreflight.check({
          intent: {
            ...(modelEvent.id ? { toolCallId: modelEvent.id } : {}),
            name: modelEvent.name,
            input: modelEvent.input,
            source: "model"
          },
          workspaceRoot: request.workspaceRoot,
          platform: descriptor.os,
          modelVisibleCapabilities: visibleCapabilities.map((capability) => capability.id),
          providerId: request.profile.providerId,
          profileId: request.profile.id
        });
        const preflightKind = preflight.status === "rejected" ? "model.tool.rejected" : preflight.status === "repaired" ? "model.tool.repaired" : "model.tool.repaired";
        const preflightEvent = agentLoopEvent(preflightKind, sessionId, turnId, trace, {
          status: preflight.status,
          capabilityId: preflight.capabilityId ?? "",
          repairs: preflight.repairs,
          diagnostics: preflight.diagnostics,
          repaired: preflight.repaired ?? {}
        }, request.agentId, preflight.status === "rejected" ? toolIntentError(preflight.diagnostics) : undefined);
        await recordRuntimeAdapterEvent(deps, preflightEvent);
        yield preflightEvent;
        if (preflight.status === "rejected" || !preflight.capabilityId) {
          const error = toolIntentError(preflight.diagnostics);
          diagnostics.push(error);
          messages.push({ role: "tool", content: `Tool request rejected: ${error.message}`, toolCallId: modelEvent.id ?? "", toolName: modelEvent.name });
          continue;
        }

        const toolInput = preflight.repaired?.input ?? modelEvent.input;
        const kernelRequest: RuntimeKernelRequest = {
          capabilityId: preflight.capabilityId,
          caller: request.caller,
          input: toolInput,
          sessionId,
          timeoutMs: limits.toolTimeoutMs,
          trace
        };
        const toolEvents = await collectRuntimeEvents(kernel.execute({
          ...kernelRequest,
          ...(request.agentId ? { agentId: request.agentId } : {}),
          ...(modelEvent.id ? { parentInvocationId: modelEvent.id } : {})
        }));
        for (const event of toolEvents) {
          yield event;
        }
        const terminal = lastRuntimeEvent(toolEvents, (event) => event.kind === "capability.completed" || event.kind === "capability.failed" || event.kind === "capability.cancelled" || event.kind === "execution.rejected");
        const toolResultText = modelToolResultText(terminal);
        messages.push({ role: "tool", content: toolResultText, toolCallId: modelEvent.id ?? "", toolName: modelEvent.name });
        const resultEvent = agentLoopEvent("model.tool.result", sessionId, turnId, trace, {
          toolCallId: modelEvent.id ?? "",
          toolName: modelEvent.name,
          result: boundedModelText(toolResultText, limits.maxOutputBytes),
          terminalKind: terminal?.kind ?? "unknown"
        }, request.agentId, terminal?.error);
        await recordRuntimeAdapterEvent(deps, resultEvent);
        yield resultEvent;
        if (terminal?.error) {
          diagnostics.push(terminal.error);
          const status = terminal.kind === "capability.cancelled"
            ? "cancelled"
            : terminal.kind === "execution.rejected"
              ? "rejected"
              : "failed";
          const summary = summarizeAgentLoop(status, request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
          const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, terminal.error);
          await recordRuntimeAdapterEvent(deps, failed);
          yield failed;
          terminalEmitted = true;
          return;
        }
      }
      if (modelEvent.kind === "finish") {
        const event = agentLoopEvent("model.finished", sessionId, turnId, trace, {
          reason: modelEvent.reason,
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
      }
      if (modelEvent.kind === "done") {
        const event = agentLoopEvent("model.done", sessionId, turnId, trace, {
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
      }
      if (modelEvent.kind === "error") {
        diagnostics.push(modelEvent.error);
        const failed = agentLoopEvent("runtime.error", sessionId, turnId, trace, {
          source: "model",
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId, modelEvent.error);
        await recordRuntimeAdapterEvent(deps, failed);
        yield failed;
        const summary = summarizeAgentLoop("failed", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
        const terminal = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, modelEvent.error);
        await recordRuntimeAdapterEvent(deps, terminal);
        yield terminal;
        terminalEmitted = true;
        return;
      }
    }
    if (!requestedTool) {
      const summary = summarizeAgentLoop("completed", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
      const completed = agentLoopEvent("turn.completed", sessionId, turnId, trace, summary, request.agentId);
      await recordRuntimeAdapterEvent(deps, completed);
      yield completed;
      const loopCompleted = agentLoopEvent("agent.loop.completed", sessionId, turnId, trace, summary, request.agentId);
      await recordRuntimeAdapterEvent(deps, loopCompleted);
      yield loopCompleted;
      terminalEmitted = true;
      return;
    }
  }

  if (!terminalEmitted) {
    const error = kernelError("KERNEL_QUEUE_BACKPRESSURE", "Agent loop model iteration limit exceeded", { maxModelIterations: limits.maxModelIterations });
    diagnostics.push(error);
    const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
    const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, error);
    await recordRuntimeAdapterEvent(deps, failed);
    yield failed;
  }
}

export async function* executeProjectedRuntimeTurn(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: ProjectedRuntimeTurnRequest
): AsyncIterable<RuntimeEvent> {
  const sessionId = request.sessionId ?? await deps.sessions.create({ caller: request.caller });
  const trace = request.trace ?? runtimeTrace(sessionId, "projection");
  const budget = await deps.usage.contextBudget({
    sessionId,
    purpose: "model-request",
    requestedInputTokens: countTokens(request.prompt),
    reservedOutputTokens: 1024
  });

  const started = projectionRuntimeEvent("context.projection.started", sessionId, trace, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    purpose: "model-request",
    promptHash: stableHash(request.prompt),
    budget
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  const projection = await deps.context.projectGraph({
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId,
    purpose: "model-request",
    prompt: request.prompt,
    budget: {
      hardLimitTokens: budget.hardLimitTokens,
      ...(budget.softLimitTokens !== undefined ? { softLimitTokens: budget.softLimitTokens } : {}),
      reservedOutputTokens: budget.reservedOutputTokens
    },
    scope: {
      sessionId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      availableRedactionClasses: ["public", "internal", "sensitive"]
    },
    trace,
    policy: { redaction: "fail-closed" },
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  });

  if (projection.cache.hit) {
    const cacheHit = projectionRuntimeEvent("context.projection.cache-hit", sessionId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, cacheHit);
    yield cacheHit;
  }
  if (projection.status === "degraded") {
    const degraded = projectionRuntimeEvent("context.projection.degraded", sessionId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
  }
  if (projection.status === "rejected") {
    const rejected = projectionRuntimeEvent("context.projection.rejected", sessionId, trace, projectionEventData(projection), request.agentId, projection.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
    await recordRuntimeAdapterEvent(deps, rejected);
    yield rejected;
    return;
  }

  const completed = projectionRuntimeEvent("context.projection.completed", sessionId, trace, projectionEventData(projection), request.agentId);
  await recordRuntimeAdapterEvent(deps, completed);
  yield completed;

  yield* kernel.execute({
    ...request,
    sessionId,
    trace,
    input: {
      ...request.input,
      prompt: projection.prompt,
      text: projection.prompt,
      contextProjection: {
        schemaVersion: projection.schemaVersion,
        status: projection.status,
        selectedNodeCount: projection.selectedNodes.length,
        excludedNodeCount: projection.excludedNodes.length,
        estimatedTokens: projection.estimatedTokens,
        replayFingerprint: projection.replayFingerprint
      }
    }
  });
}

export async function collectRuntimeEvents(iterable: AsyncIterable<RuntimeEvent>): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

function projectionEventData(projection: ContextProjectionResult): JsonObject {
  return {
    schemaVersion: projection.schemaVersion,
    status: projection.status,
    selectedNodeCount: projection.selectedNodes.length,
    excludedNodeCount: projection.excludedNodes.length,
    estimatedTokens: projection.estimatedTokens,
    budget: projection.budget,
    redaction: projection.redaction,
    redactionEvidence: projectionRedactionEvidence(projection),
    cache: projection.cache,
    replayFingerprint: projection.replayFingerprint
  };
}

function projectionRedactionEvidence(projection: ContextProjectionResult): readonly JsonObject[] {
  return projection.excludedNodes
    .filter((node) => node.secretDecision || node.reason === "unsafe-secret" || node.reason === "policy-denied")
    .map((node) => ({
      nodeId: node.id,
      reason: node.reason,
      action: node.secretDecision?.action ?? "exclude",
      reasonCode: node.secretDecision?.reasonCode ?? "context.secret.excluded",
      redactedText: node.secretDecision?.redactedText ?? "[REDACTED]",
      classification: node.secretDecision
        ? {
            detected: node.secretDecision.classification.detected,
            kind: node.secretDecision.classification.kind,
            exposure: node.secretDecision.classification.exposure,
            reasonCode: node.secretDecision.classification.reasonCode,
            occurrences: node.secretDecision.classification.occurrences,
            redactionClass: node.secretDecision.classification.redactionClass
          }
        : {
            detected: true,
            kind: "generic-secret",
            exposure: "unsafe",
            reasonCode: "secret.detected",
            occurrences: 1,
            redactionClass: "secret"
          },
      redaction: { class: "secret", fields: ["redactedText"] }
    }));
}

function projectionRuntimeEvent(
  kind: Extract<RuntimeEvent["kind"], `context.projection.${string}`>,
  sessionId: SessionId,
  trace: TraceContext,
  data: JsonObject,
  agentId?: AgentId,
  error?: import("@deepseek/platform-contracts").RedactedError
): RuntimeEvent {
  return {
    kind,
    sessionId,
    ...(agentId ? { agentId } : {}),
    trace,
    data: redactJsonSecrets(data) as JsonObject,
    ...(error ? { error } : {})
  };
}

async function* projectAgentLoopContext(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  trace: TraceContext
): AsyncIterable<RuntimeEvent> {
  const budget = await deps.usage.contextBudget({
    sessionId,
    purpose: "model-request",
    requestedInputTokens: countTokens(request.prompt),
    reservedOutputTokens: 1024
  });

  const started = agentLoopEvent("context.projection.started", sessionId, turnId, trace, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    purpose: "model-request",
    promptHash: stableHash(request.prompt),
    budget
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  const projection = await deps.context.projectGraph({
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId,
    purpose: "model-request",
    prompt: request.prompt,
    budget: {
      hardLimitTokens: budget.hardLimitTokens,
      ...(budget.softLimitTokens !== undefined ? { softLimitTokens: budget.softLimitTokens } : {}),
      reservedOutputTokens: budget.reservedOutputTokens
    },
    scope: {
      sessionId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      availableRedactionClasses: ["public", "internal", "sensitive"]
    },
    trace,
    policy: { redaction: "fail-closed" },
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  });

  if (projection.cache.hit) {
    const cacheHit = agentLoopEvent("context.projection.cache-hit", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, cacheHit);
    yield cacheHit;
  }
  if (projection.status === "degraded") {
    const degraded = agentLoopEvent("context.projection.degraded", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
  }
  if (projection.status === "rejected") {
    const rejected = agentLoopEvent("context.projection.rejected", sessionId, turnId, trace, projectionEventData(projection), request.agentId, projection.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
    await recordRuntimeAdapterEvent(deps, rejected);
    yield rejected;
    return;
  }

  const completed = agentLoopEvent("context.projection.completed", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
  await recordRuntimeAdapterEvent(deps, completed);
  yield completed;
}

async function recordRuntimeAdapterEvent(deps: RuntimeDependencies, event: RuntimeEvent): Promise<void> {
  const events = await deps.sessions.events(event.sessionId);
  await deps.sessions.append({
    sessionId: event.sessionId,
    sequence: events.length + 1,
    kind: event.kind,
    at: new Date(0).toISOString(),
    payload: event.data,
    redaction: { class: "internal" }
  });
  await deps.bus.publish({
    protocolVersion: "1",
    schemaVersion: "1.0.0",
    id: `bus-${stableHash(`${event.kind}:${event.sessionId}:${events.length + 1}`)}`,
    type: "event",
    createdAt: new Date(0).toISOString(),
    trace: event.trace,
    redaction: { class: "internal" },
    compatibility: { schemaVersion: "1.0.0" },
    payload: {
      kind: event.kind,
      data: event.data,
      ...(event.error ? { error: event.error } : {})
    },
    topic: { name: "runtime.event", owner: "runtime", trustBoundary: "core" },
    producer: "runtime-context-projection",
    correlationId: event.trace.correlationId,
    sessionId: event.sessionId,
    replayable: true
  });
  await deps.observability.emit({
    kind: event.kind === "context.projection.rejected" ? "audit" : "trace",
    at: new Date(0).toISOString(),
    name: event.kind,
    fields: event.data
  });
}

function agentLoopEvent(
  kind: RuntimeEvent["kind"],
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  trace: TraceContext,
  data: JsonObject,
  agentId?: AgentId,
  error?: import("@deepseek/platform-contracts").RedactedError
): RuntimeEvent {
  return {
    kind,
    sessionId,
    turnId,
    ...(agentId ? { agentId } : {}),
    trace,
    data: redactJsonSecrets(data) as JsonObject,
    ...(error ? { error } : {})
  };
}

function modelToolSchema(manifest: CapabilityManifest): JsonObject {
  return {
    type: "function",
    function: {
      name: String(manifest.id),
      description: manifest.description ?? manifest.name,
      parameters: manifest.inputSchema
    },
    metadata: {
      capabilityId: manifest.id,
      version: manifest.version,
      sideEffect: manifest.sideEffect,
      permissions: manifest.permissions,
      timeoutMs: manifest.timeoutMs ?? 30_000,
      replayPolicy: manifest.replayPolicy ?? {}
    }
  };
}

function providerMetadata(request: AgentLoopRequest): ModelProviderEventMetadata {
  return {
    provider: String(request.profile.providerId),
    protocol: "openai-chat-completions",
    model: request.profile.model
  };
}

function toolIntentError(diagnostics: readonly ToolIntentDiagnostic[]): KernelError {
  const first = diagnostics[0];
  return kernelError("KERNEL_ENVELOPE_INVALID", first?.message ?? "Tool intent preflight failed", {
    code: first?.code ?? "TOOL_INTENT_REJECTED",
    field: first?.field ?? ""
  });
}

function modelToolResultText(event: RuntimeEvent | undefined): string {
  if (!event) return "Tool execution produced no terminal event.";
  if (event.error) return `Tool execution failed: ${event.error.message}`;
  const output = event.data.output;
  if (isJsonObjectForRuntime(output)) {
    const evidence = output.evidence;
    if (isJsonObjectForRuntime(evidence)) {
      const preview = evidence.preview;
      if (isJsonObjectForRuntime(preview) && typeof preview.text === "string") return preview.text;
      return JSON.stringify({
        status: evidence.status ?? "completed",
        tool: evidence.tool ?? "",
        affectedPaths: evidence.affectedPaths ?? []
      });
    }
  }
  return JSON.stringify(event.data);
}

function lastRuntimeEvent(events: readonly RuntimeEvent[], predicate: (event: RuntimeEvent) => boolean): RuntimeEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && predicate(event)) return event;
  }
  return undefined;
}

function summarizeAgentLoop(
  status: AgentLoopSummary["status"],
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  trace: TraceContext,
  assistantText: string,
  iterations: number,
  toolCalls: number,
  diagnostics: readonly import("@deepseek/platform-contracts").RedactedError[]
): AgentLoopSummary {
  return {
    schemaVersion: "1.0.0",
    status,
    sessionId,
    turnId,
    traceId: String(trace.traceId),
    assistantText: boundedModelText(assistantText, request.limits?.maxOutputBytes ?? defaultAgentLoopLimits.maxOutputBytes),
    iterations,
    toolCalls,
    modelProvider: request.profile.providerId,
    modelProfile: request.profile.id,
    diagnostics,
    redaction: { class: "internal", fields: ["assistantText", "diagnostics.details"] }
  };
}

function boundedModelText(value: string, limitBytes: number): string {
  const safe = redactSecretTextForRuntime(value);
  return Buffer.byteLength(safe, "utf8") > limitBytes ? safe.slice(0, limitBytes) : safe;
}

function isJsonObjectForRuntime(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function runtimeTrace(sessionId: SessionId, scope: string): TraceContext {
  return {
    traceId: asId<"trace">(`trace-${scope}-${sessionId}`),
    spanId: asId<"span">(`span-${scope}-${sessionId}`),
    correlationId: asId<"correlation">(`corr-${scope}-${sessionId}`),
    sessionId
  };
}

function countTokens(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function redactSecretTextForRuntime(value: string): string {
  return redactJsonSecrets(value) as string;
}
