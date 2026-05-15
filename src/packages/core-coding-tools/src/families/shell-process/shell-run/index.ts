import type {
  BackgroundTaskManager,
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  ShellProfile,
  ShellRunInput
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { processResultToEvidence, requireDeps, resolveToolPath } from "../../../shared/workspace.js";

export interface ShellRunToolDeps extends CoreCodingToolsDependencies {
  readonly backgroundTasks?: BackgroundTaskManager;
}

export function defineShellRunTool(deps: ShellRunToolDeps | undefined) {
  return defineToolManifest(
    "shell.run",
    coreToolIds.shellRun,
    "Shell Run",
    "process",
    ["process:run"],
    objectSchema(["command"], {
      command: { type: "string" },
      args: { type: "array" },
      cwd: { type: "string" },
      workspaceRoot: { type: "string" },
      timeoutMs: { type: "number" },
      limitBytes: { type: "number" },
      shellProfile: { type: "string" },
      runInBackground: { type: "boolean" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => shellRunTool(input, context, ready as ShellRunToolDeps))
  );
}

async function shellRunTool(input: JsonObject, context: CapabilityExecutionContext, deps: ShellRunToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as ShellRunInput;
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, parsed.cwd ?? ".");
  if (!cwdPath.ok || !cwdPath.value) return failure("shell.run", "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.cwd ?? ".")]);
  const cwd = cwdPath.value.path;

  if (parsed.runInBackground === true) {
    if (!deps.backgroundTasks) {
      return failure("shell.run", "BACKGROUND_TASKS_UNAVAILABLE", "BackgroundTaskManager is not registered in runtime dependencies.", [cwd]);
    }
    const summary = await deps.backgroundTasks.start({ command: parsed.command, args: parsed.args ?? [], cwd });
    return success("shell.run", [cwd], {
      preview: boundedText(`[background] ${summary.taskId} ${parsed.command}`, parsed.limitBytes ?? 8_000),
      metadata: { background: true, taskId: summary.taskId, summary: summary as unknown as JsonObject },
      replay: replay(context),
      status: "completed"
    });
  }

  const shellProfile = typeof parsed.shellProfile === "string" ? parsed.shellProfile as ShellProfile : undefined;
  if (shellProfile) {
    const shell = await deps.platform.resolveShell(shellProfile);
    if (!shell.ok) return failure("shell.run", shell.error?.code ?? "SHELL_UNAVAILABLE", shell.error?.message ?? "Shell unavailable.", [cwd]);
  }
  const processProvider = await deps.platform.resolveProcessProvider();
  if (!processProvider.available) {
    return failure("shell.run", "PROCESS_UNAVAILABLE", processProvider.diagnostics[0]?.message ?? "Process unavailable.", [cwd], { processProvider });
  }
  const result = await deps.platform.runProcess(parsed.command, parsed.args ?? [], { cwd, timeoutMs: parsed.timeoutMs ?? 30_000 });
  return processResultToEvidence("shell.run", result, cwd, context, parsed.limitBytes);
}
