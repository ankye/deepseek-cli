import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RuntimeDependencies } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { PersistentFilesystemSessionStore } from "@deepseek/session-store";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runCli } from "../../src/apps/cli/src/index.js";

describe("session persistence across CLI invocations", () => {
  it("resumes a session written by a prior CLI run from the same persistent directory", async () => {
    const sessionsDir = await mkdtemp(join(tmpdir(), "deepseek-session-integration-"));
    try {
      const firstStore = new PersistentFilesystemSessionStore(sessionsDir);
      const firstDeps: RuntimeDependencies = { ...createDeterministicRuntimeDependencies(), sessions: firstStore };
      await registerRuntimeCoreTools(firstDeps, process.cwd());
      const firstKernel = await createDefaultRuntimeKernel(firstDeps);

      const firstLines: string[] = [];
      await runCli(
        ["run", "persist me", "--output", "jsonl"],
        (line: string) => { firstLines.push(line); },
        [],
        { stdinIsTTY: false, stdoutIsTTY: false },
        { createRuntime: async () => ({ deps: firstDeps, kernel: firstKernel }) }
      );
      const firstEvents = firstLines.map((line) => JSON.parse(line) as { kind: string; sessionId?: string });
      const firstTerminal = firstEvents.find((event) => event.kind === "agent.loop.completed");
      assert.ok(firstTerminal?.sessionId, "first invocation must produce a session id");
      const sessionId = firstTerminal.sessionId;

      const secondStore = new PersistentFilesystemSessionStore(sessionsDir);
      assert.equal((await secondStore.events(sessionId as never)).length > 0, true, "hydrated store must see events from prior invocation");

      const secondDeps: RuntimeDependencies = { ...createDeterministicRuntimeDependencies(), sessions: secondStore };
      await registerRuntimeCoreTools(secondDeps, process.cwd());
      const secondKernel = await createDefaultRuntimeKernel(secondDeps);

      const secondLines: string[] = [];
      await runCli(
        ["session", "resume", sessionId, "--output", "json"],
        (line: string) => { secondLines.push(line); },
        [],
        { stdinIsTTY: false, stdoutIsTTY: false },
        { createRuntime: async () => ({ deps: secondDeps, kernel: secondKernel }) }
      );
      const resume = JSON.parse(secondLines[0] ?? "{}") as { ok?: boolean; value?: { eventCount?: number }; error?: { code?: string } };
      assert.equal(resume.ok, true, `resume failed: ${JSON.stringify(resume.error)}`);
      assert.equal((resume.value?.eventCount ?? 0) > 0, true, `expected eventCount > 0, got ${resume.value?.eventCount}`);
    } finally {
      await rm(sessionsDir, { recursive: true, force: true });
    }
  });

  it("emits a resume hint in text output after a one-shot run", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(deps);

    const lines: string[] = [];
    await runCli(
      ["run", "hint me", "--output", "text"],
      (line: string) => { lines.push(line); },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      { createRuntime: async () => ({ deps, kernel }) }
    );
    const hint = lines.find((line) => line.startsWith("[session] deepseek session resume "));
    assert.ok(hint, `expected resume hint, got: ${JSON.stringify(lines)}`);
  });

  it("includes resumeCommand in JSON one-shot summary", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(deps);

    const lines: string[] = [];
    await runCli(
      ["run", "json hint", "--output", "json"],
      (line: string) => { lines.push(line); },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      { createRuntime: async () => ({ deps, kernel }) }
    );
    const summary = JSON.parse(lines[0] ?? "{}") as { sessionId?: string; resumeCommand?: string };
    assert.equal(typeof summary.resumeCommand, "string");
    assert.equal(summary.resumeCommand?.startsWith("deepseek session resume "), true);
    assert.equal(summary.resumeCommand?.endsWith(summary.sessionId ?? ""), true);
  });
});
