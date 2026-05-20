import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId, CONTEXT_PIPELINE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { ContextBlock, ContextPipelineManifest } from "@deepseek/platform-contracts";
import { contextBlockCacheKey, createContextBlockCacheEntry, createContextPipelineManifestCacheEntry } from "./index.js";

describe("memory-cache-management context pipeline cache", () => {
  it("stores immutable context blocks under content-addressed keys", () => {
    const block = contextBlock("block-project", "hash-project", ["file:a"]);
    const entry = createContextBlockCacheEntry(block);

    assert.equal(entry.key, contextBlockCacheKey(block));
    assert.equal(entry.namespace, "context.pipeline.block");
    assert.equal(entry.value.hash, block.hash);
    assert.deepEqual(entry.invalidation, ["context-block:hash-project", "file:a"]);
  });

  it("changes content-addressed keys when dependency fingerprints change", () => {
    const first = contextBlock("block-project", "hash-project", ["file:a"]);
    const second = contextBlock("block-project", "hash-project", ["file:b"]);

    assert.notEqual(contextBlockCacheKey(first), contextBlockCacheKey(second));
  });

  it("stores pipeline manifest records by session, turn, and fingerprint", () => {
    const manifest: ContextPipelineManifest = {
      schemaVersion: CONTEXT_PIPELINE_SCHEMA_VERSION,
      manifestId: "context-pipeline:manifest-1",
      sessionId: asId<"session">("session-cache-manifest"),
      turnId: asId<"turn">("turn-cache-manifest"),
      layers: [],
      blocks: [],
      excludedBlocks: [],
      prefixHashes: [],
      tokenTotals: { selectedTokens: 0, excludedTokens: 0, hardLimitTokens: 128 },
      cacheHintSummary: { stable: 0, ephemeral: 0, noStore: 0, ttlBound: 0 },
      pipelineFingerprint: "pipeline:abc",
      diagnostics: [],
      redaction: { class: "internal", fields: ["blocks.content"] },
      compatibility: { schemaVersion: CONTEXT_PIPELINE_SCHEMA_VERSION }
    };

    const entry = createContextPipelineManifestCacheEntry(manifest);

    assert.equal(entry.namespace, "context.pipeline.manifest");
    assert.equal(entry.value.pipelineFingerprint, "pipeline:abc");
    assert.deepEqual(entry.invalidation, ["session:session-cache-manifest", "turn:turn-cache-manifest", "pipeline:pipeline:abc"]);
  });
});

function contextBlock(id: string, hash: string, dependencyFingerprints: readonly string[]): ContextBlock {
  return {
    schemaVersion: CONTEXT_PIPELINE_SCHEMA_VERSION,
    id,
    layer: "project",
    order: 0,
    sourceNodeId: asId<"contextNode">("ctx-project"),
    kind: "file",
    source: "workspace",
    hash,
    content: "project context",
    estimatedTokens: 2,
    dependencyFingerprints,
    provenance: { path: "README.md" },
    cacheHint: { policy: "stable" },
    replay: { fingerprint: `replay:${hash}` },
    redaction: { class: "internal", fields: ["content"] },
    compatibility: { schemaVersion: CONTEXT_PIPELINE_SCHEMA_VERSION }
  };
}
