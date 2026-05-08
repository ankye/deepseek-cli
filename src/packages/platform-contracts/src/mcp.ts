import type { JsonObject } from "./common.js";
import type { McpServerId } from "./ids.js";

export interface McpServerManifest {
  readonly id: McpServerId;
  readonly name: string;
  readonly transport: "stdio" | "http" | "fake";
  readonly namespace: string;
  readonly trust: "trusted" | "workspace" | "untrusted";
  readonly timeoutMs: number;
}

export interface McpGateway {
  connect(manifest: McpServerManifest): Promise<void>;
  listTools(namespace?: string): Promise<readonly JsonObject[]>;
  callTool(namespace: string, name: string, input: JsonObject): Promise<JsonObject>;
}
