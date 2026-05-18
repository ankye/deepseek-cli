import type {
  CapabilityExecutionContext,
  CoreCodingToolName,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { requireDeps, resolveToolPath } from "../../../shared/workspace.js";

const TOOL_NAME = "git.history-branch" as CoreCodingToolName;

interface GitHistoryBranchInput extends JsonObject {
  readonly workspaceRoot?: string;
  readonly limit?: number;
  readonly limitBytes?: number;
  readonly checkoutBranch?: string;
}

export function defineGitHistoryBranchTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.gitHistoryBranch,
    "Git History Branch",
    "read",
    ["git:read"],
    objectSchema([], {
      workspaceRoot: { type: "string" },
      limit: { type: "number" },
      limitBytes: { type: "number" },
      checkoutBranch: { type: "string" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => gitHistoryBranchTool(input, context, ready))
  );
}

async function gitHistoryBranchTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as GitHistoryBranchInput;
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, ".");
  if (!cwdPath.ok || !cwdPath.value) return failure(TOOL_NAME, "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.workspaceRoot ?? ".")]);
  const cwd = cwdPath.value.path;
  const processProvider = await deps.platform.resolveProcessProvider();
  if (!processProvider.available) return failure(TOOL_NAME, "PROCESS_UNAVAILABLE", processProvider.diagnostics[0]?.message ?? "Process unavailable.", [cwd], { processProvider });

  const limit = Number.isFinite(parsed.limit) ? Math.max(1, Math.min(100, Math.floor(parsed.limit ?? 10))) : 10;
  const [current, branches, log] = await Promise.all([
    deps.platform.runProcess("git", ["branch", "--show-current"], { cwd, executionProfile: "noninteractive", stdin: "ignore", outputLimitBytes: parsed.limitBytes ?? 16_000 }),
    deps.platform.runProcess("git", ["branch", "--list", "--no-color"], { cwd, executionProfile: "noninteractive", stdin: "ignore", outputLimitBytes: parsed.limitBytes ?? 16_000 }),
    deps.platform.runProcess("git", ["log", "--oneline", `-${limit}`], { cwd, executionProfile: "noninteractive", stdin: "ignore", outputLimitBytes: parsed.limitBytes ?? 16_000 })
  ]);
  const preview = [
    "current:",
    current.stdout.trim(),
    "branches:",
    branches.stdout.trim(),
    "log:",
    log.stdout.trim(),
    parsed.checkoutBranch ? `checkout preview: git checkout ${parsed.checkoutBranch}` : ""
  ].filter((line) => line.length > 0).join("\n");
  const exitCode = Math.max(current.exitCode, branches.exitCode, log.exitCode);
  return success(TOOL_NAME, [cwd], {
    preview: boundedText(preview, parsed.limitBytes),
    provider: log.metadata,
    metadata: {
      currentBranch: current.stdout.trim(),
      branches: branches.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 100),
      log: log.stdout.split(/\r?\n/).filter(Boolean).slice(0, limit),
      checkoutPreview: parsed.checkoutBranch ? { command: "git", args: ["checkout", parsed.checkoutBranch], mutatesWorkspace: true, applied: false } : undefined,
      exitCode
    },
    replay: replay(context),
    status: exitCode === 0 ? "completed" : "failed"
  });
}
