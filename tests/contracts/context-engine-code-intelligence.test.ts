import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import {
  CONTEXT_PROJECTION_SCHEMA_VERSION,
  asId,
  type CodeIntelligenceContextRequest,
  type CodeIntelligenceContextResult,
  type CodeIntelligenceProviderMetadata,
  type CodeIntelligenceService,
  type ContextProjectionRequest,
  type Diagnostic,
  type SerializableResult,
  type SymbolReference,
  type CodeIntelligenceIndexResult
} from "@deepseek/platform-contracts";
import { DeterministicCodeIntelligenceService } from "@deepseek/code-intelligence";
import { InMemoryContextEngine } from "@deepseek/context-engine";

function request(sessionId: string, prompt = "Review diagnostics"): ContextProjectionRequest {
  const session = asId<"session">(sessionId);
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId: session,
    purpose: "model-request",
    prompt,
    budget: { hardLimitTokens: 200, reservedOutputTokens: 20 },
    scope: {
      sessionId: session,
      availableRedactionClasses: ["public", "internal", "sensitive"],
      workspaceRoot: "/workspace"
    },
    trace: {
      traceId: asId<"trace">(`trace-${sessionId}`),
      spanId: asId<"span">(`span-${sessionId}`),
      correlationId: asId<"correlation">(`corr-${sessionId}`),
      sessionId: session
    },
    policy: {},
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  };
}

class ThrowingCodeIntelligenceService implements CodeIntelligenceService {
  async status(): Promise<CodeIntelligenceProviderMetadata> {
    throw new Error("status should not be called in this test");
  }
  async index(): Promise<SerializableResult<CodeIntelligenceIndexResult>> {
    throw new Error("index should not be called in this test");
  }
  async diagnostics(): Promise<readonly Diagnostic[]> {
    return [];
  }
  async symbols(): Promise<readonly SymbolReference[]> {
    return [];
  }
  async definitions(): Promise<readonly SymbolReference[]> {
    return [];
  }
  async references(): Promise<readonly SymbolReference[]> {
    return [];
  }
  async contextNodes(_request: CodeIntelligenceContextRequest): Promise<SerializableResult<CodeIntelligenceContextResult>> {
    throw new Error("context intelligence internal failure");
  }
  async invalidate(): Promise<void> {
    return;
  }
}

describe("context-engine code-intelligence auto-enrichment", () => {
  it("adds source=code-intelligence nodes when codeIntelligence is injected", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    await platform.writeFile("/workspace/app.ts", "// TODO integrate ci\nexport function run() {}\n");
    const codeIntelligence = new DeterministicCodeIntelligenceService(platform);
    const engine = new InMemoryContextEngine({ codeIntelligence });

    const projection = await engine.projectGraph(request("session-ci-enrich"));

    assert.equal(projection.status, "completed");
    assert.equal(
      projection.selectedNodes.some((node) => node.source === "code-intelligence"),
      true
    );
  });

  it("does not emit code-intelligence nodes when no codeIntelligence is injected (zero regression)", async () => {
    const engine = new InMemoryContextEngine();

    const projection = await engine.projectGraph(request("session-ci-noinject"));

    assert.equal(projection.status, "completed");
    assert.equal(
      projection.selectedNodes.some((node) => node.source === "code-intelligence"),
      false
    );
  });

  it("falls back gracefully when codeIntelligence.contextNodes throws", async () => {
    const engine = new InMemoryContextEngine({ codeIntelligence: new ThrowingCodeIntelligenceService() });

    const projection = await engine.projectGraph(request("session-ci-throw"));

    assert.notEqual(projection.status, "rejected");
    assert.equal(
      projection.selectedNodes.some((node) => node.source === "code-intelligence"),
      false
    );
    assert.equal(projection.error, undefined);
  });

  it("does not enrich when workspace root is missing on platform (safe fallback)", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const codeIntelligence = new DeterministicCodeIntelligenceService(platform);
    const engine = new InMemoryContextEngine({ codeIntelligence });

    const projection = await engine.projectGraph(request("session-ci-empty-root"));

    assert.equal(projection.status, "completed");
    assert.equal(
      projection.selectedNodes.some((node) => node.source === "code-intelligence"),
      false
    );
  });
});
