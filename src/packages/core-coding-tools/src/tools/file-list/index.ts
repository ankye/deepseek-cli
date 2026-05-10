import type {
  CapabilityExecutionContext,
  CoreToolResult,
  FileListInput,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps, resolveToolPath } from "../../shared/workspace.js";

export function defineFileListTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    "file.list",
    coreToolIds.fileList,
    "File List",
    "read",
    ["workspace:read"],
    objectSchema([], { pattern: { type: "string" }, path: { type: "string" }, workspaceRoot: { type: "string" }, limit: { type: "number" }, limitBytes: { type: "number" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => listFilesTool(input, context, ready))
  );
}

async function listFilesTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileListInput;
  const listRoot = resolveToolPath(deps, parsed.workspaceRoot, parsed.path ?? ".");
  if (!listRoot.ok || !listRoot.value) return failure("file.list", "PATH_REJECTED", listRoot.error?.message ?? "Path rejected.", [String(parsed.path ?? ".")]);
  const root = listRoot.value.path;
  const pattern = parsed.pattern ?? "";
  const files = [...await deps.platform.findFiles(pattern, root)].sort().slice(0, parsed.limit ?? 200);
  return success("file.list", files, {
    preview: boundedText(files.join("\n"), parsed.limitBytes ?? 8_000),
    metadata: { pattern, count: files.length, root, relativePath: listRoot.value.relativePath },
    replay: replay(context)
  });
}
