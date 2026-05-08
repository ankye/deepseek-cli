import type { JsonObject, RedactionMetadata } from "./common.js";
import type { SessionId } from "./ids.js";

export interface SessionEvent {
  readonly sessionId: SessionId;
  readonly sequence: number;
  readonly kind: string;
  readonly at: string;
  readonly payload: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface SessionSnapshot {
  readonly sessionId: SessionId;
  readonly eventCount: number;
  readonly checkpointId?: string;
  readonly payload: JsonObject;
}

export interface SessionStore {
  create(metadata?: JsonObject): Promise<SessionId>;
  append(event: SessionEvent): Promise<void>;
  events(sessionId: SessionId): Promise<readonly SessionEvent[]>;
  snapshot(sessionId: SessionId, payload: JsonObject): Promise<SessionSnapshot>;
}
