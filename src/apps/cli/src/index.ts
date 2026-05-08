#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CapabilityId, ReadinessCommandName, ReadinessCommandResult, RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { invokeLocalReadinessCommand } from "@deepseek/command-system";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import { createDeepSeekCredentialPresenceEnv } from "@deepseek/credential-auth-management";
import { createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

export interface CliOptions {
  readonly command: "turn" | "run" | "readiness";
  readonly prompt: string;
  readonly output: "text" | "stream-json";
  readonly capabilityId?: CapabilityId;
  readonly readinessCommand?: ReadinessCommandName;
}

const readinessCommands = new Set<ReadinessCommandName>(["init", "config", "auth", "doctor", "privacy", "verify-install"]);

export function parseCliArgs(args: readonly string[]): CliOptions {
  const first = args[0];
  if (isReadinessCommand(first)) {
    const outputFlagIndex = args.indexOf("--output");
    const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "json" ? "stream-json" : "text";
    return { command: "readiness", readinessCommand: first, prompt: "", output };
  }
  const command = args[0] === "run" ? "run" : "turn";
  const effectiveArgs = command === "run" ? args.slice(1) : args;
  const promptIndex = effectiveArgs.indexOf("-p");
  const prompt = promptIndex >= 0 ? effectiveArgs[promptIndex + 1] ?? "" : effectiveArgs.filter((arg) => arg !== "--output" && arg !== "stream-json").join(" ");
  const capabilityIndex = effectiveArgs.indexOf("--capability");
  const capabilityId = capabilityIndex >= 0 ? asId<"capability">(effectiveArgs[capabilityIndex + 1] ?? String(runtimeEchoCapability.id)) : runtimeEchoCapability.id;
  const outputFlagIndex = args.indexOf("--output");
  const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "stream-json" ? "stream-json" : "text";
  return { command, prompt, output, capabilityId };
}

export function renderText(event: RuntimeEvent): string {
  if (event.kind === "model.delta") return String(event.data.text ?? "");
  if (event.kind === "capability.output") return String((event.data.output as { text?: string } | undefined)?.text ?? "");
  if (event.kind === "capability.completed") return "[kernel completed]";
  if (event.kind === "execution.rejected") return `[rejected] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "turn.completed") return "[completed]";
  return `[${event.kind}]`;
}

export function renderStreamJson(event: RuntimeEvent): string {
  return JSON.stringify(event);
}

export async function runCli(args: readonly string[], write: (line: string) => void = console.log): Promise<void> {
  const options = parseCliArgs(args);
  if (options.command === "readiness") {
    await runReadinessCommand(options, write);
    return;
  }

  const deps = createDeterministicRuntimeDependencies();
  const kernel = await createDefaultRuntimeKernel(deps);
  try {
    for await (const event of kernel.execute({
      capabilityId: options.capabilityId ?? runtimeEchoCapability.id,
      caller: options.command === "run" ? "cli.run" : "cli.turn",
      input: { text: options.prompt, prompt: options.prompt },
      timeoutMs: 30_000
    })) {
      write(options.output === "stream-json" ? renderStreamJson(event) : renderText(event));
    }
  } finally {
    await kernel.shutdown();
  }
}

export function renderReadinessText(result: ReadinessCommandResult): readonly string[] {
  const lines = [`${result.command}: ${result.status}`];
  for (const check of result.checks) {
    lines.push(`- ${check.id}: ${check.status} - ${check.message}`);
  }
  for (const action of result.suggestedActions) {
    lines.push(`next: ${action}`);
  }
  return lines;
}

async function runReadinessCommand(options: CliOptions, write: (line: string) => void): Promise<void> {
  if (!options.readinessCommand) return;
  const result = await invokeLocalReadinessCommand(options.readinessCommand, {}, createCliReadinessEnvironment());
  if (!result.ok || !result.value) {
    write(options.output === "stream-json" ? JSON.stringify(result) : `[readiness failed] ${result.error?.message ?? options.readinessCommand}`);
    return;
  }
  if (options.output === "stream-json") {
    write(JSON.stringify(result.value));
    return;
  }
  for (const line of renderReadinessText(result.value)) write(line);
}

function createCliReadinessEnvironment(): LocalReadinessEnvironment {
  return {
    cwd: process.cwd(),
    nodeVersion: process.version,
    platform: process.platform,
    packageName: "deekseek-cli",
    packageVersion: "0.1.0",
    env: createDeepSeekCredentialPresenceEnv(),
    ignoredPaths: [".env", ".env.*", "参考/"],
    availableCommands: ["node", "npm"],
    config: {},
    initialized: false
  };
}

function isReadinessCommand(value: string | undefined): value is ReadinessCommandName {
  return typeof value === "string" && readinessCommands.has(value as ReadinessCommandName);
}

export function isCliEntryPoint(entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isCliEntryPoint()) {
  await runCli(process.argv.slice(2));
}
