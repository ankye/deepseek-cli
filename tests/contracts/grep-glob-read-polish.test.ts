import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { asId } from "@deepseek/platform-contracts";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";
import type { JsonObject, CapabilityExecutionContext } from "@deepseek/platform-contracts";
import { defineSearchTextTool } from "../../src/packages/core-coding-tools/src/families/search-code-intelligence/search-text/index.js";
import { defineFileListTool } from "../../src/packages/core-coding-tools/src/families/workspace-io/file-list/index.js";
import { defineFileReadTool } from "../../src/packages/core-coding-tools/src/families/workspace-io/file-read/index.js";

function context(): CapabilityExecutionContext {
  return {
    envelope: {
      invocationId: "inv-polish",
      capabilityId: asId<"capability">("core.file.read"),
      sessionId: asId<"session">("session-polish"),
      schemaVersion: "1.0.0"
    } as never,
    trace: { traceId: "trace-polish", spanId: "span-polish", schemaVersion: "1.0.0" } as never,
    signal: new AbortController().signal,
    metadata: {}
  };
}

describe("file.read offset/limit", () => {
  it("returns slice of lines with nextOffset metadata", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-read-"));
    try {
      await writeFile(join(root, "file.txt"), "one\ntwo\nthree\nfour\nfive\n", "utf8");
      const platform = new NodePlatformRuntime();
      const workspaceState = new InMemoryWorkspaceStateManager();
      const tool = defineFileReadTool({ platform, workspaceState, workspaceRoot: root });
      const result = await tool.execute({ path: "file.txt", offset: 1, limit: 2 } as JsonObject, context());
      assert.equal(result.ok, true);
      assert.equal(result.value?.evidence.preview?.text, "two\nthree");
      assert.equal(result.value?.evidence.metadata.startLine, 1);
      assert.equal(result.value?.evidence.metadata.endLine, 3);
      assert.equal(result.value?.evidence.metadata.truncatedLines, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns full file when offset/limit omitted (backwards compatible)", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-read-"));
    try {
      await writeFile(join(root, "file.txt"), "hello\nworld\n", "utf8");
      const platform = new NodePlatformRuntime();
      const workspaceState = new InMemoryWorkspaceStateManager();
      const tool = defineFileReadTool({ platform, workspaceState, workspaceRoot: root });
      const result = await tool.execute({ path: "file.txt" } as JsonObject, context());
      assert.equal(result.ok, true);
      assert.equal(result.value?.evidence.preview?.text, "hello\nworld\n");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns base64 for PNG images", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-read-"));
    try {
      const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01, 0x02]);
      await writeFile(join(root, "pixel.png"), png);
      const platform = new NodePlatformRuntime();
      const workspaceState = new InMemoryWorkspaceStateManager();
      const tool = defineFileReadTool({ platform, workspaceState, workspaceRoot: root });
      const result = await tool.execute({ path: "pixel.png" } as JsonObject, context());
      assert.equal(result.ok, true);
      assert.equal(result.value?.evidence.metadata.kind, "image");
      assert.equal(result.value?.evidence.metadata.mime, "image/png");
      assert.equal(typeof result.value?.evidence.metadata.base64, "string");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("file.list mtime sort", () => {
  it("returns files sorted by mtime descending by default", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-list-"));
    try {
      await writeFile(join(root, "a.txt"), "a");
      await writeFile(join(root, "b.txt"), "b");
      await writeFile(join(root, "c.txt"), "c");
      const now = Date.now() / 1000;
      await utimes(join(root, "a.txt"), now - 300, now - 300);
      await utimes(join(root, "b.txt"), now - 100, now - 100);
      await utimes(join(root, "c.txt"), now - 200, now - 200);
      const platform = new NodePlatformRuntime();
      const workspaceState = new InMemoryWorkspaceStateManager();
      const tool = defineFileListTool({ platform, workspaceState, workspaceRoot: root });
      const result = await tool.execute({ pattern: "" } as JsonObject, context());
      assert.equal(result.ok, true);
      const text = String(result.value?.evidence.preview?.text ?? "");
      const order = text.split("\n").map((line) => line.split(/[\\/]/).pop());
      assert.deepEqual(order.slice(0, 3), ["b.txt", "c.txt", "a.txt"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("search.text advanced options", () => {
  it("supports contextLines with outputMode=content", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const platform = deps.platform;
    await platform.writeFile("/workspace/a.txt", "alpha\nbeta\ngamma\ndelta\n");
    const tool = defineSearchTextTool({ platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ pattern: "gamma", outputMode: "content", contextLines: 1 } as JsonObject, context());
    assert.equal(result.ok, true);
    const text = String(result.value?.evidence.preview?.text ?? "");
    assert.equal(text.includes("beta"), true);
    assert.equal(text.includes("gamma"), true);
    assert.equal(text.includes("delta"), true);
  });

  it("filters files via glob", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const platform = deps.platform;
    await platform.writeFile("/workspace/doc.md", "hello markdown\n");
    await platform.writeFile("/workspace/src/code.ts", "hello typescript\n");
    const tool = defineSearchTextTool({ platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ pattern: "hello", glob: "*.ts", outputMode: "files_with_matches" } as JsonObject, context());
    assert.equal(result.ok, true);
    const paths = String(result.value?.evidence.preview?.text ?? "");
    assert.equal(paths.includes("code.ts"), true);
    assert.equal(paths.includes("doc.md"), false);
  });

  it("case insensitive option matches patterns regardless of case", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const platform = deps.platform;
    await platform.writeFile("/workspace/log.txt", "ERROR: bad thing\nerror: low\n");
    const tool = defineSearchTextTool({ platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ pattern: "error", caseInsensitive: true, outputMode: "count" } as JsonObject, context());
    assert.equal(result.ok, true);
    assert.equal(result.value?.evidence.metadata.totalHits, 2);
  });
});
