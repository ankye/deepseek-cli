import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
    } else if (entry.name.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

describe("platform-contracts boundary", () => {
  it("does not import hosts, processes, SDKs, or implementation packages", async () => {
    const files = await walk("src/packages/platform-contracts/src");
    for (const file of files) {
      const content = await readFile(file, "utf8");
      assert.equal(/@deepseek\//.test(content), false, `${file} imports a DeepSeek implementation package`);
      assert.equal(/from\s+["'](?:node:)?(?:fs|child_process|process|vscode)/.test(content), false, `${file} imports a host API`);
      assert.equal(/SDK|sdk/.test(content), false, `${file} references a concrete SDK`);
    }
  });
});
