import type {
  AgentRuntime,
  BusEnvelope,
  AgentId,
  JsonObject,
  ModelStreamEvent,
  RunTurnRequest,
  RuntimeDependencies,
  RuntimeEvent,
  SessionEvent,
  SessionId,
  StartSessionRequest,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

export class HeadlessAgentRuntime implements AgentRuntime {
  private disposed = false;

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
    const turnId = asId<"turn">(`turn-${sessionId}`);
    const agentDefinition = request.agentId
      ? (await this.deps.agents.listDefinitions()).find((definition) => definition.id === request.agentId) ?? (await this.deps.agents.getDefault())
      : await this.deps.agents.getDefault();
    const agent = await this.deps.agents.createInstance(agentDefinition.id, sessionId);
    const trace = this.trace(sessionId, "runtime");

    const started: RuntimeEvent = {
      kind: "turn.started",
      sessionId,
      turnId,
      agentId: agent.definition.id,
      trace,
      data: { prompt: request.prompt, agentInstanceId: agent.id }
    };
    await this.recordRuntimeEvent(started);
    yield started;

    const graph = await this.deps.workflow.createGraph({ sessionId, prompt: request.prompt });
    for await (const event of this.deps.workflow.runGraph(graph, { sessionId, prompt: request.prompt })) {
      await this.recordRuntimeEvent(event);
      yield event;
    }

    const busRecorded: RuntimeEvent = {
      kind: "bus.recorded",
      sessionId,
      turnId,
      taskId: graph.taskId,
      agentId: agent.definition.id,
      trace,
      data: {
        topic: "runtime.event",
        replayRecords: this.deps.bus.getReplayRecords(sessionId).length
      }
    };
    await this.recordRuntimeEvent(busRecorded);
    yield busRecorded;

    const checkpoint = await this.deps.workflow.createCheckpoint(graph, { reason: "single-turn-start" });
    await this.deps.sessions.snapshot(sessionId, { checkpointId: checkpoint.id, workflowId: graph.id });

    const projection = await this.deps.context.project(sessionId, request.prompt);
    const tools = (await this.deps.capabilities.listModelVisible()).map((manifest) => ({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      sideEffect: manifest.sideEffect,
      permissions: manifest.permissions
    }));

    const modelEvents = this.deps.models.stream({
      profile: defaultDeepSeekProfile,
      prompt: projection.prompt,
      tools
    });

    for await (const modelEvent of modelEvents) {
      const runtimeEvent = await this.modelEventToRuntimeEvent(modelEvent, sessionId, turnId, agent.definition.id, trace);
      if (runtimeEvent) {
        await this.recordRuntimeEvent(runtimeEvent);
        yield runtimeEvent;
      }
    }

    const completed: RuntimeEvent = {
      kind: "turn.completed",
      sessionId,
      turnId,
      taskId: graph.taskId,
      agentId: agent.definition.id,
      trace,
      data: {
        workflowId: graph.id,
        checkpointId: checkpoint.id,
        status: "completed"
      }
    };
    await this.recordRuntimeEvent(completed);
    yield completed;
  }

  async interrupt(sessionId: SessionId, reason: string): Promise<void> {
    await this.appendSessionEvent(sessionId, "runtime.interrupted", { reason });
  }

  async dispose(): Promise<void> {
    this.disposed = true;
  }

  private async modelEventToRuntimeEvent(
    modelEvent: ModelStreamEvent,
    sessionId: SessionId,
    turnId: TurnId,
    agentId: AgentId,
    trace: TraceContext
  ): Promise<RuntimeEvent | undefined> {
    if (modelEvent.kind === "delta") {
      return {
        kind: "model.delta",
        sessionId,
        turnId,
        agentId,
        trace,
        data: { text: modelEvent.text }
      };
    }
    if (modelEvent.kind === "usage") {
      await this.deps.usage.record({
        sessionId,
        inputTokens: modelEvent.inputTokens,
        outputTokens: modelEvent.outputTokens,
        costMicros: 0,
        elapsedMs: 0
      });
      return {
        kind: "usage.updated",
        sessionId,
        turnId,
        agentId,
        trace,
        data: {
          inputTokens: modelEvent.inputTokens,
          outputTokens: modelEvent.outputTokens
        }
      };
    }
    if (modelEvent.kind === "error") {
      return {
        kind: "runtime.error",
        sessionId,
        turnId,
        agentId,
        trace,
        data: {},
        error: modelEvent.error
      };
    }
    return undefined;
  }

  private async recordRuntimeEvent(event: RuntimeEvent): Promise<void> {
    await this.appendSessionEvent(event.sessionId, event.kind, event.data);
    await this.deps.bus.publish(this.toBusEnvelope(event));
    await this.deps.observability.emit({
      kind: event.kind === "usage.updated" ? "usage" : "trace",
      at: new Date(0).toISOString(),
      name: event.kind,
      fields: event.data
    });
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

  private toBusEnvelope(event: RuntimeEvent): BusEnvelope {
    return {
      protocolVersion: "1",
      schemaVersion: "1.0.0",
      id: `bus-${event.kind}-${event.sessionId}`,
      type: "event",
      createdAt: new Date(0).toISOString(),
      trace: event.trace,
      redaction: { class: "internal" },
      compatibility: { schemaVersion: "1.0.0" },
      payload: {
        kind: event.kind,
        data: event.data
      },
      topic: { name: "runtime.event", owner: "runtime", trustBoundary: "core" },
      producer: "runtime",
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
