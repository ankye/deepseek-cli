import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { asId } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

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

  it("auto-enriches projection from workspace file without a manual contextNodes call", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/auto-enrich.ts", "// TODO auto enrichment\nexport const answer = 42;\n");

    const projection = await deps.context.projectGraph({
      schemaVersion: "1.0.0",
      sessionId: asId<"session">("session-ci-auto"),
      purpose: "model-request",
      prompt: "Review diagnostics",
      budget: { hardLimitTokens: 200, reservedOutputTokens: 20 },
      scope: {
        sessionId: asId<"session">("session-ci-auto"),
        availableRedactionClasses: ["public", "internal", "sensitive"],
        workspaceRoot: "/workspace"
      },
      trace: {
        traceId: asId<"trace">("trace-ci-auto"),
        spanId: asId<"span">("span-ci-auto"),
        correlationId: asId<"correlation">("corr-ci-auto"),
        sessionId: asId<"session">("session-ci-auto")
      },
      policy: {},
      compatibility: { schemaVersion: "1.0.0" }
    });

    assert.equal(projection.status, "completed");
    assert.equal(projection.selectedNodes.some((node) => node.source === "code-intelligence"), true);
  });

  it("projects references and definitions through the runtime main path", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.platform.writeFile("/workspace/reference.ts", "export function run() {}\nrun();\n");
    await deps.codeIntelligence.index("/workspace");
    const gateway = new CapturingGateway();
    const loopDeps = { ...deps, models: gateway };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);

    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "Inspect function run references",
      caller: "code-intelligence.integration",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const memoryEvent = events.find((event) => event.kind === "context.memory.collected");
    const codeEvidence = memoryEvent?.data.codeEvidence as { candidateCount?: number; status?: string } | undefined;
    assert.equal(codeEvidence?.status, "completed");
    assert.equal((codeEvidence?.candidateCount ?? 0) > 0, true);
    assert.equal(gateway.requests[0]?.messages?.[0]?.content.includes("definition run"), true);
    await kernel.shutdown();
  });

  it("degrades reference and definition misses without blocking model dispatch", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const gateway = new CapturingGateway();
    const loopDeps = { ...deps, models: gateway };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);

    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "Inspect function MissingSymbol references",
      caller: "code-intelligence.integration",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile
    }));

    const memoryEvent = events.find((event) => event.kind === "context.memory.collected");
    const codeEvidence = memoryEvent?.data.codeEvidence as { status?: string; scopeCounts?: { unresolved?: number } } | undefined;
    assert.equal(codeEvidence?.status, "degraded");
    assert.equal((codeEvidence?.scopeCounts?.unresolved ?? 0) > 0, true);
    assert.equal(events.some((event) => event.kind === "model.requested"), true);
    assert.equal(gateway.requests.length, 1);
    await kernel.shutdown();
  });
});

class CapturingGateway {
  readonly requests: import("@deepseek/platform-contracts").ModelRequest[] = [];

  async *stream(request: import("@deepseek/platform-contracts").ModelRequest): AsyncIterable<import("@deepseek/platform-contracts").ModelStreamEvent> {
    this.requests.push(request);
    yield { kind: "delta", text: "captured" };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
