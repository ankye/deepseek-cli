import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultPrivacySettings, InMemoryObservabilitySink } from "@deepseek/observability";

describe("observability privacy matrix", () => {
  it("covers deterministic privacy modes", async () => {
    const modes = [
      { name: "default-local", settings: defaultPrivacySettings, expectedRecords: 1, expectedExport: "deny-export" },
      { name: "telemetry-disabled", settings: { ...defaultPrivacySettings, telemetryEnabled: false, allowExternalExport: true }, expectedRecords: 1, expectedExport: "deny-export" },
      { name: "external-allowed", settings: { ...defaultPrivacySettings, telemetryEnabled: true, allowExternalExport: true }, expectedRecords: 1, expectedExport: "allow-export" },
      { name: "local-disabled", settings: { ...defaultPrivacySettings, localDiagnosticsEnabled: false }, expectedRecords: 0, expectedExport: "deny-export" }
    ] as const;

    for (const mode of modes) {
      const sink = new InMemoryObservabilitySink(mode.settings);
      await sink.emit({
        kind: "audit",
        at: new Date(0).toISOString(),
        name: mode.name,
        fields: { message: mode.name, token: "sk-matrix-1234567890" }
      });
      const records = await sink.drain();
      const localBundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: mode.name });
      const externalBundle = await sink.createDiagnosticBundle({ target: "external-telemetry", reason: mode.name });

      assert.equal(records.length, mode.expectedRecords, mode.name);
      assert.equal(localBundle.records.length, mode.expectedRecords, mode.name);
      assert.equal(externalBundle.privacyDecision.action, mode.expectedExport, mode.name);
      assert.equal(JSON.stringify({ records, localBundle, externalBundle }).includes("sk-matrix-1234567890"), false, mode.name);
    }
  });
});
