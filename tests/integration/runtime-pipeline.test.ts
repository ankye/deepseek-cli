import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createDefaultRuntimeKernel, createHeadlessRuntime, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { asId } from "@deepseek/platform-contracts";

describe("runtime integration pipeline", () => {
  it("records bus, session, and observability state for a kernel-backed turn", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "integration smoke" }));
    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);
    assert.ok(deps.bus.getReplayRecords(sessionId).length >= 4);
    assert.ok((await deps.sessions.events(sessionId)).length >= 4);
    assert.equal((await deps.usage.total(sessionId)).outputTokens, 0);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.ok((await deps.observability.drain()).length >= 4);
    await runtime.dispose();
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
    assert.equal(events.some((event) => event.kind === "scheduler.queued"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.started"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal(deps.bus.getReplayRecords(sessionId).some((record) => record.payload.kind === "capability.completed"), true);
    assert.equal((await deps.sessions.events(sessionId)).some((event) => event.kind === "workflow.closed"), true);
    await kernel.shutdown();
  });

  it("streams scheduler timeout events through kernel.execute and closes workflow once", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.capabilities.register(
      {
        ...runtimeEchoCapability,
        id: asId<"capability">("runtime.slow")
      },
      async (_input, context) => {
        await new Promise<void>((resolve) => {
          context.signal.addEventListener("abort", () => resolve(), { once: true });
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { ok: true, value: { late: true } };
      }
    );
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: asId<"capability">("runtime.slow"),
      caller: "integration",
      input: {},
      timeoutMs: 1
    }));

    assert.deepEqual(
      events.filter((event) => event.kind.startsWith("scheduler.")).map((event) => event.kind),
      ["scheduler.queued", "scheduler.started", "scheduler.timed-out"]
    );
    assert.equal(events.some((event) => event.kind === "capability.cancelled" && event.error?.code === "KERNEL_SCHEDULER_TIMEOUT"), true);
    assert.equal(events.filter((event) => event.kind === "workflow.closed").length, 1);
    assert.equal((events.find((event) => event.kind === "workflow.closed")?.data.status), "timed-out");
    await kernel.shutdown();
  });
});
