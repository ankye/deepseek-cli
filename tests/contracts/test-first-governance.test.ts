import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const gateScript = resolve("scripts/check-test-first-governance.mjs");

async function writeFixtureFile(root: string, path: string, content: string): Promise<void> {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
}

function git(root: string, args: readonly string[]): void {
  const result = spawnSync("git", [...args], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runGate(root: string): { readonly status: number | null; readonly stdout: string; readonly stderr: string; readonly parsed: Record<string, unknown> } {
  const result = spawnSync(process.execPath, [gateScript, "--json"], { cwd: root, encoding: "utf8" });
  const parsed = JSON.parse(result.stdout || "{}") as Record<string, unknown>;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, parsed };
}

async function withFixtureRepo<T>(callback: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), "deepseek-test-first-"));
  try {
    git(root, ["init", "--quiet"]);
    git(root, ["config", "user.email", "test-first@example.invalid"]);
    git(root, ["config", "user.name", "Test First"]);
    await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export const runtime = 1;\n");
    await writeFixtureFile(root, "docs/architecture/system-overview.md", "# System\n");
    git(root, ["add", "."]);
    git(root, ["commit", "--quiet", "-m", "baseline"]);
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("test-first governance gate", () => {
  it("fails implementation changes without focused coverage", async () => {
    await withFixtureRepo(async (root) => {
      await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export const runtime = 2;\n");

      const result = runGate(root);

      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.equal(result.parsed.ok, false);
      assert.equal(result.parsed.ruleId, "test-first/implementation-without-coverage");
      assert.deepEqual(result.parsed.implementationPaths, ["src/packages/runtime/src/index.ts"]);
    });
  });

  it("passes implementation changes with focused tests", async () => {
    await withFixtureRepo(async (root) => {
      await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export const runtime = 2;\n");
      await writeFixtureFile(root, "src/packages/runtime/src/index.test.ts", "import { test } from 'node:test';\ntest('runtime', () => undefined);\n");

      const result = runGate(root);

      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.equal(result.parsed.ok, true);
      assert.deepEqual(result.parsed.testPaths, ["src/packages/runtime/src/index.test.ts"]);
    });
  });

  it("passes docs-only changes", async () => {
    await withFixtureRepo(async (root) => {
      await writeFixtureFile(root, "docs/architecture/system-overview.md", "# System\n\nDocs only.\n");

      const result = runGate(root);

      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.equal(result.parsed.ok, true);
      assert.deepEqual(result.parsed.implementationPaths, []);
    });
  });

  it("does not count generated acceptance evidence as focused implementation coverage", async () => {
    await withFixtureRepo(async (root) => {
      await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export const runtime = 2;\n");
      await writeFixtureFile(root, "tests/acceptance/latest/runtime.json", JSON.stringify({ ok: true }, null, 2));

      const result = runGate(root);

      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.equal(result.parsed.ok, false);
      assert.equal(result.parsed.ruleId, "test-first/implementation-without-coverage");
      assert.deepEqual(result.parsed.testPaths, []);
    });
  });

  it("passes implementation changes with an explicit OpenSpec verification exception", async () => {
    await withFixtureRepo(async (root) => {
      await writeFixtureFile(root, "src/packages/runtime/src/index.ts", "export const runtime = 2;\n");
      await writeFixtureFile(
        root,
        "openspec/changes/non-unit-testable/tasks.md",
        [
          "## 1. Verification",
          "",
          "- [ ] 1.1 Test-first exception: generated compatibility shim cannot be usefully asserted before generation.",
          "- [ ] 1.2 Substitute verification: run snapshot replay and architecture lint after generation.",
          ""
        ].join("\n")
      );

      const result = runGate(root);

      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.equal(result.parsed.ok, true);
      assert.equal(result.parsed.exceptionPath, "openspec/changes/non-unit-testable/tasks.md");
    });
  });
});
