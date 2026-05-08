import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, createHeadlessRuntime, runtimeEchoCapability } from "../src/index.js";
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

  it("executes deterministic built-in capabilities through the runtime kernel", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "test",
      input: { text: "kernel" },
      timeoutMs: 30_000
    }));

    assert.deepEqual(
      events.map((event) => event.kind),
      [
        "kernel.request.accepted",
        "workflow.opened",
        "execution.envelope.created",
        "policy.decided",
        "sandbox.selected",
        "capability.started",
        "capability.output",
        "capability.completed",
        "workflow.closed"
      ]
    );
    assert.equal(events.some((event) => event.kind === "capability.output" && (event.data.output as { text?: string }).text === "kernel"), true);
    assert.equal(deps.concurrency.events().some((event) => event.status === "queued"), true);
    assert.equal(deps.bus.getReplayRecords(events[0]?.sessionId).length >= events.length, true);
    await kernel.shutdown();
  });
});
