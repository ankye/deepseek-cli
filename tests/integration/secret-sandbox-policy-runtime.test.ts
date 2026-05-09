import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

const workspaceRoot = "/workspace";

describe("secret sandbox policy runtime integration", () => {
  it("rewrites raw secret input before scheduler execution", async () => {
    const deps = createDeterministicRuntimeDependencies();
    let schedulerCalls = 0;
    deps.concurrency.run = async () => {
      schedulerCalls += 1;
      throw new Error("should not execute secret input");
    };
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "integration",
      input: { text: "sk-live-1234567890" }
    }));
    const serialized = JSON.stringify(events);

    assert.equal(schedulerCalls, 0);
    assert.equal(events.some((event) => event.kind === "execution.rejected" && event.error?.code === "KERNEL_POLICY_DENIED"), true);
    assert.equal(events.some((event) => event.kind === "policy.decided" && event.data.action === "rewrite"), true);
    assert.equal(serialized.includes("sk-live-1234567890"), false);
  });

  it("denies read-only filesystem writes before scheduler execution", async () => {
    const deps = {
      ...createDeterministicRuntimeDependencies(),
      platform: new FakePlatformRuntime("linux", workspaceRoot, { readOnlyFilesystem: true })
    };
    let schedulerCalls = 0;
    deps.concurrency.run = async () => {
      schedulerCalls += 1;
      throw new Error("should not execute read-only write");
    };
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileWrite,
      caller: "integration",
      input: { path: "README.md", content: "blocked", workspaceRoot }
    }));

    assert.equal(schedulerCalls, 0);
    assert.equal(events.some((event) => event.kind === "policy.decided" && String(JSON.stringify(event.data)).includes("filesystem.read-only")), true);
    assert.equal(events.some((event) => event.kind === "scheduler.queued"), false);
  });

  it("passes process test metadata through policy, scheduler, sandbox, bus, and session events", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.testRun,
      caller: "integration",
      input: { command: "npm", args: ["test"], workspaceRoot, intent: "secret-sandbox" }
    }));
    const sessionId = events[0]?.sessionId;

    assert.ok(sessionId);
    assert.equal(events.some((event) => event.kind === "policy.decided"), true);
    assert.equal(events.some((event) => event.kind === "sandbox.selected"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal((await deps.sessions.events(sessionId)).some((event) => event.kind === "policy.decided"), true);
    assert.equal(deps.bus.getReplayRecords(sessionId).some((record) => record.payload.kind === "policy.decided"), true);
  });
});
