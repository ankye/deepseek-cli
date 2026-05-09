import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

describe("secret sandbox audit golden replay", () => {
  it("replays allow, deny, rewrite, and degraded platform audit evidence deterministically", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerDeterministicCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);

    const allow = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden",
      input: { text: "safe" }
    }));
    const rewrite = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden",
      input: { text: "Bearer abcdefghijklmnop" }
    }));
    const deny = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileWrite,
      caller: "golden",
      input: { path: "README.md", content: "deny", workspaceRoot: "/workspace" }
    }));
    const requireSandbox = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "golden",
      input: { text: "sandbox", requireSandbox: true }
    }));

    const golden = {
      allow: policySummary(allow),
      rewrite: policySummary(rewrite),
      deny: policySummary(deny),
      requireSandbox: policySummary(requireSandbox)
    };
    const serialized = JSON.stringify(golden);

    assert.deepEqual(golden.allow.actions, ["allow"]);
    assert.deepEqual(golden.rewrite.actions, ["rewrite"]);
    assert.deepEqual(golden.deny.actions, ["deny"]);
    assert.deepEqual(golden.requireSandbox.actions, ["require-sandbox"]);
    assert.equal(serialized.includes("Bearer abcdefghijklmnop"), false);
    await kernel.shutdown();
  });
});

function policySummary(events: Awaited<ReturnType<typeof collectRuntimeEvents>>) {
  return {
    kinds: events.map((event) => event.kind),
    actions: events.filter((event) => event.kind === "policy.decided").map((event) => String(event.data.action)),
    sandboxProfiles: events.filter((event) => event.kind === "sandbox.selected").map((event) => String(event.data.profile))
  };
}
