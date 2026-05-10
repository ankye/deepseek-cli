import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RuntimeDependencies, RuntimeKernel } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runCli } from "../../src/apps/cli/src/index.js";

interface ChatHarness {
  readonly deps: RuntimeDependencies;
  readonly kernel: RuntimeKernel;
  readonly lines: string[];
  modelCallCount: number;
}

async function buildHarness(): Promise<ChatHarness> {
  const deps = createDeterministicRuntimeDependencies();
  await registerRuntimeCoreTools(deps, process.cwd());
  const kernel = await createDefaultRuntimeKernel(deps);
  const harness: ChatHarness = { deps, kernel, lines: [], modelCallCount: 0 };
  const originalStream = deps.models.stream.bind(deps.models);
  deps.models.stream = (request) => {
    harness.modelCallCount += 1;
    return originalStream(request);
  };
  return harness;
}

async function runChatLines(harness: ChatHarness, inputs: readonly string[]): Promise<string[]> {
  harness.lines.length = 0;
  await runCli(
    ["chat", "--output", "text"],
    (line) => { harness.lines.push(line); },
    (async function* () { for (const line of inputs) yield `${line}\n`; })(),
    { stdinIsTTY: false, stdoutIsTTY: false },
    { createRuntime: async () => ({ deps: harness.deps, kernel: harness.kernel }) }
  );
  return [...harness.lines];
}

describe("chat slash commands", () => {
  it("/help lists controls and does not call the model", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/help", "/exit"]);
    assert.equal(harness.modelCallCount, 0, `help must not call model, lines=${JSON.stringify(lines)}`);
    assert.equal(lines.some((line) => line === "Chat controls:"), true);
    assert.equal(lines.some((line) => line.startsWith("  /help")), true);
    assert.equal(lines.some((line) => line.startsWith("  /cost")), true);
    assert.equal(lines.some((line) => line.startsWith("  /model")), true);
  });

  it("/clear renders ANSI clear sequence without invoking runtime", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/clear", "/exit"]);
    assert.equal(harness.modelCallCount, 0);
    assert.equal(lines.some((line) => line.includes("\x1B[2J")), true, `expected ANSI clear, got ${JSON.stringify(lines)}`);
  });

  it("/cost reports zero usage before any turn", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/cost", "/exit"]);
    assert.equal(harness.modelCallCount, 0);
    assert.equal(lines.some((line) => line.startsWith("[chat] tokens in=0 out=0")), true);
  });

  it("/model reports active profile", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/model", "/exit"]);
    assert.equal(harness.modelCallCount, 0);
    assert.equal(lines.some((line) => line.startsWith("[chat] model=") && line.includes("provider=")), true);
  });

  it("/cost after a turn sums usage from usage.updated events", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["hello world", "/cost", "/exit"]);
    assert.equal(harness.modelCallCount, 1);
    const cost = lines.find((line) => line.startsWith("[chat] tokens in="));
    assert.ok(cost, `expected /cost line, got ${JSON.stringify(lines)}`);
    assert.equal(cost.includes("out=0"), false, `expected non-zero out tokens in ${cost}`);
  });

  it("unknown slash does not reach the model", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/does-not-exist", "/exit"]);
    assert.equal(harness.modelCallCount, 0);
    assert.equal(lines.some((line) => line === "[chat] unknown command /does-not-exist"), true);
  });

  it("/cancel with no active turn prints no-op notice", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["/cancel", "/exit"]);
    assert.equal(harness.modelCallCount, 0);
    assert.equal(lines.some((line) => line === "[chat] nothing to cancel"), true);
  });

  it("plain prompt still calls the model", async () => {
    const harness = await buildHarness();
    const lines = await runChatLines(harness, ["normal prompt", "/exit"]);
    assert.equal(harness.modelCallCount, 1);
    assert.equal(lines.some((line) => line.startsWith("[completed]")), true);
  });
});
