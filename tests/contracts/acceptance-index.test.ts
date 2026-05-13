import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

describe("acceptance evidence index", () => {
  it("maps index provider safety gates to focused evidence", async () => {
    const index = await readFile("tests/acceptance/acceptance-index.md", "utf8");

    assert.equal(index.includes("| Index provider CLI intent safety |"), true);
    assert.equal(index.includes("| Index provider activation evidence gate |"), true);
    assert.equal(index.includes("| Index provider text evidence rendering |"), true);
    assert.equal(index.includes("| CLI acceptance evidence refresh |"), true);
    assert.equal(index.includes("| CLI task completion evaluation |"), true);
    assert.equal(index.includes("| CLI release diagnostics gate |"), true);
    assert.equal(index.includes("| CLI release verify decision |"), true);
    assert.equal(index.includes("deepseek diagnostics refresh --output json"), true);
    assert.equal(index.includes("deepseek diagnostics evaluate --dry-run --output json"), true);
    assert.equal(index.includes("tests/contracts/index-provider-contracts.test.ts"), true);
    assert.equal(index.includes("tests/e2e/local-readiness-cli.test.ts"), true);
    assert.equal(index.includes("src/apps/cli/test/cli.test.ts"), true);
  });
});
