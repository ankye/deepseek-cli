import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";
import { DefaultPolicyEngine } from "@deepseek/policy-sandbox";
import type { PolicyRequest } from "@deepseek/platform-contracts";

describe("checkpoint undo runtime integration", () => {
  it("records checkpoint evidence for governed edits and supports undo through workspace state", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const policy = new DefaultPolicyEngine();
    deps.policy.decide = async (request: PolicyRequest) => {
      if (request.resource === String(coreToolIds.fileEdit)) {
        return { action: "allow", reason: "checkpoint integration allows exact edit", audit: { policy: "integration" }, sandboxProfile: "development" };
      }
      return policy.decide(request);
    };
    const workspaceRoot = "/workspace";
    await deps.platform.writeFile(`${workspaceRoot}/README.md`, "hello checkpoint\n");
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);

    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileEdit,
      caller: "integration",
      input: { path: "README.md", expected: "checkpoint", replacement: "undo", workspaceRoot }
    }));
    const output = events.find((event) => event.kind === "capability.output")?.data.output as { evidence?: { metadata?: { checkpoint?: { checkpointId?: string } } } } | undefined;

    assert.equal(typeof output?.evidence?.metadata?.checkpoint?.checkpointId, "string");
    assert.equal(await deps.platform.readFile(`${workspaceRoot}/README.md`), "hello undo\n");
    assert.ok(deps.workspaceState instanceof InMemoryWorkspaceStateManager);
    const undo = await deps.workspaceState.undoLatest({ path: `${workspaceRoot}/README.md` });
    assert.equal(undo.ok, true);
    assert.equal(await deps.platform.readFile(`${workspaceRoot}/README.md`), "hello checkpoint\n");
    await kernel.shutdown();
  });
});
