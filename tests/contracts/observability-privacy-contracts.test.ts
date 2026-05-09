import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OBSERVABILITY_SCHEMA_VERSION, type DiagnosticBundle, type ObservabilityRecord, type PrivacySettings } from "@deepseek/platform-contracts";
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
