import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MCP_SCHEMA_VERSION, asId, type McpServerManifest } from "@deepseek/platform-contracts";
import { InMemoryMcpGateway } from "./index.js";

function manifest(overrides: Partial<McpServerManifest> = {}): McpServerManifest {
  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    id: asId<"mcpServer">("mcp-fake"),
    name: "fake",
    version: "1.0.0",
    namespace: "fake",
    source: "built-in" as const,
    trust: "trusted" as const,
    transport: { kind: "fake" as const },
    permissions: ["mcp:read"] as const,
    timeoutMs: 20,
    tools: [{ name: "search", inputSchema: {}, outputSchema: {}, permissions: ["mcp:tool"], timeoutMs: 20 }],
    resources: [{ uri: "mcp://fake/readme", name: "readme", permissions: ["mcp:resource"], cachePolicy: "session" as const }],
    prompts: [{ name: "summarize", argumentsSchema: {} }],
    ...overrides
  };
}

describe("MCP gateway v1", () => {
  it("validates, connects, lists, calls tools, and reads resources", async () => {
    const gateway = new InMemoryMcpGateway();
    const summary = await gateway.connectServer(manifest(), {
      toolHandlers: {
        search: async (input) => ({ ok: true, value: { echoed: input.query, token: "sk-testsecret" } })
      },
      resourceHandlers: {
        "mcp://fake/readme": async () => ({ ok: true, value: { content: "hello TOKEN=supersecret", mimeType: "text/plain" } })
      }
    });

    assert.equal(summary.schemaVersion, MCP_SCHEMA_VERSION);
    assert.equal(summary.health, "connected");
    assert.equal((await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION })).length, 1);
    assert.equal((await gateway.listTools({ schemaVersion: MCP_SCHEMA_VERSION, namespace: "fake" }))[0]?.qualifiedName, "fake.search");
    assert.equal((await gateway.listResources({ schemaVersion: MCP_SCHEMA_VERSION }))[0]?.cachePolicy, "session");
    assert.equal((await gateway.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION }))[0]?.qualifiedName, "fake.summarize");

    const call = await gateway.callTool({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-fake"),
      name: "search",
      caller: "runtime",
      input: { query: "docs" }
    });
    assert.equal(call.status, "completed");
    assert.equal(call.output?.token, "[REDACTED:secret]");
    assert.equal(call.redaction.class, "secret");
    assert.match(call.replayFingerprint, /^h[0-9a-f]+$/);

    const resource = await gateway.readResource({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-fake"),
      uri: "mcp://fake/readme",
      caller: "skill"
    });
    assert.equal(resource.status, "completed");
    assert.equal(resource.content, "hello TOKEN=[REDACTED:secret]");
    assert.equal(resource.redaction.class, "secret");
  });

  it("keeps untrusted, disabled, and unavailable real transports inert", async () => {
    const gateway = new InMemoryMcpGateway();
    await gateway.connectServer(manifest({ id: asId<"mcpServer">("mcp-untrusted"), namespace: "untrusted", trust: "untrusted" }));
    await gateway.connectServer(manifest({ id: asId<"mcpServer">("mcp-disabled"), namespace: "disabled", enabled: false }));
    await gateway.connectServer(manifest({ id: asId<"mcpServer">("mcp-http"), namespace: "http", transport: { kind: "http" as const, endpoint: "https://example.invalid/mcp" } }));

    assert.equal((await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION })).length, 0);
    assert.equal((await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: true })).length, 3);

    const unavailable = await gateway.callTool({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-http"),
      name: "search",
      caller: "runtime",
      input: {}
    });
    assert.equal(unavailable.status, "unavailable");
    assert.equal(unavailable.diagnostics.some((item) => item.code === "MCP_TRANSPORT_UNAVAILABLE"), true);
  });

  it("rejects malformed manifests, namespace collisions, unknown targets, and unsupported request schemas", async () => {
    const gateway = new InMemoryMcpGateway();
    const invalid = await gateway.validateManifest(manifest({ namespace: "../bad" }));
    assert.equal(invalid.ok, false);
    assert.equal(invalid.diagnostics.some((item) => item.code === "MCP_NAMESPACE_INVALID"), true);

    await gateway.connectServer(manifest());
    await assert.rejects(() => gateway.connectServer(manifest({ id: asId<"mcpServer">("mcp-second") })), /MCP_NAMESPACE_COLLISION/);

    const unknown = await gateway.callTool({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-fake"),
      name: "missing",
      caller: "runtime",
      input: {}
    });
    assert.equal(unknown.status, "rejected");
    assert.equal(unknown.diagnostics.some((item) => item.code === "MCP_TOOL_NOT_FOUND"), true);

    const unsupported = await gateway.readResource({
      schemaVersion: "999.0.0",
      serverId: asId<"mcpServer">("mcp-fake"),
      uri: "mcp://fake/readme",
      caller: "runtime"
    });
    assert.equal(unsupported.status, "rejected");
    assert.equal(unsupported.diagnostics.some((item) => item.code === "MCP_SCHEMA_VERSION_UNSUPPORTED"), true);
  });

  it("contains handler timeouts", async () => {
    const gateway = new InMemoryMcpGateway();
    await gateway.connectServer(manifest(), {
      toolHandlers: {
        search: async () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, value: { late: true } }), 30))
      }
    });

    const result = await gateway.callTool({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-fake"),
      name: "search",
      caller: "runtime",
      input: {},
      timeoutMs: 1
    });
    assert.equal(result.status, "timed-out");
    assert.equal(result.durationMs, 1);
  });
});
