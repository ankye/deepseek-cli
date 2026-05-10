import type {
  CapabilityExecutionContext,
  CoreToolResult,
  FileReadInput,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, isDiagnostic, objectSchema, replay, success, undefinedError } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps, resolveToolPath } from "../../shared/workspace.js";

export function defineFileReadTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    "file.read",
    coreToolIds.fileRead,
    "File Read",
    "read",
    ["workspace:read"],
    objectSchema(["path"], { path: { type: "string" }, workspaceRoot: { type: "string" }, limitBytes: { type: "number" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => readFileTool(input, context, ready))
  );
}

async function readFileTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileReadInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure("file.read", "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  const content = await deps.platform.readFile(path.value.path).catch((error: unknown) => undefinedError(error, "READ_FAILED"));
  if (isDiagnostic(content)) return failure("file.read", content.code, content.message, [path.value.path]);
  return success("file.read", [path.value.path], {
    preview: boundedText(content, parsed.limitBytes),
    metadata: { path: path.value.path, relativePath: path.value.relativePath },
    replay: replay(context)
  });
}
