import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ModelGateway, ModelRequest, ModelStreamEvent } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import {
  cliUsageLines,
  parseCliArgs,
  runCli
} from "../src/index.js";

describe("cli host adapter", () => {
  it("parses the new run and chat commands without legacy prompt compatibility", () => {
    assert.deepEqual(parseCliArgs(["run", "hello", "--output", "jsonl"]), {
      command: "run",
      prompt: "hello",
      output: "jsonl",
      live: false
    });
    assert.deepEqual(parseCliArgs(["chat", "--output", "json", "--live", "--timeout-ms", "1000"]), {
      command: "chat",
      prompt: "",
      output: "json",
      live: true,
      timeoutMs: 1000
    });
    assert.deepEqual(parseCliArgs(["-p", "hello"]), {
      command: "help",
      prompt: "",
      output: "text",
      live: false
    });
  });

  it("prints deterministic help for no-arg usage", async () => {
    const lines: string[] = [];
    await runCli([], (line: string) => {
      lines.push(line);
    }, [], { stdinIsTTY: true, stdoutIsTTY: true });
    assert.deepEqual(lines, cliUsageLines());
    assert.equal(lines.join("\n").includes("stream-json"), false);
    assert.equal(lines.join("\n").includes(" -p "), false);
  });

  it("runs one-shot tasks through the runtime-owned agent loop as JSONL", async () => {
    const lines: string[] = [];
    await runCli(["run", "hello", "--output", "jsonl"], (line: string) => {
      lines.push(line);
    });
    const events = lines.map((line) => JSON.parse(line) as { kind: string; data?: Record<string, unknown> });

    assert.equal(events[0]?.kind, "agent.loop.started");
    assert.equal(events.some((event) => event.kind === "model.requested"), true);
    assert.equal(events.some((event) => event.kind === "model.delta"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("renders one-shot final JSON summaries", async () => {
    const lines: string[] = [];
    await runCli(["run", "summary", "--output", "json"], (line: string) => {
      lines.push(line);
    });
    const summary = JSON.parse(lines[0] ?? "{}") as { status?: string; assistantText?: string; traceId?: string };

    assert.equal(lines.length, 1);
    assert.equal(summary.status, "completed");
    assert.equal(summary.assistantText?.includes("DeepSeek mock response"), true);
    assert.equal(typeof summary.traceId, "string");
  });

  it("runs scripted chat turns with one session id", async () => {
    const lines: string[] = [];
    await runCli(["chat", "--output", "jsonl"], (line: string) => {
      lines.push(line);
    }, ["first\nsecond\n/exit\n"], { stdinIsTTY: false, stdoutIsTTY: false });
    const events = lines.map((line) => JSON.parse(line) as { kind: string; sessionId?: string });
    const completed = events.filter((event) => event.kind === "agent.loop.completed");

    assert.equal(completed.length, 2);
    assert.equal(completed[0]?.sessionId, completed[1]?.sessionId);
  });

  it("preserves chat session id across runtime submissions", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(deps);
    const lines: string[] = [];
    await runCli(
      ["chat", "--output", "jsonl"],
      (line: string) => {
        lines.push(line);
      },
      ["one\ntwo\n"],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps, kernel })
      }
    );
    const events = lines.map((line) => JSON.parse(line) as { kind: string; sessionId?: string });
    const sessionIds = new Set(events.filter((event) => event.kind === "agent.loop.completed").map((event) => event.sessionId));

    assert.deepEqual([...sessionIds].length, 1);
  });

  it("routes model tool calls through preflight and governed execution", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const toolDeps = { ...deps, models: new ToolCallingModelGateway() };
    await toolDeps.platform.writeFile("/workspace/README.md", "tool loop\n");
    await registerRuntimeCoreTools(toolDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(toolDeps);
    const lines: string[] = [];
    await runCli(
      ["run", "read README", "--output", "jsonl"],
      (line: string) => {
        lines.push(line);
      },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => {
          return { deps: toolDeps, kernel };
        }
      }
    );
    const events = lines.map((line) => JSON.parse(line) as { kind: string; data?: Record<string, unknown> });

    assert.equal(events.some((event) => event.kind === "model.tool.intent"), true);
    assert.equal(events.some((event) => event.kind === "model.tool.repaired"), true);
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "model.tool.result"), true);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
  });

  it("runs scriptable session commands with typed failures for unknown sessions", async () => {
    const resumeLines: string[] = [];
    await runCli(["session", "resume", "session-missing", "--output", "json"], (line: string) => {
      resumeLines.push(line);
    });
    const resume = JSON.parse(resumeLines[0] ?? "{}") as { ok?: boolean; error?: { code?: string } };
    assert.equal(resume.ok, false);
    assert.equal(resume.error?.code, "SESSION_NOT_FOUND");

    const forkLines: string[] = [];
    await runCli(["session", "fork", "session-missing", "--output", "json"], (line: string) => {
      forkLines.push(line);
    });
    const fork = JSON.parse(forkLines[0] ?? "{}") as { ok?: boolean; error?: { code?: string } };
    assert.equal(fork.ok, false);
    assert.equal(fork.error?.code, "SESSION_NOT_FOUND");
  });
});

class ToolCallingModelGateway implements ModelGateway {
  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (request.messages?.some((message) => message.role === "tool")) {
      yield { kind: "delta", text: "Read completed." };
      yield { kind: "finish", reason: "stop" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "tool-call", id: "call-readme", name: "core.file.read", input: { path: "./README.md" } };
    yield { kind: "finish", reason: "tool-call" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
