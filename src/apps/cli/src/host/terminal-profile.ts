import type { AgentLoopOutputMode, CliTuiProfile } from "@deepseek/platform-contracts";
import type { CliCommand, CliInputStream, CliTerminalFlags } from "../types.js";

export type CliRendererProfile = "plain" | "ansi" | "interactive" | "full-screen" | "json" | "jsonl";
export type CliInputStrategy = "line" | "raw" | "scripted" | "none";
export type CliColorDepth = "none" | "ansi16" | "ansi256" | "truecolor";
export type CliUnicodeProfile = "basic" | "unicode";

export interface CliTerminalCapabilityProfile {
  readonly rendererProfile: CliRendererProfile;
  readonly inputStrategy: CliInputStrategy;
  readonly stdinIsTTY: boolean;
  readonly stdoutIsTTY: boolean;
  readonly isCI: boolean;
  readonly platform: string;
  readonly columns?: number;
  readonly colorDepth: CliColorDepth;
  readonly unicode: CliUnicodeProfile;
  readonly rawInput: boolean;
  readonly inlineText: boolean;
  readonly tuiProfile?: CliTuiProfile;
  readonly reasons: readonly string[];
}

export interface CliTerminalProfileSource {
  readonly command: CliCommand;
  readonly output: AgentLoopOutputMode;
  readonly terminal: CliTerminalFlags;
  readonly input: CliInputStream;
  readonly tuiProfile?: CliTuiProfile;
  readonly facts: CliTerminalHostFacts;
}

export interface CliTerminalHostFacts {
  readonly env: Record<string, string | undefined>;
  readonly platform: string;
  readonly columns?: number;
  readonly colorDepth: number;
  readonly processStdin: CliInputStream;
}

export function createTerminalCapabilityProfile(source: CliTerminalProfileSource): CliTerminalCapabilityProfile {
  const env = source.facts.env;
  const platform = source.facts.platform;
  const isCI = env.CI === "true" || env.CI === "1";
  const columns = source.facts.columns;
  const colorDepth = selectColorDepth(source.facts.colorDepth, env);
  const unicode = selectUnicodeProfile(platform, env);
  const inputIsScripted = source.input !== source.facts.processStdin || !source.terminal.stdinIsTTY;
  const rawInput = source.terminal.stdinIsTTY && !inputIsScripted;
  const tuiProfile = source.tuiProfile ?? tuiProfileFromEnv(env);
  const rendererProfile = selectRendererProfile({
    command: source.command,
    output: source.output,
    terminal: source.terminal,
    isCI,
    colorDepth,
    rawInput,
    tuiProfile,
    ...(typeof columns === "number" ? { columns } : {})
  });
  const inputStrategy = selectInputStrategy({
    command: source.command,
    stdinIsTTY: source.terminal.stdinIsTTY,
    inputIsScripted,
    rawInput,
    tuiProfile,
    rendererProfile
  });
  return {
    rendererProfile,
    inputStrategy,
    stdinIsTTY: source.terminal.stdinIsTTY,
    stdoutIsTTY: source.terminal.stdoutIsTTY,
    isCI,
    platform,
    ...(typeof columns === "number" && Number.isFinite(columns) && columns > 0 ? { columns } : {}),
    colorDepth,
    unicode,
    rawInput,
    inlineText: (rendererProfile === "ansi" || rendererProfile === "interactive" || rendererProfile === "full-screen") && source.terminal.stdoutIsTTY,
    tuiProfile,
    reasons: profileReasons({ rendererProfile, inputStrategy, inputIsScripted, isCI, colorDepth, tuiProfile })
  };
}

function selectRendererProfile(input: {
  readonly command: CliCommand;
  readonly output: AgentLoopOutputMode;
  readonly terminal: CliTerminalFlags;
  readonly isCI: boolean;
  readonly colorDepth: CliColorDepth;
  readonly columns?: number;
  readonly rawInput: boolean;
  readonly tuiProfile: CliTuiProfile;
}): CliRendererProfile {
  if (input.output === "json") return "json";
  if (input.output === "jsonl") return "jsonl";
  if (!input.terminal.stdoutIsTTY || input.isCI) return "plain";
  if (input.command === "chat" && input.tuiProfile === "off") return input.colorDepth === "none" ? "plain" : "ansi";
  if (input.command === "chat" && input.tuiProfile === "full-screen" && input.terminal.stdinIsTTY && input.rawInput && (input.columns ?? 0) >= 80) return "full-screen";
  if (input.command === "chat" && input.terminal.stdinIsTTY) return "interactive";
  return input.colorDepth === "none" ? "plain" : "ansi";
}

function selectInputStrategy(input: {
  readonly command: CliCommand;
  readonly stdinIsTTY: boolean;
  readonly inputIsScripted: boolean;
  readonly rawInput: boolean;
  readonly tuiProfile: CliTuiProfile;
  readonly rendererProfile: CliRendererProfile;
}): CliInputStrategy {
  if (input.command !== "chat") return "none";
  if (input.inputIsScripted || !input.stdinIsTTY) return "scripted";
  if ((input.rendererProfile === "interactive" || input.rendererProfile === "full-screen") && input.rawInput) return "raw";
  return input.rawInput ? "line" : "scripted";
}

function tuiProfileFromEnv(env: Record<string, string | undefined>): CliTuiProfile {
  const value = env.DEEPSEEK_TUI;
  if (value === "line" || value === "full-screen" || value === "off") return value;
  return "auto";
}

function selectColorDepth(depth: number, env: Record<string, string | undefined>): CliColorDepth {
  if (env.NO_COLOR || env.FORCE_COLOR === "0") return "none";
  if (depth >= 24) return "truecolor";
  if (depth >= 8) return "ansi256";
  if (depth >= 4) return "ansi16";
  return "none";
}

function selectUnicodeProfile(platform: string, env: Record<string, string | undefined>): CliUnicodeProfile {
  if (env.DEEPSEEK_ASCII === "1") return "basic";
  if ((platform === "win32" || platform === "windows") && !env.WT_SESSION && !env.TERM_PROGRAM) return "basic";
  return "unicode";
}

function profileReasons(input: {
  readonly rendererProfile: CliRendererProfile;
  readonly inputStrategy: CliInputStrategy;
  readonly inputIsScripted: boolean;
  readonly isCI: boolean;
  readonly colorDepth: CliColorDepth;
  readonly tuiProfile: CliTuiProfile;
}): readonly string[] {
  const reasons: string[] = [`renderer:${input.rendererProfile}`, `input:${input.inputStrategy}`, `tui:${input.tuiProfile}`];
  if (input.inputIsScripted) reasons.push("scripted-input");
  if (input.isCI) reasons.push("ci");
  if (input.colorDepth === "none") reasons.push("no-color");
  return reasons;
}
