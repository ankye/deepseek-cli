import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { StdioMcpClient } from "../../src/packages/mcp-gateway/src/stdio-client.js";

const here = dirname(fileURLToPath(import.meta.url));
const echoServerPath = resolve(here, "..", "..", "scripts", "mcp-echo-server.mjs");

function launchEcho() {
  const child = spawn(process.execPath, [echoServerPath], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  return child;
}

describe("StdioMcpClient against the echo server", () => {
  it("initializes, lists one tool, calls echo, and shuts down", async () => {
    const child = launchEcho();
    try {
      const client = new StdioMcpClient({
        stdin: child.stdin,
        stdout: child.stdout,
        timeoutMs: 5000
      });

      const init = await client.initialize();
      assert.equal(typeof (init as { protocolVersion?: string }).protocolVersion, "string");

      const tools = await client.listTools();
      const toolList = (tools as { tools?: readonly { name?: string }[] }).tools ?? [];
      assert.equal(toolList.length, 1);
      assert.equal(toolList[0]?.name, "echo");

      const call = await client.callTool("echo", { text: "hello mcp" });
      const content = (call as { content?: readonly { type?: string; text?: string }[] }).content ?? [];
      assert.equal(content[0]?.type, "text");
      assert.equal(content[0]?.text, "hello mcp");

      await client.shutdown();
      client.dispose("test done");
    } finally {
      await new Promise<void>((r) => {
        child.once("exit", () => r());
        child.kill();
      });
    }
  });

  it("times out when the server does not respond", async () => {
    // Launch a script that reads input but never writes a response.
    const noop = spawn(process.execPath, ["-e", "process.stdin.resume();"], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    try {
      const client = new StdioMcpClient({
        stdin: noop.stdin,
        stdout: noop.stdout,
        timeoutMs: 100
      });
      await assert.rejects(
        () => client.initialize(),
        /MCP request timed out after 100ms/
      );
      client.dispose("test done");
    } finally {
      await new Promise<void>((r) => {
        noop.once("exit", () => r());
        noop.kill();
      });
    }
  });

  it("propagates JSON-RPC error responses as rejected promises", async () => {
    const child = launchEcho();
    try {
      const client = new StdioMcpClient({
        stdin: child.stdin,
        stdout: child.stdout,
        timeoutMs: 5000
      });
      await client.initialize();
      await assert.rejects(
        () => client.callTool("does-not-exist", {}),
        /MCP error -32601/
      );
      client.dispose("test done");
    } finally {
      await new Promise<void>((r) => {
        child.once("exit", () => r());
        child.kill();
      });
    }
  });
});
