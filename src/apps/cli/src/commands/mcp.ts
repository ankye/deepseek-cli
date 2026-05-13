import type { JsonObject, McpServerManifest } from "@deepseek/platform-contracts";
import { InMemoryMcpGateway, createRealMcpAdapter } from "@deepseek/mcp-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import type { CliOptions } from "../types.js";

export async function runMcpCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  const manifestPath = options.mcpManifestPath;
  if (!manifestPath) {
    const error = { code: "MCP_MANIFEST_PATH_REQUIRED", message: "deepseek mcp test requires a manifest path" };
    if (options.output === "text") await write(`[mcp failed] ${error.message}`);
    else await write(JSON.stringify({ ok: false, error }));
    return;
  }
  const platform = new NodePlatformRuntime();
  let manifest: McpServerManifest;
  try {
    const raw = await platform.readFile(manifestPath);
    manifest = JSON.parse(raw) as McpServerManifest;
  } catch (error) {
    const err = { code: "MCP_MANIFEST_READ_FAILED", message: error instanceof Error ? error.message : String(error) };
    if (options.output === "text") await write(`[mcp failed] ${err.message}`);
    else await write(JSON.stringify({ ok: false, error: err }));
    return;
  }
  const gateway = new InMemoryMcpGateway();
  const enableReal = options.enableRealMcp === true || realTransportEnvEnabled();
  if (enableReal && manifest.transport?.kind === "stdio") {
    gateway.registerRealTransport("stdio", async (m) => createRealMcpAdapter(m, (command, args) => platform.spawnMcpServer(command, args)));
  }
  try {
    const summary = await gateway.connectServer(manifest);
    if (summary.health !== "connected") {
      const payload = {
        ok: false,
        status: summary.health,
        error: { code: "MCP_TRANSPORT_UNAVAILABLE", message: `MCP server is ${summary.health} (enable --enable-real-mcp?)` },
        summary
      };
      if (options.output === "text") await write(`[mcp ${summary.health}] ${payload.error.message}`);
      else await write(JSON.stringify(payload));
      return;
    }
    const tools = await gateway.listTools({ schemaVersion: "1.0.0", namespace: manifest.namespace });
    let callResult: unknown;
    if (options.mcpCallTool) {
      const input: JsonObject = options.mcpCallInput ? JSON.parse(options.mcpCallInput) as JsonObject : {};
      callResult = await gateway.callTool({
        schemaVersion: "1.0.0",
        serverId: summary.id,
        name: options.mcpCallTool,
        input,
        caller: "command"
      });
    }
    const payload = {
      ok: true,
      status: "completed" as const,
      summary,
      tools,
      ...(callResult ? { call: callResult } : {})
    };
    if (options.output === "text") {
      await write(`[mcp connected] ${summary.id} health=${summary.health} tools=${tools.length}`);
      for (const tool of tools) await write(`  - ${String(tool.qualifiedName ?? tool.name ?? "")}`);
      if (callResult) await write(`  call: ${JSON.stringify(callResult)}`);
    } else {
      await write(JSON.stringify(payload));
    }
  } finally {
    await gateway.disposeAll().catch(() => undefined);
  }
}

function realTransportEnvEnabled(): boolean {
  const proc = globalThis as unknown as { process?: { env?: { MCP_REAL_TRANSPORT?: string } } };
  return proc.process?.env?.MCP_REAL_TRANSPORT === "1";
}
