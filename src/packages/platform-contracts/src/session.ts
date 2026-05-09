import type { JsonObject, RedactionMetadata, SerializableResult } from "./common.js";
import type { SessionId } from "./ids.js";

export const SESSION_SCHEMA_VERSION = "1.0.0";

export interface SessionLineage extends JsonObject {
  readonly parentSessionId?: SessionId;
  readonly forkPointSequence?: number;
  readonly inheritedEventCount?: number;
  readonly reason?: string;
}

export interface SessionMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly sessionId: SessionId;
  readonly createdAt: string;
  readonly eventCount: number;
  readonly latestSequence: number;
  readonly metadata: JsonObject;
  readonly lineage: SessionLineage;
  readonly redaction: RedactionMetadata;
}

export interface SessionEvent extends JsonObject {
  readonly sessionId: SessionId;
  readonly sequence: number;
  readonly kind: string;
  readonly at: string;
  readonly payload: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface SessionSnapshot extends JsonObject {
  readonly schemaVersion: string;
  readonly sessionId: SessionId;
  readonly eventCount: number;
  readonly checkpointId?: string;
  readonly payload: JsonObject;
  readonly lineage?: SessionLineage;
  readonly redaction?: RedactionMetadata;
}

export interface SessionResumeResult extends JsonObject {
  readonly schemaVersion: string;
  readonly sessionId: SessionId;
  readonly eventCount: number;
  readonly latestSequence: number;
  readonly metadata: SessionMetadata;
  readonly lineage: SessionLineage;
  readonly preview: JsonObject;
  readonly snapshot?: SessionSnapshot;
  readonly redaction: RedactionMetadata;
}

export interface SessionForkRequest extends JsonObject {
  readonly parentSessionId: SessionId;
  readonly forkPointSequence?: number;
  readonly reason?: string;
  readonly metadata?: JsonObject;
}

export interface SessionForkResult extends JsonObject {
  readonly schemaVersion: string;
  readonly parentSessionId: SessionId;
  readonly childSessionId: SessionId;
  readonly forkPointSequence: number;
  readonly inheritedEventCount: number;
  readonly metadata: SessionMetadata;
  readonly lineage: SessionLineage;
  readonly forkEvent: SessionEvent;
  readonly redaction: RedactionMetadata;
}

export interface SessionStore {
  create(metadata?: JsonObject): Promise<SessionId>;
  append(event: SessionEvent): Promise<void>;
  events(sessionId: SessionId): Promise<readonly SessionEvent[]>;
  snapshot(sessionId: SessionId, payload: JsonObject): Promise<SessionSnapshot>;
  metadata(sessionId: SessionId): Promise<SerializableResult<SessionMetadata>>;
  resume(sessionId: SessionId): Promise<SerializableResult<SessionResumeResult>>;
  fork(request: SessionForkRequest): Promise<SerializableResult<SessionForkResult>>;
}
