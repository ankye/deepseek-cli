import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "../src/index.js";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("headless runtime", () => {
  it("emits session, workflow, model, usage, and completion events", async () => {
    const runtime = createHeadlessRuntime(createDeterministicRuntimeDependencies());
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "hello" }));
    assert.deepEqual(
      events.map((event) => event.kind),
      ["turn.started", "workflow.step", "bus.recorded", "model.delta", "usage.updated", "turn.completed"]
    );
    assert.ok(events.every((event) => event.sessionId));
  });
});
