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
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class InMemorySessionStore implements SessionStore {
  protected next = 1;
  protected readonly eventsBySession = new Map<string, SessionEvent[]>();
  protected readonly metadataBySession = new Map<string, SessionMetadata>();
  protected readonly snapshotsBySession = new Map<string, SessionSnapshot>();

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

  protected buildMetadata(sessionId: SessionId, metadata: JsonObject, lineage: SessionLineage): SessionMetadata {
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

export class PersistentFilesystemSessionStore extends InMemorySessionStore {
  constructor(private readonly root: string) {
    super();
    this.hydrate();
  }

  private hydrate(): void {
    try {
      mkdirSync(this.root, { recursive: true });
    } catch {
      return;
    }
    let entries: readonly string[] = [];
    try {
      entries = readdirSync(this.root);
    } catch {
      return;
    }
    let maxSessionOrdinal = 0;
    for (const name of entries) {
      if (name.endsWith(".jsonl")) {
        const sessionId = asId<"session">(name.slice(0, -".jsonl".length));
        const ordinal = parseSessionOrdinal(sessionId);
        if (ordinal !== undefined && ordinal > maxSessionOrdinal) maxSessionOrdinal = ordinal;
        try {
          const content = readFileSync(join(this.root, name), "utf8");
          const events: SessionEvent[] = [];
          for (const line of content.split(/\r?\n/)) {
            if (!line.trim()) continue;
            try {
              const record = JSON.parse(line) as { recordType?: string; event?: SessionEvent };
              if (record.recordType === "event" && record.event) events.push(record.event);
            } catch {
              continue;
            }
          }
          if (events.length > 0) {
            this.eventsBySession.set(sessionId, events);
            this.metadataBySession.set(sessionId, this.buildMetadata(sessionId, {}, {}));
          }
        } catch {
          continue;
        }
      }
    }
    for (const name of entries) {
      if (name.endsWith(".metadata.json")) {
        const sessionId = asId<"session">(name.slice(0, -".metadata.json".length));
        try {
          const metadata = JSON.parse(readFileSync(join(this.root, name), "utf8")) as SessionMetadata;
          this.metadataBySession.set(sessionId, metadata);
        } catch {
          continue;
        }
      }
      if (name.endsWith(".snapshot.json")) {
        const sessionId = asId<"session">(name.slice(0, -".snapshot.json".length));
        try {
          const snapshot = JSON.parse(readFileSync(join(this.root, name), "utf8")) as SessionSnapshot;
          this.snapshotsBySession.set(sessionId, snapshot);
        } catch {
          continue;
        }
      }
    }
    this.next = maxSessionOrdinal + 1;
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

/** @deprecated Use PersistentFilesystemSessionStore. Kept as an alias until callers migrate. */
export const DevelopmentFilesystemSessionStore = PersistentFilesystemSessionStore;

function parseSessionOrdinal(sessionId: string): number | undefined {
  const match = /^session-(\d+)$/.exec(sessionId);
  if (!match) return undefined;
  const ordinal = Number(match[1]);
  return Number.isFinite(ordinal) ? ordinal : undefined;
}

export function userSessionsDirectory(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): string {
  const resolvedEnv = env ?? sessionEnv();
  const resolvedPlatform = platform ?? sessionPlatform();
  if (resolvedPlatform === "win32") {
    const appData = resolvedEnv.APPDATA ?? resolvedEnv.LOCALAPPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "deepseek", "sessions");
  }
  const xdgDataHome = resolvedEnv.XDG_DATA_HOME;
  if (xdgDataHome && xdgDataHome.length > 0) return join(xdgDataHome, "deepseek", "sessions");
  return join(homedir(), ".deepseek", "sessions");
}

function sessionEnv(): NodeJS.ProcessEnv {
  const proc = globalThis as unknown as { process?: { env?: NodeJS.ProcessEnv } };
  return proc.process?.env ?? {};
}

function sessionPlatform(): NodeJS.Platform {
  const proc = globalThis as unknown as { process?: { platform?: NodeJS.Platform } };
  return proc.process?.platform ?? "linux";
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
