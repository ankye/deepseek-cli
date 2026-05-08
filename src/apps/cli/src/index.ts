#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CapabilityId, RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

export interface CliOptions {
  readonly command: "turn" | "run";
  readonly prompt: string;
  readonly output: "text" | "stream-json";
  readonly capabilityId?: CapabilityId;
}

export function parseCliArgs(args: readonly string[]): CliOptions {
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

export function isCliEntryPoint(entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isCliEntryPoint()) {
  await runCli(process.argv.slice(2));
}
