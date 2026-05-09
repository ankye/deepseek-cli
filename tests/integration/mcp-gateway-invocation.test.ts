import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MCP_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("MCP gateway integration", () => {
  it("records governed MCP evidence without mutating owner subsystems", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.mcp.connectServer(
      {
        schemaVersion: MCP_SCHEMA_VERSION,
        id: asId<"mcpServer">("mcp-integration"),
        name: "integration",
        version: "1.0.0",
        namespace: "integration",
        source: "built-in",
        trust: "trusted",
        transport: { kind: "fake" },
        permissions: ["mcp:read"],
        timeoutMs: 100,
        tools: [{ name: "lookup", inputSchema: {}, permissions: ["mcp:tool"] }],
        resources: [{ uri: "mcp://integration/context", name: "context", permissions: ["mcp:resource"], cachePolicy: "session" }],
        prompts: [{ name: "explain" }]
      },
      {
        toolHandlers: {
          lookup: async () => ({ ok: true, value: { result: "ok" } })
        },
        resourceHandlers: {
          "mcp://integration/context": async () => ({ ok: true, value: { content: "context" } })
        }
      }
    );

    const beforeCapabilities = await deps.capabilities.listModelVisible();
    const tools = await deps.mcp.listTools({ schemaVersion: MCP_SCHEMA_VERSION, namespace: "integration" });
    const prompts = await deps.mcp.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION, namespace: "integration" });
    const call = await deps.mcp.callTool({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-integration"),
      name: "lookup",
      caller: "runtime",
      input: { q: "x" }
    });
    const resource = await deps.mcp.readResource({
      schemaVersion: MCP_SCHEMA_VERSION,
      serverId: asId<"mcpServer">("mcp-integration"),
      uri: "mcp://integration/context",
      caller: "runtime"
    });
    const afterCapabilities = await deps.capabilities.listModelVisible();

    assert.equal(tools.length, 1);
    assert.equal(prompts.length, 1);
    assert.equal(call.status, "completed");
    assert.equal(resource.status, "completed");
    assert.deepEqual(afterCapabilities, beforeCapabilities);
  });
});
