import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ModelGateway, ModelRequest, ModelStreamEvent } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("evidence-first agent loop golden replay", () => {
  it("replays evidence ordering and prompt-boundary preservation", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingEvidenceModelGateway();
    const loopDeps = { ...deps, models: gateway };
    await loopDeps.platform.writeFile("/workspace/README.md", "DeepSeek CLI repository evidence\n");
    await loopDeps.platform.writeFile("/workspace/src/apps/cli/package.json", JSON.stringify({ name: "deepseek-agent-cli", bin: { deepseek: "dist/index.js" } }));
    await loopDeps.platform.writeFile("/workspace/docs/reference/command-index.md", "deepseek run <prompt>\n");
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const prompt = "生成 DeepSeek CLI 产品介绍并说明 deepseek run";
    const runtime = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt,
      caller: "golden.evidence",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));
    const sessionId = runtime[0]?.sessionId;
    assert.ok(sessionId);

    const trace = await deps.regression.normalize({
      name: "evidence-first-agent-loop",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime,
      sessions: await deps.sessions.events(sessionId),
      assertions: [
        { expectedKind: "evidence.classified" },
        { expectedKind: "evidence.plan.created" },
        { expectedKind: "evidence.selected" },
        { expectedKind: "evidence.claims.grounded" }
      ]
    });
    const replay = await deps.regression.replay(trace);
    const kinds = runtime.map((event) => event.kind);
    const userMessage = gateway.requests[0]?.messages?.find((message) => message.role === "user");

    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal(kinds.indexOf("evidence.classified") < kinds.indexOf("model.requested"), true);
    assert.equal(kinds.indexOf("evidence.selected") < kinds.indexOf("model.requested"), true);
    assert.equal(kinds.indexOf("evidence.claims.grounded") < kinds.indexOf("turn.completed"), true);
    assert.equal(userMessage?.content, prompt);
    assert.equal(gateway.requests[0]?.messages?.some((message) => message.role === "system" && message.content.includes("Selected local project evidence:")), true);
    await kernel.shutdown();
  });
});

class CapturingEvidenceModelGateway implements ModelGateway {
  readonly requests: ModelRequest[] = [];

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    this.requests.push(request);
    yield { kind: "delta", text: "DeepSeek CLI package is deepseek-agent-cli. Run deepseek run <prompt>." };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
