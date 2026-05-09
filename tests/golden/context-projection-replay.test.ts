import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("context projection golden replay", () => {
  it("captures selected nodes, budget, redaction, and cache metadata in replay", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "golden projection" }));
    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);
    const projectionCompleted = events.find((event) => event.kind === "context.projection.completed");
    assert.ok(projectionCompleted);
    assert.equal(typeof projectionCompleted.data.replayFingerprint, "string");
    assert.equal((projectionCompleted.data.budget as { selectedTokens?: number }).selectedTokens, 2);
    assert.equal((projectionCompleted.data.redaction as { secretLikeBlocked?: number }).secretLikeBlocked, 0);

    const trace = await deps.regression.normalize({
      name: "context-projection",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime: events,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "context.projection.completed" }, { expectedKind: "capability.completed" }]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    await runtime.dispose();
  });
});
