import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { DeterministicToolIntentPreflight, deepSeekToolIntentProfile, normalizeWorkspacePath, prepareProviderIntent } from "../src/index.js";

const visible = [asId<"capability">("core.file.read")];
const deepseek = asId<"modelProvider">("provider-deepseek");

describe("tool intent preflight", () => {
  it("repairs safe workspace-relative paths before execution", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const result = await preflight.check({
      intent: {
        name: "core.file.read",
        source: "model",
        input: { path: "./src/packages/model-gateway/src/index.ts" }
      },
      workspaceRoot: "/repo",
      platform: "linux",
      modelVisibleCapabilities: visible
    });

    assert.equal(result.status, "repaired");
    assert.equal(result.diagnostics.length, 0);
    assert.deepEqual(result.repaired?.input, { path: "src/packages/model-gateway/src/index.ts" });
    assert.equal(result.repairs.some((repair) => repair.modelValue === "/repo/src/packages/model-gateway/src/index.ts"), true);
    assert.equal(result.repairs.some((repair) => repair.kind === "path-prefix-removed"), true);
    assert.equal(result.repairs.some((repair) => repair.kind === "path-normalized"), true);
  });

  it("normalizes Windows separators deterministically", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const result = await preflight.check({
      intent: {
        name: "core.file.read",
        source: "model",
        input: { path: "src/packages/model-gateway/src/index.ts" }
      },
      workspaceRoot: "C:\\repo",
      platform: "windows",
      modelVisibleCapabilities: visible
    });

    assert.equal(result.status, "repaired");
    assert.deepEqual(result.repaired?.input, { path: "src\\packages\\model-gateway\\src\\index.ts" });
    assert.equal(result.repairs.some((repair) => repair.modelValue === "C:\\repo\\src\\packages\\model-gateway\\src\\index.ts"), true);
    assert.equal(result.repairs.some((repair) => repair.kind === "path-separator-normalized"), true);
  });

  it("rejects unsafe absolute paths, parent traversal, home paths, and ambiguous drive-relative paths", () => {
    const unsafe = [
      ["/etc/passwd", "TOOL_INTENT_ABSOLUTE_PATH_REJECTED"],
      ["../secret.txt", "TOOL_INTENT_PARENT_TRAVERSAL_REJECTED"],
      ["~/secret.txt", "TOOL_INTENT_HOME_PATH_REJECTED"],
      ["C:secret.txt", "TOOL_INTENT_AMBIGUOUS_PLATFORM_PATH"]
    ] as const;

    for (const [path, code] of unsafe) {
      const normalized = normalizeWorkspacePath(path, "/repo", "linux");
      assert.equal(normalized.diagnostics[0]?.code, code);
      assert.equal(normalized.value, undefined);
    }
  });

  it("rejects unknown or non-model-visible tools before envelope creation", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const result = await preflight.check({
      intent: {
        name: "write_file",
        source: "model",
        input: { path: "src/index.ts" }
      },
      workspaceRoot: "/repo",
      platform: "linux",
      modelVisibleCapabilities: visible
    });

    assert.equal(result.status, "rejected");
    assert.equal(result.diagnostics[0]?.code, "TOOL_INTENT_UNKNOWN_TOOL");
    assert.equal(result.repaired, undefined);
  });

  it("applies DeepSeek-specific tool aliases and arguments unwrapping before common safety checks", async () => {
    const preflight = new DeterministicToolIntentPreflight();
    const result = await preflight.check({
      providerId: deepseek,
      intent: {
        name: "readFile",
        source: "model",
        input: {
          arguments: JSON.stringify({ path: "./src\\packages\\model-gateway\\src\\index.ts" })
        }
      },
      workspaceRoot: "/repo",
      platform: "linux",
      modelVisibleCapabilities: visible
    });

    assert.equal(result.status, "repaired");
    assert.equal(result.capabilityId, "core.file.read");
    assert.deepEqual(result.repaired?.input, { path: "src/packages/model-gateway/src/index.ts" });
    assert.equal(result.provider?.matched, true);
    assert.equal(result.repairs.some((repair) => repair.kind === "provider-tool-alias-normalized"), true);
    assert.equal(result.repairs.some((repair) => repair.kind === "provider-arguments-unwrapped"), true);
  });

  it("rejects invalid provider argument JSON before execution", () => {
    const prepared = prepareProviderIntent(
      {
        name: "readFile",
        source: "model",
        input: { arguments: "{not-json" }
      },
      deepSeekToolIntentProfile
    );

    assert.equal(prepared.intent.name, "core.file.read");
    assert.equal(prepared.diagnostics[0]?.code, "TOOL_INTENT_PROVIDER_ARGUMENTS_INVALID_JSON");
  });
});
