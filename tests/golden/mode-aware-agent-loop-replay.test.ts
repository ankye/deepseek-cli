import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AgentLoopSummary, AgentVerifierResult, RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

describe("mode-aware agent loop golden replay", () => {
  it("orders evidence, implementation, verification, reconciliation, and terminal events", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(runAgentLoop(deps, kernel, {
      prompt: "生成一个 HTML 网站",
      caller: "golden.mode-loop",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));
    const kinds = events.map((event) => event.kind);

    assertBefore(kinds, "agent.phase.plan.created", "evidence.classified");
    assertBefore(kinds, "evidence.classified", "prompt.assembled");
    assertBefore(kinds, "model.done", "agent.verifier.verdict");
    assertBefore(kinds, "agent.verifier.verdict", "agent.result.reconciled");
    assertBefore(kinds, "agent.result.reconciled", "agent.loop.completed");

    const verifier = events.find((event) => event.kind === "agent.verifier.verdict")?.data as AgentVerifierResult | undefined;
    const terminal = events.at(-1)?.data as AgentLoopSummary | undefined;
    assert.equal(verifier?.verdict, "partial");
    assert.equal(terminal?.modeSummary?.verifierResults[0]?.verdict, "partial");

    const sessionId = events[0]?.sessionId ? asId<"session">(events[0].sessionId) : undefined;
    assert.ok(sessionId);
    const trace = await deps.regression.normalize({
      name: "mode-aware-agent-loop",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime: events as readonly RuntimeEvent[],
      sessions: await deps.sessions.events(sessionId),
      assertions: [
        { expectedKind: "agent.verifier.verdict" },
        { expectedKind: "agent.result.reconciled" },
        { expectedKind: "agent.loop.completed" }
      ]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    await kernel.shutdown();
  });
});

function assertBefore(kinds: readonly string[], first: string, second: string): void {
  const firstIndex = kinds.indexOf(first);
  const secondIndex = kinds.indexOf(second);
  assert.equal(firstIndex >= 0, true, `${first} missing`);
  assert.equal(secondIndex >= 0, true, `${second} missing`);
  assert.equal(firstIndex < secondIndex, true, `${first} must occur before ${second}`);
}
