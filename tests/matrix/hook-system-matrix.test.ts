import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createHookOutput, InMemoryHookSystem } from "@deepseek/hook-system";

describe("hook system matrix", () => {
  it("covers trust, disabled, malformed, ordering, timeout, and failure policies", async () => {
    const hooks = new InMemoryHookSystem();
    const cases = [
      { id: "hook-continue", name: "continue", priority: 2, failurePolicy: "continue", status: "completed" },
      { id: "hook-block", name: "block", priority: 3, failurePolicy: "block", status: "blocked" },
      { id: "hook-disable", name: "disable", priority: 4, failurePolicy: "disable", status: "failed" },
      { id: "hook-rollback", name: "rollback", priority: 5, failurePolicy: "rollback-requested", status: "rollback-requested" }
    ] as const;

    await hooks.registerHook(manifest("hook-alpha", "alpha", 1), async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-alpha"), "observation", { ok: true }) }));
    await hooks.registerHook(manifest("hook-untrusted", "untrusted", 6, { trust: "untrusted", source: "workspace" }));
    await hooks.registerHook(manifest("hook-disabled", "disabled", 7, { enabled: false }));

    const malformed = await hooks.validateManifest({ name: "bad" } as never);
    assert.equal(malformed.ok, false);

    const order = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", includeInert: true });
    assert.equal(order.ordered[0]?.name, "alpha");
    assert.equal(order.ordered.some((hook) => hook.name === "untrusted"), true);
    assert.equal(order.ordered.some((hook) => hook.name === "disabled"), true);

    for (const item of cases) {
      const scoped = new InMemoryHookSystem();
      await scoped.registerHook(
        manifest(item.id, item.name, item.priority, { failurePolicy: item.failurePolicy }),
        async () => ({ ok: false, error: { code: `HOOK_${item.name.toUpperCase()}`, message: item.name, retryable: false, redaction: { class: "public" } } })
      );
      const result = await scoped.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });
      assert.equal(result.status, item.status, item.name);
    }

    const timeout = new InMemoryHookSystem();
    await timeout.registerHook(
      manifest("hook-timeout-matrix", "timeout", 1, { timeoutMs: 1, failurePolicy: "block" }),
      async () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, value: createHookOutput(asId<"hook">("hook-timeout-matrix"), "observation", {}) }), 20))
    );
    assert.equal((await timeout.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} })).status, "blocked");
  });
});

function manifest(id: string, name: string, priority: number, overrides: Partial<Parameters<InMemoryHookSystem["registerHook"]>[0]> = {}): Parameters<InMemoryHookSystem["registerHook"]>[0] {
  return {
    id: asId<"hook">(id),
    name,
    version: "1.0.0",
    point: "user-input.before",
    source: "built-in",
    trust: "trusted",
    ordering: { priority },
    timeoutMs: 100,
    failurePolicy: "continue",
    isolation: "in-process-observe-only",
    permissions: [],
    inputSchema: {},
    outputSchema: {},
    ...overrides
  };
}
