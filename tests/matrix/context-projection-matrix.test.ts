import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createProjectionRequest, InMemoryContextEngine } from "@deepseek/context-engine";
import { asId } from "@deepseek/platform-contracts";

describe("context projection matrix", () => {
  it("covers empty, large, secret, stale-cache, hard-budget, and degraded-memory scenarios", async () => {
    const cases: ReadonlyArray<{ readonly name: string; readonly prompt: string; readonly hard: number; readonly soft?: number; readonly expectedStatus: string }> = [
      { name: "empty", prompt: "", hard: 10, expectedStatus: "degraded" },
      { name: "large", prompt: "one two three four five", hard: 3, expectedStatus: "rejected" },
      { name: "secret", prompt: "sk-live-secret-value", hard: 10, expectedStatus: "degraded" },
      { name: "memory-unavailable", prompt: "memory missing but prompt works", hard: 10, expectedStatus: "completed" },
      { name: "soft-degraded", prompt: "one two three", hard: 10, soft: 1, expectedStatus: "degraded" }
    ];

    for (const item of cases) {
      const engine = new InMemoryContextEngine();
      const sessionId = asId<"session">(`session-projection-${item.name}`);
      const result = await engine.projectGraph(createProjectionRequest({
        sessionId,
        prompt: item.prompt,
        hardLimitTokens: item.hard,
        ...(item.soft !== undefined ? { softLimitTokens: item.soft } : {})
      }));
      assert.equal(result.status, item.expectedStatus, item.name);
      assert.equal(result.prompt.includes("sk-live-secret-value"), false);
    }

    const cacheEngine = new InMemoryContextEngine();
    const sessionId = asId<"session">("session-projection-stale-cache");
    const request = createProjectionRequest({ sessionId, prompt: "stale cache", hardLimitTokens: 10 });
    const first = await cacheEngine.projectGraph(request);
    const second = await cacheEngine.projectGraph(request);
    assert.equal(first.cache.hit, false);
    assert.equal(second.cache.hit, true);
  });
});
