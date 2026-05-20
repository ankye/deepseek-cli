import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function specFiles(root = "openspec/specs"): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await specFiles(path));
    } else if (entry.name === "spec.md") {
      files.push(path.replace(/\\/g, "/"));
    }
  }
  return files.sort();
}

function purposeBlock(content: string): string | undefined {
  const match = content.match(/## Purpose\s+([\s\S]*?)(?=\n## Requirements|\n## ADDED Requirements|\n## MODIFIED Requirements|\n## REMOVED Requirements|$)/);
  return match?.[1]?.trim();
}

describe("OpenSpec canonical purpose hygiene", () => {
  it("requires non-placeholder bilingual Purpose text in canonical specs", async () => {
    const failures: string[] = [];
    for (const file of await specFiles()) {
      const purpose = purposeBlock(await readFile(file, "utf8"));
      if (!purpose) {
        failures.push(`${file}: missing Purpose section`);
        continue;
      }
      if (purpose.includes("TBD - created by archiving change")) {
        failures.push(`${file}: generated Purpose placeholder remains`);
      }
      if (!/[A-Za-z]/.test(purpose) || !/\p{Script=Han}/u.test(purpose)) {
        failures.push(`${file}: Purpose must include English and Chinese text`);
      }
    }
    assert.deepEqual(failures, []);
  });
});
