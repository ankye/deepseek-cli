import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import type { ToolIntentPreflightRequest } from "@deepseek/platform-contracts";
import { DeterministicToolIntentPreflight } from "@deepseek/tool-intent-preflight";

const visible = [asId<"capability">("core.file.read")];

type Platform = ToolIntentPreflightRequest["platform"];

const platforms: readonly Platform[] = ["windows", "macos", "linux", "fake"];

describe("live-agent-tool-execution preflight matrix", () => {
  it("rejects parent traversal on every platform", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    for (const platform of platforms) {
      const result = await preflight.check({
        intent: { name: "core.file.read", source: "model", input: { path: "../secret" } },
        workspaceRoot: platform === "windows" ? "C:\\repo" : "/repo",
        platform,
        modelVisibleCapabilities: visible
      });
      assert.equal(result.status, "rejected", `expected rejected on ${platform}`);
      assert.equal(result.diagnostics[0]?.code, "TOOL_INTENT_PARENT_TRAVERSAL_REJECTED");
    }
  });

  it("rejects null bytes on every platform", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    for (const platform of platforms) {
      const result = await preflight.check({
        intent: { name: "core.file.read", source: "model", input: { path: "file\x00.txt" } },
        workspaceRoot: platform === "windows" ? "C:\\repo" : "/repo",
        platform,
        modelVisibleCapabilities: visible
      });
      assert.equal(result.status, "rejected", `expected rejected on ${platform}`);
      assert.equal(result.diagnostics[0]?.code, "TOOL_INTENT_NULL_BYTE_REJECTED");
    }
  });

  it("rejects absolute paths on every platform", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const absolutePaths: Record<Platform, string> = {
      windows: "C:\\Windows\\System32",
      macos: "/etc/passwd",
      linux: "/etc/shadow",
      fake: "/fake/abs"
    };
    for (const platform of platforms) {
      const result = await preflight.check({
        intent: { name: "core.file.read", source: "model", input: { path: absolutePaths[platform] } },
        workspaceRoot: platform === "windows" ? "C:\\repo" : "/repo",
        platform,
        modelVisibleCapabilities: visible
      });
      assert.equal(result.status, "rejected", `expected rejected on ${platform}`);
      assert.equal(result.diagnostics[0]?.code, "TOOL_INTENT_ABSOLUTE_PATH_REJECTED");
    }
  });

  it("normalises mixed separators into the platform-native shape without rejecting", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const repaired: Record<Platform, string> = {
      windows: "src\\packages\\runtime\\src\\index.ts",
      macos: "src/packages/runtime/src/index.ts",
      linux: "src/packages/runtime/src/index.ts",
      fake: "src/packages/runtime/src/index.ts"
    };
    for (const platform of platforms) {
      const result = await preflight.check({
        intent: { name: "core.file.read", source: "model", input: { path: "src\\packages/runtime\\src/index.ts" } },
        workspaceRoot: platform === "windows" ? "C:\\repo" : "/repo",
        platform,
        modelVisibleCapabilities: visible
      });
      assert.equal(result.status, "repaired", `expected repaired on ${platform}`);
      assert.deepEqual(result.repaired?.input, { path: repaired[platform] });
    }
  });
});
