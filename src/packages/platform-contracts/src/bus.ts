import type { JsonObject, RedactedError, TraceContext, VersionedEnvelope } from "./common.js";
import type { CausationId, CorrelationId, SessionId } from "./ids.js";

export type BusMessageKind = "command" | "event" | "request" | "reply" | "control";

export interface BusTopic {
  readonly name: string;
  readonly owner: string;
  readonly trustBoundary?: "core" | "extension" | "plugin" | "skill" | "external";
}

export interface BusEnvelope<TPayload extends JsonObject = JsonObject>
  extends VersionedEnvelope<BusMessageKind, TPayload> {
  readonly topic: BusTopic;
  readonly producer: string;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly sessionId?: SessionId;
  readonly replayable: boolean;
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
}

export interface BusBackpressureError extends RedactedError {
  readonly code: "BUS_BACKPRESSURE";
}
