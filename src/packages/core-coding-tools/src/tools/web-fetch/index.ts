import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  RuntimeDependencies,
  SerializableResult,
  WebFetchInput,
  WebFetchProvider
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import { htmlToMarkdown } from "../../shared/html.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface WebFetchToolDeps extends CoreCodingToolsDependencies {
  readonly webFetch?: WebFetchProvider;
  readonly runtime?: Pick<RuntimeDependencies, "webFetch">;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; markdown: string; metadata: JsonObject }>();

export function defineWebFetchTool(deps: WebFetchToolDeps | undefined) {
  return defineToolManifest(
    "web.fetch",
    coreToolIds.webFetch,
    "Web Fetch",
    "read",
    ["network:read"],
    objectSchema(["url"], {
      url: { type: "string" },
      prompt: { type: "string" },
      summarize: { type: "boolean" },
      limitBytes: { type: "number" },
      followRedirects: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => webFetchTool(input, context, ready as WebFetchToolDeps))
  );
}

async function webFetchTool(input: JsonObject, context: CapabilityExecutionContext, deps: WebFetchToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as WebFetchInput;
  if (!/^https?:\/\//i.test(parsed.url ?? "")) {
    return failure("web.fetch", "WEB_FETCH_URL_REJECTED", "URL must start with http(s)://", []);
  }
  const provider = deps.webFetch ?? deps.runtime?.webFetch;
  const cached = cache.get(parsed.url);
  if (cached && cached.expiresAt > Date.now() && parsed.summarize !== true) {
    return success("web.fetch", [parsed.url], {
      preview: boundedText(cached.markdown, parsed.limitBytes ?? 16_000),
      metadata: { ...cached.metadata, cached: true },
      replay: replay(context)
    });
  }

  if (provider) {
    try {
      const result = await provider.fetch(parsed);
      const markdown = result.summary ?? result.markdown;
      cache.set(parsed.url, { expiresAt: Date.now() + CACHE_TTL_MS, markdown, metadata: result.metadata });
      return success("web.fetch", [result.metadata.finalUrl], {
        preview: boundedText(markdown, parsed.limitBytes ?? 16_000),
        metadata: { ...result.metadata, summarized: Boolean(result.summary), provider: provider.name },
        replay: replay(context)
      });
    } catch (error) {
      return failure("web.fetch", "WEB_FETCH_PROVIDER_FAILED", error instanceof Error ? error.message : "Web fetch provider failed.", [parsed.url]);
    }
  }

  const platform = deps.platform as unknown as {
    httpFetch?: (url: string, options?: JsonObject) => Promise<{
      status: number;
      finalUrl: string;
      headers: Record<string, string>;
      body: string;
      truncated: boolean;
      redirects: number;
    }>;
  };
  if (!platform.httpFetch) {
    return failure("web.fetch", "WEB_FETCH_UNAVAILABLE", "Platform does not expose httpFetch; inject a WebFetchProvider.", [parsed.url]);
  }
  try {
    const response = await platform.httpFetch(parsed.url, {
      maxRedirects: parsed.followRedirects ?? 5,
      maxBytes: 10_000_000
    });
    const markdown = htmlToMarkdown(response.body);
    const metadata: JsonObject = {
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: String(response.headers["content-type"] ?? ""),
      truncated: response.truncated,
      byteLength: response.body.length,
      summarized: false,
      redirects: response.redirects,
      cached: false
    };
    cache.set(parsed.url, { expiresAt: Date.now() + CACHE_TTL_MS, markdown, metadata });
    return success("web.fetch", [response.finalUrl], {
      preview: boundedText(markdown, parsed.limitBytes ?? 16_000),
      metadata,
      replay: replay(context)
    });
  } catch (error) {
    return failure("web.fetch", "WEB_FETCH_FAILED", error instanceof Error ? error.message : "Web fetch failed.", [parsed.url]);
  }
}

export function clearWebFetchCacheForTests(): void {
  cache.clear();
}
