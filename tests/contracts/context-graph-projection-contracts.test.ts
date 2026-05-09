import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createProjectionCacheEntry, projectionCacheKey, PROJECTION_CACHE_NAMESPACE } from "@deepseek/memory-cache-management";
import { createProjectionRequest, InMemoryContextEngine } from "@deepseek/context-engine";
import {
  asId,
  CONTEXT_PROJECTION_SCHEMA_VERSION
} from "@deepseek/platform-contracts";
import type { ContextProjectionResult, ContextProjectionRequest } from "@deepseek/platform-contracts";
import { requireSchemaVersion } from "@deepseek/testing-regression";

describe("context graph projection contracts", () => {
  it("defines serializable versioned projection request and result DTOs", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-projection-contract");
    const request = createProjectionRequest({ sessionId, prompt: "contract prompt", hardLimitTokens: 32 }) satisfies ContextProjectionRequest;
    const result = await engine.projectGraph(request);

    assert.equal(request.schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
    assert.equal(result.schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
    assert.deepEqual(requireSchemaVersion(request), []);
    assert.deepEqual(requireSchemaVersion(result), []);
    assert.equal(JSON.parse(JSON.stringify(result)).schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
  });

  it("creates projection cache entries with dependency invalidation metadata", async () => {
    const engine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-projection-cache-contract");
    const result: ContextProjectionResult = await engine.projectGraph(createProjectionRequest({
      sessionId,
      prompt: "cache contract",
      hardLimitTokens: 32
    }));
    const entry = createProjectionCacheEntry({
      requestFingerprint: result.replayFingerprint,
      dependencyFingerprints: result.cache.dependencyFingerprints
    }, result);

    assert.equal(entry.namespace, PROJECTION_CACHE_NAMESPACE);
    assert.equal(entry.key, projectionCacheKey({ requestFingerprint: result.replayFingerprint, dependencyFingerprints: result.cache.dependencyFingerprints }));
    assert.deepEqual(entry.invalidation, [...result.cache.dependencyFingerprints].sort());
  });
});
