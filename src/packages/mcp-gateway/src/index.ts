import type { JsonObject, McpGateway, McpServerManifest } from "@deepseek/platform-contracts";

export class FakeMcpGateway implements McpGateway {
  private readonly servers = new Map<string, McpServerManifest>();

  async connect(manifest: McpServerManifest): Promise<void> {
    if (manifest.trust === "untrusted") throw new Error("Untrusted MCP servers are disabled by default");
    this.servers.set(manifest.id, manifest);
  }

  async listTools(namespace?: string): Promise<readonly JsonObject[]> {
    return [...this.servers.values()]
      .filter((server) => !namespace || server.namespace === namespace)
      .map((server) => ({ namespace: server.namespace, name: "fake.tool" }));
  }

  async callTool(namespace: string, name: string, input: JsonObject): Promise<JsonObject> {
    return { namespace, name, input, ok: true };
  }
}
