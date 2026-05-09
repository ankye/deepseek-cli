import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";
import { DefaultPolicyEngine } from "@deepseek/policy-sandbox";
import type { PolicyRequest } from "@deepseek/platform-contracts";

const workspaceRoot = "/workspace";

describe("core coding tools runtime integration", () => {
  it("executes the minimal read-edit-test loop through governed runtime events", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const policyRequests: PolicyRequest[] = [];
    const policy = new DefaultPolicyEngine();
    deps.policy.decide = async (request) => {
      policyRequests.push(request);
      if (request.resource === String(coreToolIds.fileEdit)) {
        return { action: "allow", reason: "integration allows exact edit", audit: { policy: "integration" }, sandboxProfile: "development" };
      }
      return policy.decide(request);
    };
    await deps.platform.writeFile(`${workspaceRoot}/README.md`, "hello core tools\n");
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);

    const read = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileRead,
      caller: "integration",
      input: { path: "README.md", workspaceRoot }
    }));
    const edit = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileEdit,
      caller: "integration",
      input: { path: "README.md", expected: "core", replacement: "governed", workspaceRoot }
    }));
    const test = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.testRun,
      caller: "integration",
      input: { command: "npm", args: ["test"], workspaceRoot, intent: "minimal-coding-turn" }
    }));

    assert.equal(read.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(edit.some((event) => event.kind === "policy.decided"), true);
    assert.equal(test.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal(read.some((event) => event.kind === "capability.completed"), true);
    assert.equal(edit.some((event) => event.kind === "capability.completed"), true);
    assert.equal(test.some((event) => event.kind === "capability.completed"), true);
    assert.equal(await deps.platform.readFile(`${workspaceRoot}/README.md`), "hello governed tools\n");

    const testOutput = test.find((event) => event.kind === "capability.output")?.data.output as { evidence?: { metadata?: { intent?: string } } } | undefined;
    assert.equal(testOutput?.evidence?.metadata?.intent, "minimal-coding-turn");
    const testPolicy = policyRequests.find((request) => request.resource === String(coreToolIds.testRun));
    assert.equal(testPolicy?.metadata.command, "npm");
    assert.deepEqual(testPolicy?.metadata.args, ["test"]);
    assert.equal(testPolicy?.metadata.cwd, workspaceRoot);
    assert.equal(testPolicy?.metadata.workspaceRoot, workspaceRoot);
    assert.deepEqual(testPolicy?.metadata.resourceLocks, [`process:${workspaceRoot}`]);
    await kernel.shutdown();
  });

  it("prevents denied write tools from reaching scheduler", async () => {
    const deps = createDeterministicRuntimeDependencies();
    let schedulerCalls = 0;
    const originalRun = deps.concurrency.run.bind(deps.concurrency);
    deps.concurrency.run = (task, fn) => {
      schedulerCalls += 1;
      return originalRun(task, fn);
    };
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileWrite,
      caller: "integration",
      input: { path: "README.md", content: "blocked", workspaceRoot }
    }));

    assert.equal(events.some((event) => event.kind === "execution.rejected" && event.error?.code === "KERNEL_POLICY_DENIED"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.queued"), false);
    assert.equal(schedulerCalls, 0);
    await kernel.shutdown();
  });
});
