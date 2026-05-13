import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

const workspaceRoot = "/workspace";

describe("edit invalidation flushes code-intelligence index", () => {
  it("write → diagnostics(v1); edit → diagnostics(v2) reflects the new content", async () => {
    const deps = createDeterministicRuntimeDependencies();
    deps.policy.decide = async (request) => {
      if (request.resource === String(coreToolIds.fileWrite) || request.resource === String(coreToolIds.fileEdit)) {
        return {
          action: "allow",
          reason: "integration allows write/edit",
          audit: { policy: "integration" },
          sandboxProfile: "development"
        };
      }
      return { action: "deny", reason: "not allowed in this test", audit: { policy: "integration" }, sandboxProfile: "none" };
    };
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);

    const writeEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileWrite,
      caller: "integration",
      input: { path: "invalidate.ts", content: "// TODO initial\nexport const v = 1;\n", workspaceRoot }
    }));
    assert.equal(writeEvents.some((event) => event.kind === "capability.completed"), true);

    const firstDiagnostics = await deps.codeIntelligence.diagnostics(workspaceRoot);
    const firstForFile = firstDiagnostics.filter((diagnostic) => diagnostic.path === `${workspaceRoot}/invalidate.ts`);
    assert.equal(firstForFile.some((diagnostic) => diagnostic.code === "CODE_TODO"), true);
    assert.equal(firstForFile.some((diagnostic) => diagnostic.code === "CODE_FIXME"), false);

    const editEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileEdit,
      caller: "integration",
      input: { path: "invalidate.ts", expected: "// TODO initial", replacement: "// FIXME replaced", workspaceRoot }
    }));
    assert.equal(editEvents.some((event) => event.kind === "capability.completed"), true);

    const secondDiagnostics = await deps.codeIntelligence.diagnostics(workspaceRoot);
    const secondForFile = secondDiagnostics.filter((diagnostic) => diagnostic.path === `${workspaceRoot}/invalidate.ts`);
    assert.equal(secondForFile.some((diagnostic) => diagnostic.code === "CODE_FIXME"), true);
    assert.equal(secondForFile.some((diagnostic) => diagnostic.code === "CODE_TODO"), false);

    await kernel.shutdown();
  });
});
