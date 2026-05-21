import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { readCliChatPrompts } from "../src/input/chat-input.js";
import { dispatchRawInputToTui } from "../src/commands/chat-raw-input.js";
import { createChatTuiController } from "../src/commands/chat-tui.js";
import type { ChatTui } from "../src/commands/chat-tui.js";
import type { CliTerminalCapabilityProfile } from "../src/host/terminal-profile.js";

function createInteractiveTerminalProfile(): CliTerminalCapabilityProfile {
  return {
    rendererProfile: "interactive",
    inputStrategy: "raw",
    stdinIsTTY: true,
    stdoutIsTTY: true,
    isCI: false,
    platform: "linux",
    colorDepth: "truecolor",
    unicode: "unicode",
    rawInput: true,
    inlineText: true,
    reasons: []
  };
}

function createTui(): ChatTui {
  return createChatTuiController({
    enabled: true,
    terminalProfile: createInteractiveTerminalProfile(),
    write: async () => undefined,
    writeInline: async () => undefined
  });
}

async function readPrompts(tui: ChatTui, chunks: readonly string[]): Promise<readonly string[]> {
  async function* stream(): AsyncIterable<string> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  const outputs: string[] = [];
  for await (const text of readCliChatPrompts(stream(), "raw", (event, context) => dispatchRawInputToTui(tui, event, context))) {
    outputs.push(text);
  }
  return outputs;
}

describe("chat TUI raw input handler", () => {
  it("opens command bar when slash is first key and keeps prompt buffer empty", async () => {
    const tui = createTui();
    const outputs = await readPrompts(tui, ["/"]);

    assert.deepEqual(outputs, []);
    assert.equal(tui.snapshot().workbench.commandBar.open, true);
    assert.equal(tui.snapshot().workbench.commandBar.mode, "search");
    assert.equal(tui.snapshot().workbench.commandBar.query, "");
    assert.equal(tui.snapshot().workbench.focus.activePanel, "command-bar");
    assert.equal(tui.snapshot().promptReady, true);
  });

  it("updates command bar query locally while typing and keeps unmatched input from becoming prompt text", async () => {
    const tui = createTui();
    const outputs = await readPrompts(tui, ["/", "z", "z", "\n"]);

    assert.deepEqual(outputs, []);
    assert.equal(tui.snapshot().workbench.commandBar.open, true);
    assert.equal(tui.snapshot().workbench.commandBar.query, "zz");
    assert.equal(tui.snapshot().workbench.focus.activePanel, "command-bar");
  });

  it("submits help command on enter when suggestion is complete", async () => {
    const tui = createTui();
    const outputs = await readPrompts(tui, ["/", "h", "e", "l", "p", "\n"]);

    assert.deepEqual(outputs, ["/help"]);
    assert.equal(tui.snapshot().workbench.commandBar.open, false);
  });

  it("keeps slash local when pending prompt is not empty", async () => {
    const tui = createTui();
    const outputs = await readPrompts(tui, ["a", "/", "\n"]);

    assert.deepEqual(outputs, ["a/"]);
  });

  it("cycles suggestion selection in command bar with Tab", async () => {
    const tui = createTui();
    await readPrompts(tui, ["/"]);
    const firstSuggestion = tui.snapshot().workbench.commandBar.activeSuggestionId;

    await readPrompts(tui, ["\t"]);
    const secondSuggestion = tui.snapshot().workbench.commandBar.activeSuggestionId;

    assert.equal(tui.snapshot().workbench.focus.activePanel, "command-bar");
    assert.notEqual(firstSuggestion, secondSuggestion);
  });

  it("cycles panels with Tab when command bar is not open", async () => {
    const tui = createTui();
    await readPrompts(tui, ["\t"]);

    assert.equal(tui.snapshot().workbench.focus.activePanel, "reasoning");
  });
});
