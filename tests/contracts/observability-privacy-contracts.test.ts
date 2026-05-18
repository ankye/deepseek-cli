import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId, createVisibleReasoningRecord, OBSERVABILITY_SCHEMA_VERSION, projectVisibleReasoning, type DiagnosticBundle, type ObservabilityRecord, type PrivacySettings } from "@deepseek/platform-contracts";
import { defaultPrivacySettings, InMemoryObservabilitySink } from "@deepseek/observability";

describe("observability privacy contracts", () => {
  it("serializes privacy settings, canonical records, and diagnostic bundles", async () => {
    const settings: PrivacySettings = {
      ...defaultPrivacySettings,
      telemetryEnabled: false,
      allowExternalExport: false
    };
    const sink = new InMemoryObservabilitySink(settings);
    await sink.emit({
      kind: "audit",
      at: new Date(0).toISOString(),
      name: "contract.secret",
      fields: { token: "sk-contract-1234567890" }
    });

    const [record] = await sink.drain();
    assertRecord(record);
    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "contract" });
    assertBundle(bundle);
    const serialized = JSON.stringify({ settings, record, bundle });
    assert.equal(serialized.includes("sk-contract-1234567890"), false);
    assert.equal(serialized.includes(OBSERVABILITY_SCHEMA_VERSION), true);
  });

  it("returns denied privacy decisions before external export payloads are produced", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({ kind: "trace", at: new Date(0).toISOString(), name: "local", fields: { message: "kept locally" } });

    const bundle = await sink.createDiagnosticBundle({ target: "support-upload", reason: "external request" });
    assert.equal(bundle.privacyDecision.action, "deny-export");
    assert.equal(bundle.privacyDecision.exportAllowed, false);
    assert.equal(bundle.records.length, 0);
  });

  it("supports CLI diagnostics bundle projection without leaking support secrets", async () => {
    const { collectCliDiagnostics, renderDiagnosticsResult } = await import("../../src/apps/cli/src/diagnostics/index.js");
    const result = await collectCliDiagnostics("bundle", {
      command: "diagnostics",
      prompt: "",
      output: "json",
      live: false,
      diagnosticsCommand: "bundle",
      diagnosticsInput: { fakeSecret: true }
    });
    const rendered = renderDiagnosticsResult(result, "json").join("\n");

    assert.equal(result.kind, "diagnostics.bundle");
    assert.equal(result.externalExportDecision?.action, "deny-export");
    assert.equal(result.referencePitFixtureIds.includes("pit.diagnostic-redaction.support-bundle"), true);
    assert.equal(rendered.includes("sk-diagnostics-secret-123456"), false);
    assert.equal(rendered.includes("hidden chain-of-thought diagnostics payload"), false);
    assert.equal(rendered.includes("raw provider reasoning is excluded"), false);
    assert.equal(rendered.includes("visible:hdiagnostics"), true);
  });

  it("keeps visible reasoning diagnostic bundles to redacted summaries and fingerprints", async () => {
    const sink = new InMemoryObservabilitySink();
    const trace = {
      traceId: asId<"trace">("trace-visible-diagnostics"),
      spanId: asId<"span">("span-visible-diagnostics"),
      correlationId: asId<"correlation">("correlation-visible-diagnostics")
    };
    const record = createVisibleReasoningRecord({
      sessionId: asId<"session">("session-visible-diagnostics"),
      turnId: asId<"turn">("turn-visible-diagnostics"),
      trace,
      createdAt: new Date(0).toISOString(),
      actor: "runtime",
      stepKind: "verification",
      status: "completed",
      summary: "Verified DEEPSEEK_API_KEY=ds-visible-secret-123456789 through a support bundle check.",
      detail: "Long private detail with sk-visible-secret-123456789 and file preview that must stay out of bundles.",
      sequence: 1,
      metadata: { rawProviderReasoning: "literal hidden reasoning", filePreview: "private source excerpt" }
    });
    const projection = projectVisibleReasoning([record], { renderer: "json", detailLevel: "full" });
    await sink.emit({
      kind: "trace",
      at: new Date(0).toISOString(),
      name: "visible.reasoning.projected",
      fields: projection
    });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "visible reasoning support", maxRecords: 1 });
    const serialized = JSON.stringify(bundle);

    assert.equal(serialized.includes("ds-visible-secret-123456789"), false);
    assert.equal(serialized.includes("sk-visible-secret-123456789"), false);
    assert.equal(serialized.includes("literal hidden reasoning"), false);
    assert.equal(serialized.includes("private source excerpt"), false);
    assert.equal(serialized.includes("replayFingerprint"), true);
    assert.equal(serialized.includes(projection.replayFingerprint), true);
    assert.equal(serialized.includes("recordSummaries"), true);
    assert.equal(serialized.includes("Long private detail"), false);
    assert.equal(serialized.includes("filePreview"), false);
  });
});

function assertRecord(record: ObservabilityRecord | undefined): asserts record is ObservabilityRecord {
  assert.ok(record);
  assert.equal(record.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(record.compatibility.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(record.privacyDecision.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(record.redactionSummary.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
}

function assertBundle(bundle: DiagnosticBundle): void {
  assert.equal(bundle.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(bundle.compatibility.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(bundle.privacyDecision.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
  assert.equal(bundle.redactionSummary.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
}
