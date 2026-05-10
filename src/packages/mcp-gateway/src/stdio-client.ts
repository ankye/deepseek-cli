import type { JsonObject } from "@deepseek/platform-contracts";
import type { Readable, Writable } from "node:stream";

type PendingEntry = {
  readonly resolve: (value: JsonObject) => void;
  readonly reject: (error: Error) => void;
  readonly timer: NodeJS.Timeout;
};

export interface StdioMcpClientOptions {
  readonly stdin: Writable;
  readonly stdout: Readable;
  readonly timeoutMs: number;
  readonly onStderr?: (chunk: string) => void;
}

export class StdioMcpClient {
  private nextId = 1;
  private readonly pending = new Map<number, PendingEntry>();
  private buffer = "";
  private closed = false;

  constructor(private readonly options: StdioMcpClientOptions) {
    options.stdout.setEncoding?.("utf8");
    options.stdout.on("data", (chunk: string | Buffer) => this.onChunk(chunk));
    options.stdout.on("close", () => this.onClose(new Error("MCP stdout closed")));
    options.stdout.on("error", (error: Error) => this.onClose(error));
  }

  async initialize(clientName = "deepseek-cli", clientVersion = "0.1.3"): Promise<JsonObject> {
    const result = await this.call("initialize", {
      protocolVersion: "2024-11-05",
      clientInfo: { name: clientName, version: clientVersion },
      capabilities: {}
    });
    this.notify("notifications/initialized", {});
    return result;
  }

  async listTools(): Promise<JsonObject> {
    return this.call("tools/list", {});
  }

  async callTool(name: string, args: JsonObject): Promise<JsonObject> {
    return this.call("tools/call", { name, arguments: args });
  }

  async listResources(): Promise<JsonObject> {
    return this.call("resources/list", {});
  }

  async readResource(uri: string): Promise<JsonObject> {
    return this.call("resources/read", { uri });
  }

  async shutdown(): Promise<void> {
    try {
      await this.call("shutdown", {});
    } catch {
      // ignore; best-effort
    }
  }

  dispose(reason = "client disposed"): void {
    this.closed = true;
    const error = new Error(reason);
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    this.pending.clear();
  }

  private async call(method: string, params: JsonObject): Promise<JsonObject> {
    if (this.closed) throw new Error("MCP client already closed");
    const id = this.nextId++;
    return new Promise<JsonObject>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`MCP request timed out after ${this.options.timeoutMs}ms: ${method}`));
      }, this.options.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.writeLine({ jsonrpc: "2.0", id, method, params });
    });
  }

  private notify(method: string, params: JsonObject): void {
    if (this.closed) return;
    this.writeLine({ jsonrpc: "2.0", method, params });
  }

  private writeLine(message: JsonObject): void {
    try {
      this.options.stdin.write(`${JSON.stringify(message)}\n`);
    } catch (error) {
      this.onClose(error instanceof Error ? error : new Error("MCP stdin write failed"));
    }
  }

  private onChunk(chunk: string | Buffer): void {
    this.buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    let idx = this.buffer.indexOf("\n");
    while (idx >= 0) {
      const line = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      if (line.trim().length > 0) this.handleLine(line);
      idx = this.buffer.indexOf("\n");
    }
  }

  private handleLine(line: string): void {
    let message: { id?: number; result?: JsonObject; error?: { code: number; message: string } };
    try {
      message = JSON.parse(line) as typeof message;
    } catch {
      return;
    }
    if (typeof message.id !== "number") return;
    const entry = this.pending.get(message.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(message.id);
    if (message.error) {
      entry.reject(new Error(`MCP error ${message.error.code}: ${message.error.message}`));
      return;
    }
    entry.resolve(message.result ?? {});
  }

  private onClose(error: Error): void {
    if (this.closed) return;
    this.closed = true;
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    this.pending.clear();
  }
}
