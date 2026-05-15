import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { asId } from "@deepseek/platform-contracts";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import type { JsonObject, CapabilityExecutionContext, WebSearchProvider, WebFetchProvider } from "@deepseek/platform-contracts";
import { defineWebFetchTool, clearWebFetchCacheForTests } from "../../src/packages/core-coding-tools/src/families/web-public-data/web-fetch/index.js";
import { defineWebSearchTool } from "../../src/packages/core-coding-tools/src/families/web-public-data/web-search/index.js";

function context(): CapabilityExecutionContext {
  return {
    envelope: {
      invocationId: "inv-test",
      capabilityId: asId<"capability">("core.web.fetch"),
      sessionId: asId<"session">("session-test"),
      traceId: "trace-test",
      schemaVersion: "1.0.0",
      caller: "test",
      input: {},
      timeoutMs: 10_000
    } as never,
    trace: { traceId: "trace-test", spanId: "span-test", schemaVersion: "1.0.0" } as never,
    signal: new AbortController().signal,
    metadata: {}
  };
}

describe("core.web.fetch tool", () => {
  it("fetches an HTML page and returns markdown without calling model", async () => {
    clearWebFetchCacheForTests();
    const server = createServer((_req, res) => {
      res.statusCode = 200;
      res.setHeader("content-type", "text/html");
      res.end("<html><body><h1>Hello</h1><p>World from <strong>test</strong>.</p></body></html>");
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    try {
      const deps = createDeterministicRuntimeDependencies();
      const tool = defineWebFetchTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
      const port = (server.address() as AddressInfo).port;
      const result = await tool.execute({ url: `http://127.0.0.1:${port}/page` } as JsonObject, context());
      assert.equal(result.ok, true, `expected ok, got ${JSON.stringify(result)}`);
      const text = String(result.value?.evidence.preview?.text ?? "");
      assert.equal(text.includes("# Hello"), true, `expected markdown heading, got ${text.slice(0, 200)}`);
      assert.equal(text.includes("**test**"), true, `expected bold text, got ${text.slice(0, 200)}`);
      assert.equal(result.value?.evidence.metadata.cached, false);
    } finally {
      server.close();
    }
  });

  it("rejects non-http URLs", async () => {
    clearWebFetchCacheForTests();
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineWebFetchTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ url: "file:///etc/passwd" } as JsonObject, context());
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "WEB_FETCH_URL_REJECTED");
  });

  it("uses injected WebFetchProvider when present", async () => {
    clearWebFetchCacheForTests();
    const calls: string[] = [];
    const provider: WebFetchProvider = {
      name: "stub",
      async fetch(input) {
        calls.push(input.url);
        return {
          metadata: { finalUrl: input.url, status: 200, contentType: "text/markdown", truncated: false, byteLength: 9, summarized: true, redirects: 0, cached: false },
          markdown: "# stubbed",
          summary: "# stubbed summary"
        };
      }
    };
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineWebFetchTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", webFetch: provider });
    const result = await tool.execute({ url: "https://example.test/doc", summarize: true } as JsonObject, context());
    assert.equal(result.ok, true);
    assert.deepEqual(calls, ["https://example.test/doc"]);
    assert.equal(String(result.value?.evidence.preview?.text ?? "").includes("stubbed summary"), true);
  });
});

describe("core.web.search tool", () => {
  it("returns WEB_SEARCH_UNAVAILABLE when no provider registered", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineWebSearchTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ query: "typescript generics" } as JsonObject, context());
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "WEB_SEARCH_UNAVAILABLE");
  });

  it("returns filtered results from injected provider", async () => {
    const provider: WebSearchProvider = {
      name: "stub",
      async search() {
        return [
          { title: "TS handbook", url: "https://typescriptlang.org/docs", snippet: "The TypeScript handbook." },
          { title: "TS release notes", url: "https://blog.example.com/ts", snippet: "Release notes." }
        ];
      }
    };
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineWebSearchTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", webSearch: provider });
    const result = await tool.execute({ query: "typescript", allowedDomains: ["typescriptlang.org"] } as JsonObject, context());
    assert.equal(result.ok, true);
    const results = result.value?.evidence.metadata.results as ReadonlyArray<{ url: string }>;
    assert.equal(results.length, 1);
    assert.equal(results[0]?.url, "https://typescriptlang.org/docs");
  });
});
