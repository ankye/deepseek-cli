import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { IndexProviderConfig, PageIndexPage, RuntimeEvent } from "@deepseek/platform-contracts";
import { INDEX_PROVIDER_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import {
  createDefaultIndexProviderDiagnostics,
  createDefaultIndexProviderManifest,
  createPageIndexProviderState,
  freshnessEvidenceFromMetadata,
  markStalePageIndexPagesFromWorkspaceWatermark,
  recordPageIndexTurn,
  resolveIndexProviderDiagnostics,
  resolvePageIndexRecall
} from "@deepseek/index-provider";

describe("index provider contracts", () => {
  it("projects PageIndex-only provider diagnostics without SDK or secret fields", () => {
    const summary = createDefaultIndexProviderDiagnostics();
    const zvec = summary.providers.find((provider) => provider.providerId === "zvec");
    const codeIndex = summary.providers.find((provider) => provider.providerId === "code-index");
    const serialized = JSON.stringify(summary);

    assert.equal(summary.kind, "index-provider.diagnostics");
    assert.equal(summary.defaultProviderId, "pageindex");
    assert.equal(summary.enabledProviderIds.includes("pageindex"), true);
    assert.equal(zvec?.status, "deferred");
    assert.equal(codeIndex?.status, "deferred");
    assert.equal(summary.diagnostics.every((diagnostic) => diagnostic.code === "INDEX_PROVIDER_DEFERRED"), true);
    assert.equal(serialized.includes("function"), false);
    assert.equal(serialized.includes("sk-"), false);
  });

  it("normalizes provider manifest intent without enabling unsupported semantic recall", () => {
    const manifest = {
      ...createDefaultIndexProviderManifest(),
      source: {
        scope: "workspace",
        sourceId: "config.indexProviders",
        description: "test config",
        redaction: { class: "internal", fields: ["sourceId"] }
      },
      providers: [{
        providerId: "zvec",
        kind: "zvec",
        status: "enabled",
        scope: ["workspace", "global"],
        ranking: ["semantic", "hybrid"],
        implementationStatus: "missing",
        metadata: { configured: true },
        redaction: { class: "internal", fields: ["metadata"] }
      }]
    } as const;
    const summary = resolveIndexProviderDiagnostics(manifest);
    const zvec = summary.providers.find((provider) => provider.providerId === "zvec");

    assert.equal(summary.source.scope, "workspace");
    assert.equal(zvec?.status, "deferred");
    assert.equal(zvec?.requestedStatus, "enabled");
    assert.equal(zvec?.implementationStatus, "missing");
    assert.equal(summary.diagnostics.some((diagnostic) => diagnostic.code === "INDEX_PROVIDER_UNSUPPORTED_ENABLED"), true);
    assert.equal(JSON.stringify(summary).includes("sk-"), false);
  });

  it("downgrades status-only semantic enablement without activation evidence", () => {
    const summary = resolveIndexProviderDiagnostics({
      ...createDefaultIndexProviderManifest(),
      source: {
        scope: "workspace",
        sourceId: "config.indexProviders",
        redaction: { class: "internal", fields: ["sourceId"] }
      },
      providers: [{
        providerId: "zvec",
        kind: "zvec",
        status: "enabled",
        implementationStatus: "available",
        metadata: { configured: true },
        redaction: { class: "internal", fields: ["metadata"] }
      }]
    });
    const zvec = summary.providers.find((provider) => provider.providerId === "zvec");

    assert.equal(zvec?.status, "deferred");
    assert.equal(zvec?.requestedStatus, "enabled");
    assert.equal(zvec?.implementationStatus, "available");
    assert.deepEqual(zvec?.metadata.missingActivationEvidence, ["implementation-module", "embedding-provider", "vector-store"]);
    assert.equal(summary.diagnostics.some((diagnostic) => diagnostic.code === "INDEX_PROVIDER_ACTIVATION_EVIDENCE_MISSING"), true);
  });

  it("enables semantic provider only when required activation evidence is present", () => {
    const summary = resolveIndexProviderDiagnostics({
      ...createDefaultIndexProviderManifest(),
      source: {
        scope: "runtime",
        sourceId: "runtime.indexProviders",
        redaction: { class: "internal", fields: ["sourceId"] }
      },
      providers: [{
        providerId: "zvec",
        kind: "zvec",
        status: "enabled",
        implementationStatus: "available",
        activationEvidence: [
          activationEvidence("implementation-module"),
          activationEvidence("embedding-provider"),
          activationEvidence("vector-store")
        ],
        metadata: { configured: true },
        redaction: { class: "internal", fields: ["metadata", "activationEvidence.metadata"] }
      }]
    });
    const zvec = summary.providers.find((provider) => provider.providerId === "zvec");

    assert.equal(zvec?.status, "enabled");
    assert.equal(zvec?.requestedStatus, undefined);
    assert.equal(zvec?.activationEvidence.every((evidence) => evidence.status === "present"), true);
    assert.equal(summary.enabledProviderIds.includes("zvec"), true);
    assert.equal(summary.metadata.semanticRecall, "enabled");
  });

  it("defines serializable PageIndex provider config and deferred semantic status", () => {
    const config: IndexProviderConfig = {
      schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
      providerId: "pageindex",
      kind: "pageindex",
      status: "enabled",
      scope: ["session", "workspace"],
      ranking: ["deterministic-text"],
      metadata: {
        semanticProviders: [{
          providerId: "zvec",
          kind: "zvec",
          status: "deferred"
        }]
      },
      redaction: { class: "internal" }
    };
    const state = createPageIndexProviderState();

    assert.equal(config.schemaVersion, INDEX_PROVIDER_SCHEMA_VERSION);
    assert.equal(state.status, "enabled");
    assert.equal(JSON.parse(JSON.stringify(config)).metadata.semanticProviders[0].status, "deferred");
    assert.equal(JSON.stringify(config).includes("function"), false);
  });

  it("records and recalls PageIndex pages through host-neutral DTOs", () => {
    const pages = recordPageIndexTurn([], {
      prompt: "database auth decision",
      terminal: terminalEvent("session-index-provider", "turn-index-provider", "database answer")
    });
    const recall = resolvePageIndexRecall(pages, { query: "database", scope: "session" });

    assert.equal(pages[0]?.schemaVersion, INDEX_PROVIDER_SCHEMA_VERSION);
    assert.equal(recall.schemaVersion, INDEX_PROVIDER_SCHEMA_VERSION);
    assert.equal(recall.provider.kind, "pageindex");
    assert.equal(recall.semanticStatus, "deferred");
    assert.equal(recall.items[0]?.page.pageId, pages[0]?.pageId);
    assert.equal(recall.items[0]?.matchedFields.includes("promptPreview"), true);
    assert.doesNotThrow(() => JSON.stringify(recall));
  });

  it("preserves bounded freshness evidence for workspace watermark decisions", () => {
    const page = {
      ...recordPageIndexTurn([], {
        prompt: "database watermark",
        terminal: terminalEvent("session-index-provider-watermark", "turn-index-provider-watermark", "ok")
      })[0]!,
      scope: "workspace",
      evidenceQuality: {
        createdAt: "2026-05-13T00:00:00.000Z",
        createdAtSource: "runtime-event",
        freshnessStatus: "fresh",
        ranking: "deterministic-text",
        semanticStatus: "deferred",
        workspaceCheckpointWatermark: 1
      }
    } satisfies PageIndexPage;

    const [stale] = markStalePageIndexPagesFromWorkspaceWatermark([page], { workspaceCheckpointWatermark: 2 });
    const evidence = freshnessEvidenceFromMetadata(stale?.freshnessEvidence ?? {});

    assert.equal(stale?.evidenceQuality.freshnessStatus, "stale");
    assert.equal(evidence.reason, "workspace-checkpoint-watermark-advanced");
    assert.equal(evidence.workspaceCheckpointWatermark, 1);
    assert.equal(evidence.currentWorkspaceCheckpointWatermark, 2);
  });
});

function terminalEvent(session: string, turn: string, assistantText: string): RuntimeEvent {
  return {
    kind: "agent.loop.completed",
    sessionId: asId<"session">(session),
    turnId: asId<"turn">(turn),
    createdAt: "2026-05-13T00:00:00.000Z",
    trace: {
      traceId: asId<"trace">(`trace-${turn}`),
      spanId: asId<"span">(`span-${turn}`),
      correlationId: asId<"correlation">(`corr-${turn}`),
      sessionId: asId<"session">(session)
    },
    data: { status: "completed", assistantText }
  };
}

function activationEvidence(kind: "implementation-module" | "embedding-provider" | "vector-store") {
  return {
    kind,
    status: "present",
    sourceId: `test.${kind}`,
    metadata: { fixture: true },
    redaction: { class: "internal", fields: ["metadata"] }
  } as const;
}
