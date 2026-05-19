import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import type { CliInteractionContribution } from "@deepseek/platform-contracts";
import { createChatTuiController } from "../../src/apps/cli/src/commands/chat-tui.js";
import { dispatchRawInputToTui } from "../../src/apps/cli/src/commands/chat-raw-input.js";
import { readCliChatPrompts } from "../../src/apps/cli/src/input/chat-input.js";
import type { CliTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";

describe("chat command bar raw input bridge", () => {
  it("submits complete slash suggestions from the command bar", async () => {
    const prompts = await collectPrompts(["/", "\r"]);

    assert.deepEqual(prompts, ["/help"]);
  });

  it("fills slash drafts and lets users complete arguments before submit", async () => {
    const prompts = await collectPrompts(["/", "f", "i", "l", "e", "\x1b[B", "\r", "s", "r", "c", "\r"]);

    assert.deepEqual(prompts, ["/file preview src"]);
  });

  it("fills first-party plugin slash drafts when owner routes require arguments", async () => {
    const prompts = await collectPrompts(["/", "r", "e", "p", "o", "\r", "s", "r", "c", "\r"]);

    assert.deepEqual(prompts, ["/repo files src"]);
  });

  it("submits complete first-party plugin slash aliases from the command bar", async () => {
    const prompts = await collectPrompts(["/", "g", "i", "t", " ", "s", "\r"]);

    assert.deepEqual(prompts, ["/git status"]);
  });

  it("keeps slash as prompt text when the raw prompt buffer is non-empty", async () => {
    const prompts = await collectPrompts(["h", "i", "/", "\r"]);

    assert.deepEqual(prompts, ["hi/"]);
  });

  it("keeps plugin command bar descriptors local without yielding prompts", async () => {
    const prompts = await collectPrompts(["/", "z", "z", "p", "l", "u", "g", "i", "n", "\r"], [pluginCommand()]);

    assert.deepEqual(prompts, []);
  });
});

async function collectPrompts(chunks: readonly string[], plugin: readonly CliInteractionContribution[] = []): Promise<readonly string[]> {
  const tui = createChatTuiController({
    enabled: true,
    terminalProfile: fullScreenProfile(),
    write: async () => undefined,
    writeInline: async () => undefined,
    contributions: {
      plugin
    }
  });
  const prompts: string[] = [];
  for await (const prompt of readCliChatPrompts(chunks, "raw", (event, context) => dispatchRawInputToTui(tui, event, context))) {
    prompts.push(prompt);
  }
  return prompts;
}

function pluginCommand(): CliInteractionContribution {
  return {
    id: "plugin.command.repo-grep",
    kind: "command",
    source: "plugin",
    pluginId: asId<"plugin">("@deepseek/plugin-test"),
    commandName: "zzplugin.command",
    targetKind: "file",
    priority: 90
  };
}

function fullScreenProfile(): CliTerminalCapabilityProfile {
  return {
    rendererProfile: "full-screen",
    inputStrategy: "raw",
    stdinIsTTY: true,
    stdoutIsTTY: true,
    isCI: false,
    platform: "linux",
    columns: 120,
    colorDepth: "ansi256",
    unicode: "unicode",
    rawInput: true,
    inlineText: true,
    tuiProfile: "full-screen",
    reasons: ["renderer:full-screen", "input:raw", "tui:full-screen"]
  };
}
