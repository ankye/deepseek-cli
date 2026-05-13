import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AgentLoopReferenceContext, JsonObject, ModelGateway, ModelRequest, ModelStreamEvent, PolicyDecision, PolicyEngine, PolicyRequest } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, createHeadlessRuntime, registerRuntimeCoreTools, runAgentLoop, runtimeEchoCapability } from "../src/index.js";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE } from "@deepseek/memory-cache-management";
import { InMemoryUsageBudgetManager } from "@deepseek/usage-budget-management";
import { asId } from "@deepseek/platform-contracts";

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
      "hooks.invoked",
      "context.projection.started",
      "context.memory.collected",
      "context.projection.completed",
      "hooks.invoked",
      "prompt.assembled",
      "model.requested",
      "model.delta",
      "usage.updated",
      "model.finished",
      "model.done",
      "hooks.invoked",
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

  it("projects file references into a runtime-owned model context message", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await loopDeps.platform.writeFile("/workspace/docs/plan.md", "reference plan detail\n");
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "use projected context",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      referenceContext: fileReferenceContext("docs/plan.md")
    }));

    const completed = events.find((event) => event.kind === "context.projection.completed");
    assert.equal(completed?.data.selectedNodeCount, 2);
    assert.equal(events.find((event) => event.kind === "model.requested")?.data.contextProjection !== undefined, true);
    assert.equal(gateway.requests.length, 1);
    assert.equal(gateway.requests[0]?.messages?.[0]?.role, "system");
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("reference plan detail"), true);
    const userMessage = gateway.requests[0]?.messages?.find((message) => message.role === "user");
    assert.equal(userMessage?.content, "use projected context");
    assert.equal(gateway.requests[0]?.prompt.includes("user: use projected context"), true);
    await kernel.shutdown();
  });

  it("projects PageIndex turn references into bounded runtime-owned summary context", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "continue with recalled decision",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      referenceContext: pageIndexTurnReferenceContext()
    }));

    const completed = events.find((event) => event.kind === "context.projection.completed");
    const modelRequested = events.find((event) => event.kind === "model.requested");
    const projection = modelRequested?.data.contextProjection as { selectedNodeCount?: number; referenceEvidence?: { resolvedReferenceCount?: number; unresolvedReferences?: readonly unknown[] } } | undefined;
    assert.equal(completed?.data.selectedNodeCount, 2);
    assert.equal(projection?.referenceEvidence?.resolvedReferenceCount, 1);
    assert.equal(projection?.referenceEvidence?.unresolvedReferences?.length, 0);
    assert.equal(gateway.requests.length, 1);
    assert.equal(gateway.requests[0]?.messages?.[0]?.role, "system");
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("PageIndex recall page:1:test"), true);
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("User prompt preview: database auth decision"), true);
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("Assistant preview: use token exchange"), true);
    const userMessage = gateway.requests[0]?.messages?.find((message) => message.role === "user");
    assert.equal(userMessage?.content, "continue with recalled decision");
    await kernel.shutdown();
  });

  it("projects scoped memory entries into runtime-owned model context", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await loopDeps.memory.put({
      id: asId<"memory">("memory-runtime-decision"),
      scope: "session",
      content: "Use token exchange for database auth.",
      provenance: { source: "runtime.test" },
      redaction: { class: "internal", fields: ["content"] },
      confidence: 0.9
    });
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "continue implementation",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const memoryEvent = events.find((event) => event.kind === "context.memory.collected");
    assert.equal((memoryEvent?.data as { candidateCount?: number }).candidateCount, 1);
    assert.equal(events.find((event) => event.kind === "model.requested")?.data.contextProjection !== undefined, true);
    assert.equal(gateway.requests[0]?.messages?.[0]?.role, "system");
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("Use token exchange for database auth."), true);
    await kernel.shutdown();
  });

  it("emits compact boundary evidence when projection crosses soft budget pressure", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = {
      ...deps,
      models: gateway,
      usage: new InMemoryUsageBudgetManager({ contextHardLimitTokens: 200, contextSoftLimitTokens: 8 })
    };
    await loopDeps.memory.put({
      id: asId<"memory">("memory-compact-pressure"),
      scope: "session",
      content: "memory pressure one two three four five six",
      provenance: { source: "runtime.test" },
      redaction: { class: "internal", fields: ["content"] }
    });
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "compact pressure prompt",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const compact = events.find((event) => event.kind === "context.compact.boundary");
    assert.ok(compact);
    assert.equal(typeof compact.data.fingerprint, "string");
    assert.equal(compact.data.pressure, "soft");
    assert.equal(events.findIndex((event) => event.kind === "context.compact.boundary") < events.findIndex((event) => event.kind === "model.requested"), true);
    await kernel.shutdown();
  });

  it("records bounded tool-result evidence and caches it without raw preview text", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/README.md", "tool evidence content\n");
    const loopDeps = { ...deps, models: new SingleToolCallModelGateway("core.file.read", { path: "README.md" }) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "read evidence",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const result = events.find((event) => event.kind === "model.tool.result");
    const evidence = result?.data.evidence as { replayHash?: string; previewHash?: string } | undefined;
    assert.ok(evidence?.replayHash);
    assert.equal(JSON.stringify(evidence).includes("tool evidence content"), false);
    const cached = await loopDeps.cache.get(`${TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE}:${evidence.replayHash}` as import("@deepseek/platform-contracts").CacheKey);
    assert.ok(cached);
    assert.equal(JSON.stringify(cached.value).includes("tool evidence content"), false);
    await kernel.shutdown();
  });

  it("keeps non-PageIndex turn references unresolved evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "continue without page metadata",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      referenceContext: plainTurnReferenceContext()
    }));

    const projectionEvent = events.find((event) => event.kind === "model.requested")?.data.contextProjection as { referenceEvidence?: { resolvedReferenceCount?: number; unresolvedReferences?: readonly { reason?: string; targetKind?: string }[] } } | undefined;
    assert.equal(projectionEvent?.referenceEvidence?.resolvedReferenceCount, 0);
    assert.equal(projectionEvent?.referenceEvidence?.unresolvedReferences?.[0]?.reason, "pageindex-metadata-incomplete");
    assert.equal(projectionEvent?.referenceEvidence?.unresolvedReferences?.[0]?.targetKind, "turn");
    assert.equal(gateway.requests[0]?.messages?.some((message) => message.role === "system" && message.content.includes("Projected runtime context:")), false);
    await kernel.shutdown();
  });

  it("excludes secret-like referenced file content before model dispatch", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await loopDeps.platform.writeFile("/workspace/.env", "DEEPSEEK_API_KEY=sk-live-secret-value\n");
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "check referenced env",
      caller: "runtime.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      referenceContext: fileReferenceContext(".env")
    }));

    assert.equal(events.some((event) => event.kind === "context.projection.degraded"), true);
    assert.equal(events.some((event) => event.kind === "context.compact.boundary"), false);
    assert.equal(JSON.stringify(events).includes("sk-live-secret-value"), false);
    assert.equal(JSON.stringify(gateway.requests).includes("sk-live-secret-value"), false);
    assert.equal(gateway.requests[0]?.messages?.some((message) => message.role === "system" && message.content.includes("Projected runtime context:")), false);
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

