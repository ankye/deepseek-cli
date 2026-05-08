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
});
