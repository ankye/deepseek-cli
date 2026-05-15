import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { runCli } from "../../src/apps/cli/src/index.js";

const canonicalAgentLoopKinds = [
  "agent.loop.started",
  "turn.started",
  "hooks.invoked",
  "mode.interaction.changed",
  "mode.agent.bound",
  "agent.phase.plan.created",
  "agent.phase.skipped",
  "agent.phase.skipped",
  "agent.phase.skipped",
  "agent.phase.skipped",
  "agent.phase.skipped",
  "model.reasoning.effort.mapped",
  "evidence.classified",
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
];

describe("minimal chat CLI golden replay", () => {
  it("keeps chat prompt semantics aligned with runtime agent-loop events", async () => {
    const prompt = "chat golden";
    const chatDeps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(chatDeps, process.cwd());
    const chatKernel = await createDefaultRuntimeKernel(chatDeps);
    const lines: string[] = [];
    await runCli(
      ["chat", "--output", "jsonl"],
      (line: string) => {
        lines.push(line);
      },
      [`${prompt}\n/exit\n`],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps: chatDeps, kernel: chatKernel })
      }
    );
    const chatRuntimeEvents = lines
      .map((line) => JSON.parse(line) as RuntimeEvent | { readonly kind: string })
      .filter((event): event is RuntimeEvent => event.kind !== "chat.command.result");

    const headlessDeps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(headlessDeps, process.cwd());
    const headlessKernel = await createDefaultRuntimeKernel(headlessDeps);
    const headlessEvents = [];
    for await (const event of runAgentLoop(headlessDeps, headlessKernel, {
      prompt,
      caller: "cli.chat",
      workspaceRoot: process.cwd(),
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    })) {
      headlessEvents.push(event);
    }

    assert.deepEqual(chatRuntimeEvents.map((event) => event.kind), headlessEvents.map((event) => event.kind));

    const sessionId = chatRuntimeEvents[0]?.sessionId ? asId<"session">(chatRuntimeEvents[0].sessionId) : undefined;
    assert.ok(sessionId);
    const trace = await chatDeps.regression.normalize({
      name: "minimal-chat-cli",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: chatDeps.bus.getReplayRecords(sessionId),
      runtime: chatRuntimeEvents,
      sessions: await chatDeps.sessions.events(sessionId),
      assertions: [{ expectedKind: "agent.loop.completed" }]
    });
    const replay = await chatDeps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    await headlessKernel.shutdown();
  });
});
