import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import {
  cliUsageLines,
  parseCliArgs,
  parseInteractiveInput,
  runCli,
  runInteractiveCli
} from "../src/index.js";

describe("cli host adapter", () => {
  it("parses prompt mode and stream-json rendering", () => {
    assert.deepEqual(parseCliArgs(["-p", "hello", "--output", "stream-json"]), {
      command: "turn",
      prompt: "hello",
      output: "stream-json",
      capabilityId: "runtime.echo"
    });
  });

  it("parses interactive mode and non-tty no-arg help safely", () => {
    assert.deepEqual(parseCliArgs(["interactive"], { stdinIsTTY: false, stdoutIsTTY: false }), {
      command: "interactive",
      prompt: "",
      output: "text"
    });
    assert.deepEqual(parseCliArgs([], { stdinIsTTY: true, stdoutIsTTY: true }), {
      command: "interactive",
      prompt: "",
      output: "text"
    });
    assert.deepEqual(parseCliArgs([], { stdinIsTTY: false, stdoutIsTTY: true }), {
      command: "help",
      prompt: "",
      output: "text"
    });
  });

  it("parses interactive prompt and control lines", () => {
    assert.deepEqual(parseInteractiveInput("hello"), { kind: "prompt", text: "hello" });
    assert.deepEqual(parseInteractiveInput("/help"), { kind: "command", name: "help", raw: "/help", args: [] });
    assert.deepEqual(parseInteractiveInput("/resume session-1"), { kind: "command", name: "resume", raw: "/resume session-1", args: ["session-1"] });
    assert.deepEqual(parseInteractiveInput("/nope"), { kind: "unknown-command", name: "nope", raw: "/nope" });
    assert.deepEqual(parseInteractiveInput("  "), { kind: "empty" });
  });

  it("prints deterministic help without blocking non-tty no-arg usage", async () => {
    const lines: string[] = [];
    await runCli([], (line) => lines.push(line), [], { stdinIsTTY: false, stdoutIsTTY: false });
    assert.deepEqual(lines, cliUsageLines());
  });

  it("runs as a thin host over runtime events", async () => {
    const lines: string[] = [];
    await runCli(["-p", "hello", "--output", "stream-json"], (line) => lines.push(line));
    assert.ok(lines.some((line) => JSON.parse(line).kind === "scheduler.completed"));
    assert.ok(lines.some((line) => JSON.parse(line).kind === "capability.completed"));
    assert.equal(lines.some((line) => JSON.parse(line).kind === "model.delta"), false);
  });

  it("runs interactive help and exit controls with structured output", async () => {
    const lines: string[] = [];
    const result = await runInteractiveCli({
      input: ["/help\n/exit\n"],
      output: "stream-json",
      write: (line) => {
        lines.push(line);
      }
    });
    const events = lines.map((line) => JSON.parse(line));
    assert.equal(result.status, "completed");
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "help"), true);
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "exit"), true);
    assert.equal(events.at(-1)?.kind, "interactive.completed");
  });

  it("runs interactive prompts through kernel-backed runtime events", async () => {
    const lines: string[] = [];
    const result = await runInteractiveCli({
      input: ["hello interactive\n/exit\n"],
      output: "stream-json",
      write: (line) => {
        lines.push(line);
      }
    });
    const events = lines.map((line) => JSON.parse(line));
    assert.equal(result.prompts, 1);
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "interactive.completed"), true);
  });

  it("runs scriptable session commands with typed failures for unknown sessions", async () => {
    const resumeLines: string[] = [];
    await runCli(["session", "resume", "session-missing", "--output", "stream-json"], (line) => resumeLines.push(line));
    const resume = JSON.parse(resumeLines[0] ?? "{}");
    assert.equal(resume.ok, false);
    assert.equal(resume.error.code, "SESSION_NOT_FOUND");

    const forkLines: string[] = [];
    await runCli(["session", "fork", "session-missing", "--output", "stream-json"], (line) => forkLines.push(line));
    const fork = JSON.parse(forkLines[0] ?? "{}");
    assert.equal(fork.ok, false);
    assert.equal(fork.error.code, "SESSION_NOT_FOUND");
  });

  it("reports unknown interactive slash commands as structured host events", async () => {
    const lines: string[] = [];
    await runInteractiveCli({
      input: ["/missing\n/exit\n"],
      output: "stream-json",
      write: (line) => {
        lines.push(line);
      }
    });
    const events = lines.map((line) => JSON.parse(line));
    assert.equal(events.some((event) => event.kind === "interactive.command.failed" && event.data.code === "INTERACTIVE_COMMAND_NOT_FOUND"), true);
  });

  it("cancels the active interactive turn through the runtime kernel", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const slowCapabilityId = asId<"capability">("runtime.slow-interactive");
    await deps.capabilities.register(
      {
        ...runtimeEchoCapability,
        id: slowCapabilityId,
        name: "Slow Interactive Runtime"
      },
      async (_input, context) => {
        await new Promise<void>((resolve) => {
          context.signal.addEventListener("abort", () => resolve(), { once: true });
        });
        return {
          ok: false,
          error: {
            code: "SLOW_ABORTED",
            message: context.cancellationReason ?? "aborted",
            retryable: false,
            redaction: { class: "public" }
          }
        };
      }
    );

    async function* scriptedInput(): AsyncIterable<string> {
      yield "cancel me\n";
      await new Promise((resolve) => setTimeout(resolve, 0));
      yield "/cancel\n/exit\n";
    }

    const lines: string[] = [];
    const result = await runInteractiveCli({
      input: scriptedInput(),
      output: "stream-json",
      capabilityId: slowCapabilityId,
      createKernel: () => createDefaultRuntimeKernel(deps),
      write: (line) => {
        lines.push(line);
      }
    });
    const events = lines.map((line) => JSON.parse(line));
    assert.equal(result.cancellations, 1);
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "cancel"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.cancelled"), true);
    assert.equal(events.some((event) => event.kind === "capability.cancelled" || event.kind === "capability.failed"), true);
  });
});
