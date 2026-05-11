import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { HookHandler, HookManifest, JsonObject, RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

function baseManifest(overrides: Partial<HookManifest>): HookManifest {
  return {
    schemaVersion: "1.0.0",
    id: asId<"hook">("hook-test"),
    name: "test hook",
    version: "0.0.1",
    point: "tool-execution.before",
    source: "built-in",
    trust: "trusted",
    ordering: { priority: 100 },
    timeoutMs: 5000,
    failurePolicy: "continue",
    isolation: "in-process-observe-only",
    permissions: [],
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    ...overrides
  } as HookManifest;
}

class SingleToolThenFinishModelGateway {
  constructor(private readonly toolName: string, private readonly input: JsonObject) {}
  async *stream(request: { messages?: readonly { role: string }[] }): AsyncIterable<JsonObject> {
    if (request.messages?.some((message) => message.role === "tool")) {
      yield { kind: "delta", text: "done" };
      yield { kind: "finish", reason: "stop" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "tool-call", id: "call-hook-test", name: this.toolName, input: this.input };
    yield { kind: "finish", reason: "tool-call" };
    yield { kind: "done" };
  }
  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

describe("hook wiring", () => {
  it("fires user-input.before + model-call.before/after during a simple turn", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const invoked: string[] = [];
    const observer: HookHandler = async (input, context) => {
      invoked.push(context.manifest.point);
      return { ok: true, value: [] };
    };
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-user"), point: "user-input.before" }), observer);
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-model-before"), point: "model-call.before" }), observer);
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-model-after"), point: "model-call.after" }), observer);

    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "hook observe",
      caller: "hook.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    assert.ok(invoked.includes("user-input.before"));
    assert.ok(invoked.includes("model-call.before"));
    assert.ok(invoked.includes("model-call.after"));
    const hookEvents = events.filter((event) => event.kind === "hooks.invoked");
    assert.equal(hookEvents.length, 3);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("blocks the tool call when a tool-execution.before hook returns block policy", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const blocker: HookHandler = async () => ({
      ok: false,
      error: { code: "HOOK_BLOCKED_BY_POLICY", message: "denied by policy", retryable: false, redaction: { class: "internal" } }
    });
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-deny-tool"), point: "tool-execution.before", failurePolicy: "block" }), blocker);

    await deps.platform.writeFile("/workspace/README.md", "hook denial content\n");
    const loopDeps = { ...deps, models: new SingleToolThenFinishModelGateway("core.file.read", { path: "README.md" }) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "denied tool",
      caller: "hook.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 2 }
    }));

    const resultEvent = events.find((event) => event.kind === "model.tool.result");
    assert.ok(resultEvent);
    const feedback = resultEvent!.data.feedback as { status?: string } | undefined;
    assert.equal(feedback?.status, "denied");
    assert.equal(events.some((event) => event.kind === "capability.completed"), false, "kernel execution must not run");
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("aborts the turn when user-input.before hook blocks", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const denier: HookHandler = async () => ({
      ok: false,
      error: { code: "HOOK_BLOCKED_BY_POLICY", message: "sensitive prompt", retryable: false, redaction: { class: "internal" } }
    });
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-deny-input"), point: "user-input.before", failurePolicy: "block" }), denier);

    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "blocked",
      caller: "hook.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const terminal = events.at(-1);
    assert.equal(terminal?.kind, "agent.loop.failed");
    assert.equal((terminal?.data as { reason?: string } | undefined)?.reason, "blocked-by-hook");
    assert.equal(events.some((event) => event.kind === "model.requested"), false, "model dispatch must not happen");
    await kernel.shutdown();
  });

  it("emits model.blocked when model-call.before hook blocks", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const denier: HookHandler = async () => ({
      ok: false,
      error: { code: "HOOK_BLOCKED_BY_POLICY", message: "rate-limited", retryable: false, redaction: { class: "internal" } }
    });
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-deny-model"), point: "model-call.before", failurePolicy: "block" }), denier);

    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "blocked at model",
      caller: "hook.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    assert.equal(events.some((event) => event.kind === "model.blocked"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.failed");
    assert.equal(events.some((event) => event.kind === "model.requested"), false);
    await kernel.shutdown();
  });

  it("continue-policy hook failures do not crash the turn", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const flaky: HookHandler = async () => ({
      ok: false,
      error: { code: "SOMETHING_BROKE", message: "oops", retryable: false, redaction: { class: "internal" } }
    });
    await deps.hooks.registerHook(baseManifest({ id: asId<"hook">("hook-flaky"), point: "model-call.before", failurePolicy: "continue" }), flaky);

    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "continue on hook failure",
      caller: "hook.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });
});
