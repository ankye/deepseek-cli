import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OBSERVABILITY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { defaultPrivacySettings, InMemoryObservabilitySink, redactObservabilityArtifact } from "./index.js";

const secret = "sk-live-1234567890";

describe("observability privacy sink", () => {
  it("normalizes emitted events into canonical redacted records", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({
      kind: "trace",
      at: new Date(0).toISOString(),
      name: "provider.request",
      fields: {
        url: "https://api.deepseek.com",
        Authorization: `Bearer ${secret}`,
        nested: { apiKey: secret }
      }
    });

    const records = await sink.drain();
    assert.equal(records.length, 1);
    const [record] = records;
    assert.ok(record);
    const serialized = JSON.stringify(record);
    assert.equal(record.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.equal(record.recordId, "observability-record-1");
    assert.equal(record.privacyDecision.action, "allow-local");
    assert.equal(record.persistence.scope, "local-diagnostics");
    assert.equal(record.redactionSummary.redactedValueCount >= 2, true);
    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("[REDACTED:secret]") || serialized.includes("[REDACTED:api-key]"), true);
  });

  it("generates bounded local diagnostic bundles and denies external export by default", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({ kind: "log", at: new Date(0).toISOString(), name: "first", fields: { message: "one" } });
    await sink.emit({ kind: "audit", at: new Date(0).toISOString(), name: "second", fields: { token: secret } });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "support case", maxRecords: 1 });
    const denied = await sink.createDiagnosticBundle({ target: "external-telemetry", reason: `upload ${secret}` });

    assert.equal(bundle.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.equal(bundle.records.length, 1);
    assert.equal(bundle.selectedRecordCount, 1);
    assert.equal(bundle.totalRecordCount, 2);
    assert.equal(bundle.truncated, true);
    assert.equal(bundle.privacyDecision.action, "allow-local");
    assert.equal(JSON.stringify(bundle).includes(secret), false);
    assert.equal(denied.privacyDecision.action, "deny-export");
    assert.equal(denied.records.length, 0);
    assert.equal(JSON.stringify(denied).includes(secret), false);
  });

  it("honors local diagnostic opt-out", async () => {
    const sink = new InMemoryObservabilitySink({
      ...defaultPrivacySettings,
      localDiagnosticsEnabled: false
    });
    await sink.emit({ kind: "trace", at: new Date(0).toISOString(), name: "dropped", fields: { message: "drop" } });

    assert.deepEqual(await sink.drain(), []);
    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "local disabled" });
    assert.equal(bundle.records.length, 0);
    assert.equal(bundle.privacyDecision.action, "allow-local");
  });

  it("redacts standalone observability artifacts", () => {
    const artifact = redactObservabilityArtifact({ env: `DEEPSEEK_API_KEY=${secret}` });
    assert.equal(JSON.stringify(artifact).includes(secret), false);
    assert.equal(JSON.stringify(artifact).includes("[REDACTED:secret]"), true);
  });
});
