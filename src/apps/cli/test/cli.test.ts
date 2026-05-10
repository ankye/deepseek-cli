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

  it("coalesces streaming model deltas into one inline line in text mode", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const streamingDeps = { ...deps, models: new StreamingDeltaModelGateway() };
    await registerRuntimeCoreTools(streamingDeps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(streamingDeps);
    const lines: string[] = [];
    await runCli(
      ["run", "hello", "--output", "text"],
      (line: string) => {
        lines.push(line);
      },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps: streamingDeps, kernel })
      }
    );
    const combined = lines.join("\n");
    assert.equal(combined.includes("hi there friend"), true, combined);
    // each delta chunk must not be a standalone line
    assert.equal(lines.includes("hi "), false);
    assert.equal(lines.includes("there "), false);
    assert.equal(lines.includes("friend"), false);
  });

  it("emits a single [reasoning] indicator per iteration in text mode", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const reasoningDeps = { ...deps, models: new ReasoningStreamModelGateway() };
    await registerRuntimeCoreTools(reasoningDeps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(reasoningDeps);
    const lines: string[] = [];
    await runCli(
      ["run", "think", "--output", "text"],
      (line: string) => {
        lines.push(line);
      },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps: reasoningDeps, kernel })
      }
    );
    const reasoningCount = lines.filter((line) => line.startsWith("[reasoning] ")).length;
    assert.equal(reasoningCount, 1, `expected one reasoning prefix, got: ${JSON.stringify(lines)}`);
    const combined = lines.join("\n");
    assert.equal(combined.includes("plan first step."), true, combined);
  });

  it("leaves JSONL mode byte-identical to today (no streaming coalescence)", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const streamingDeps = { ...deps, models: new StreamingDeltaModelGateway() };
    await registerRuntimeCoreTools(streamingDeps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(streamingDeps);
    const lines: string[] = [];
    await runCli(
      ["run", "hello", "--output", "jsonl"],
      (line: string) => {
        lines.push(line);
      },
      [],
      { stdinIsTTY: false, stdoutIsTTY: false },
      {
        createRuntime: async () => ({ deps: streamingDeps, kernel })
      }
    );
    const deltaEvents = lines
      .map((line) => JSON.parse(line) as { kind: string; data?: { text?: string } })
      .filter((event) => event.kind === "model.delta");
    assert.equal(deltaEvents.length, 3, "JSONL mode must still produce one event per delta chunk");
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

class StreamingDeltaModelGateway implements ModelGateway {
  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "delta", text: "hi " };
    yield { kind: "delta", text: "there " };
    yield { kind: "delta", text: "friend" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

class ReasoningStreamModelGateway implements ModelGateway {
  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "reasoning", text: "plan ", redaction: { class: "internal" } };
    yield { kind: "reasoning", text: "first ", redaction: { class: "internal" } };
    yield { kind: "reasoning", text: "step.", redaction: { class: "internal" } };
    yield { kind: "delta", text: "ok" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
