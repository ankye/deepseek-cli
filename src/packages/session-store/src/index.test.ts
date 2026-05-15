import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { executeSessionResumeFork, InMemorySessionStore } from "./index.js";

describe("session.resume-fork helper", () => {
  it("wraps resume and fork store operations in deterministic evidence", async () => {
    const store = new InMemorySessionStore();
    const parentSessionId = await store.create({ label: "parent" });
    await store.append({
      sessionId: parentSessionId,
      sequence: 1,
      kind: "turn.completed",
      at: new Date(0).toISOString(),
      payload: { message: "done" },
      redaction: { class: "internal" }
    });

    const resumed = await executeSessionResumeFork(store, { action: "resume", sessionId: parentSessionId });
    const forked = await executeSessionResumeFork(store, {
      action: "fork",
      parentSessionId,
      reason: "unit fork",
      metadata: { label: "child", token: "sk-session-secret" }
    });
    const missing = await executeSessionResumeFork(store, { action: "resume", sessionId: asId<"session">("session-missing") });

    assert.equal(resumed.familyId, "session.resume-fork");
    assert.equal(resumed.status, "completed");
    assert.equal(resumed.latestSequence, 1);
    assert.equal(forked.status, "completed");
    assert.equal(forked.parentSessionId, parentSessionId);
    assert.ok(forked.childSessionId);
    assert.match(forked.replayFingerprint, /^session\.resume-fork:h[0-9a-f]+$/);
    assert.equal(missing.status, "rejected");
    assert.deepEqual(missing.diagnostics, ["SESSION_NOT_FOUND"]);
  });
});
