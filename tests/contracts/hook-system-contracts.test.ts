import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createHookOutput, InMemoryHookSystem } from "@deepseek/hook-system";

describe("hook system contracts", () => {
  it("emits serializable v1 DTOs for summaries, order projection, and invocation", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      {
        id: asId<"hook">("hook-contract"),
        name: "contract",
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
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-contract"), "observation", { checked: true }) })
    );

    const summaries = await hooks.listHooks();
    const order = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before" });
    const invocation = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });

    assert.equal(summaries[0]?.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(order.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(invocation.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(invocation.executions[0]?.outputs[0]?.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(JSON.stringify({ summaries, order, invocation }).includes("undefined"), false);
  });

  it("does not expose legacy generic hook APIs", () => {
    const hooks = new InMemoryHookSystem() as unknown as Record<string, unknown>;
    assert.equal(hooks.register, undefined);
    assert.equal(hooks.run, undefined);
  });
});
