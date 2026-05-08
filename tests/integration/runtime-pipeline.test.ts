import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, createHeadlessRuntime, runtimeEchoCapability } from "@deepseek/runtime";
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

  it("connects registry, envelope, workflow, policy, scheduler, bus, and result metadata through the kernel", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "integration",
      input: { text: "kernel integration" },
      timeoutMs: 30_000
    }));

    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "workflow.opened"), true);
    assert.equal(events.some((event) => event.kind === "policy.decided"), true);
    assert.equal(events.some((event) => event.kind === "sandbox.selected"), true);
    assert.equal(deps.concurrency.events().some((event) => event.status === "completed"), true);
    assert.equal(deps.bus.getReplayRecords(sessionId).some((record) => record.payload.kind === "capability.completed"), true);
    assert.equal((await deps.sessions.events(sessionId)).some((event) => event.kind === "workflow.closed"), true);
    await kernel.shutdown();
  });
});
