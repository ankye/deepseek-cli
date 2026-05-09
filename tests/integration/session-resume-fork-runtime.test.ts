import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("session resume and fork runtime integration", () => {
  it("appends resumed turns to the selected session id", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const sessionId = await deps.sessions.create({ label: "resume-target" });
    const resumed = await deps.sessions.resume(sessionId);
    assert.equal(resumed.ok, true);

    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "integration.resume",
      input: { text: "resumed turn" },
      sessionId
    }));

    assert.equal(events.every((event) => event.sessionId === sessionId), true);
    assert.equal((await deps.sessions.events(sessionId)).some((event) => event.kind === "capability.completed"), true);
    await kernel.shutdown();
  });

  it("executes forked child sessions through the governed kernel path", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const parentSessionId = await deps.sessions.create({ label: "parent" });
    await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "integration.parent",
      input: { text: "parent turn" },
      sessionId: parentSessionId
    }));

    const forked = await deps.sessions.fork({ parentSessionId, reason: "alternate implementation" });
    assert.equal(forked.ok, true, forked.error?.message);
    assert.ok(forked.value?.childSessionId);
    const childSessionId = forked.value.childSessionId;
    const childEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "integration.child",
      input: { text: "child turn" },
      sessionId: childSessionId
    }));

    assert.equal(childEvents.every((event) => event.sessionId === childSessionId), true);
    assert.equal(childEvents.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(childEvents.some((event) => event.kind === "policy.decided"), true);
    assert.equal(childEvents.some((event) => event.kind === "scheduler.completed"), true);
    const childResume = await deps.sessions.resume(childSessionId);
    assert.equal(childResume.value?.lineage.parentSessionId, parentSessionId);
    await kernel.shutdown();
  });
});
