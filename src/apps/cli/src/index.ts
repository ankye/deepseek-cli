#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { RuntimeEvent } from "@deepseek/platform-contracts";
import { createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

export interface CliOptions {
  readonly prompt: string;
  readonly output: "text" | "stream-json";
}

export function parseCliArgs(args: readonly string[]): CliOptions {
  const promptIndex = args.indexOf("-p");
  const prompt = promptIndex >= 0 ? args[promptIndex + 1] ?? "" : args.join(" ");
  const outputFlagIndex = args.indexOf("--output");
  const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "stream-json" ? "stream-json" : "text";
  return { prompt, output };
}

export function renderText(event: RuntimeEvent): string {
  if (event.kind === "model.delta") return String(event.data.text ?? "");
  if (event.kind === "turn.completed") return "[completed]";
  return `[${event.kind}]`;
}

export function renderStreamJson(event: RuntimeEvent): string {
  return JSON.stringify(event);
}

export async function runCli(args: readonly string[], write: (line: string) => void = console.log): Promise<void> {
  const options = parseCliArgs(args);
  const runtime = createHeadlessRuntime(createDeterministicRuntimeDependencies());
  for await (const event of runtime.runTurn({ prompt: options.prompt })) {
    write(options.output === "stream-json" ? renderStreamJson(event) : renderText(event));
  }
  await runtime.dispose();
}

export function isCliEntryPoint(entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isCliEntryPoint()) {
  await runCli(process.argv.slice(2));
}
