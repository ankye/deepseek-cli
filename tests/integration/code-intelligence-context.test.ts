import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { asId } from "@deepseek/platform-contracts";

describe("code intelligence context integration", () => {
  it("feeds diagnostic context nodes into context projection", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/app.ts", "// TODO project diagnostic\nexport function run() {}\n");
    const codeContext = await deps.codeIntelligence.contextNodes({
      sessionId: asId<"session">("session-ci-integration"),
      root: "/workspace",
      includeDiagnostics: true,
      includeSymbols: false
    });
    assert.equal(codeContext.ok, true);

    const projection = await deps.context.projectGraph({
      schemaVersion: "1.0.0",
      sessionId: asId<"session">("session-ci-integration"),
      purpose: "model-request",
      prompt: "Review diagnostics",
      budget: { hardLimitTokens: 200, reservedOutputTokens: 20 },
      scope: { sessionId: asId<"session">("session-ci-integration"), availableRedactionClasses: ["public", "internal", "sensitive"] },
      candidateNodes: codeContext.value?.nodes ?? [],
      trace: {
        traceId: asId<"trace">("trace-ci-integration"),
        spanId: asId<"span">("span-ci-integration"),
        correlationId: asId<"correlation">("corr-ci-integration"),
        sessionId: asId<"session">("session-ci-integration")
      },
      policy: {},
      compatibility: { schemaVersion: "1.0.0" }
    });

    assert.equal(projection.status, "completed");
    assert.equal(projection.selectedNodes.some((node) => node.source === "code-intelligence"), true);
  });
});
