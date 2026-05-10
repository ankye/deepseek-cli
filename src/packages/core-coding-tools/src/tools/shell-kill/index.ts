import type {
  BackgroundTaskManager,
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  ShellKillInput
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface ShellKillToolDeps extends CoreCodingToolsDependencies {
  readonly backgroundTasks?: BackgroundTaskManager;
}

export function defineShellKillTool(deps: ShellKillToolDeps | undefined) {
  return defineToolManifest(
    "shell.kill",
    coreToolIds.shellKill,
    "Shell Kill",
    "process",
    ["process:kill"],
    objectSchema(["taskId"], { taskId: { type: "string" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => shellKillTool(input, context, ready as ShellKillToolDeps))
  );
}

async function shellKillTool(input: JsonObject, context: CapabilityExecutionContext, deps: ShellKillToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as ShellKillInput;
  if (!deps.backgroundTasks) {
    return failure("shell.kill", "BACKGROUND_TASKS_UNAVAILABLE", "BackgroundTaskManager is not registered.", []);
  }
  try {
    const summary = await deps.backgroundTasks.kill({ taskId: parsed.taskId });
    return success("shell.kill", [parsed.taskId], {
      preview: boundedText(`[killed] ${summary.taskId} status=${summary.status}`, 1_000),
      metadata: { taskId: summary.taskId, status: summary.status, exitCode: summary.exitCode ?? null, done: summary.done },
      replay: replay(context)
    });
  } catch (error) {
    return failure("shell.kill", "BACKGROUND_TASK_NOT_FOUND", error instanceof Error ? error.message : "Unknown task.", [parsed.taskId]);
  }
}
