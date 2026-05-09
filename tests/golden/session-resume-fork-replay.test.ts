import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("session resume and fork golden replay", () => {
  it("replays resumed and forked session lineage", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const parentSessionId = await deps.sessions.create({ label: "golden-parent" });

    const parentEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden.parent",
      input: { text: "parent" },
      sessionId: parentSessionId
    }));
    const resumed = await deps.sessions.resume(parentSessionId);
    assert.equal(resumed.ok, true);

    const forked = await deps.sessions.fork({ parentSessionId, reason: "golden fork" });
    assert.equal(forked.ok, true);
    assert.ok(forked.value?.childSessionId);
    const childSessionId = forked.value.childSessionId;
    const childEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden.child",
      input: { text: "child" },
      sessionId: childSessionId
    }));

    const parentTrace = await deps.regression.normalize({
      name: "session-resume-parent",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(parentSessionId),
      runtime: parentEvents,
      sessions: await deps.sessions.events(parentSessionId),
      assertions: [{ expectedKind: "capability.completed" }]
    });
    assert.equal((await deps.regression.replay(parentTrace)).ok, true);

    const childTrace = await deps.regression.normalize({
      name: "session-fork-child",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(childSessionId),
      runtime: childEvents,
      sessions: await deps.sessions.events(childSessionId),
      assertions: [{ expectedKind: "session.forked" }, { expectedKind: "capability.completed" }]
    });
    const replay = await deps.regression.replay(childTrace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal((await deps.sessions.resume(childSessionId)).value?.lineage.parentSessionId, parentSessionId);
    await kernel.shutdown();
  });
});
