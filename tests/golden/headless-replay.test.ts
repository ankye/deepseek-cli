import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("golden replay", () => {
  it("replays a normalized minimal headless trace", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "golden" }));
    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);
    const trace = await deps.regression.normalize({
      name: "minimal-headless",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime: events,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "turn.completed" }]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal((await deps.regression.assertSemantic(trace, { expectedKind: "turn.completed" })).ok, true);
  });
});
