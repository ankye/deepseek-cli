import type {
  JsonObject,
  RedactedError,
  SerializableResult,
  SessionEvent,
  SessionForkRequest,
  SessionForkResult,
  SessionId,
  SessionLineage,
  SessionMetadata,
  SessionResumeResult,
  SessionSnapshot,
  SessionStore
} from "@deepseek/platform-contracts";
import { SESSION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export class InMemorySessionStore implements SessionStore {
  private next = 1;
  private readonly eventsBySession = new Map<string, SessionEvent[]>();
  private readonly metadataBySession = new Map<string, SessionMetadata>();
  private readonly snapshotsBySession = new Map<string, SessionSnapshot>();

  async create(metadata: JsonObject = {}): Promise<SessionId> {
    const id = asId<"session">(`session-${this.next++}`);
    this.eventsBySession.set(id, []);
    this.metadataBySession.set(id, this.buildMetadata(id, metadata, {}));
    return id;
  }

  async append(event: SessionEvent): Promise<void> {
    const events = this.eventsBySession.get(event.sessionId) ?? [];
    events.push(event);
    this.eventsBySession.set(event.sessionId, events);
    this.metadataBySession.set(event.sessionId, this.buildMetadata(event.sessionId, this.metadataBySession.get(event.sessionId)?.metadata ?? {}, this.metadataBySession.get(event.sessionId)?.lineage ?? {}));
  }

  async events(sessionId: SessionId): Promise<readonly SessionEvent[]> {
    return [...(this.eventsBySession.get(sessionId) ?? [])];
  }

  async snapshot(sessionId: SessionId, payload: JsonObject): Promise<SessionSnapshot> {
    const existing = this.metadataBySession.get(sessionId);
    const snapshot = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId,
      eventCount: this.eventsBySession.get(sessionId)?.length ?? 0,
      checkpointId: `checkpoint-${sessionId}`,
      payload: redactJson(payload),
      lineage: existing?.lineage ?? {},
      redaction: { class: "internal" as const }
    };
    this.snapshotsBySession.set(sessionId, snapshot);
    return snapshot;
  }

  async metadata(sessionId: SessionId): Promise<SerializableResult<SessionMetadata>> {
    const metadata = this.metadataBySession.get(sessionId);
    if (!metadata) return { ok: false, error: sessionError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`) };
    return { ok: true, value: metadata };
  }

  async resume(sessionId: SessionId): Promise<SerializableResult<SessionResumeResult>> {
    const metadata = this.metadataBySession.get(sessionId);
    if (!metadata) return { ok: false, error: sessionError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`) };
    const events = this.eventsBySession.get(sessionId) ?? [];
    const latestSequence = latestSequenceOf(events);
    const snapshot = this.snapshotsBySession.get(sessionId);
    return {
      ok: true,
      value: {
        schemaVersion: SESSION_SCHEMA_VERSION,
        sessionId,
        eventCount: events.length,
        latestSequence,
        metadata: this.buildMetadata(sessionId, metadata.metadata, metadata.lineage),
        lineage: metadata.lineage,
        preview: previewFor(events),
        ...(snapshot ? { snapshot } : {}),
        redaction: { class: "internal", fields: ["preview"] }
      }
    };
  }

  async fork(request: SessionForkRequest): Promise<SerializableResult<SessionForkResult>> {
    const parentMetadata = this.metadataBySession.get(request.parentSessionId);
    if (!parentMetadata) return { ok: false, error: sessionError("SESSION_NOT_FOUND", `Session not found: ${request.parentSessionId}`) };
    const parentEvents = this.eventsBySession.get(request.parentSessionId) ?? [];
    const forkPointSequence = request.forkPointSequence ?? latestSequenceOf(parentEvents);
    const inheritedEventCount = parentEvents.filter((event) => event.sequence <= forkPointSequence).length;
    const childSessionId = asId<"session">(`session-${this.next++}`);
    const lineage: SessionLineage = {
      parentSessionId: request.parentSessionId,
      forkPointSequence,
      inheritedEventCount,
      ...(request.reason ? { reason: request.reason } : {})
    };
    const childMetadata = this.buildMetadata(childSessionId, request.metadata ?? {}, lineage);
    const forkEvent: SessionEvent = {
      sessionId: childSessionId,
      sequence: 1,
      kind: "session.forked",
      at: new Date(0).toISOString(),
      payload: {
        schemaVersion: SESSION_SCHEMA_VERSION,
        parentSessionId: request.parentSessionId,
        forkPointSequence,
        inheritedEventCount,
        reason: request.reason ?? ""
      },
      redaction: { class: "internal" }
    };
    this.eventsBySession.set(childSessionId, [forkEvent]);
    this.metadataBySession.set(childSessionId, this.buildMetadata(childSessionId, childMetadata.metadata, lineage));
    return {
      ok: true,
      value: {
        schemaVersion: SESSION_SCHEMA_VERSION,
        parentSessionId: request.parentSessionId,
        childSessionId,
        forkPointSequence,
        inheritedEventCount,
        metadata: this.metadataBySession.get(childSessionId) ?? childMetadata,
        lineage,
        forkEvent,
        redaction: { class: "internal" }
      }
    };
  }

  protected serializeMetadata(sessionId: SessionId): SessionMetadata | undefined {
    return this.metadataBySession.get(sessionId);
  }

  private buildMetadata(sessionId: SessionId, metadata: JsonObject, lineage: SessionLineage): SessionMetadata {
    const events = this.eventsBySession.get(sessionId) ?? [];
    return {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId,
      createdAt: new Date(0).toISOString(),
      eventCount: events.length,
      latestSequence: latestSequenceOf(events),
      metadata: redactJson(metadata),
      lineage,
      redaction: { class: "internal", fields: ["metadata", "lineage.reason"] }
    };
  }
}

export class DevelopmentFilesystemSessionStore extends InMemorySessionStore {
  constructor(private readonly root: string) {
    super();
  }

  override async append(event: SessionEvent): Promise<void> {
    await super.append(event);
    await mkdir(this.root, { recursive: true });
    const path = join(this.root, `${event.sessionId}.jsonl`);
    const existing = await readFile(path, "utf8").catch(() => "");
    await writeFile(path, `${existing}${JSON.stringify({ schemaVersion: SESSION_SCHEMA_VERSION, recordType: "event", event })}\n`, "utf8");
    const metadata = this.serializeMetadata(event.sessionId);
    if (metadata) await writeFile(join(this.root, `${event.sessionId}.metadata.json`), JSON.stringify(metadata, null, 2), "utf8");
  }

  override async snapshot(sessionId: SessionId, payload: JsonObject): Promise<SessionSnapshot> {
    const snapshot = await super.snapshot(sessionId, payload);
    await mkdir(this.root, { recursive: true });
    await writeFile(join(this.root, `${sessionId}.snapshot.json`), JSON.stringify(snapshot, null, 2), "utf8");
    return snapshot;
  }
}

function latestSequenceOf(events: readonly SessionEvent[]): number {
  return events.reduce((latest, event) => Math.max(latest, event.sequence), 0);
}

function previewFor(events: readonly SessionEvent[]): JsonObject {
  const last = events.at(-1);
  return {
    lastKind: last?.kind ?? "",
    lastSequence: last?.sequence ?? 0,
    eventKinds: events.slice(-5).map((event) => event.kind)
  };
}

function sessionError(code: string, message: string): RedactedError {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

function redactJson(value: JsonObject): JsonObject {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === "string" && /(?:sk-|token|secret|api[_-]?key)/i.test(item)) return "[REDACTED]";
    return item;
  })) as JsonObject;
}
