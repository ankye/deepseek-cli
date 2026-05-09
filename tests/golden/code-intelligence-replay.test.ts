import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { asId } from "@deepseek/platform-contracts";

describe("code intelligence golden replay", () => {
  it("normalizes code intelligence context evidence without raw secrets", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const sessionId = asId<"session">("session-ci-golden");
    await deps.platform.writeFile("/workspace/app.ts", "// TODO DEEPSEEK_API_KEY=sk-test-secret\nexport const answer = 42;\n");
    const context = await deps.codeIntelligence.contextNodes({ sessionId, root: "/workspace" });
    const trace = await deps.regression.normalize({
      name: "code-intelligence-context",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: [],
      runtime: [{ kind: "context.projection.completed", sessionId, trace: { traceId: asId<"trace">("trace-ci-golden"), spanId: asId<"span">("span-ci-golden"), correlationId: asId<"correlation">("corr-ci-golden"), sessionId }, data: context.value ?? {} }],
      sessions: [{ sessionId, sequence: 1, kind: "code-intelligence.context", at: new Date(0).toISOString(), payload: context.value ?? {}, redaction: { class: "internal" } }],
      assertions: [{ expectedKind: "code-intelligence.context" }]
    });
    const serialized = JSON.stringify(trace);

    assert.equal(serialized.includes("sk-test-secret"), false);
    assert.match(serialized, /code-intelligence/);
    assert.equal((await deps.regression.replay(trace)).ok, true);
  });
});
