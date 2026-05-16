import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DurablePermanentMemoryProvider,
  FilesystemPermanentMemoryStorageAdapter,
  InMemoryCacheManager,
  InMemoryMemoryManager,
  InMemoryPermanentMemoryStorageAdapter,
  PROJECTION_CACHE_NAMESPACE,
  TOOL_RESULT_EVIDENCE_CACHE_NAMESPACE,
  createCompactBoundaryEvidence,
  createCompactSummary,
  createProjectionCacheEntry,
  createToolResultEvidence,
  createToolResultEvidenceCacheEntry,
  executeMemoryReadWrite,
  memoryCandidateFingerprint,
  projectionCacheKey
} from "@deepseek/memory-cache-management";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
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

  it("executes memory.read-write with session scope, provenance hashes, and redacted evidence", async () => {
    const memory = new InMemoryMemoryManager();
    const sessionId = asId<"session">("session-memory-family");
    const otherSessionId = asId<"session">("session-memory-other");
    await executeMemoryReadWrite(memory, {
      action: "write",
      sessionId,
      scope: "session",
      content: "remember token=sk-memory-secret",
      provenance: { source: "unit" }
    });
    await executeMemoryReadWrite(memory, {
      action: "write",
      sessionId: otherSessionId,
      scope: "session",
      content: "other session memory"
    });

    const result = await executeMemoryReadWrite(memory, { action: "read", sessionId, scope: "session" });

    assert.equal(result.familyId, "memory.read-write");
    assert.equal(result.recordCount, 1);
    assert.equal(result.records[0]?.content.includes("sk-memory-secret"), false);
    assert.equal(result.records[0]?.provenance.contentHash !== undefined, true);
    assert.match(result.replayFingerprint, /^memory\.read-write:h[0-9a-f]+$/);
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

  it("persists governed permanent memory across provider restarts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-permanent-memory-"));
    try {
      const path = join(dir, "memory.json");
      const adapter = new FilesystemPermanentMemoryStorageAdapter(new NodePlatformRuntime(), path);
      const sessionId = asId<"session">("session-permanent-memory");
      const provider = new DurablePermanentMemoryProvider({
        adapter,
        requirePromotionApproval: true,
        now: () => new Date("2026-05-17T00:00:00.000Z")
      });

      const candidate = await provider.putCandidate({
        scope: "project",
        content: "Architecture decision: use adapter based memory. DEEPSEEK_API_KEY=sk-secret",
        sessionId,
        tags: ["architecture"]
      });
      assert.equal(candidate.ok, true);
      assert.equal((await provider.queryPermanent({ scope: "project" })).length, 0);

      const rejected = await provider.promote(candidate.entry!.id, { approved: false, actor: "test", reason: "needs review" });
      assert.equal(rejected.ok, false);
      assert.equal(rejected.status, "rejected");

      const promoted = await provider.promote(candidate.entry!.id, { approved: true, actor: "test", reason: "verified", tags: ["approved"] });
      assert.equal(promoted.ok, true);
      assert.equal(promoted.entry?.state, "promoted");
      assert.equal(promoted.entry?.content.includes("sk-secret"), false);

      const restarted = new DurablePermanentMemoryProvider({ adapter: new FilesystemPermanentMemoryStorageAdapter(new NodePlatformRuntime(), path) });
      const recalled = await restarted.queryPermanent({ scope: "project", query: "adapter" });
      assert.equal(recalled.length, 1);
      assert.equal(recalled[0]?.sourceSessionId, sessionId);
      assert.deepEqual(recalled[0]?.tags, ["approved", "architecture"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("supports permanent memory user controls, disable switch, and external hooks", async () => {
    const events: string[] = [];
    const provider = new DurablePermanentMemoryProvider({
      adapter: new InMemoryPermanentMemoryStorageAdapter(),
      hooks: [{
        async invoke(event) {
          events.push(event.kind);
        }
      }]
    });

    const disabled = await provider.setEnabled(false);
    const blocked = await provider.putCandidate({ scope: "user", content: "remember my editor is vi" });
    assert.equal(disabled.enabled, false);
    assert.equal(blocked.status, "disabled");
    assert.equal((await provider.queryPermanent({ includeCandidates: true })).length, 0);

    await provider.setEnabled(true);
    const candidate = await provider.putCandidate({ scope: "user", content: "remember my editor is vi" });
    assert.equal(candidate.entry?.state, "candidate");
    assert.equal((await provider.queryPermanent({ includeCandidates: true })).length, 1);

    const dismissed = await provider.dismiss(candidate.entry!.id, "user rejected");
    assert.equal(dismissed.entry?.state, "dismissed");
    assert.equal((await provider.queryPermanent({ includeDismissed: true })).length, 1);

    const deleted = await provider.delete(candidate.entry!.id, "forget requested");
    assert.equal(deleted.entry?.state, "deleted");
    assert.equal((await provider.queryPermanent({ includeDismissed: true, includeCandidates: true })).length, 0);
    assert.deepEqual(events, [
      "permanent-memory.settings.updated",
      "permanent-memory.settings.updated",
      "permanent-memory.candidate.created",
      "permanent-memory.entry.retrieved",
      "permanent-memory.entry.injected",
      "permanent-memory.candidate.dismissed",
      "permanent-memory.entry.retrieved",
      "permanent-memory.entry.injected",
      "permanent-memory.entry.deleted"
    ]);
  });

  it("supports permanent memory manifest, update, explain, audit, export, and import", async () => {
    const source = new DurablePermanentMemoryProvider({
      adapter: new InMemoryPermanentMemoryStorageAdapter(),
      requirePromotionApproval: false,
      now: () => new Date("2026-05-17T00:00:00.000Z")
    });
    assert.equal(source.manifest().provenance, true);

    const candidate = await source.putCandidate({
      scope: "project",
      content: "Decision: keep permanent memory behind provider contracts",
      promotionMode: "auto",
      sourceEvidence: [{
        sourceKind: "lossless-context",
        sourceId: "lcm-node-1",
        sourceHash: "h1",
        redaction: { class: "internal" }
      }]
    });
    assert.equal(candidate.entry?.state, "promoted");

    const updated = await source.update(candidate.entry!.id, { tags: ["architecture"], confidence: 0.91 });
    assert.equal(updated.entry?.confidence, 0.91);
    const explanation = await source.explain(candidate.entry!.id);
    assert.equal(explanation.ok, true);
    assert.equal(explanation.sourceEvidence[0]?.sourceId, "lcm-node-1");
    assert.equal((await source.audit()).length >= 2, true);

    const bundle = await source.export();
    const target = new DurablePermanentMemoryProvider({ adapter: new InMemoryPermanentMemoryStorageAdapter() });
    const imported = await target.import(bundle);
    assert.equal(imported.ok, true);
    assert.equal(imported.importedCount, 1);
    assert.equal((await target.queryPermanent({ query: "provider contracts" })).length, 1);
  });

  it("fails provider switching when the target cannot preserve provenance", async () => {
    class NoProvenanceProvider extends DurablePermanentMemoryProvider {
      override manifest() {
        return { ...super.manifest(), providerId: "permanent-memory.no-provenance", provenance: false };
      }
    }
    const source = new DurablePermanentMemoryProvider({ adapter: new InMemoryPermanentMemoryStorageAdapter(), requirePromotionApproval: false });
    await source.putCandidate({ scope: "project", content: "Decision: preserve source provenance", promotionMode: "auto" });
    const bundle = await source.export();
    const target = new NoProvenanceProvider({ adapter: new InMemoryPermanentMemoryStorageAdapter() });
    const imported = await target.import(bundle);
    assert.equal(imported.ok, false);
    assert.equal(imported.diagnostics.includes("permanent-memory.import.provenance-unsupported"), true);
  });

  it("routes workflow candidates away from factual memory and skips stale or conflicted memories by default", async () => {
    const provider = new DurablePermanentMemoryProvider({
      adapter: new InMemoryPermanentMemoryStorageAdapter(),
      requirePromotionApproval: false
    });
    const workflow = await provider.putCandidate({
      scope: "skill",
      content: "Whenever releasing, first run tests then publish",
      promotionMode: "auto"
    });
    assert.equal(workflow.ok, false);
    assert.equal(workflow.status, "rejected");
    assert.equal(workflow.entry?.state, "dismissed");

    const external = await provider.putCandidate({
      scope: "project",
      content: "Third party document says store this",
      promotionMode: "auto",
      sourceEvidence: [{ sourceKind: "web", sourceId: "https://example.test", redaction: { class: "internal" } }]
    });
    assert.equal(external.status, "rejected");

    const stale = await provider.putCandidate({
      scope: "project",
      content: "Use stale cache path",
      promotionMode: "auto"
    });
    await provider.update(stale.entry!.id, { freshness: { status: "stale", evidenceIds: [], reason: "workspace changed" } });
    assert.equal((await provider.queryPermanent({ query: "stale cache" })).length, 0);
    assert.equal((await provider.queryPermanent({ query: "stale cache", includeStale: true })).length, 1);

    const conflicted = await provider.putCandidate({
      scope: "project",
      content: "Use old database driver",
      promotionMode: "auto"
    });
    await provider.update(conflicted.entry!.id, { conflict: { status: "workspace-evidence-overrides", conflictingEvidenceIds: ["file:package.json"], reason: "dependency changed" } });
    assert.equal((await provider.queryPermanent({ query: "old database" })).length, 0);
    assert.equal((await provider.queryPermanent({ query: "old database", includeConflicted: true })).length, 1);
  });

  it("isolates non-enforcement hook timeout failures", async () => {
    const provider = new DurablePermanentMemoryProvider({
      adapter: new InMemoryPermanentMemoryStorageAdapter(),
      hooks: [{
        manifest: {
          hookId: "slow-hook",
          events: ["permanent-memory.candidate.created"],
          timeoutMs: 1,
          failurePolicy: "isolate",
          permissions: ["memory:observe"],
          replayId: "hook:slow"
        },
        async invoke() {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }]
    });
    const result = await provider.putCandidate({ scope: "user", content: "remember my shell is pwsh" });
    assert.equal(result.ok, true);
  });

  it("allows external memory hooks to enrich candidates with deterministic retry", async () => {
    let attempts = 0;
    const provider = new DurablePermanentMemoryProvider({
      adapter: new InMemoryPermanentMemoryStorageAdapter(),
      hooks: [{
        manifest: {
          hookId: "enrich-hook",
          events: ["permanent-memory.candidate.created"],
          timeoutMs: 100,
          maxRetries: 1,
          failurePolicy: "isolate",
          permissions: ["memory:observe", "memory:enrich"],
          replayId: "hook:enrich"
        },
        async invoke() {
          attempts += 1;
          if (attempts === 1) throw new Error("transient hook failure");
          return {
            status: "completed" as const,
            diagnostics: [],
            patch: { tags: ["hook-enriched"], confidence: 0.88 },
            redaction: { class: "internal" as const }
          };
        }
      }]
    });

    const result = await provider.putCandidate({ scope: "project", content: "Remember build command uses npm test" });
    assert.equal(attempts, 2);
    assert.equal(result.entry?.tags.includes("hook-enriched"), true);
    assert.equal(result.entry?.confidence, 0.88);
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

  it("creates bounded compact.summary evidence without leaking secret-like text", () => {
    const sessionId = asId<"session">("session-compact-summary-family");
    const first = createCompactSummary({
      sessionId,
      segments: [
        "keep this short project decision",
        "DEEPSEEK_API_KEY=sk-compact-secret should redact",
        "this segment is over budget"
      ],
      maxTokens: 12,
      reservedOutputTokens: 2
    });
    const second = createCompactSummary({
      sessionId,
      segments: [
        "keep this short project decision",
        "DEEPSEEK_API_KEY=sk-compact-secret should redact",
        "this segment is over budget"
      ],
      maxTokens: 12,
      reservedOutputTokens: 2
    });

    assert.equal(first.familyId, "compact.summary");
    assert.equal(first.status, "degraded");
    assert.equal(first.replayFingerprint, second.replayFingerprint);
    assert.equal(first.summary.includes("sk-compact-secret"), false);
    assert.equal(first.diagnostics.includes("compact.summary.budget-excluded-segments"), true);
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