class CapturingModelGateway implements ModelGateway {
  readonly requests: ModelRequest[] = [];

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    this.requests.push(request);
    yield { kind: "delta", text: "captured" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

function fileReferenceContext(path: string): AgentLoopReferenceContext {
  return {
    schemaVersion: "1.0.0",
    source: "cli.palette.references",
    activeSetId: "refset:active",
    activeItemId: `ref:file:${path}`,
    setCount: 1,
    itemCount: 1,
    sets: [{
      id: "refset:active",
      label: "Active references",
      activeItemId: `ref:file:${path}`,
      items: [{
        id: `ref:file:${path}`,
        kind: "file",
        target: { kind: "file", id: `file:${path}`, label: path, path },
        label: path,
        provenance: { source: "runtime.test" },
        order: 0,
        redaction: { class: "internal", fields: ["target", "label"] }
      }],
      provenance: { source: "runtime.test" },
      redaction: { class: "internal", fields: ["items.target"] }
    }],
    redaction: { class: "internal", fields: ["sets.items.target"] }
  };
}

function pageIndexTurnReferenceContext(): AgentLoopReferenceContext {
  return {
    schemaVersion: "1.0.0",
    source: "cli.palette.references",
    activeSetId: "refs:active",
    activeItemId: "ref:pageindex-result:test",
    setCount: 1,
    itemCount: 1,
    sets: [{
      id: "refs:active",
      label: "Active references",
      activeItemId: "ref:pageindex-result:test",
      items: [{
        id: "ref:pageindex-result:test",
        kind: "turn",
        target: {
          kind: "turn",
          id: "turn-source",
          label: "Turn 1",
          sessionId: "session-source" as import("@deepseek/platform-contracts").SessionId,
          turnId: "turn-source" as import("@deepseek/platform-contracts").TurnId,
          metadata: {
            pageId: "page:1:test",
            sequence: 1,
            status: "completed",
            traceId: "trace-source",
            promptPreview: "database auth decision",
            assistantPreview: "use token exchange",
            deterministicScore: 12,
            ranking: "deterministic-text",
            semantic: { status: "deferred" },
            redaction: { class: "internal", fields: ["promptPreview", "assistantPreview"] }
          }
        },
        label: "#1 completed: database auth decision",
        provenance: { source: "result-list", resultListItemId: "pageindex-result:test" },
        order: 0,
        redaction: { class: "internal", fields: ["target", "label"] }
      }],
      provenance: { source: "runtime.test" },
      redaction: { class: "internal", fields: ["items.target"] }
    }],
    redaction: { class: "internal", fields: ["sets.items.target"] }
  };
}

function plainTurnReferenceContext(): AgentLoopReferenceContext {
  return {
    schemaVersion: "1.0.0",
    source: "cli.palette.references",
    activeSetId: "refs:active",
    activeItemId: "ref:turn:plain",
    setCount: 1,
    itemCount: 1,
    sets: [{
      id: "refs:active",
      label: "Active references",
      activeItemId: "ref:turn:plain",
      items: [{
        id: "ref:turn:plain",
        kind: "turn",
        target: {
          kind: "turn",
          id: "turn-plain",
          label: "Plain turn",
          turnId: "turn-plain" as import("@deepseek/platform-contracts").TurnId
        },
        label: "Plain turn",
        provenance: { source: "runtime.test" },
        order: 0,
        redaction: { class: "internal", fields: ["target", "label"] }
      }],
      provenance: { source: "runtime.test" },
      redaction: { class: "internal", fields: ["items.target"] }
    }],
    redaction: { class: "internal", fields: ["sets.items.target"] }
  };
}
