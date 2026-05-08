import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFakePlatformMatrix } from "@deepseek/testing-regression";

describe("fake platform matrix", () => {
  it("covers macOS, Windows, and Linux fallback behavior", async () => {
    const matrix = createFakePlatformMatrix();
    assert.deepEqual(
      matrix.map((platform) => platform.os),
      ["macos", "windows", "linux"]
    );
    for (const platform of matrix) {
      assert.equal((await platform.runProcess("echo", ["ok"])).exitCode, 0);
    }
  });

  it("covers config paths, workspace metadata paths, and atomic write behavior", async () => {
    const matrix = createFakePlatformMatrix();
    const userPaths = matrix.map((platform) => platform.userConfigPath("deepseek"));

    assert.equal(userPaths.some((path) => path.includes("AppData")), true);
    assert.equal(userPaths.some((path) => path.includes("Application Support")), true);
    assert.equal(userPaths.some((path) => path.includes(".config")), true);

    for (const platform of matrix) {
      const metadata = platform.workspaceMetadataPath("/repo", "deepseek");
      assert.equal(metadata.ok, true);
      assert.equal(metadata.value?.includes(".deepseek"), true);
      const write = await platform.atomicWriteFile(metadata.value ?? "/repo/.deepseek/config.json", "{}");
      assert.equal(write.ok, true);
      assert.equal((await platform.permissionDiagnostics(metadata.value ?? "")).length > 0, true);
    }
  });
});
