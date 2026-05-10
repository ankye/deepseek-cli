import type {
  JsonObject,
  McpResourceHandler,
  McpServerAdapter,
  McpServerManifest,
  McpToolHandler,
  RedactedError,
  SerializableResult
} from "@deepseek/platform-contracts";
import type { Readable, Writable } from "node:stream";
import { StdioMcpClient } from "./stdio-client.js";

export interface McpSubprocess {
  readonly stdin: Writable;
  readonly stdout: Readable;
  readonly stderr?: Readable;
  readonly kill: (signal?: "SIGTERM" | "SIGKILL") => void;
  readonly exit: Promise<number>;
}

export type McpProcessRunner = (command: string, args: readonly string[]) => McpSubprocess;

export interface RealMcpAdapterHandle {
  readonly adapter: McpServerAdapter;
  readonly dispose: () => Promise<void>;
}

export async function createRealMcpAdapter(manifest: McpServerManifest, runner: McpProcessRunner): Promise<RealMcpAdapterHandle> {
  if (manifest.transport.kind !== "stdio") {
    throw new Error(`Real transport not implemented for kind: ${manifest.transport.kind}`);
  }
  const command = manifest.transport.command;
  if (!command) throw new Error("stdio MCP transport requires manifest.transport.command");
  const args = readArgs(manifest.transport.metadata);
  const subprocess = runner(command, args);
  const client = new StdioMcpClient({
    stdin: subprocess.stdin,
    stdout: subprocess.stdout,
    timeoutMs: manifest.timeoutMs
  });

  await client.initialize();

  const toolHandlers: Record<string, McpToolHandler> = {};
  for (const tool of manifest.tools ?? []) {
    toolHandlers[tool.name] = async (input: JsonObject): Promise<SerializableResult<JsonObject>> => {
      try {
        const raw = await client.callTool(tool.name, input);
        return { ok: true, value: raw };
      } catch (error) {
        return { ok: false, error: classifyToolError(tool.name, error) };
      }
    };
  }

  const resourceHandlers: Record<string, McpResourceHandler> = {};
  for (const resource of manifest.resources ?? []) {
    resourceHandlers[resource.uri] = async (): Promise<SerializableResult<{ content: string; mimeType?: string; metadata?: JsonObject }>> => {
      try {
        const raw = await client.readResource(resource.uri);
        const content = typeof raw.contents === "object" && raw.contents !== null && !Array.isArray(raw.contents)
          ? extractContentText(raw.contents as JsonObject)
          : typeof raw.text === "string"
            ? raw.text
            : JSON.stringify(raw);
        return {
          ok: true,
          value: {
            content,
            ...(resource.mimeType ? { mimeType: resource.mimeType } : {}),
            metadata: { raw }
          }
        };
      } catch (error) {
        return { ok: false, error: classifyResourceError(resource.uri, error) };
      }
    };
  }

  let disposed = false;
  const dispose = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    try { await client.shutdown(); } catch { /* best-effort */ }
    client.dispose("adapter disposed");
    subprocess.kill("SIGTERM");
    const raceTimer = setTimeout(() => subprocess.kill("SIGKILL"), 2000);
    try {
      await subprocess.exit;
    } finally {
      clearTimeout(raceTimer);
    }
  };

  return {
    adapter: { toolHandlers, resourceHandlers },
    dispose
  };
}

function readArgs(metadata: JsonObject | undefined): readonly string[] {
  if (!metadata) return [];
  const args = metadata.args;
  if (!Array.isArray(args)) return [];
  return args.filter((arg): arg is string => typeof arg === "string");
}

function extractContentText(value: JsonObject): string {
  if (typeof value.text === "string") return value.text;
  if (Array.isArray(value.content)) {
    return value.content
      .map((item) => (typeof item === "object" && item !== null && typeof (item as JsonObject).text === "string" ? String((item as JsonObject).text) : ""))
      .join("");
  }
  return JSON.stringify(value);
}

function classifyToolError(name: string, error: unknown): RedactedError {
  const message = error instanceof Error ? error.message : String(error);
  const code = /timed out/i.test(message) ? "MCP_TOOL_TIMEOUT" : "MCP_TOOL_REAL_FAILED";
  return { code, message: `MCP tool '${name}' failed: ${message}`, retryable: false, redaction: { class: "internal" } };
}

function classifyResourceError(uri: string, error: unknown): RedactedError {
  const message = error instanceof Error ? error.message : String(error);
  const code = /timed out/i.test(message) ? "MCP_RESOURCE_TIMEOUT" : "MCP_RESOURCE_REAL_FAILED";
  return { code, message: `MCP resource '${uri}' failed: ${message}`, retryable: false, redaction: { class: "internal" } };
}
