import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { CODE_INTELLIGENCE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { DeterministicCodeIntelligenceService } from "@deepseek/code-intelligence";

describe("code-intelligence safe-fallback & idempotence", () => {
  it("returns { ok: true, value: { nodes: [] } } when root does not exist", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const service = new DeterministicCodeIntelligenceService(platform);
    const sessionId = asId<"session">("session-ci-missing-root");

    const result = await service.contextNodes({ sessionId, root: "/nonexistent/root" });

    assert.equal(result.ok, true);
    assert.ok(result.value);
    assert.equal(result.value!.schemaVersion, CODE_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(result.value!.sessionId, sessionId);
    assert.deepEqual(result.value!.nodes, []);
    assert.equal(result.value!.redaction.class, "internal");
  });

  it("falls back safely when root is missing even with includeDiagnostics/includeSymbols flags", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const service = new DeterministicCodeIntelligenceService(platform);
    const sessionId = asId<"session">("session-ci-missing-flags");

    const result = await service.contextNodes({
      sessionId,
      root: "/no/such/workspace",
      includeDiagnostics: true,
      includeSymbols: true,
      limit: 10
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.value!.nodes, []);
  });

  it("invalidate() on an unknown path resolves without throwing", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const service = new DeterministicCodeIntelligenceService(platform);

    const outcome = await service.invalidate("/workspace/never-indexed.ts");
    assert.equal(outcome, undefined);
  });

  it("invalidate() is idempotent across repeated calls on the same unknown path", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const service = new DeterministicCodeIntelligenceService(platform);
    const unknownPath = "/workspace/phantom.ts";

    const first = await service.invalidate(unknownPath);
    const second = await service.invalidate(unknownPath);
    const third = await service.invalidate(unknownPath);

    assert.equal(first, undefined);
    assert.equal(second, undefined);
    assert.equal(third, undefined);
  });

  it("invalidate() does not throw when interleaved with contextNodes on a missing root", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const service = new DeterministicCodeIntelligenceService(platform);
    const sessionId = asId<"session">("session-ci-interleaved");

    await service.invalidate("/missing/a.ts");
    const first = await service.contextNodes({ sessionId, root: "/missing" });
    await service.invalidate("/missing/b.ts");
    const second = await service.contextNodes({ sessionId, root: "/missing" });

    assert.equal(first.ok, true);
    assert.deepEqual(first.value!.nodes, []);
    assert.equal(second.ok, true);
    assert.deepEqual(second.value!.nodes, []);
  });
});
