import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("runtime integration pipeline", () => {
  it("records bus, session, usage, and observability state for a turn", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "integration smoke" }));
    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);
    assert.ok(deps.bus.getReplayRecords(sessionId).length >= 4);
    assert.ok((await deps.sessions.events(sessionId)).length >= 4);
    assert.equal((await deps.usage.total(sessionId)).outputTokens, 6);
    assert.ok((await deps.observability.drain()).length >= 4);
  });
});
