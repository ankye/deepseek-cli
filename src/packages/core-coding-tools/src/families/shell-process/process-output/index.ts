import type {
  BackgroundTaskManager,
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  ShellOutputInput
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { requireDeps } from "../../../shared/workspace.js";

export interface ShellOutputToolDeps extends CoreCodingToolsDependencies {
  readonly backgroundTasks?: BackgroundTaskManager;
}

export function defineShellOutputTool(deps: ShellOutputToolDeps | undefined) {
  return defineToolManifest(
    "shell.output",
    coreToolIds.shellOutput,
    "Shell Output",
    "read",
    ["process:read"],
    objectSchema(["taskId"], {
      taskId: { type: "string" },
      offsetBytes: { type: "number" },
      limitBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => shellOutputTool(input, context, ready as ShellOutputToolDeps))
  );
}

async function shellOutputTool(input: JsonObject, context: CapabilityExecutionContext, deps: ShellOutputToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as ShellOutputInput;
  if (!deps.backgroundTasks) {
    return failure("shell.output", "BACKGROUND_TASKS_UNAVAILABLE", "BackgroundTaskManager is not registered.", []);
  }
  try {
    const out = await deps.backgroundTasks.output({ taskId: parsed.taskId });
    return success("shell.output", [parsed.taskId], {
      preview: boundedText(`${out.stdout}${out.stderr ? `\n[stderr]\n${out.stderr}` : ""}`, parsed.limitBytes ?? 8_000),
      metadata: { taskId: parsed.taskId, done: out.done, exitCode: out.exitCode ?? null, status: out.status, stdoutOffset: out.stdoutOffset, stderrOffset: out.stderrOffset },
      replay: replay(context),
      status: out.done ? "completed" : "completed"
    });
  } catch (error) {
    return failure("shell.output", "BACKGROUND_TASK_NOT_FOUND", error instanceof Error ? error.message : "Unknown task.", [parsed.taskId]);
  }
}
