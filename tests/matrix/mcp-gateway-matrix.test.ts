import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MCP_SCHEMA_VERSION, asId, type McpServerManifest } from "@deepseek/platform-contracts";
import { InMemoryMcpGateway } from "@deepseek/mcp-gateway";

function base(id: string, namespace: string, overrides: Partial<McpServerManifest> = {}): McpServerManifest {
  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    id: asId<"mcpServer">(id),
    name: namespace,
    version: "1.0.0",
    namespace,
    source: "built-in" as const,
    trust: "trusted" as const,
    transport: { kind: "fake" as const },
    permissions: [],
    timeoutMs: 10,
    tools: [{ name: "lookup", inputSchema: {}, permissions: [] }],
    resources: [{ uri: `mcp://${namespace}/resource`, name: "resource", permissions: [], cachePolicy: "no-store" as const }],
    ...overrides
  };
}

describe("MCP gateway matrix", () => {
  it("covers trust, disabled, malformed, transport, target, timeout, and redaction modes", async () => {
    const gateway = new InMemoryMcpGateway();
    await gateway.connectServer(base("mcp-trusted", "trusted"), {
      toolHandlers: { lookup: async () => ({ ok: true, value: { result: "ok" } }) },
      resourceHandlers: { "mcp://trusted/resource": async () => ({ ok: true, value: { content: "ok" } }) }
    });
    await gateway.connectServer(base("mcp-workspace", "workspace", { trust: "workspace" }));
    await gateway.connectServer(base("mcp-untrusted", "untrusted", { trust: "untrusted" }));
    await gateway.connectServer(base("mcp-disabled", "disabled", { enabled: false }));
    await gateway.connectServer(base("mcp-http", "http", { transport: { kind: "http" as const, endpoint: "https://example.invalid/mcp" } }));

    assert.equal((await gateway.validateManifest(base("mcp-bad", "Bad Namespace"))).ok, false);
    await assert.rejects(() => gateway.connectServer(base("mcp-collision", "trusted")), /MCP_NAMESPACE_COLLISION/);

    const visible = await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION });
    const inert = await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: true });
    assert.deepEqual(visible.map((item) => item.namespace), ["trusted", "workspace"]);
    assert.equal(inert.length, 5);

    const unknownTool = await gateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-trusted"), name: "missing", caller: "test", input: {} });
    const unknownResource = await gateway.readResource({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-trusted"), uri: "mcp://trusted/missing", caller: "test" });
    const unavailable = await gateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-http"), name: "lookup", caller: "test", input: {} });
    assert.equal(unknownTool.status, "rejected");
    assert.equal(unknownResource.status, "rejected");
    assert.equal(unavailable.status, "unavailable");

    const timeoutGateway = new InMemoryMcpGateway();
    await timeoutGateway.connectServer(base("mcp-timeout", "timeout"), {
      toolHandlers: { lookup: async () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, value: { late: true } }), 30)) }
    });
    const timedOut = await timeoutGateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-timeout"), name: "lookup", caller: "test", input: {}, timeoutMs: 1 });
    assert.equal(timedOut.status, "timed-out");

    const secretGateway = new InMemoryMcpGateway();
    await secretGateway.connectServer(base("mcp-secret", "secret"), {
      toolHandlers: { lookup: async () => ({ ok: true, value: { secret: "sk-abc123456789" } }) }
    });
    const secret = await secretGateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-secret"), name: "lookup", caller: "test", input: {} });
    assert.equal(secret.output?.secret, "[REDACTED:secret]");
  });
});
