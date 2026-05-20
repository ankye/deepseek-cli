import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId, CONTEXT_PROJECTION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { ContextGraphNode, SessionId } from "@deepseek/platform-contracts";
import { compareContextPipelineManifests, createProjectionRequest, deriveContextPipelineManifest, InMemoryContextEngine } from "../../src/packages/context-engine/src/index.js";

describe("context pipeline prefix cache golden replay", () => {
  it("replays stable upstream prefixes across volatile current turns", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-context-pipeline-golden");
    const candidates = [
      node(sessionId, "kernel", "kernel contracts", "kernel"),
      node(sessionId, "project", "project rules", "project"),
      node(sessionId, "session", "session summary", "session")
    ];
    const first = deriveContextPipelineManifest(await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "first turn", hardLimitTokens: 128 }),
      candidateNodes: candidates
    }));
    const second = deriveContextPipelineManifest(await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "second turn", hardLimitTokens: 128 }),
      candidateNodes: candidates
    }));

    const comparison = compareContextPipelineManifests(first, second);

    assert.equal(first.schemaVersion, "1.0.0");
    assert.equal(first.layers.map((layer) => layer.id).join(">"), "kernel>project>session>current-turn");
    assert.equal(first.prefixHashes.find((entry) => entry.layer === "kernel")?.prefixHash, second.prefixHashes.find((entry) => entry.layer === "kernel")?.prefixHash);
    assert.equal(first.prefixHashes.find((entry) => entry.layer === "project")?.prefixHash, second.prefixHashes.find((entry) => entry.layer === "project")?.prefixHash);
    assert.equal(comparison.firstChangedLayer, "current-turn");
    assert.equal(comparison.rawContentInspected, false);
    assert.equal(JSON.stringify(first).includes("sk-live-secret"), false);
  });

  it("replays cache opportunity diagnostics when project prefix changes", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-context-pipeline-drift-golden");
    const kernel = node(sessionId, "kernel", "kernel contracts", "kernel");
    const projectV1 = node(sessionId, "project", "project rules v1", "project", ["project:v1"]);
    const projectV2 = node(sessionId, "project", "project rules v2", "project", ["project:v2"]);
    const first = deriveContextPipelineManifest(await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "same turn", hardLimitTokens: 128 }),
      candidateNodes: [kernel, projectV1]
    }));
    const second = deriveContextPipelineManifest(await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "same turn", hardLimitTokens: 128 }),
      candidateNodes: [kernel, projectV2]
    }));

    const comparison = compareContextPipelineManifests(first, second);

    assert.deepEqual({
      status: comparison.status,
      firstChangedLayer: comparison.firstChangedLayer,
      stableLayerCount: comparison.stableLayerCount,
      changedLayerCount: comparison.changedLayerCount,
      diagnosticCodes: comparison.diagnostics.map((diagnostic) => diagnostic.code)
    }, {
      status: "changed",
      firstChangedLayer: "project",
      stableLayerCount: 1,
      changedLayerCount: 3,
      diagnosticCodes: ["CONTEXT_PIPELINE_PREFIX_CHANGED", "CONTEXT_PIPELINE_PREFIX_CHANGED", "CONTEXT_PIPELINE_PREFIX_CHANGED"]
    });
    assert.equal(comparison.rawContentInspected, false);
  });

  it("replays bounded compaction evidence for oversized tool results", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-context-pipeline-tool-golden");
    const rawToolOutput = `${Array.from({ length: 120 }, (_, index) => `line-${index}`).join(" ")} RAW_UNBOUNDED_END`;
    const manifest = deriveContextPipelineManifest(await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "inspect output", hardLimitTokens: 256 }),
      candidateNodes: [node(sessionId, "tool-large", rawToolOutput, "session", ["tool:large"], "tool-result", "tool")]
    }), { maxStableToolResultTokens: 10 });

    const stableContent = manifest.blocks
      .filter((block) => block.layer !== "current-turn")
      .map((block) => block.content ?? "")
      .join("\n");

    assert.equal(stableContent.includes("RAW_UNBOUNDED_END"), false);
    assert.equal(manifest.blocks.some((block) => block.layer === "session" && block.provenance.boundedSummary === true), true);
    assert.equal(manifest.blocks.some((block) => block.layer === "current-turn" && block.content?.includes("RAW_UNBOUNDED_END")), true);
  });

  it("replays session compact-boundary replacement with source hashes", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-context-pipeline-compact-golden");
    const projection = await engine.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "continue", hardLimitTokens: 256 }),
      candidateNodes: [
        node(sessionId, "session-1", "first session summary", "session"),
        node(sessionId, "session-2", "second session summary", "session"),
        node(sessionId, "session-3", "third session summary", "session")
      ]
    });
    const uncompacted = deriveContextPipelineManifest(projection);
    const compacted = deriveContextPipelineManifest(projection, { maxSessionBlocksBeforeCompaction: 2 });
    const compactedBlock = compacted.blocks.find((block) => block.layer === "session");

    assert.equal(compacted.blocks.filter((block) => block.layer === "session").length, 1);
    assert.deepEqual(compactedBlock?.replay.sourceBlockHashes, uncompacted.blocks.filter((block) => block.layer === "session").map((block) => block.hash));
    assert.equal((compactedBlock?.content ?? "").includes("first session summary"), false);
  });
});

function node(
  sessionId: SessionId,
  id: string,
  content: string,
  pipelineLayer: "kernel" | "project" | "session",
  dependencyFingerprints: readonly string[] = [`${pipelineLayer}:${id}`],
  kind: ContextGraphNode["kind"] = "summary",
  source: ContextGraphNode["source"] = pipelineLayer === "project" ? "workspace" : "system"
): ContextGraphNode {
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`ctx-golden-${id}`),
    kind,
    source,
    lifecycle: pipelineLayer === "kernel" ? "global" : pipelineLayer,
    scope: { sessionId },
    priority: pipelineLayer === "kernel" ? 950 : pipelineLayer === "project" ? 900 : 100,
    content,
    estimatedTokens: content.split(/\s+/).length,
    redaction: { class: "internal" },
    provenance: { pipelineLayer },
    dependencyFingerprints,
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: new Date(0).toISOString()
  };
}
