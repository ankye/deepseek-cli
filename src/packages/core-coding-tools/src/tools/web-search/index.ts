import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  RuntimeDependencies,
  SerializableResult,
  WebSearchInput,
  WebSearchProvider
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface WebSearchToolDeps extends CoreCodingToolsDependencies {
  readonly webSearch?: WebSearchProvider;
  readonly runtime?: Pick<RuntimeDependencies, "webSearch">;
}

export function defineWebSearchTool(deps: WebSearchToolDeps | undefined) {
  return defineToolManifest(
    "web.search",
    coreToolIds.webSearch,
    "Web Search",
    "read",
    ["network:read"],
    objectSchema(["query"], {
      query: { type: "string" },
      limit: { type: "number" },
      allowedDomains: { type: "array" },
      blockedDomains: { type: "array" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => webSearchTool(input, context, ready as WebSearchToolDeps))
  );
}

async function webSearchTool(input: JsonObject, context: CapabilityExecutionContext, deps: WebSearchToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as WebSearchInput;
  if (!parsed.query || parsed.query.length < 2) {
    return failure("web.search", "WEB_SEARCH_QUERY_TOO_SHORT", "Search query must be at least 2 characters.", []);
  }
  const provider = deps.webSearch ?? deps.runtime?.webSearch;
  if (!provider) {
    return failure("web.search", "WEB_SEARCH_UNAVAILABLE", "No WebSearchProvider registered in runtime dependencies.", []);
  }
  try {
    const results = await provider.search(parsed);
    const filtered = filterDomains(results, parsed.allowedDomains, parsed.blockedDomains);
    const preview = filtered.map((item) => `- [${item.title}](${item.url})\n  ${item.snippet}`).join("\n");
    return success("web.search", filtered.map((item) => item.url), {
      preview: boundedText(preview, 8_000),
      metadata: { query: parsed.query, count: filtered.length, provider: provider.name, results: filtered as unknown as JsonObject },
      replay: replay(context)
    });
  } catch (error) {
    return failure("web.search", "WEB_SEARCH_PROVIDER_FAILED", error instanceof Error ? error.message : "Web search provider failed.", []);
  }
}

function filterDomains<T extends { url: string }>(items: readonly T[], allowed?: readonly string[], blocked?: readonly string[]): readonly T[] {
  return items.filter((item) => {
    try {
      const host = new URL(item.url).hostname;
      if (allowed && allowed.length > 0 && !allowed.some((domain) => host.endsWith(domain))) return false;
      if (blocked && blocked.length > 0 && blocked.some((domain) => host.endsWith(domain))) return false;
      return true;
    } catch {
      return false;
    }
  });
}
