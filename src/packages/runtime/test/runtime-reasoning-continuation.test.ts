import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  JsonObject,
  ModelChatMessage,
  ModelGateway,
  ModelRequest,
  ModelStreamEvent,
  RuntimeEvent
} from "@deepseek/platform-contracts";
import {
  collectRuntimeEvents,
  createDefaultRuntimeKernel,
  registerRuntimeCoreTools,
  runAgentLoop
} from "../src/index.js";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

class ReasoningThenToolModelGateway implements ModelGateway {
  readonly capturedRequests: ModelRequest[] = [];
  private turn = 0;

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    this.capturedRequests.push(request);
    this.turn += 1;
    if (this.turn === 1) {
      yield { kind: "reasoning", text: "Plan first ", redaction: { class: "internal" } };
      yield { kind: "reasoning", text: "step.", redaction: { class: "internal" } };
      yield { kind: "tool-call", id: "call-reason", name: "core.file.read", input: { path: "README.md" } };
      yield { kind: "finish", reason: "tool-call" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "delta", text: "summary" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

class ReasoningThenMultipleToolsModelGateway implements ModelGateway {
  readonly capturedRequests: ModelRequest[] = [];
  private turn = 0;

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    this.capturedRequests.push(request);
    this.turn += 1;
    if (this.turn === 1) {
      yield { kind: "reasoning", text: "Inspect all files first.", redaction: { class: "internal" } };
      yield { kind: "tool-call", id: "call-readme", name: "core.file.read", input: { path: "README.md" } };
      yield { kind: "tool-call", id: "call-package", name: "core.file.read", input: { path: "package.json" } };
      yield { kind: "finish", reason: "tool-call" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "delta", text: "summary" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

describe("agent loop preserves thinking-mode reasoning into continuation history", () => {
  it("attaches reasoningContent to the assistant tool-call message and emits model.reasoning.persisted", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/README.md", "reasoning continuation fixture\n");
    const recording = new ReasoningThenToolModelGateway();
    const loopDeps = { ...deps, models: recording };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);

    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "thinking continuation",
      caller: "runtime.reasoning.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const persisted = events.filter((event) => event.kind === "model.reasoning.persisted");
    assert.equal(persisted.length, 1, JSON.stringify(persisted));
    const record = persisted[0]!.data as JsonObject;
    assert.equal(record.iteration, 1);
    assert.equal(record.byteLength, "Plan first step.".length);
    assert.equal((record.redaction as JsonObject).class, "internal");
    assert.equal("text" in record, false, "persisted event must not leak reasoning text");

    const continuationRequest = recording.capturedRequests[1];
    assert.ok(continuationRequest, "provider should be called a second time after the tool result");
    const assistantMessage = continuationRequest.messages?.find((message) => message.role === "assistant") as ModelChatMessage | undefined;
    assert.ok(assistantMessage, "continuation must contain an assistant message with the tool call record");
    assert.equal(assistantMessage.reasoningContent, "Plan first step.");
    assert.equal(assistantMessage.reasoningRedaction?.class, "internal");
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("attaches the same reasoningContent to each tool-call message from one thinking-mode response", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/README.md", "readme fixture\n");
    await deps.platform.writeFile("/workspace/package.json", "{\"name\":\"fixture\"}\n");
    const recording = new ReasoningThenMultipleToolsModelGateway();
    const loopDeps = { ...deps, models: recording };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);

    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "thinking continuation with multiple tools",
      caller: "runtime.reasoning.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const persisted = events.filter((event) => event.kind === "model.reasoning.persisted");
    assert.equal(persisted.length, 1, JSON.stringify(persisted));
    const continuationRequest = recording.capturedRequests[1];
    assert.ok(continuationRequest, "provider should be called a second time after the tool results");
    const assistantMessages = continuationRequest.messages?.filter((message) => message.role === "assistant") as ModelChatMessage[] | undefined;
    assert.equal(assistantMessages?.length, 2);
    assert.deepEqual(assistantMessages?.map((message) => message.reasoningContent), [
      "Inspect all files first.",
      "Inspect all files first."
    ]);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("emits no model.reasoning.persisted when the turn has no reasoning chunks", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "plain turn",
      caller: "runtime.reasoning.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const persisted = events.some((event: RuntimeEvent) => event.kind === "model.reasoning.persisted");
    assert.equal(persisted, false);
    await kernel.shutdown();
  });
});
