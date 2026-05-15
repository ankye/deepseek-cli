import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId, CONTEXT_PROJECTION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { ContextGraphNode, ContextProjectionRequest, SessionId } from "@deepseek/platform-contracts";
import { createProjectionRequest, DeterministicProjectIndex, InMemoryContextEngine } from "./index.js";

describe("InMemoryContextEngine", () => {
  it("filters, orders, budgets, redacts, and freezes projection results", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-context-unit");
    await engine.addNode(sessionId, {
      id: asId<"contextNode">("ctx-low"),
      kind: "file",
      content: "low priority file",
      metadata: {
        priority: 10,
        source: "workspace",
        redactionClass: "internal",
        dependencyFingerprints: ["file:a"]
      }
    });
    await engine.addNode(sessionId, {
      id: asId<"contextNode">("ctx-secret"),
      kind: "file",
      content: "sk-live-secret-value",
      metadata: {
        priority: 100,
        source: "workspace",
        redactionClass: "secret",
        dependencyFingerprints: ["file:secret"]
      }
    });
    await engine.addNode(sessionId, {
      id: asId<"contextNode">("ctx-stale"),
      kind: "summary",
      content: "stale summary",
      metadata: {
        stale: true,
        priority: 200,
        source: "system",
        dependencyFingerprints: ["summary:old"]
      }
    });

    const result = await engine.projectGraph(createProjectionRequest({
      sessionId,
      prompt: "current prompt",
      hardLimitTokens: 5,
      softLimitTokens: 2,
      availableRedactionClasses: ["public", "internal"]
    }));

    assert.equal(result.schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
    assert.equal(result.status, "degraded");
    assert.deepEqual(result.selectedNodes.map((node) => String(node.id)), ["context-current-session-context-unit-turn", "ctx-low"]);
    assert.equal(result.excludedNodes.some((node) => node.reason === "policy-denied"), true);
    assert.equal(result.excludedNodes.some((node) => node.reason === "stale"), true);
    assert.equal(result.redaction.secretLikeBlocked, 1);
    assert.equal(result.prompt.includes("sk-live-secret-value"), false);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.selectedNodes), true);
  });

  it("returns deterministic cache-hit metadata for unchanged projection dependencies", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-cache-unit");
    const request = createProjectionRequest({
      sessionId,
      prompt: "cache prompt",
      hardLimitTokens: 10
    });

    const first = await engine.projectGraph(request);
    const second = await engine.projectGraph(request);

    assert.equal(first.cache.hit, false);
    assert.equal(second.cache.hit, true);
    assert.equal(second.cache.key, first.cache.key);
  });

  it("rejects unsupported projection schema versions", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-schema-unit");
    const request = {
      ...createProjectionRequest({ sessionId, prompt: "schema", hardLimitTokens: 10 }),
      schemaVersion: "999.0.0"
    } satisfies ContextProjectionRequest;

    const result = await engine.projectGraph(request);
    assert.equal(result.status, "rejected");
    assert.equal(result.error?.code, "CONTEXT_PROJECTION_REJECTED");
    assert.equal(result.budget.reason, "unsupported-schema");
  });

  it("keeps context nodes scoped to the requested session", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-scope-unit");
    const otherSessionId = asId<"session">("session-other-unit");
    const outside = graphNode(otherSessionId, "outside", "outside scope", 500);
    const request: ContextProjectionRequest = {
      ...createProjectionRequest({ sessionId, prompt: "inside scope", hardLimitTokens: 10 }),
      candidateNodes: [outside]
    };

    const result = await engine.projectGraph(request);
    assert.equal(result.excludedNodes.some((node) => node.id === outside.id && node.reason === "outside-scope"), true);
  });

  it("refreshes and queries deterministic context.project-index evidence with stale diagnostics", () => {
    const sessionId = asId<"session">("session-project-index-unit");
    const index = new DeterministicProjectIndex();
    const refresh = index.refresh({
      sessionId,
      workspaceRoot: "/workspace",
      documents: [
        { path: "/workspace/src/app.ts", content: "export const answer = 42", language: "typescript" },
        { path: "/workspace/README.md", content: "Project index readme" }
      ]
    });

    const query = index.query({
      sessionId,
      workspaceRoot: "/workspace",
      query: "answer",
      documentsFingerprint: refresh.documentsFingerprint
    });
    const stale = index.query({
      sessionId,
      workspaceRoot: "/workspace",
      query: "answer",
      documentsFingerprint: "changed"
    });

    assert.equal(refresh.familyId, "context.project-index");
    assert.equal(query.status, "completed");
    assert.equal(query.resultCount, 1);
    assert.equal(query.contextNodes[0]?.provenance.source, "context.project-index");
    assert.equal(stale.status, "degraded");
    assert.equal(stale.diagnostics.includes("context.project-index.stale-index"), true);
  });
});

function graphNode(sessionId: SessionId, id: string, content: string, priority: number): ContextGraphNode {
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(id),
    kind: "file",
    source: "workspace",
    lifecycle: "session",
    scope: { sessionId },
    priority,
    content,
    estimatedTokens: content.split(/\s+/).length,
    redaction: { class: "internal" },
    provenance: { fixture: true },
    dependencyFingerprints: [`fixture:${id}`],
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: new Date(0).toISOString()
  };
}
