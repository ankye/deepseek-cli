import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { InMemoryUsageBudgetManager } from "./index.js";

describe("usage budget management", () => {
  it("tracks per-session usage totals and enforces hard limits", async () => {
    const sessionId = asId<"session">("session-usage-budget");
    const manager = new InMemoryUsageBudgetManager({ maxInputTokens: 100, maxOutputTokens: 50, maxCostMicros: 1_000 });

    await manager.record({ sessionId, inputTokens: 60, outputTokens: 20, costMicros: 400, elapsedMs: 10 });
    await manager.record({ sessionId, inputTokens: 20, outputTokens: 10, costMicros: 200, elapsedMs: 5 });

    assert.deepEqual(await manager.total(sessionId), { sessionId, inputTokens: 80, outputTokens: 30, costMicros: 600, elapsedMs: 15 });
    assert.deepEqual(await manager.check(sessionId, { inputTokens: 5 }), { allowed: true, warning: "usage.inputTokens.near-limit" });
    assert.deepEqual(await manager.check(sessionId, { inputTokens: 25 }), { allowed: false, hardLimit: "usage.inputTokens" });
    assert.deepEqual(await manager.check(sessionId, { outputTokens: 25 }), { allowed: false, hardLimit: "usage.outputTokens" });
    assert.deepEqual(await manager.check(sessionId, { costMicros: 401 }), { allowed: false, hardLimit: "usage.costMicros" });
  });

  it("returns deterministic context budget decisions", async () => {
    const manager = new InMemoryUsageBudgetManager({
      contextHardLimitTokens: 12_000,
      contextSoftLimitTokens: 9_000,
      reservedOutputTokens: 1_500
    });

    const sessionId = asId<"session">("session-usage-context-budget");
    assert.deepEqual(await manager.contextBudget({ sessionId, purpose: "test", requestedInputTokens: 5_000 }), {
      hardLimitTokens: 12_000,
      softLimitTokens: 9_000,
      reservedOutputTokens: 1_500,
      reason: "deterministic-default"
    });
    assert.deepEqual(await manager.contextBudget({ sessionId, purpose: "test", requestedInputTokens: 5_000, reservedOutputTokens: 2_000 }), {
      hardLimitTokens: 12_000,
      softLimitTokens: 9_000,
      reservedOutputTokens: 2_000,
      reason: "deterministic-default"
    });
  });
});
