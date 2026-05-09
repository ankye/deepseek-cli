import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MCP_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemoryMcpGateway } from "@deepseek/mcp-gateway";

describe("MCP gateway golden replay", () => {
  it("normalizes MCP discovery, invocation, resource, and failure evidence", async () => {
    const gateway = new InMemoryMcpGateway();
    await gateway.connectServer(
      {
        schemaVersion: MCP_SCHEMA_VERSION,
        id: asId<"mcpServer">("mcp-golden"),
        name: "golden",
        version: "1.0.0",
        namespace: "golden",
        source: "built-in",
        trust: "trusted",
        transport: { kind: "fake" },
        permissions: [],
        timeoutMs: 100,
        tools: [{ name: "lookup", inputSchema: {}, permissions: [] }],
        resources: [{ uri: "mcp://golden/resource", name: "resource", permissions: [], cachePolicy: "session" }],
        prompts: [{ name: "prompt" }]
      },
      {
        toolHandlers: {
          lookup: async () => ({ ok: true, value: { value: "golden" } })
        },
        resourceHandlers: {
          "mcp://golden/resource": async () => ({ ok: true, value: { content: "golden resource" } })
        }
      }
    );

    const tools = await gateway.listTools({ schemaVersion: MCP_SCHEMA_VERSION });
    const prompts = await gateway.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION });
    const call = await gateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-golden"), name: "lookup", caller: "test", input: {} });
    const resource = await gateway.readResource({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-golden"), uri: "mcp://golden/resource", caller: "test" });
    const missing = await gateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-golden"), name: "missing", caller: "test", input: {} });

    const normalized = {
      tools: tools.map((item) => ({ schemaVersion: item.schemaVersion, qualifiedName: item.qualifiedName, trust: item.trust })),
      prompts: prompts.map((item) => ({ schemaVersion: item.schemaVersion, qualifiedName: item.qualifiedName })),
      call: { status: call.status, fingerprint: call.replayFingerprint, diagnostics: call.diagnostics.map((item) => item.code) },
      resource: { status: resource.status, fingerprint: resource.replayFingerprint, cachePolicy: resource.cachePolicy },
      missing: { status: missing.status, diagnostics: missing.diagnostics.map((item) => item.code) }
    };

    assert.deepEqual(normalized, {
      tools: [{ schemaVersion: MCP_SCHEMA_VERSION, qualifiedName: "golden.lookup", trust: "trusted" }],
      prompts: [{ schemaVersion: MCP_SCHEMA_VERSION, qualifiedName: "golden.prompt" }],
      call: { status: "completed", fingerprint: call.replayFingerprint, diagnostics: [] },
      resource: { status: "completed", fingerprint: resource.replayFingerprint, cachePolicy: "session" },
      missing: { status: "rejected", diagnostics: ["MCP_TOOL_NOT_FOUND"] }
    });
    assert.match(call.replayFingerprint, /^h[0-9a-f]+$/);
    assert.match(resource.replayFingerprint, /^h[0-9a-f]+$/);
  });
});
