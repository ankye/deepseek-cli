import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext, VersionedEnvelope } from "./common.js";
import type { ContextPipelineLayerId } from "./context.js";
import type { CausationId, CorrelationId, SessionId } from "./ids.js";

export const RUNTIME_PIPE_SCHEMA_VERSION = "1.0.0";

export type BusMessageKind = "command" | "event" | "request" | "reply" | "control";
export type BusPipeOverflowPolicy = "block" | "drop-newest" | "drop-oldest" | "compact" | "summarize" | "fail-closed";
export type BusPipePressureState = "normal" | "pressured" | "overflowing" | "failed-closed";
export type BusPipeReplayImpact = "none" | "diagnostic-only" | "replay-affecting";
export type BusPipeDeliveryClass = "lossless" | "compactable" | "summarizable" | "fail-closed";

export interface BusTopic {
  readonly name: string;
  readonly owner: string;
  readonly trustBoundary?: "core" | "extension" | "plugin" | "skill" | "external";
}

export interface BusPipeConfig extends JsonObject {
  readonly schemaVersion: string;
  readonly streamId: string;
  readonly topic: string;
  readonly owner: string;
  readonly capacity: number;
  readonly highWatermark: number;
  readonly overflowPolicy: BusPipeOverflowPolicy;
  readonly delivery: BusPipeDeliveryClass;
  readonly replayImpact: BusPipeReplayImpact;
  readonly description: string;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface BusPipeMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly streamId: string;
  readonly sequence: number;
  readonly capacity: number;
  readonly depth: number;
  readonly pressure: BusPipePressureState;
  readonly overflowPolicy: BusPipeOverflowPolicy;
  readonly delivery: BusPipeDeliveryClass;
  readonly replayImpact: BusPipeReplayImpact;
  readonly droppedRecords: number;
  readonly compactedRecords: number;
}

export interface BusPipeDiagnostic extends JsonObject {
  readonly schemaVersion: string;
  readonly streamId: string;
  readonly topic: string;
  readonly producer?: string;
  readonly consumer?: string;
  readonly capacity: number;
  readonly depth: number;
  readonly pressure: BusPipePressureState;
  readonly overflowPolicy: BusPipeOverflowPolicy;
  readonly delivery: BusPipeDeliveryClass;
  readonly replayImpact: BusPipeReplayImpact;
  readonly droppedRecords: number;
  readonly blockedProducers: readonly string[];
  readonly compactedRecords: number;
  readonly failClosedCount: number;
  readonly suggestedAction: string;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export type ContextPipelineStreamRecordKind =
  | "context.pipeline.block"
  | "context.pipeline.completed"
  | "context.pipeline.failed"
  | "context.pipeline.backpressure";

export interface ContextPipelineStreamRecord extends JsonObject {
  readonly schemaVersion: typeof RUNTIME_PIPE_SCHEMA_VERSION;
  readonly kind: ContextPipelineStreamRecordKind;
  readonly streamId: string;
  readonly correlationId: CorrelationId;
  readonly sessionId?: SessionId;
  readonly pipelineFingerprint?: string;
  readonly sequence: number;
  readonly layer?: ContextPipelineLayerId;
  readonly blockIds: readonly string[];
  readonly affectedBlockIds?: readonly string[];
  readonly overflowPolicy?: BusPipeOverflowPolicy;
  readonly pressure?: BusPipePressureState;
  readonly error?: RedactedError;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface BusEnvelope<TPayload extends JsonObject = JsonObject>
  extends VersionedEnvelope<BusMessageKind, TPayload> {
  readonly topic: BusTopic;
  readonly producer: string;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly sessionId?: SessionId;
  readonly replayable: boolean;
  readonly pipe?: BusPipeMetadata;
}

export interface BusPublishOptions {
  readonly requirePolicyCheck?: boolean;
  readonly persistReplay?: boolean;
}

export interface BusSubscription {
  readonly topic: string;
  readonly consumer: string;
}

export interface RuntimeMessageBus {
  publish<TPayload extends JsonObject>(
    envelope: BusEnvelope<TPayload>,
    options?: BusPublishOptions
  ): Promise<void>;
  subscribe(subscription: BusSubscription): AsyncIterable<BusEnvelope>;
  getReplayRecords(sessionId?: SessionId): readonly BusEnvelope[];
  getPipeDiagnostics(): readonly BusPipeDiagnostic[];
}

export interface BusBackpressureError extends RedactedError {
  readonly code: "BUS_BACKPRESSURE";
}

export const RUNTIME_PIPE_STREAMS: readonly BusPipeConfig[] = [
  pipe("runtime.events", "runtime.event", "runtime-message-bus", 1000, "drop-oldest", "compactable", "diagnostic-only", "Canonical runtime events delivered to hosts and diagnostics."),
  pipe("session.replay", "session.event", "session-store", 1000, "fail-closed", "lossless", "replay-affecting", "Session replay stream; cannot silently drop records."),
  pipe("context.pipeline", "context.pipeline", "context-engine", 256, "compact", "compactable", "replay-affecting", "Context pipeline manifests, prefix hashes, and compaction records."),
  pipe("tool.results", "tool.result", "runtime", 128, "summarize", "summarizable", "diagnostic-only", "Tool result summaries and bounded evidence references."),
  pipe("agent.stream", "agent.stream", "agent-management", 256, "block", "lossless", "replay-affecting", "Agent lifecycle, worker, verifier, and repair stream records."),
  pipe("plugin.events", "plugin.event", "plugin-system", 128, "fail-closed", "fail-closed", "replay-affecting", "Plugin contribution and activation events across trust boundaries."),
  pipe("mcp.events", "mcp.event", "mcp-gateway", 128, "fail-closed", "fail-closed", "replay-affecting", "MCP bridge discovery, invocation, and resource events.")
];

function pipe(
  streamId: string,
  topic: string,
  owner: string,
  capacity: number,
  overflowPolicy: BusPipeOverflowPolicy,
  delivery: BusPipeDeliveryClass,
  replayImpact: BusPipeReplayImpact,
  description: string
): BusPipeConfig {
  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    streamId,
    topic,
    owner,
    capacity,
    highWatermark: Math.max(1, Math.floor(capacity * 0.8)),
    overflowPolicy,
    delivery,
    replayImpact,
    description,
    redaction: { class: "internal", fields: ["description"] }
  };
}
