import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { ProtocolEnvelope } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runCli } from "../../src/apps/cli/src/index.js";
import { activate } from "../../src/apps/vscode-extension/src/index.js";

before(() => {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", "build:cli"], {
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
});

describe("host adapter smoke", () => {
  it("runs CLI stream-json and activates VSCode bridge", async () => {
    const lines: string[] = [];
    await runCli(["-p", "e2e", "--output", "stream-json"], (line) => lines.push(line));
    assert.ok(lines.some((line) => JSON.parse(line).kind === "capability.completed"));
    assert.ok(lines.some((line) => JSON.parse(line).kind === "scheduler.completed"));
    const bridge = activate({ subscriptions: [] });
    assert.equal(bridge.context.hostKind, "vscode");
  });

  it("runs CLI kernel-backed command in stream-json mode", async () => {
    const lines: string[] = [];
    await runCli(["run", "-p", "kernel e2e", "--output", "stream-json"], (line) => lines.push(line));
    const events = lines.map((line) => JSON.parse(line));
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.trace?.traceId), true);
  });

  it("runs CLI core tools smoke through runtime events without live provider access", async () => {
    const lines: string[] = [];
    await runCli(["tools-smoke", "--output", "stream-json"], (line) => lines.push(line));
    const events = lines.map((line) => JSON.parse(line));

    assert.equal(events.filter((event) => event.kind === "execution.envelope.created").length, 3);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "execution.rejected" && event.error?.code === "KERNEL_POLICY_DENIED"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("runs scripted minimal interactive CLI prompt, help, and exit", async () => {
    const lines: string[] = [];
    await runCli(["interactive", "--output", "stream-json"], (line) => lines.push(line), ["/help\nhello e2e\n/exit\n"], { stdinIsTTY: false, stdoutIsTTY: false });
    const events = lines.map((line) => JSON.parse(line));

    assert.equal(events.some((event) => event.kind === "interactive.started"), true);
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "help"), true);
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "exit"), true);
    assert.equal(events.at(-1)?.kind, "interactive.completed");
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("runs scriptable session resume and fork failures without live provider access", async () => {
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
    assert.equal([...resumeLines, ...forkLines].join("\n").includes("sk-live-secret-value"), false);
  });

  it("runs the built CLI binary with traceable runtime metadata", () => {
    assert.equal(existsSync("src/apps/cli/dist/index.js"), true, "run npm run build:cli before npm run test:e2e");
    const result = spawnSync(process.execPath, ["src/apps/cli/dist/index.js", "-p", "built e2e", "--output", "stream-json"], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr);

    const events = result.stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.deepEqual(
      events.map((event) => event.kind),
      [
        "context.projection.started",
        "context.projection.completed",
        "kernel.request.accepted",
        "workflow.opened",
        "execution.envelope.created",
        "policy.decided",
        "sandbox.selected",
        "capability.started",
        "scheduler.queued",
        "scheduler.started",
        "scheduler.completed",
        "capability.output",
        "capability.completed",
        "workflow.closed"
      ]
    );

    for (const event of events) {
      assert.equal(typeof event.sessionId, "string");
      assert.equal(typeof event.trace?.traceId, "string");
      assert.equal(typeof event.trace?.correlationId, "string");
    }
    assert.equal(events.some((event) => event.taskId), true);
    assert.equal(events.some((event) => event.kind === "model.delta"), false);
  });

  it("keeps raw secret fixtures out of CLI text and stream-json output", () => {
    const secret = "sk-live-1234567890";
    const text = spawnSync(process.execPath, ["--import", "tsx", "src/apps/cli/src/index.ts", "-p", secret], {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    const stream = spawnSync(process.execPath, ["--import", "tsx", "src/apps/cli/src/index.ts", "-p", secret, "--output", "stream-json"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });

    assert.equal(text.stdout.includes(secret), false);
    assert.equal(text.stderr.includes(secret), false);
    assert.equal(stream.stdout.includes(secret), false);
    assert.equal(stream.stderr.includes(secret), false);
    assert.equal(stream.stdout.includes("[REDACTED"), true);
  });

  it("runs the built CLI binary in scripted interactive mode", () => {
    assert.equal(existsSync("src/apps/cli/dist/index.js"), true, "run npm run build:cli before npm run test:e2e");
    const result = spawnSync(process.execPath, ["src/apps/cli/dist/index.js", "interactive", "--output", "stream-json"], {
      encoding: "utf8",
      input: "/help\nbuilt interactive\n/cancel\n/exit\n"
    });
    assert.equal(result.status, 0, result.stderr);
    const events = result.stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "help"), true);
    assert.equal(events.some((event) => event.kind === "interactive.command.completed" && event.data.action === "cancel"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.at(-1)?.kind, "interactive.completed");
  });

  it("keeps the VSCode bridge transport-backed and isolated from CLI rendering", async () => {
    const subscriptions: Array<{ dispose(): unknown }> = [];
    const bridge = activate({ subscriptions });
    assert.equal(subscriptions.length, 1);
    assert.deepEqual(bridge.context.capabilities, ["commands", "chat-input", "editor-context", "approvals", "workspace-edits"]);

    const editorContext = await bridge.collectEditorContext();
    assert.deepEqual(editorContext, {
      activeDocument: null,
      selections: [],
      diagnostics: [],
      workspaceFolders: []
    });

    const stream = bridge.transport.receive()[Symbol.asyncIterator]();
    const event: ProtocolEnvelope = {
      protocolVersion: "1",
      schemaVersion: "1.0.0",
      id: "msg-e2e",
      messageId: asId<"message">("msg-e2e"),
      correlationId: asId<"correlation">("corr-e2e"),
      type: "event",
      createdAt: new Date(0).toISOString(),
      trace: {
        traceId: asId<"trace">("trace-e2e"),
        spanId: asId<"span">("span-e2e"),
        correlationId: asId<"correlation">("corr-e2e")
      },
      redaction: { class: "internal" },
      compatibility: { schemaVersion: "1.0.0" },
      routing: { host: "vscode", target: "host" },
      payload: {
        event: {
          kind: "capability.completed",
          sessionId: asId<"session">("session-e2e"),
          trace: {
            traceId: asId<"trace">("trace-e2e"),
            spanId: asId<"span">("span-e2e"),
            correlationId: asId<"correlation">("corr-e2e")
          },
          data: {}
        }
      }
    };
    await bridge.transport.send(event);
    assert.deepEqual((await stream.next()).value, event);
  });

  it("lets VSCode project runtime kernel events without importing CLI", async () => {
    const bridge = activate({ subscriptions: [] });
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const events: unknown[] = [];
    for await (const event of bridge.projectRuntimeEvents(kernel, {
      capabilityId: runtimeEchoCapability.id,
      caller: "vscode",
      input: { text: "vscode kernel" }
    })) {
      events.push(event);
    }
    assert.equal(bridge.getRenderedEvents().some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => (event as { kind?: string }).kind === "workflow.opened"), true);
    await kernel.shutdown();
  });
});
