import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { runCli } from "../../src/apps/cli/src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const echoServerPath = join(repoRoot, "scripts", "mcp-echo-server.mjs");

async function writeManifest(dir: string): Promise<string> {
  const manifest = {
    id: "echo-server",
    name: "echo",
    version: "0.0.1",
    namespace: "echo",
    source: "built-in",
    trust: "trusted",
    transport: {
      kind: "stdio",
      command: "node",
      metadata: { args: [echoServerPath] }
    },
    permissions: [],
    timeoutMs: 5000,
    tools: [
      { name: "echo", inputSchema: { type: "object", properties: { text: { type: "string" } } }, permissions: [] }
    ]
  };
  const path = join(dir, "manifest.json");
  await writeFile(path, JSON.stringify(manifest), "utf8");
  return path;
}

describe("MCP real transport opt-in", () => {
  it("fails closed without --enable-real-mcp", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-mcp-"));
    try {
      const manifestPath = await writeManifest(dir);
      const lines: string[] = [];
      await runCli(
        ["mcp", "test", manifestPath, "--output", "json"],
        (line) => { lines.push(line); },
        [],
        { stdinIsTTY: false, stdoutIsTTY: false }
      );
      const result = JSON.parse(lines[0] ?? "{}") as { ok?: boolean; status?: string; error?: { code?: string } };
      assert.equal(result.ok, false);
      assert.equal(result.status, "unavailable");
      assert.equal(result.error?.code, "MCP_TRANSPORT_UNAVAILABLE");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("connects and calls the echo tool with --enable-real-mcp", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-mcp-"));
    try {
      const manifestPath = await writeManifest(dir);
      const lines: string[] = [];
      await runCli(
        ["mcp", "test", manifestPath, "--enable-real-mcp", "--call", "echo", "--input", '{"text":"integration"}', "--output", "json"],
        (line) => { lines.push(line); },
        [],
        { stdinIsTTY: false, stdoutIsTTY: false }
      );
      const result = JSON.parse(lines[0] ?? "{}") as {
        ok?: boolean;
        status?: string;
        summary?: { health?: string; id?: string };
        tools?: readonly { name?: string }[];
        call?: { status?: string; output?: { content?: readonly { text?: string }[] } };
      };
      assert.equal(result.ok, true, `expected ok, got ${JSON.stringify(result)}`);
      assert.equal(result.status, "completed");
      assert.equal(result.summary?.health, "connected");
      assert.equal(result.tools?.length, 1);
      assert.equal(result.tools?.[0]?.name, "echo");
      assert.equal(result.call?.status, "completed");
      assert.equal(result.call?.output?.content?.[0]?.text, "integration");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
