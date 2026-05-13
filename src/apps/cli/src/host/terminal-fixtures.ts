import type { AgentLoopOutputMode } from "@deepseek/platform-contracts";
import type { CliCommand, CliTerminalFlags } from "../types.js";

export interface CliTerminalProfileFixture {
  readonly name: string;
  readonly command: CliCommand;
  readonly output: AgentLoopOutputMode;
  readonly terminal: CliTerminalFlags;
  readonly facts: {
    readonly env: Record<string, string | undefined>;
    readonly platform: string;
    readonly columns?: number;
    readonly colorDepth: number;
  };
}

export const terminalProfileFixtures: readonly CliTerminalProfileFixture[] = [
  {
    name: "windows-terminal-powershell",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { WT_SESSION: "1", TERM_PROGRAM: "Windows_Terminal" },
      platform: "win32",
      columns: 120,
      colorDepth: 24
    }
  },
  {
    name: "windows-cmd-conpty",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { TERM: "xterm-256color" },
      platform: "win32",
      columns: 100,
      colorDepth: 8
    }
  },
  {
    name: "macos-terminal",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { TERM_PROGRAM: "Apple_Terminal", TERM: "xterm-256color" },
      platform: "darwin",
      columns: 100,
      colorDepth: 8
    }
  },
  {
    name: "linux-terminal",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { TERM: "xterm-256color" },
      platform: "linux",
      columns: 120,
      colorDepth: 8
    }
  },
  {
    name: "ci-non-tty",
    command: "run",
    output: "text",
    terminal: { stdinIsTTY: false, stdoutIsTTY: false },
    facts: {
      env: { CI: "true" },
      platform: "linux",
      colorDepth: 1
    }
  },
  {
    name: "redirected-jsonl",
    command: "run",
    output: "jsonl",
    terminal: { stdinIsTTY: false, stdoutIsTTY: false },
    facts: {
      env: {},
      platform: "linux",
      columns: 80,
      colorDepth: 1
    }
  },
  {
    name: "remote-unknown-width",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { SSH_CONNECTION: "example" },
      platform: "linux",
      colorDepth: 4
    }
  },
  {
    name: "no-color-terminal",
    command: "chat",
    output: "text",
    terminal: { stdinIsTTY: true, stdoutIsTTY: true },
    facts: {
      env: { NO_COLOR: "1" },
      platform: "linux",
      columns: 100,
      colorDepth: 24
    }
  }
];
