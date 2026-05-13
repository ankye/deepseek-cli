import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import type { CliOptions, CliRunOptions } from "../types.js";
import { createCliAgentRuntime } from "../host/runtime.js";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";
import { emitAgentLoop, finalAgentLoopEvent, renderFinalJsonIfNeeded, resumeHint } from "../renderers/runtime-events.js";

export async function runOneShotCommand(
  options: CliOptions,
  write: (line: string) => Promise<void>,
  writeInline: (chunk: string) => Promise<void>,
  bufferedInline: boolean,
  terminalProfile: CliTerminalCapabilityProfile,
  runOptions: CliRunOptions
): Promise<void> {
  const workspaceRoot = process.cwd();
  const runtime = await createCliAgentRuntime({ live: options.live, workspaceRoot }, runOptions);
  try {
    const events = await emitAgentLoop(runtime.deps, runtime.kernel, {
      prompt: options.prompt,
      outputMode: options.output,
      workspaceRoot,
      caller: "cli.run",
      profile: defaultDeepSeekProfile,
      live: options.live,
      ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {})
    }, write, writeInline, bufferedInline, undefined, terminalProfile);
    await renderFinalJsonIfNeeded(options.output, events, write);
    if (options.output === "text") {
      const finalSessionId = finalAgentLoopEvent(events)?.sessionId ?? events.at(-1)?.sessionId;
      if (finalSessionId) await write(resumeHint(finalSessionId));
    }
  } finally {
    await runtime.kernel.shutdown("cli-run-completed");
  }
}
