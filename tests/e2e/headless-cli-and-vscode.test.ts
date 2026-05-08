import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { ProtocolEnvelope } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
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
    assert.ok(lines.some((line) => JSON.parse(line).kind === "turn.completed"));
    const bridge = activate({ subscriptions: [] });
    assert.equal(bridge.context.hostKind, "vscode");
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
      ["turn.started", "workflow.step", "bus.recorded", "model.delta", "usage.updated", "turn.completed"]
    );

    for (const event of events) {
      assert.equal(typeof event.sessionId, "string");
      assert.equal(typeof event.trace?.traceId, "string");
      assert.equal(typeof event.trace?.correlationId, "string");
    }
    assert.equal(events.some((event) => event.taskId), true);
    assert.equal(events.some((event) => event.agentId), true);
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
          kind: "turn.completed",
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
});
