#!/usr/bin/env node
// Minimal MCP stdio echo server used as a test fixture.
// Speaks JSON-RPC 2.0 over stdin/stdout with newline framing.
// Supports: initialize, tools/list, tools/call (echo), resources/list/read,
// prompts/list/get, shutdown.
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function ok(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function fail(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

const tools = [
  {
    name: "echo",
    description: "Echo arguments back verbatim.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  }
];

const resources = [
  {
    uri: "mcp://family/readme",
    name: "readme",
    mimeType: "text/plain",
    description: "Native MCP coverage resource."
  }
];

const prompts = [
  {
    name: "summarize",
    description: "Summarize a topic.",
    arguments: [
      { name: "topic", description: "Topic to summarize", required: true }
    ]
  }
];

rl.on("line", (raw) => {
  const line = raw.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.method === "initialize") {
    ok(msg.id, { protocolVersion: "2024-11-05", serverInfo: { name: "echo", version: "0.0.1" }, capabilities: { tools: {}, resources: {}, prompts: {} } });
    return;
  }
  if (msg.method === "tools/list") {
    ok(msg.id, { tools });
    return;
  }
  if (msg.method === "tools/call") {
    const name = msg.params?.name;
    const args = msg.params?.arguments ?? {};
    if (name === "echo") {
      ok(msg.id, { content: [{ type: "text", text: typeof args.text === "string" ? args.text : JSON.stringify(args) }] });
      return;
    }
    fail(msg.id, -32601, `Unknown tool: ${name}`);
    return;
  }
  if (msg.method === "resources/list") {
    ok(msg.id, { resources });
    return;
  }
  if (msg.method === "resources/read") {
    const uri = msg.params?.uri;
    if (uri === "mcp://family/readme") {
      ok(msg.id, { contents: [{ uri, mimeType: "text/plain", text: "native MCP resource for live tool coverage" }] });
      return;
    }
    fail(msg.id, -32602, `Unknown resource: ${uri}`);
    return;
  }
  if (msg.method === "prompts/list") {
    ok(msg.id, { prompts });
    return;
  }
  if (msg.method === "prompts/get") {
    const name = msg.params?.name;
    if (name === "summarize") {
      ok(msg.id, { description: "Summarize a topic.", messages: [{ role: "user", content: { type: "text", text: `Summarize ${msg.params?.arguments?.topic ?? "coverage"}` } }] });
      return;
    }
    fail(msg.id, -32602, `Unknown prompt: ${name}`);
    return;
  }
  if (msg.method === "shutdown") {
    ok(msg.id ?? null, {});
    setTimeout(() => process.exit(0), 10);
    return;
  }
  if (msg.method === "notifications/initialized") return;
  if (typeof msg.id === "number" || typeof msg.id === "string") {
    fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
});

rl.on("close", () => process.exit(0));
