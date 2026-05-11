import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { runCli } from "../../src/apps/cli/src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const hookStubPath = join(repoRoot, "scripts", "hook-stub.mjs");

describe("CLI loads user hooks from .deepseek/hooks.json", () => {
  it("registers a user hook defined in .deepseek/hooks.json and invokes it during a run", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "deepseek-hooks-"));
    try {
      const outputMarker = join(workspaceRoot, "hook-observed.txt");
      await mkdir(join(workspaceRoot, ".deepseek"), { recursive: true });
      const spec = [
        {
          id: "hook-user-observer",
          name: "user observer",
          version: "0.0.1",
          point: "user-input.before",
          trust: "trusted",
          isolation: "in-process-observe-only",
          failurePolicy: "continue",
          timeoutMs: 5_000,
          permissions: [],
          command: "node",
          args: [hookStubPath, outputMarker]
        }
      ];
      await writeFile(join(workspaceRoot, ".deepseek", "hooks.json"), JSON.stringify(spec), "utf8");

      const cwd = process.cwd();
      try {
        process.chdir(workspaceRoot);
        const lines: string[] = [];
        await runCli(
          ["run", "hello", "--output", "jsonl"],
          (line) => { lines.push(line); },
          [],
          { stdinIsTTY: false, stdoutIsTTY: false }
        );
        const hookEvents = lines
          .map((line) => { try { return JSON.parse(line) as { kind?: string; data?: { point?: string; hookCount?: number } }; } catch { return undefined; } })
          .filter((event): event is { kind?: string; data?: { point?: string; hookCount?: number } } => Boolean(event))
          .filter((event) => event.kind === "hooks.invoked");
        const userInputHook = hookEvents.find((event) => event.data?.point === "user-input.before");
        assert.ok(userInputHook, `expected user-input.before hook event, got kinds=${hookEvents.map((event) => event.data?.point).join(",")}`);
        assert.equal(userInputHook.data?.hookCount, 1);
      } finally {
        process.chdir(cwd);
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("ignores missing .deepseek/hooks.json silently", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "deepseek-hooks-none-"));
    try {
      const cwd = process.cwd();
      try {
        process.chdir(workspaceRoot);
        const lines: string[] = [];
        await runCli(
          ["run", "no hooks", "--output", "jsonl"],
          (line) => { lines.push(line); },
          [],
          { stdinIsTTY: false, stdoutIsTTY: false }
        );
        assert.equal(lines.length > 0, true);
        const parsed = lines.map((line) => JSON.parse(line) as { kind?: string });
        assert.equal(parsed.at(-1)?.kind, "agent.loop.completed");
        const hookEvents = parsed.filter((event) => event.kind === "hooks.invoked");
        assert.equal(hookEvents.every((event) => (event as unknown as { data: { hookCount: number } }).data.hookCount === 0), true);
      } finally {
        process.chdir(cwd);
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
