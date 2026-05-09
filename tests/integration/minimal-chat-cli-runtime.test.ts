import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runCli } from "../../src/apps/cli/src/index.js";

describe("minimal chat CLI runtime integration", () => {
  it("renders scripted chat prompts from the runtime-owned agent loop", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(deps);
    const lines: string[] = [];
    await runCli(
      ["chat", "--output", "jsonl"],
      (line: string) => {
        lines.push(line);
      },
      ["integration prompt\n/exit\n"],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps, kernel })
      }
    );

    const events = lines.map((line) => JSON.parse(line) as { kind: string });
    assert.equal(events.some((event) => event.kind === "agent.loop.started"), true);
    assert.equal(events.some((event) => event.kind === "model.requested"), true);
    assert.equal(events.some((event) => event.kind === "model.delta"), true);
    assert.equal(events.some((event) => event.kind === "agent.loop.completed"), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });
});
