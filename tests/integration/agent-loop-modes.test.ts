import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AgentLoopSummary, AgentPhasePlan, AgentReasoningEffortMapping, AgentVerifierResult, ModelGateway, ModelLiveVerificationRequest, ModelLiveVerificationResult, ModelRequest, ModelStreamEvent } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

describe("agent loop mode orchestration", () => {
  it("records typed skipped phases for a simple single-agent turn", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "hello",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const plan = events.find((event) => event.kind === "agent.phase.plan.created")?.data as AgentPhasePlan | undefined;
    assert.equal(plan?.agentMode, "default");
    assert.equal(plan?.phases.some((phase) => phase.phase === "evidence" && phase.status === "skipped" && phase.skipReason === "simple-task"), true);
    assert.equal(plan?.phases.some((phase) => phase.phase === "verify" && phase.status === "skipped" && phase.skipReason === "low-risk"), true);
    assert.equal(events.some((event) => event.kind === "agent.worker.launched"), false);
    await kernel.shutdown();
  });

  it("records evidence phase and consumed evidence budget for fact-sensitive project tasks", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/README.md", "DeepSeek CLI project\n");
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "介绍当前 DeepSeek CLI 项目",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const plan = events.find((event) => event.kind === "agent.phase.plan.created")?.data as AgentPhasePlan | undefined;
    assert.equal(plan?.phases.some((phase) => phase.phase === "evidence" && phase.status === "completed"), true);
    assert.equal(events.some((event) => event.kind === "agent.loop.budget.consumed" && event.data.kind === "evidence"), true);
    assert.equal(events.some((event) => event.kind === "evidence.selected"), true);
    await kernel.shutdown();
  });

  it("requires verifier verdict and reconciles generated artifacts without overstating success", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "生成一个 HTML 网站",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const plan = events.find((event) => event.kind === "agent.phase.plan.created")?.data as AgentPhasePlan | undefined;
    assert.equal(plan?.phases.some((phase) => phase.phase === "verify" && phase.status === "required" && phase.mode === "verifier"), true);
    const verifier = events.find((event) => event.kind === "agent.verifier.verdict")?.data as AgentVerifierResult | undefined;
    assert.equal(verifier?.verdict, "partial");
    assert.equal(verifier?.diagnostics.some((diagnostic) => diagnostic.code === "VERIFIER_PARTIAL_EVIDENCE"), true);
    assert.equal(events.some((event) => event.kind === "agent.result.reconciled" && event.data.status === "partial"), true);
    const terminal = events.at(-1)?.data as AgentLoopSummary | undefined;
    assert.equal(terminal?.phasePlan?.planId, plan?.planId);
    assert.equal(terminal?.modeSummary?.verifierResults[0]?.verdict, "partial");
    await kernel.shutdown();
  });

  it("records verifier failure, governed repair attempt, and rerun chain when repair budget exists", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new FailingVerifierModelGateway() };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "生成一个 HTML 网站",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxRetries: 1 }
    }));

    const verifier = events.find((event) => event.kind === "agent.verifier.verdict")?.data as AgentVerifierResult | undefined;
    const terminal = events.at(-1);
    assert.equal(verifier?.verdict, "fail");
    assert.equal(events.some((event) => event.kind === "agent.repair.attempted" && event.data.status === "attempted"), true);
    assert.equal(events.some((event) => event.kind === "agent.repair.rerun" && event.data.status === "deferred"), true);
    assert.equal(events.some((event) => event.kind === "agent.result.reconciled" && event.data.status === "fail" && event.data.repairAttemptCount === 1), true);
    assert.equal(events.some((event) => event.kind === "agent.loop.budget.consumed" && event.data.kind === "repair" && event.data.consumed === 1), true);
    assert.equal(terminal?.kind, "agent.loop.completed");
    const summary = terminal?.data as AgentLoopSummary | undefined;
    assert.equal(summary?.modeSummary?.verifierResults[0]?.verdict, "fail");
    await kernel.shutdown();
  });

  it("credits independent command evidence before reporting verifier pass", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new ReadThenFinishModelGateway() };
    await deps.platform.writeFile("/workspace/README.md", "verified workspace\n");
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "生成一个 HTML 网站并读取 README 作为验证证据",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const verifier = events.find((event) => event.kind === "agent.verifier.verdict")?.data as AgentVerifierResult | undefined;
    const terminal = events.at(-1)?.data as AgentLoopSummary | undefined;
    assert.equal(verifier?.verdict, "pass");
    assert.equal((verifier?.commandEvidenceIds.length ?? 0) > 0, true);
    assert.equal(events.some((event) => event.kind === "agent.result.reconciled" && event.data.status === "pass"), true);
    assert.equal(terminal?.modeSummary?.verifierResults[0]?.verdict, "pass");
    await kernel.shutdown();
  });

  it("reports reasoning effort separately from evidence and verification budgets", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "hello",
      caller: "mode-test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      reasoning: { enabled: true, effort: "xhigh" }
    }));

    const mapped = events.find((event) => event.kind === "model.reasoning.effort.mapped")?.data as AgentReasoningEffortMapping | undefined;
    const plan = events.find((event) => event.kind === "agent.phase.plan.created")?.data as AgentPhasePlan | undefined;
    assert.equal(mapped?.requestedEffort, "xhigh");
    assert.equal(mapped?.providerEffort, "max");
    assert.equal(plan?.budgets.some((budget) => budget.kind === "evidence" && budget.requested === 0), true);
    assert.equal(plan?.budgets.some((budget) => budget.kind === "verification" && budget.requested === 0), true);
    await kernel.shutdown();
  });
});

class FailingVerifierModelGateway implements ModelGateway {
  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    void request;
    yield { kind: "delta", text: "Needs repair." };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  async verify(_request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult> {
    return {
      ok: false,
      provider: { provider: "deepseek", protocol: "openai-chat-completions", model: defaultDeepSeekProfile.model },
      reachable: true,
      terminalStatus: "failed",
      eventKinds: ["delta", "finish", "done"],
      diagnostics: [{
        code: "TEST_VERIFIER_FAIL",
        message: "Verifier failed by test fixture.",
        retryable: false,
        redaction: { class: "internal" }
      }],
      redaction: { class: "internal" }
    };
  }
}

class ReadThenFinishModelGateway implements ModelGateway {
  private requestedRead = false;

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (!this.requestedRead && !request.messages?.some((message) => message.role === "tool")) {
      this.requestedRead = true;
      yield { kind: "tool-call", id: "call-readme", name: "core.file.read", input: { path: "README.md" } };
      yield { kind: "finish", reason: "tool-call" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "delta", text: "Verified with README evidence." };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
