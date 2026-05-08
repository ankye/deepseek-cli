import type { JsonObject, SessionEvent, SessionId, SessionSnapshot, SessionStore } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export class InMemorySessionStore implements SessionStore {
  private next = 1;
  private readonly eventsBySession = new Map<string, SessionEvent[]>();

  async create(_metadata: JsonObject = {}): Promise<SessionId> {
    const id = asId<"session">(`session-${this.next++}`);
    this.eventsBySession.set(id, []);
    return id;
  }

  async append(event: SessionEvent): Promise<void> {
    const events = this.eventsBySession.get(event.sessionId) ?? [];
    events.push(event);
    this.eventsBySession.set(event.sessionId, events);
  }

  async events(sessionId: SessionId): Promise<readonly SessionEvent[]> {
    return [...(this.eventsBySession.get(sessionId) ?? [])];
  }

  async snapshot(sessionId: SessionId, payload: JsonObject): Promise<SessionSnapshot> {
    return {
      sessionId,
      eventCount: this.eventsBySession.get(sessionId)?.length ?? 0,
      checkpointId: `checkpoint-${sessionId}`,
      payload
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
    await writeFile(path, `${existing}${JSON.stringify(event)}\n`, "utf8");
  }
}
