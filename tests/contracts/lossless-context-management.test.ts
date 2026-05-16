import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryLosslessContextManager, PersistentJsonlLosslessContextManager } from "@deepseek/memory-cache-management";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { LOSSLESS_CONTEXT_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { LosslessContextNode, SessionId } from "@deepseek/platform-contracts";

describe("lossless context management", () => {
  it("records durable DAG nodes, summarizes incrementally, and expands summaries back to originals", async () => {
    const manager = new InMemoryLosslessContextManager();
    const sessionId = asId<"session">("session-lossless-contract");
    for (let index = 0; index < 5; index += 1) {
      const result = await manager.recordNode({
        node: node(sessionId, `node-${index}`, index === 1 ? "critical approval rule: do not delete without explicit approval" : `ordinary turn ${index}`)
      });
      assert.equal(result.status, "recorded");
    }

    const summary = await manager.summarize({ sessionId, thresholdNodeCount: 3, freshTailCount: 1 });
    assert.equal(summary.status, "recorded");
    assert.equal(summary.coveredNodeCount, 4);

    const found = await manager.grep({ sessionId, query: "approval rule" });
    assert.equal(found.status, "completed");
    assert.equal(found.matches.some((match) => match.role === "user"), true);
    assert.equal(found.matches.some((match) => match.sourceClass === "user-prompt"), true);

    const summaryNodeId = summary.summaryNodeId;
    if (!summaryNodeId) throw new Error("expected summary node id");
    const described = await manager.describe({ nodeId: summaryNodeId });
    assert.equal(described.status, "completed");
    assert.equal(described.node?.kind, "summary");
    assert.equal(described.outboundEdges.length, 4);

    const expanded = await manager.expand({ nodeId: summaryNodeId, limit: 10 });
    assert.equal(expanded.status, "completed");
    assert.equal(expanded.expandedNodes.some((entry) => entry.content.includes("critical approval rule")), true);
  });

  it("persists JSONL lossless context across manager instances, redacts secrets, and expands summaries after restart", async () => {
    const root = await mkdtemp(join(tmpdir(), "deepseek-lcm-contract-"));
    try {
      const sessionId = asId<"session">("session-lossless-persistent");
      const platform = new NodePlatformRuntime();
      const first = new PersistentJsonlLosslessContextManager(platform, root);
      for (const [index, content] of [
        "durable decision: provider replay evidence is required",
        "token DEEPSEEK_API_KEY=should-not-survive durable decision",
        "durable context fact: resumed sessions must rebuild history",
        "fresh tail should remain outside the summary"
      ].entries()) {
        await first.recordNode({ node: node(sessionId, `node-persistent-${index}`, content) });
      }
      const summary = await first.summarize({ sessionId, thresholdNodeCount: 2, freshTailCount: 1 });
      assert.equal(summary.status, "recorded");
      const summaryNodeId = summary.summaryNodeId;
      if (!summaryNodeId) throw new Error("expected persistent summary node id");

      const second = new PersistentJsonlLosslessContextManager(platform, root);
      const result = await second.grep({ sessionId, query: "durable decision" });
      assert.equal(result.matchCount >= 1, true);
      const messageMatch = result.matches.find((match) => match.kind === "message" && match.nodeId === "node-persistent-1");
      if (!messageMatch) throw new Error("expected persistent message match");
      const described = await second.describe({ nodeId: messageMatch.nodeId });
      assert.equal(described.node?.content.includes("should-not-survive"), false);
      assert.equal(described.node?.content.includes("[REDACTED:secret]"), true);
      assert.equal(described.node?.sourceClass, "user-prompt");
      const describedSummary = await second.describe({ nodeId: summaryNodeId });
      assert.equal(describedSummary.node?.kind, "summary");
      assert.equal(describedSummary.node?.sourceClass, "summary");
      assert.equal(describedSummary.outboundEdges.length, 3);
      const expanded = await second.expand({ nodeId: summaryNodeId, limit: 10 });
      assert.equal(expanded.status, "completed");
      assert.equal(expanded.expandedNodes.some((entry) => entry.content.includes("resumed sessions must rebuild history")), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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
    contentHash: "",
    createdAt: new Date(0).toISOString(),
    coversNodeIds: [],
    metadata: { source: "lossless-context-management.test" },
    redaction: { class: "internal", fields: ["content"] }
  };
}
