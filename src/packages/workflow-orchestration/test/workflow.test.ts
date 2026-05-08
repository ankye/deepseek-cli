import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryWorkflowTemplateRegistry, SingleTurnWorkflowOrchestrator } from "../src/index.js";
import { asId } from "@deepseek/platform-contracts";

describe("workflow orchestration", () => {
  it("creates a valid single-turn graph", async () => {
    const workflow = new SingleTurnWorkflowOrchestrator();
    const graph = await workflow.createGraph({ sessionId: asId<"session">("session-1"), prompt: "hello" });
    assert.equal((await workflow.validateGraph(graph)).length, 0);
    assert.equal(graph.steps.length, 1);
  });

  it("accepts workflow template contribution metadata", () => {
    const registry = new InMemoryWorkflowTemplateRegistry();
    registry.register({
      name: "single-turn",
      version: "1.0.0",
      contributionSource: "built-in",
      metadata: { mode: "deterministic" }
    });
    assert.equal(registry.list().length, 1);
  });
});
