import type { AgentLoopOutputMode, RuntimeEvent } from "@deepseek/platform-contracts";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";
import { renderJsonLine, renderText } from "../renderers/runtime-events.js";

export async function runCoreToolsSmoke(write: (line: string) => Promise<void>, output: AgentLoopOutputMode): Promise<void> {
  const deps = createDeterministicRuntimeDependencies();
  const workspaceRoot = "/workspace";
  await deps.platform.writeFile(`${workspaceRoot}/README.md`, "hello core tools\n");
  await registerDeterministicCoreTools(deps, workspaceRoot);
  const kernel = await createDefaultRuntimeKernel(deps);
  try {
    const sequences = [
      { capabilityId: coreToolIds.fileRead, input: { path: "README.md", workspaceRoot } },
      { capabilityId: coreToolIds.fileEdit, input: { path: "README.md", expected: "hello", replacement: "hello governed", workspaceRoot } },
      { capabilityId: coreToolIds.testRun, input: { command: "npm", args: ["test"], workspaceRoot, intent: "smoke" } }
    ];
    const events: RuntimeEvent[] = [];
    for (const step of sequences) {
      const stepEvents = await collectRuntimeEvents(kernel.execute({
        capabilityId: step.capabilityId,
        caller: "cli.tools-smoke",
        input: step.input
      }));
      events.push(...stepEvents);
      for (const event of stepEvents) {
        if (output === "jsonl") await write(renderJsonLine(event));
        if (output === "text") {
          const line = renderText(event);
          if (line) await write(line);
        }
      }
    }
    if (output === "json") {
      await write(JSON.stringify({ schemaVersion: "1.0.0", status: "completed", eventCount: events.length, redaction: { class: "internal" } }));
    }
  } finally {
    await kernel.shutdown();
  }
}
