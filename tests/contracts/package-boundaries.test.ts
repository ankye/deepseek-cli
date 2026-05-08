import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

describe("package boundaries", () => {
  it("passes dependency boundary checker", () => {
    const result = spawnSync(process.execPath, ["scripts/check-boundaries.mjs"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});
