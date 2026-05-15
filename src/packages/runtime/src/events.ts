import type {
  AgentId,
  JsonObject,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext
} from "@deepseek/platform-contracts";
import { redactJsonSecrets } from "@deepseek/policy-sandbox";
import { stableHash } from "./trace.js";

const DETERMINISTIC_EVENT_CREATED_AT = new Date(0).toISOString();

export async function collectRuntimeEvents(iterable: AsyncIterable<RuntimeEvent>): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

export function lastRuntimeEvent(events: readonly RuntimeEvent[], predicate: (event: RuntimeEvent) => boolean): RuntimeEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && predicate(event)) return event;
  }
  return undefined;
}

export function projectionRuntimeEvent(
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
    createdAt: DETERMINISTIC_EVENT_CREATED_AT,
    trace,
    data: redactJsonSecrets(data) as JsonObject,
    ...(error ? { error } : {})
  };
}

export function agentLoopEvent(
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
    createdAt: DETERMINISTIC_EVENT_CREATED_AT,
    trace,
    data: redactJsonSecrets(data) as JsonObject,
    ...(error ? { error } : {})
  };
}

export async function recordRuntimeAdapterEvent(deps: RuntimeDependencies, event: RuntimeEvent): Promise<void> {
  const events = await deps.sessions.events(event.sessionId);
  await deps.sessions.append({
    sessionId: event.sessionId,
    sequence: events.length + 1,
    kind: event.kind,
    at: event.createdAt,
    payload: event.data,
    redaction: { class: "internal" }
  });
  await deps.bus.publish({
    protocolVersion: "1",
    schemaVersion: "1.0.0",
    id: `bus-${stableHash(`${event.kind}:${event.sessionId}:${events.length + 1}`)}`,
    type: "event",
    createdAt: event.createdAt,
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
    kind: event.kind.startsWith("agent.repair.") ? "repair" : event.kind === "context.projection.rejected" ? "audit" : "trace",
    at: event.createdAt,
    name: event.kind,
    fields: event.data
  });
}
