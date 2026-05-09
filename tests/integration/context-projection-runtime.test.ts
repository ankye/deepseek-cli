import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHeadlessRuntime, executeProjectedRuntimeTurn, collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { InMemoryUsageBudgetManager } from "@deepseek/usage-budget-management";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("context projection runtime integration", () => {
  it("projects context before kernel-backed execution", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "projection integration" }));

    assert.deepEqual(events.slice(0, 2).map((event) => event.kind), ["context.projection.started", "context.projection.completed"]);
    assert.equal(events.some((event) => event.kind === "kernel.request.accepted"), true);
    assert.equal(events.findIndex((event) => event.kind === "context.projection.completed") < events.findIndex((event) => event.kind === "kernel.request.accepted"), true);
    const output = events.find((event) => event.kind === "capability.output")?.data.output as { text?: string } | undefined;
    assert.equal(output?.text, "projection integration");
    assert.equal(deps.bus.getReplayRecords(events[0]!.sessionId).some((record) => record.payload.kind === "context.projection.completed"), true);
    await runtime.dispose();
  });

  it("fails closed before kernel execution when projection exceeds hard budget", async () => {
    const deps = createDeterministicRuntimeDependencies();
    Object.assign(deps, { usage: new InMemoryUsageBudgetManager({ contextHardLimitTokens: 0, contextSoftLimitTokens: 0 }) });
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(executeProjectedRuntimeTurn(deps, kernel, {
      capabilityId: runtimeEchoCapability.id,
      caller: "projection-test",
      input: { prompt: "too large" },
      prompt: "too large"
    }));

    assert.deepEqual(events.map((event) => event.kind), ["context.projection.started", "context.projection.rejected"]);
    assert.equal(events.some((event) => event.kind === "kernel.request.accepted"), false);
    assert.equal(events.at(-1)?.error?.code, "CONTEXT_PROJECTION_BUDGET_EXCEEDED");
    await kernel.shutdown();
  });
});
