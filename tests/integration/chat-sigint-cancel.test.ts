import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JsonObject, ModelGateway, ModelRequest, ModelStreamEvent, RuntimeDependencies, RuntimeKernel } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runCli } from "../../src/apps/cli/src/index.js";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

class CancellableModelGateway implements ModelGateway {
  readonly streamStarted = deferred<void>();
  readonly cancelled: { aborted: boolean } = { aborted: false };

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "delta", text: "thinking " };
    this.streamStarted.resolve();
    await new Promise<void>((resolve) => {
      const signal = request.signal;
      if (!signal) {
        setTimeout(resolve, 50);
        return;
      }
      if (signal.aborted) {
        this.cancelled.aborted = true;
        resolve();
        return;
      }
      signal.addEventListener("abort", () => {
        this.cancelled.aborted = true;
        resolve();
      }, { once: true });
    });
    yield { kind: "delta", text: "late-chunk" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

async function buildHarness(): Promise<{ deps: RuntimeDependencies; kernel: RuntimeKernel; gateway: CancellableModelGateway }> {
  const deps = createDeterministicRuntimeDependencies();
  const gateway = new CancellableModelGateway();
  const override: RuntimeDependencies = { ...deps, models: gateway };
  await registerRuntimeCoreTools(override, process.cwd());
  const kernel = await createDefaultRuntimeKernel(override);
  return { deps: override, kernel, gateway };
}

describe("chat SIGINT cancellation", () => {
  it("first SIGINT cancels active turn and leaves REPL alive", async () => {
    const { deps, kernel, gateway } = await buildHarness();
    const lines: string[] = [];
    const secondPromptGate = deferred<void>();

    async function* scriptedInput(): AsyncIterable<string> {
      yield "first prompt\n";
      await secondPromptGate.promise;
      yield "/exit\n";
    }

    void (async () => {
      await gateway.streamStarted.promise;
      process.emit("SIGINT");
      await new Promise((resolve) => setTimeout(resolve, 10));
      secondPromptGate.resolve();
    })();

    await runCli(
      ["chat", "--output", "text"],
      (line) => { lines.push(line); },
      scriptedInput(),
      { stdinIsTTY: false, stdoutIsTTY: false },
      { createRuntime: async () => ({ deps, kernel }) }
    );

    assert.equal(gateway.cancelled.aborted, true, `gateway should see abort, lines=${JSON.stringify(lines)}`);
    assert.equal(lines.some((line) => line.startsWith("[cancelled]")), true, `expected [cancelled] line, got ${JSON.stringify(lines)}`);
    assert.equal(lines.some((line) => line === "[chat] press Ctrl+C again within 2s to exit"), true, `expected double-tap hint, got ${JSON.stringify(lines)}`);
    assert.equal(lines.some((line) => line.startsWith("[chat completed]")), true, `REPL should exit cleanly, got ${JSON.stringify(lines)}`);
  });

  it("/cancel on idle prints nothing-to-cancel notice", async () => {
    const { deps, kernel } = await buildHarness();
    const lines: string[] = [];
    await runCli(
      ["chat", "--output", "text"],
      (line) => { lines.push(line); },
      (async function* () { yield "/cancel\n"; yield "/exit\n"; })(),
      { stdinIsTTY: false, stdoutIsTTY: false },
      { createRuntime: async () => ({ deps, kernel }) }
    );
    assert.equal(lines.some((line) => line === "[chat] nothing to cancel"), true);
  });

  it("agent.loop.cancelled is emitted when runtime receives aborted signal", async () => {
    const { deps, kernel } = await buildHarness();
    let jsonlLines: string[] = [];
    const secondPromptGate = deferred<void>();
    const gateway = deps.models as CancellableModelGateway;

    async function* scriptedInput(): AsyncIterable<string> {
      yield "go\n";
      await secondPromptGate.promise;
      yield "/exit\n";
    }

    void (async () => {
      await gateway.streamStarted.promise;
      process.emit("SIGINT");
      await new Promise((resolve) => setTimeout(resolve, 10));
      secondPromptGate.resolve();
    })();

    await runCli(
      ["chat", "--output", "jsonl"],
      (line) => { jsonlLines.push(line); },
      scriptedInput(),
      { stdinIsTTY: false, stdoutIsTTY: false },
      { createRuntime: async () => ({ deps, kernel }) }
    );
    const events = jsonlLines.map((line) => {
      try { return JSON.parse(line) as JsonObject; } catch { return undefined; }
    }).filter((event): event is JsonObject => Boolean(event));
    const cancelled = events.find((event) => event.kind === "agent.loop.cancelled");
    assert.ok(cancelled, `expected agent.loop.cancelled event, got kinds=${events.map((event) => event.kind).join(",")}`);
    const data = cancelled.data as { reason?: string };
    assert.equal(data?.reason, "user-cancelled");
  });
});
