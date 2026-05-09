import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createProjectionRequest } from "@deepseek/context-engine";
import { createHookOutput } from "@deepseek/hook-system";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("hook system integration", () => {
  it("records observe-only hook evidence without mutating owner subsystems", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.hooks.registerHook(
      {
        id: asId<"hook">("hook-observe-context"),
        name: "observe-context",
        version: "1.0.0",
        point: "user-input.before",
        source: "built-in",
        trust: "trusted",
        ordering: { priority: 1 },
        timeoutMs: 100,
        failurePolicy: "continue",
        isolation: "in-process-observe-only",
        permissions: [],
        inputSchema: {},
        outputSchema: {}
      },
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-observe-context"), "context", { suggestion: "include tests" }) })
    );

    const beforeNodes = await deps.context.projectGraph({
      ...createProjectionRequest({
        sessionId: asId<"session">("session-hook-context"),
        prompt: "hook integration",
        hardLimitTokens: 64
      }),
      candidateNodes: [],
      includeSources: ["hook-system"]
    });
    const invocation = await deps.hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: { prompt: "review" } });

    assert.equal(invocation.status, "completed");
    assert.equal(invocation.executions[0]?.outputs[0]?.kind, "context");
    assert.equal(JSON.stringify(beforeNodes.selectedNodes).includes("include tests"), false);
  });
});
