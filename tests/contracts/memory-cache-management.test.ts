import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryCacheManager,
  InMemoryMemoryManager,
  PROJECTION_CACHE_NAMESPACE,
  TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE,
  createCompactBoundaryEvidence,
  createProjectionCacheEntry,
  createToolResultEvidence,
  createToolResultEvidenceCacheEntry,
  memoryCandidateFingerprint,
  projectionCacheKey
} from "@deepseek/memory-cache-management";
import type { CacheEntry, ContextProjectionResult, MemoryEntry } from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

function placeholderProjection(): ContextProjectionResult {
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    status: "completed",
    sessionId: asId<"session">("session-mcm-contract"),
    prompt: "",
    selectedNodes: [],
    excludedNodes: [],
    estimatedTokens: 0,
    budget: {
      status: "allowed",
      hardLimitTokens: 32,
      reservedOutputTokens: 0,
      selectedTokens: 0,
      excludedTokens: 0,
      reason: "within-budget"
    },
    redaction: { selected: 0, redacted: 0, excluded: 0, classes: [], secretLikeBlocked: 0 },
    cache: {
      namespace: PROJECTION_CACHE_NAMESPACE,
      key: asId<"cacheKey">(`${PROJECTION_CACHE_NAMESPACE}:placeholder`),
      hit: false,
      dependencyFingerprints: []
    },
    ordering: { strategy: "priority-recency-stable", tieBreak: ["priority", "createdAt", "id"] },
    replayFingerprint: "replay-placeholder"
  };
}

describe("memory-cache-management contracts", () => {
  it("projectionCacheKey is stable under dependencyFingerprints reordering", () => {
    const a = projectionCacheKey({ requestFingerprint: "req-abc", dependencyFingerprints: ["alpha", "beta", "gamma"] });
    const b = projectionCacheKey({ requestFingerprint: "req-abc", dependencyFingerprints: ["gamma", "alpha", "beta"] });
    const c = projectionCacheKey({ requestFingerprint: "req-abc", dependencyFingerprints: ["beta", "alpha", "gamma"] });
    assert.equal(a, b);
    assert.equal(a, c);
  });

  it("InMemoryCacheManager.set with the same key overwrites previous value", async () => {
    const cache = new InMemoryCacheManager();
    const key = projectionCacheKey({ requestFingerprint: "req-overwrite", dependencyFingerprints: ["dep-1"] });
    const first: CacheEntry<string> = {
      key,
      namespace: PROJECTION_CACHE_NAMESPACE,
      value: "first",
      createdAt: new Date(0).toISOString(),
      invalidation: ["dep-1"]
    };
    const second: CacheEntry<string> = { ...first, value: "second" };
    await cache.set(first);
    await cache.set(second);
    const fetched = await cache.get<string>(key);
    assert.ok(fetched);
    assert.equal(fetched.value, "second");
  });

  it("InMemoryCacheManager.get returns frozen entry with frozen invalidation", async () => {
    const cache = new InMemoryCacheManager();
    const input = { requestFingerprint: "req-frozen", dependencyFingerprints: ["dep-x", "dep-y"] };
    await cache.set(createProjectionCacheEntry(input, placeholderProjection()));
    const fetched = await cache.get<ContextProjectionResult>(projectionCacheKey(input));
    assert.ok(fetched);
    assert.equal(Object.isFrozen(fetched), true);
    assert.equal(Object.isFrozen(fetched.invalidation), true);
    assert.throws(() => {
      (fetched as { value: unknown }).value = null;
    });
  });

  it("InMemoryMemoryManager.query preserves put insertion order within scope", async () => {
    const memory = new InMemoryMemoryManager();
    const base = {
      scope: "working" as const,
      provenance: {},
      redaction: { class: "public" as const }
    };
    const one: MemoryEntry = { ...base, id: asId<"memory">("mem-1"), content: "one" };
    const two: MemoryEntry = { ...base, id: asId<"memory">("mem-2"), content: "two" };
    const three: MemoryEntry = { ...base, id: asId<"memory">("mem-3"), content: "three" };
    const sessionOnly: MemoryEntry = { ...base, scope: "session", id: asId<"memory">("mem-session-1"), content: "session-one" };
    await memory.put(one);
    await memory.put(two);
    await memory.put(sessionOnly);
    await memory.put(three);
    const working = await memory.query("working");
    assert.deepEqual(working.map((entry) => entry.id), ["mem-1", "mem-2", "mem-3"]);
    const session = await memory.query("session");
    assert.deepEqual(session.map((entry) => entry.id), ["mem-session-1"]);
  });

  it("memoryCandidateFingerprint changes when content changes without exposing raw content", () => {
    const base = {
      id: asId<"memory">("mem-fingerprint"),
      scope: "session" as const,
      provenance: { source: "test" },
      redaction: { class: "internal" as const }
    };
    const first = memoryCandidateFingerprint({ entry: { ...base, content: "remember architecture decision" } });
    const same = memoryCandidateFingerprint({ entry: { ...base, content: "remember architecture decision" } });
    const changed = memoryCandidateFingerprint({ entry: { ...base, content: "changed architecture decision" } });
    assert.equal(first, same);
    assert.notEqual(first, changed);
    assert.equal(first.includes("remember architecture decision"), false);
  });

  it("createCompactBoundaryEvidence creates deterministic bounded fingerprints", () => {
    const input = {
      projectionFingerprint: "projection-abc",
      sessionId: asId<"session">("session-compact-contract"),
      turnId: "turn-compact-contract",
      selectedNodeCount: 3,
      excludedNodeCount: 2,
      selectedTokens: 90,
      excludedTokens: 40,
      hardLimitTokens: 100,
      softLimitTokens: 80
    };
    const first = createCompactBoundaryEvidence(input);
    const second = createCompactBoundaryEvidence(input);
    assert.equal(first.fingerprint, second.fingerprint);
    assert.equal(first.pressure, "soft");
    assert.equal(first.redaction.class, "internal");
  });

  it("createToolResultEvidence stores bounded hashes instead of preview text", () => {
    const evidence = createToolResultEvidence({
      toolCallId: "call-contract",
      toolName: "core.file.read",
      capabilityId: "core.file.read",
      terminalKind: "capability.completed",
      feedback: {
        schemaVersion: "1.0.0",
        toolCallId: "call-contract",
        toolName: "core.file.read",
        capabilityId: "core.file.read",
        status: "success",
        preview: {
          text: "secret-like output should not be copied here",
          byteLength: 44,
          truncated: false,
          limitBytes: 100,
          redaction: { class: "internal", fields: ["text"] }
        },
        diagnostics: [],
        trace: { traceId: "trace-contract", correlationId: "corr-contract" },
        continuation: "continue",
        redaction: { class: "internal", fields: ["preview.text"] }
      }
    });
    assert.equal(JSON.stringify(evidence).includes("secret-like output"), false);
    assert.equal(evidence.previewBytes, 44);
    const entry = createToolResultEvidenceCacheEntry(evidence);
    assert.equal(entry.namespace, TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE);
    assert.equal(entry.value.replayHash, evidence.replayHash);
  });
});
