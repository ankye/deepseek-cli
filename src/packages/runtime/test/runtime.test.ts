import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JsonObject, ModelGateway, ModelRequest, ModelStreamEvent, PolicyDecision, PolicyEngine, PolicyRequest } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, createHeadlessRuntime, registerRuntimeCoreTools, runAgentLoop, runtimeEchoCapability } from "../src/index.js";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

describe("headless runtime", () => {
  it("delegates turns to the runtime kernel without direct model execution", async () => {
    const deps = createDeterministicRuntimeDependencies();
    let modelStreamCalled = false;
    deps.models.stream = () => {
      modelStreamCalled = true;
      throw new Error("model stream must not be called by headless runtime");
    };
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "hello" }));
    assert.equal(modelStreamCalled, false);
    assert.equal(events.some((event) => event.kind === "kernel.request.accepted"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "model.delta"), false);
    assert.ok(events.every((event) => event.sessionId));
    await runtime.dispose();
  });

  it("executes deterministic built-in capabilities through the runtime kernel", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "test",
      input: { text: "kernel" },
      timeoutMs: 30_000
    }));

    assert.deepEqual(
      events.map((event) => event.kind),
      [
        "kernel.request.accepted",
        "workflow.opened",
        "execution.envelope.created",
        "policy.decided",
        "sandbox.selected",
        "capability.started",
        "scheduler.queued",
        "scheduler.started",
        "scheduler.completed",
        "capability.output",
        "capability.completed",
        "workflow.closed"
      ]
    );
    assert.equal(events.some((event) => event.kind === "capability.output" && (event.data.output as { text?: string }).text === "kernel"), true);
    assert.equal(deps.concurrency.events().some((event) => event.status === "queued"), true);
    assert.equal(deps.bus.getReplayRecords(events[0]?.sessionId).length >= events.length, true);
    await kernel.shutdown();
  });

  it("runs the first usable agent loop without tool calls", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "hello agent loop",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    assert.deepEqual(events.map((event) => event.kind), [
      "agent.loop.started",
      "turn.started",
      "context.projection.started",
      "context.projection.completed",
      "model.requested",
      "model.delta",
      "usage.updated",
      "model.finished",
      "model.done",
      "turn.completed",
      "agent.loop.completed"
    ]);
    assert.equal(events.at(-1)?.data.status, "completed");
    await kernel.shutdown();
  });

  it("rejects malformed model tool calls through preflight", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new SingleToolCallModelGateway("core.file.read", { path: "../outside.txt" }) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "read unsafe",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 1 }
    }));

    assert.equal(events.some((event) => event.kind === "model.tool.intent"), true);
    assert.equal(events.some((event) => event.kind === "model.tool.rejected" && event.error?.details?.code === "TOOL_INTENT_PARENT_TRAVERSAL_REJECTED"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.failed");
    assert.equal(events.at(-1)?.data.status, "rejected");
    await kernel.shutdown();
  });

  it("fails the agent loop on provider errors", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new ErrorModelGateway() };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "provider failure",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    assert.equal(events.some((event) => event.kind === "runtime.error" && event.error?.code === "MODEL_FAILED"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.failed");
    assert.equal(events.at(-1)?.data.status, "failed");
    await kernel.shutdown();
  });

  it("sends denied tool feedback back to the model when policy denies execution", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new SingleToolCallModelGateway("core.file.read", { path: "README.md" }), policy: new DenyAllPolicyEngine() };
    await loopDeps.platform.writeFile("/workspace/README.md", "policy denied\n");
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "read with deny",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    assert.equal(events.some((event) => event.kind === "execution.rejected" && event.error?.code === "KERNEL_POLICY_DENIED"), true);
    assert.equal(events.some((event) => event.kind === "model.tool.result" && event.error?.code === "KERNEL_POLICY_DENIED"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    assert.equal(events.at(-1)?.data.status, "completed");
    await kernel.shutdown();
  });

  it("emits agent.loop.cancelled when the signal is already aborted", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const controller = new AbortController();
    controller.abort();
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "cancel me",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }, { signal: controller.signal }));

    assert.deepEqual(events.map((event) => event.kind), ["agent.loop.started", "agent.loop.cancelled"]);
    const cancelled = events.at(-1);
    assert.equal(cancelled?.data.status, "cancelled");
    assert.equal(cancelled?.data.reason, "user-cancelled");
    assert.equal(cancelled?.data.iterations, 0);
    await kernel.shutdown();
  });

  it("cancels mid-stream between model events when the signal aborts", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const controller = new AbortController();
    const loopDeps = { ...deps, models: new AbortAfterDeltaModelGateway(controller) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "mid cancel",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }, { signal: controller.signal }));

    const kinds = events.map((event) => event.kind);
    assert.equal(kinds.includes("model.delta"), true, `expected at least one delta, got ${JSON.stringify(kinds)}`);
    assert.equal(kinds.at(-1), "agent.loop.cancelled");
    assert.equal(kinds.includes("agent.loop.completed"), false);
    const cancelled = events.at(-1);
    assert.equal(cancelled?.data.reason, "user-cancelled");
    assert.equal(typeof cancelled?.data.assistantText, "string");
    await kernel.shutdown();
  });
});

class SingleToolCallModelGateway implements ModelGateway {
  constructor(private readonly name: string, private readonly input: JsonObject) {}

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (request.messages?.some((message) => message.role === "tool")) {
      yield { kind: "delta", text: "tool response handled" };
      yield { kind: "finish", reason: "stop" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "tool-call", id: "call-runtime", name: this.name, input: this.input };
    yield { kind: "finish", reason: "tool-call" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

class ErrorModelGateway implements ModelGateway {
  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield {
      kind: "error",
      error: {
        code: "MODEL_FAILED",
        message: "model failed",
        retryable: false,
        redaction: { class: "public" }
      }
    };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

class DenyAllPolicyEngine implements PolicyEngine {
  async decide(_request: PolicyRequest): Promise<PolicyDecision> {
    return {
      action: "deny",
      reason: "Denied by runtime test policy",
      audit: { policy: "deny-all-test" }
    };
  }
}

class AbortAfterDeltaModelGateway implements ModelGateway {
  constructor(private readonly controller: AbortController) {}

  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "delta", text: "partial " };
    this.controller.abort();
    yield { kind: "delta", text: "after-abort" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
