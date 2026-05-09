import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MCP_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemoryMcpGateway } from "@deepseek/mcp-gateway";

describe("MCP gateway contracts", () => {
  it("uses canonical v1 DTOs and fake substitutability", async () => {
    const gateway = new InMemoryMcpGateway();
    const validation = await gateway.validateManifest({
      id: asId<"mcpServer">("mcp-contract"),
      name: "contract",
      version: "1.0.0",
      namespace: "contract",
      source: "built-in",
      trust: "trusted",
      transport: { kind: "fake" },
      permissions: [],
      timeoutMs: 100,
      tools: [{ name: "lookup", inputSchema: {}, permissions: [] }],
      resources: [{ uri: "mcp://contract/resource", name: "resource", permissions: [], cachePolicy: "no-store" }],
      prompts: [{ name: "prompt" }]
    });

    assert.equal(validation.schemaVersion, MCP_SCHEMA_VERSION);
    assert.equal(validation.ok, true);
    assert.equal(validation.normalized?.schemaVersion, MCP_SCHEMA_VERSION);

    await gateway.connectServer(validation.normalized!, {
      toolHandlers: {
        lookup: async () => ({ ok: true, value: { value: "contract" } })
      },
      resourceHandlers: {
        "mcp://contract/resource": async () => ({ ok: true, value: { content: "contract" } })
      }
    });

    const [server] = await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION });
    const [tool] = await gateway.listTools({ schemaVersion: MCP_SCHEMA_VERSION });
    const [resource] = await gateway.listResources({ schemaVersion: MCP_SCHEMA_VERSION });
    const [prompt] = await gateway.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION });
    const call = await gateway.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-contract"), name: "lookup", caller: "test", input: {} });
    const read = await gateway.readResource({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-contract"), uri: "mcp://contract/resource", caller: "test" });

    for (const subject of [server, tool, resource, prompt, call, read]) {
      assert.equal(subject?.schemaVersion, MCP_SCHEMA_VERSION);
    }
    assert.equal(call.status, "completed");
    assert.equal(read.status, "completed");
  });
});
