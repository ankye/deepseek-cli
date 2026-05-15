import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AgentLoopBudget, RuntimeEvent } from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { renderChatModeControl, updateChatModeControlState, createInitialChatModeControlState } from "../../src/apps/cli/src/commands/chat-mode-controls.js";
import { createTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";
import { terminalProfileFixtures } from "../../src/apps/cli/src/host/terminal-fixtures.js";
import { renderText } from "../../src/apps/cli/src/renderers/runtime-events.js";

describe("CLI mode terminal matrix", () => {
  it("renders mode controls and verification markers deterministically across terminal profiles", () => {
    const event = budgetEvent();
    const state = updateChatModeControlState(createInitialChatModeControlState(asId<"session">("session-terminal-matrix")), [event]);
    const outputs = terminalProfileFixtures.map((fixture) => {
      const profile = createTerminalCapabilityProfile({
        command: fixture.command,
        output: fixture.output,
        terminal: fixture.terminal,
        input: fixture.terminal.stdinIsTTY ? process.stdin : [],
        facts: { ...fixture.facts, processStdin: process.stdin }
      });
      const modeLines = renderChatModeControl("mode", state, fixture.output);
      const marker = fixture.output === "text" ? renderText(event) : JSON.stringify(event);
      return { fixture, profile, text: [...modeLines, marker].join("\n") };
    });

    assert.equal(outputs.some((entry) => entry.fixture.name === "ci-non-tty" && entry.profile.rendererProfile === "plain"), true);
    assert.equal(outputs.some((entry) => entry.fixture.name === "redirected-jsonl" && entry.profile.rendererProfile === "jsonl" && entry.text.includes("\"agent.loop.budget.consumed\"")), true);
    assert.equal(outputs.some((entry) => entry.fixture.name === "no-color-terminal" && entry.profile.colorDepth === "none"), true);
    assert.equal(outputs.some((entry) => entry.fixture.name === "macos-terminal" && entry.profile.unicode === "unicode"), true);
    assert.equal(outputs.some((entry) => entry.fixture.name === "windows-terminal-powershell" && entry.profile.rendererProfile === "interactive"), true);
    assert.equal(outputs.every((entry) => entry.text.includes("\u001b[") === false), true);
  });
});

function budgetEvent(): RuntimeEvent {
  const trace = {
    traceId: asId<"trace">("trace-terminal-matrix"),
    spanId: asId<"span">("span-terminal-matrix"),
    correlationId: asId<"correlation">("corr-terminal-matrix"),
    sessionId: asId<"session">("session-terminal-matrix")
  };
  const budget: AgentLoopBudget = {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    kind: "verification",
    requested: 1,
    allowed: 1,
    consumed: 1,
    remaining: 0,
    policy: { source: "matrix" },
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
  return {
    kind: "agent.loop.budget.consumed",
    sessionId: trace.sessionId,
    turnId: asId<"turn">("turn-terminal-matrix"),
    createdAt: new Date(0).toISOString(),
    trace,
    data: budget
  };
}
