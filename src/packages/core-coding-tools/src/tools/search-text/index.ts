import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SearchTextInput,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export function defineSearchTextTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    "search.text",
    coreToolIds.searchText,
    "Search Text",
    "read",
    ["workspace:read"],
    objectSchema(["pattern"], { pattern: { type: "string" }, workspaceRoot: { type: "string" }, limit: { type: "number" }, limitBytes: { type: "number" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => searchTextTool(input, context, ready))
  );
}

async function searchTextTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as SearchTextInput;
  const root = parsed.workspaceRoot ?? deps.workspaceRoot;
  const results = (await deps.platform.searchText(parsed.pattern, root)).slice(0, parsed.limit ?? 50);
  return success("search.text", results.map((result) => result.path), {
    preview: boundedText(results.map((result) => `${result.path}:${result.line}: ${result.text}`).join("\n"), parsed.limitBytes),
    provider: results[0]?.metadata,
    metadata: { pattern: parsed.pattern, count: results.length },
    replay: replay(context)
  });
}
