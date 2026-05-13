#!/usr/bin/env node
import { runCli } from "./entry/run-cli.js";
import { isCliEntryPoint } from "./entry/main.js";

export type {
  CliCommand,
  CliInputChunk,
  CliInputStream,
  CliOptions,
  CliRunOptions,
  CliRuntimeFactoryOptions,
  CliTerminalFlags,
  CliWrite
} from "./types.js";
export { cliUsageLines, parseCliArgs } from "./commands/parse.js";
export { collectIndexProviderResult, renderIndexProviderResult } from "./commands/index-provider.js";
export { renderReadinessText } from "./commands/readiness.js";
export { runCli } from "./entry/run-cli.js";
export { isCliEntryPoint } from "./entry/main.js";

if (isCliEntryPoint(process.argv[1], import.meta.url)) {
  void runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "DeepSeek CLI failed.");
    process.exitCode = 1;
  });
}
