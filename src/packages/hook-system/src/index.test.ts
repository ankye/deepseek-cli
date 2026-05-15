import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { createHookOutput, createHookSystemFamilyCapabilities, InMemoryHookSystem } from "./index.js";

const secret = "sk-hook-1234567890";

describe("hook system v1", () => {
  it("validates, registers, lists, orders, and invokes observe-only hooks", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      manifest("hook-late", "late", 20),
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-late"), "observation", { order: "late" }) })
    );
    await hooks.registerHook(
      manifest("hook-early", "early", 1),
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-early"), "observation", { order: "early" }) })
    );

    const order = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before" });
    const result = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: { prompt: "hi" } });

    assert.deepEqual(order.ordered.map((hook) => hook.name), ["early", "late"]);
    assert.deepEqual(result.orderedHookIds, [asId<"hook">("hook-early"), asId<"hook">("hook-late")]);
    assert.equal(result.status, "completed");
    assert.equal(result.executions[0]?.outputs[0]?.kind, "observation");
  });

  it("keeps untrusted and disabled hooks inert", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(manifest("hook-untrusted", "untrusted", 1, { trust: "untrusted", source: "workspace" }));
    await hooks.registerHook(manifest("hook-disabled", "disabled", 2, { enabled: false }));

    const projected = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", includeInert: true });
    const result = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });

    assert.equal(projected.ordered.length, 2);
    assert.equal(projected.ordered.every((hook) => hook.enabled === false || hook.trust === "untrusted"), true);
    assert.equal(result.status, "skipped");
    assert.equal(result.executions.length, 0);
  });

  it("rejects malformed manifests and unsupported schema versions", async () => {
    const hooks = new InMemoryHookSystem();
    const malformed = await hooks.validateManifest({ name: "missing" } as never);
    const unsupported = await hooks.validateManifest({
      ...manifest("hook-unsupported", "unsupported", 1),
      schemaVersion: "999.0.0"
    });

    assert.equal(malformed.ok, false);
    assert.equal(malformed.diagnostics.some((item) => item.code === "HOOK_ID_REQUIRED"), true);
    assert.equal(unsupported.ok, false);
    assert.equal(unsupported.diagnostics.some((item) => item.code === "HOOK_SCHEMA_VERSION_UNSUPPORTED"), true);
  });

  it("contains timeout and applies failure policies", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      manifest("hook-timeout", "timeout", 1, { timeoutMs: 1, failurePolicy: "block" }),
      async () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, value: createHookOutput(asId<"hook">("hook-timeout"), "observation", {}) }), 20))
    );
    await hooks.registerHook(
      manifest("hook-never", "never", 2),
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-never"), "observation", {}) })
    );

    const result = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });

    assert.equal(result.status, "blocked");
    assert.equal(result.executions.length, 1);
    assert.equal(result.executions[0]?.status, "timed-out");
    assert.equal(result.diagnostics.some((item) => item.code === "HOOK_TIMEOUT"), true);
  });

  it("redacts secret-like output payloads", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      manifest("hook-secret", "secret", 1),
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-secret"), "observation", { secret }) })
    );

    const result = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });
    const serialized = JSON.stringify(result);

    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("[REDACTED:secret]"), true);
  });

  it("exposes hook.list-run as governed list and run capability evidence", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      manifest("hook-family", "family", 1),
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-family"), "observation", { result: "ok" }) })
    );
    const capabilities = createHookSystemFamilyCapabilities(hooks);
    const registry = new InMemoryCapabilityRegistry();
    await registry.register(capabilities[0]!.manifest, capabilities[0]!.execute);

    const projected = await registry.listModelVisible({ allowedFamilyIds: ["hook.list-run"] });
    assert.equal(projected.length, 1);

    const listed = await capabilities[0]!.execute({ action: "list", point: "user-input.before" }, {} as never);
    assert.equal((listed.value?.hooks as readonly unknown[] | undefined)?.length, 1);

    const run = await capabilities[0]!.execute({ action: "run", point: "user-input.before", input: { prompt: "hi" } }, {} as never);
    assert.equal((run.value?.result as { status?: string } | undefined)?.status, "completed");
    assert.equal((run.value?.result as { executions?: readonly unknown[] } | undefined)?.executions?.length, 1);
  });
});

function manifest(
  id: string,
  name: string,
  priority: number,
  overrides: Partial<Parameters<InMemoryHookSystem["registerHook"]>[0]> = {}
): Parameters<InMemoryHookSystem["registerHook"]>[0] {
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
