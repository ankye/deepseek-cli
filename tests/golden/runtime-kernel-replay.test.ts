import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("runtime kernel replay", () => {
  it("replays a normalized kernel invocation trace", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const runtime = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden",
      input: { text: "kernel replay" }
    }));
    const sessionId = runtime[0]?.sessionId;
    assert.ok(sessionId);

    const trace = await deps.regression.normalize({
      name: "runtime-kernel-echo",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "capability.completed" }]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal((await deps.regression.assertSemantic(trace, { expectedKind: "capability.completed" })).ok, true);
    assert.deepEqual(
      runtime.map((event) => event.kind),
      [
        "kernel.request.accepted",
        "workflow.opened",
        "execution.envelope.created",
        "policy.decided",
        "sandbox.selected",
        "capability.started",
        "scheduler.queued",
        "scheduler.started",
        "scheduler.completed",
        "capability.output",
        "capability.completed",
        "workflow.closed"
      ]
    );
    assert.equal(runtime.filter((event) => event.kind === "workflow.closed").length, 1);
    await kernel.shutdown();
  });
});
