import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SessionEvent, SessionStore } from "@deepseek/platform-contracts";
import { SESSION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { DevelopmentFilesystemSessionStore, InMemorySessionStore, PersistentFilesystemSessionStore, userSessionsDirectory } from "@deepseek/session-store";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, sep } from "node:path";
import { tmpdir } from "node:os";

function event(sessionId: string, sequence: number, kind = "runtime.test"): SessionEvent {
  return {
    sessionId: asId<"session">(sessionId),
    sequence,
    kind,
    at: new Date(0).toISOString(),
    payload: { text: "hello", secret: "sk-live-secret-value" },
    redaction: { class: "internal" }
  };
}

async function exerciseStore(name: string, store: SessionStore): Promise<void> {
  const sessionId = await store.create({ label: "contract", token: "sk-live-secret-value" });
  await store.append(event(sessionId, 1));
  await store.append(event(sessionId, 2, "runtime.done"));
  const snapshot = await store.snapshot(sessionId, { token: "sk-live-secret-value" });

  assert.equal(snapshot.schemaVersion, SESSION_SCHEMA_VERSION);
  assert.equal(JSON.stringify(snapshot).includes("sk-live-secret-value"), false, name);

  const resumed = await store.resume(sessionId);
  assert.equal(resumed.ok, true, resumed.error?.message);
  assert.equal(resumed.value?.schemaVersion, SESSION_SCHEMA_VERSION);
  assert.equal(resumed.value?.eventCount, 2);
  assert.equal(resumed.value?.latestSequence, 2);
  assert.equal(JSON.stringify(resumed.value).includes("sk-live-secret-value"), false, name);

  const forked = await store.fork({ parentSessionId: sessionId, reason: "try alternate path" });
  assert.equal(forked.ok, true, forked.error?.message);
  assert.equal(forked.value?.schemaVersion, SESSION_SCHEMA_VERSION);
  assert.equal(forked.value?.parentSessionId, sessionId);
  assert.equal(forked.value?.forkPointSequence, 2);
  assert.equal(forked.value?.inheritedEventCount, 2);
  assert.equal(forked.value?.forkEvent.kind, "session.forked");

  const childResume = forked.value ? await store.resume(forked.value.childSessionId) : undefined;
  assert.equal(childResume?.ok, true);
  assert.equal(childResume?.value?.lineage.parentSessionId, sessionId);

  const missingResume = await store.resume(asId<"session">("session-missing"));
  assert.equal(missingResume.ok, false);
  assert.equal(missingResume.error?.code, "SESSION_NOT_FOUND");

  const missingFork = await store.fork({ parentSessionId: asId<"session">("session-missing") });
  assert.equal(missingFork.ok, false);
  assert.equal(missingFork.error?.code, "SESSION_NOT_FOUND");
}

describe("session store resume and fork contracts", () => {
  it("passes against in-memory store", async () => {
    await exerciseStore("in-memory", new InMemorySessionStore());
  });

  it("passes against development filesystem store", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-session-store-"));
    try {
      const store = new DevelopmentFilesystemSessionStore(root);
      await exerciseStore("filesystem", store);
      const metadata = await readFile(join(root, "session-1.metadata.json"), "utf8");
      assert.equal(metadata.includes(SESSION_SCHEMA_VERSION), true);
      assert.equal(metadata.includes("sk-live-secret-value"), false);
      const log = await readFile(join(root, "session-1.jsonl"), "utf8");
      assert.equal(log.includes(SESSION_SCHEMA_VERSION), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("hydrates from disk so a new store instance sees prior events", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-session-hydrate-"));
    try {
      const first = new PersistentFilesystemSessionStore(root);
      const sessionId = await first.create({ label: "hydration" });
      await first.append(event(sessionId, 1, "runtime.initial"));
      await first.append(event(sessionId, 2, "runtime.final"));

      const second = new PersistentFilesystemSessionStore(root);
      const events = await second.events(sessionId);
      assert.equal(events.length, 2);
      assert.equal(events[0]?.kind, "runtime.initial");
      assert.equal(events[1]?.kind, "runtime.final");

      const resumed = await second.resume(sessionId);
      assert.equal(resumed.ok, true, resumed.error?.message);
      assert.equal(resumed.value?.eventCount, 2);
      assert.equal(resumed.value?.latestSequence, 2);

      const freshSessionId = await second.create({ label: "post-hydrate" });
      assert.notEqual(freshSessionId, sessionId, "new session id must not collide with hydrated one");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps DevelopmentFilesystemSessionStore as a backwards-compatible alias", () => {
    assert.equal(DevelopmentFilesystemSessionStore, PersistentFilesystemSessionStore);
  });

  it("picks a per-user sessions directory from environment", () => {
    const defaultLinux = userSessionsDirectory({}, "linux");
    assert.equal(defaultLinux.endsWith(`${sep}.deepseek${sep}sessions`), true, defaultLinux);
    const xdgLinux = userSessionsDirectory({ XDG_DATA_HOME: `${sep}xdg` }, "linux");
    assert.equal(xdgLinux.endsWith(`deepseek${sep}sessions`), true, xdgLinux);
    assert.equal(xdgLinux.startsWith(`${sep}xdg`), true, xdgLinux);
    const winPath = userSessionsDirectory({ APPDATA: "C:\\\\Users\\\\Tester\\\\AppData\\\\Roaming" }, "win32");
    assert.equal(winPath.includes("deepseek"), true);
    assert.equal(winPath.endsWith("sessions"), true);
  });
});
