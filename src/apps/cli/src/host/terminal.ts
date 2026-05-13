import type { CliTerminalFlags, CliWrite } from "../types.js";
import type { CliTerminalCapabilityProfile, CliTerminalHostFacts } from "./terminal-profile.js";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

export const defaultTerminalFlags: CliTerminalFlags = { stdinIsTTY: false, stdoutIsTTY: false };

interface TerminalFlagSource {
  readonly isTTY?: boolean;
}

interface TerminalStdoutSource extends TerminalFlagSource {
  readonly columns?: number;
  getColorDepth?(): number;
}

export function createInlineWriter(write: CliWrite, terminal: CliTerminalCapabilityProfile | CliTerminalFlags): (chunk: string) => Promise<void> {
  const canWriteInline = "inlineText" in terminal ? terminal.inlineText : terminal.stdoutIsTTY;
  if (write === console.log && canWriteInline) {
    return (chunk: string) => {
      process.stdout.write(chunk);
      return Promise.resolve();
    };
  }
  return (chunk: string) => Promise.resolve(write(chunk));
}

export function shouldBufferInline(write: CliWrite, terminal: CliTerminalCapabilityProfile | CliTerminalFlags): boolean {
  const canWriteInline = "inlineText" in terminal ? terminal.inlineText : terminal.stdoutIsTTY;
  return !(write === console.log && canWriteInline);
}

export function terminalFlagsFromProcess(stdin: TerminalFlagSource = process.stdin, stdout: TerminalFlagSource = process.stdout): CliTerminalFlags {
  return { stdinIsTTY: stdin.isTTY === true, stdoutIsTTY: stdout.isTTY === true };
}

export async function terminalHostFactsFromProcess(stdin = process.stdin, stdout: TerminalStdoutSource = process.stdout): Promise<CliTerminalHostFacts> {
  const descriptor = await new NodePlatformRuntime().descriptor();
  return {
    env: {
      CI: descriptor.environmentKind === "ci" ? "true" : undefined
    },
    platform: descriptor.os,
    ...(typeof stdout.columns === "number" ? { columns: stdout.columns } : {}),
    colorDepth: stdout.getColorDepth?.() ?? 1,
    processStdin: stdin
  };
}
