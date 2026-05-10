import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import type {
  JsonObject,
  ModelGateway,
  ModelRequest,
  ModelStreamEvent,
  ToolResultFeedback
} from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createLiveCliDependencies } from "@deepseek/testing-regression";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

class SingleToolCallModelGateway implements ModelGateway {
  constructor(private readonly name: string, private readonly input: JsonObject) {}

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (request.messages?.some((message) => message.role === "tool")) {
      yield { kind: "delta", text: "real file read resolved" };
      yield { kind: "finish", reason: "stop" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "tool-call", id: "call-live-factory", name: this.name, input: this.input };
    yield { kind: "finish", reason: "tool-call" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

describe("live CLI dependency factory resolves against real filesystem", () => {
  it("core.file.read resolves a fixture file through the real NodePlatformRuntime", async () => {
    const workspaceRoot = resolve(process.cwd(), "tests/fixtures/fake-workspace");
    const liveDeps = createLiveCliDependencies({ workspaceRoot });
    const deps = { ...liveDeps, models: new SingleToolCallModelGateway("core.file.read", { path: "README.md" }) };
    await registerRuntimeCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);

    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "read fixture readme through live factory",
      caller: "integration.live-factory.test",
      workspaceRoot,
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const serialized = JSON.stringify(events);
    assert.equal(serialized.includes("Fake file not found"), false, "real platform runtime must not report fake-filesystem errors");

    const resultEvent = events.find((event) => event.kind === "model.tool.result");
    assert.ok(resultEvent, "model.tool.result event should exist");
    const feedback = (resultEvent!.data as { feedback?: ToolResultFeedback }).feedback;
    assert.ok(feedback);
    assert.equal(feedback.status, "success");
    assert.equal(feedback.preview.text.includes("Fake Workspace"), true, `expected fixture content in preview, got ${feedback.preview.text.slice(0, 80)}`);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("returns a dependency bundle whose platform is a real NodePlatformRuntime", () => {
    const deps = createLiveCliDependencies();
    assert.equal(deps.platform instanceof NodePlatformRuntime, true);
    assert.equal(typeof deps.workspaceState.snapshot, "function");
    assert.equal(typeof deps.codeIntelligence.diagnostics, "function");
  });

  it("leaves deterministic dependencies in place for non-platform concerns", () => {
    const deps = createLiveCliDependencies();
    assert.equal(typeof deps.bus.publish, "function");
    assert.equal(typeof deps.workflow.openInvocation, "function");
    assert.equal(typeof deps.concurrency.run, "function");
    assert.equal(typeof deps.sessions.create, "function");
    assert.equal(typeof deps.policy.decide, "function");
  });
});
