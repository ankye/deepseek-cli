import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTerminalCapabilityProfile } from "../src/host/terminal-profile.js";
import { terminalProfileFixtures } from "../src/host/terminal-fixtures.js";

describe("terminal capability profile", () => {
  it("selects structured renderer profiles without ANSI decoration", () => {
    const json = createTerminalCapabilityProfile({
      command: "run",
      output: "json",
      terminal: { stdinIsTTY: false, stdoutIsTTY: false },
      input: [],
      facts: { env: {}, platform: "linux", colorDepth: 24, processStdin: process.stdin }
    });
    const jsonl = createTerminalCapabilityProfile({
      command: "run",
      output: "jsonl",
      terminal: { stdinIsTTY: false, stdoutIsTTY: false },
      input: [],
      facts: { env: {}, platform: "linux", colorDepth: 24, processStdin: process.stdin }
    });

    assert.equal(json.rendererProfile, "json");
    assert.equal(json.inputStrategy, "none");
    assert.equal(jsonl.rendererProfile, "jsonl");
    assert.equal(jsonl.inputStrategy, "none");
  });

  it("degrades unknown non-tty text output to plain scripted behavior", () => {
    const profile = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: false, stdoutIsTTY: false },
      input: ["hello\n"],
      facts: { env: { CI: "true" }, platform: "linux", colorDepth: 1, processStdin: process.stdin }
    });

    assert.equal(profile.rendererProfile, "plain");
    assert.equal(profile.inputStrategy, "scripted");
    assert.equal(profile.inlineText, false);
    assert.equal(profile.rawInput, false);
  });

  it("uses line input and interactive rendering for supported tty chat", () => {
    const profile = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: { TERM: "xterm-256color" }, platform: "linux", columns: 120, colorDepth: 8, processStdin: process.stdin }
    });

    assert.equal(profile.rendererProfile, "interactive");
    assert.equal(profile.inputStrategy, "line");
    assert.equal(profile.rawInput, true);
    assert.equal(profile.inlineText, true);
  });

  it("keeps deterministic fixtures for common platform profiles", () => {
    const profiles = terminalProfileFixtures.map((fixture) => ({
      name: fixture.name,
      profile: createTerminalCapabilityProfile({
        command: fixture.command,
        output: fixture.output,
        terminal: fixture.terminal,
        input: fixture.terminal.stdinIsTTY ? process.stdin : [],
        facts: { ...fixture.facts, processStdin: process.stdin }
      })
    }));
    const names = new Set(profiles.map((entry) => entry.name));

    assert.equal(names.has("windows-terminal-powershell"), true);
    assert.equal(names.has("windows-cmd-conpty"), true);
    assert.equal(names.has("macos-terminal"), true);
    assert.equal(names.has("linux-terminal"), true);
    assert.equal(names.has("ci-non-tty"), true);
    assert.equal(names.has("redirected-jsonl"), true);
    assert.equal(names.has("remote-unknown-width"), true);
    assert.equal(names.has("no-color-terminal"), true);
    assert.equal(profiles.find((entry) => entry.name === "ci-non-tty")?.profile.rendererProfile, "plain");
    assert.equal(profiles.find((entry) => entry.name === "redirected-jsonl")?.profile.rendererProfile, "jsonl");
    assert.equal(profiles.find((entry) => entry.name === "no-color-terminal")?.profile.colorDepth, "none");
  });

  it("covers terminal profiles required by TUI and visible reasoning renderers", () => {
    const narrow = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: { TERM: "xterm-256color" }, platform: "linux", columns: 32, colorDepth: 8, processStdin: process.stdin }
    });
    const noColor = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: { NO_COLOR: "1" }, platform: "linux", columns: 100, colorDepth: 24, processStdin: process.stdin }
    });
    const nonTty = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: false, stdoutIsTTY: false },
      input: [],
      facts: { env: {}, platform: "linux", columns: 80, colorDepth: 1, processStdin: process.stdin }
    });
    const json = createTerminalCapabilityProfile({
      command: "chat",
      output: "json",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: {}, platform: "linux", columns: 100, colorDepth: 24, processStdin: process.stdin }
    });
    const jsonl = createTerminalCapabilityProfile({
      command: "chat",
      output: "jsonl",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: {}, platform: "linux", columns: 100, colorDepth: 24, processStdin: process.stdin }
    });
    const windowsLike = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: process.stdin,
      facts: { env: {}, platform: "win32", columns: 100, colorDepth: 4, processStdin: process.stdin }
    });
    const unsupportedRawInput = createTerminalCapabilityProfile({
      command: "chat",
      output: "text",
      terminal: { stdinIsTTY: true, stdoutIsTTY: true },
      input: [],
      facts: { env: {}, platform: "linux", columns: 100, colorDepth: 8, processStdin: process.stdin }
    });

    assert.equal(narrow.rendererProfile, "interactive");
    assert.equal(narrow.columns, 32);
    assert.equal(noColor.colorDepth, "none");
    assert.equal(noColor.reasons.includes("no-color"), true);
    assert.equal(nonTty.rendererProfile, "plain");
    assert.equal(nonTty.inputStrategy, "scripted");
    assert.equal(json.rendererProfile, "json");
    assert.equal(jsonl.rendererProfile, "jsonl");
    assert.equal(windowsLike.unicode, "basic");
    assert.equal(unsupportedRawInput.rawInput, false);
    assert.equal(unsupportedRawInput.inputStrategy, "scripted");
  });
});
