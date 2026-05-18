import type {
  CapabilityExecutionContext,
  CoreToolResult,
  GitEvidenceInput,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { defineToolManifest, failure, objectSchema } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { processResultToEvidence, requireDeps, resolveToolPath } from "../../../shared/workspace.js";

export function defineGitDiffTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    "git.diff",
    coreToolIds.gitDiff,
    "Git Diff",
    "read",
    ["git:read"],
    objectSchema([], { workspaceRoot: { type: "string" }, limitBytes: { type: "number" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => gitTool(input, context, ready))
  );
}

async function gitTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as GitEvidenceInput;
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, ".");
  if (!cwdPath.ok || !cwdPath.value) return failure("git.diff", "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.workspaceRoot ?? ".")]);
  const cwd = cwdPath.value.path;
  const result = await deps.platform.runProcess("git", ["diff"], {
    cwd,
    executionProfile: "noninteractive",
    stdin: "ignore",
    outputLimitBytes: parsed.limitBytes ?? 16_000
  });
  return processResultToEvidence("git.diff", result, cwd, context, parsed.limitBytes, { gitMode: "diff" });
}
