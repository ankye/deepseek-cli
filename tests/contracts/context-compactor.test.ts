import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryLosslessContextManager } from "@deepseek/memory-cache-management";
import type { LosslessContextNode, SessionId } from "@deepseek/platform-contracts";
import { LOSSLESS_CONTEXT_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { runContextCompactorCommand } from "../../src/apps/cli/src/commands/context.js";

describe("context compactor plugin", () => {
  it("greps, summarizes, expands, and keeps secret-like content redacted", async () => {
    const manager = new InMemoryLosslessContextManager();
    const sessionId = asId<"session">("session-context-contract");

    for (let index = 0; index < 70; index += 1) {
      await manager.recordNode({
        node: node(sessionId, `lcm-user-${index}`, `database decision ${index} DEEPSEEK_API_KEY=secret-value-${index}`)
      });
    }

    const grep = await runContextCompactorCommand(manager, { action: "grep", query: "database", sessionId, limit: 5 });
    assert.equal(grep.status, "completed");
    assert.equal(grep.resultList?.items.length, 5);
    assert.equal(JSON.stringify(grep).includes("secret-value"), false);
    assert.equal(JSON.stringify(grep).includes("[REDACTED:secret]"), true);

    const summary = await runContextCompactorCommand(manager, { action: "summarize", sessionId });
    assert.equal(summary.status, "completed");
    const summaryNodeId = String(summary.data.summaryNodeId ?? "");
    assert.equal(summaryNodeId.startsWith("lcm-summary-"), true);

    const expand = await runContextCompactorCommand(manager, { action: "expand", target: summaryNodeId, sessionId, limit: 100 });
    assert.equal(expand.status, "completed");
    assert.equal(Number(expand.data.expandedNodeCount), 38);
    assert.equal(JSON.stringify(expand).includes("secret-value"), false);
    assert.equal(JSON.stringify(expand).includes("[REDACTED:secret]"), true);

    const status = await runContextCompactorCommand(manager, { action: "status", sessionId, limit: 100 });
    assert.equal(status.status, "completed");
    assert.equal(Number(status.data.sampledSummaryCount), 1);
  });

  it("pins context targets without writing permanent memory", async () => {
    const manager = new InMemoryLosslessContextManager();
    const sessionId = asId<"session">("session-context-pin");
    const pin = await runContextCompactorCommand(manager, { action: "pin", target: "lcm-user-1", sessionId });

    assert.equal(pin.status, "completed");
    assert.equal(pin.referenceTarget?.kind, "tool-evidence");
    assert.equal(pin.referenceTarget?.metadata?.source, "context.compactor.pin");
    assert.equal(JSON.stringify(pin).includes("permanent"), false);
  });
});

function node(sessionId: SessionId, nodeId: string, content: string): LosslessContextNode {
  return {
    schemaVersion: LOSSLESS_CONTEXT_SCHEMA_VERSION,
    nodeId,
    sessionId,
    kind: "message",
    role: "user",
    sourceClass: "user-prompt",
    content,
    contentHash: `hash-${nodeId}`,
    createdAt: "1970-01-01T00:00:00.000Z",
    coversNodeIds: [],
    metadata: {},
    redaction: { class: "internal", fields: ["content"] }
  };
}
