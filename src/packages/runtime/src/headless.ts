import type {
  AgentRuntime,
  JsonObject,
  RunTurnRequest,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel,
  RuntimeKernelRequest,
  SessionEvent,
  SessionId,
  StartSessionRequest,
  TraceContext
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { runtimeEchoCapability } from "./echo-capability.js";
import { projectionEventData } from "./context-projection.js";
import { kernelError } from "./errors.js";
import { projectionRuntimeEvent, recordRuntimeAdapterEvent } from "./events.js";
import { createDefaultRuntimeKernel } from "./kernel.js";
import { countTokens, runtimeTrace, stableHash } from "./trace.js";

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

export async function* executeProjectedRuntimeTurn(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: ProjectedRuntimeTurnRequest
): AsyncIterable<RuntimeEvent> {
  const sessionId = request.sessionId ?? await deps.sessions.create({ caller: request.caller });
  const trace: TraceContext = request.trace ?? runtimeTrace(sessionId, "projection");
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
