import type {
  AgentRuntime,
  BusEnvelope,
  AgentId,
  CapabilityExecutionContext,
  CapabilityManifest,
  Id,
  JsonObject,
  KernelError,
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
  TaskId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

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
    message,
    retryable: false,
    redaction: { class: "public" },
    details
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
  enabled: true
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

export interface ExecutionEnvelopeBuildInput {
  readonly request: RuntimeKernelRequest;
  readonly manifest: CapabilityManifest;
  readonly sessionId: SessionId;
  readonly workflowId?: string;
  readonly taskId?: string;
  readonly invocationId: string;
  readonly trace: TraceContext;
  readonly createdAt: string;
}

export function buildExecutionEnvelope(input: ExecutionEnvelopeBuildInput): import("@deepseek/platform-contracts").ExecutionEnvelope {
  const timeoutMs = input.request.timeoutMs ?? 30_000;
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
      sideEffect: input.manifest.sideEffect
    },
    approvalRequired: input.manifest.sideEffect !== "none" && input.manifest.sideEffect !== "read",
    resourceLocks: [],
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
      createdAt: this.deps.clock.now().toISOString()
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

    const policyDecision = await this.deps.policy.decide({
      subject: request.caller,
      action: `execute:${String(binding.manifest.id)}`,
      resource: String(binding.manifest.id),
      metadata: {
        envelopeId: envelope.invocationId,
        sideEffect: envelope.sideEffect,
        permissions: envelope.permissions
      }
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
      data,
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
    yield* this.kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "headless-runtime",
      input: { prompt: request.prompt },
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

export async function collectRuntimeEvents(iterable: AsyncIterable<RuntimeEvent>): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}
