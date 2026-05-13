import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ExtensionCredentialRequirement, ExtensionManagementRecord } from "@deepseek/platform-contracts";
import { EXTENSION_AUTH_SCHEMA_VERSION, EXTENSION_MANAGEMENT_SCHEMA_VERSION } from "@deepseek/platform-contracts";

describe("extension management contracts", () => {
  it("supports stable result-list targets and pit evidence", () => {
    const record: ExtensionManagementRecord = {
      schemaVersion: EXTENSION_MANAGEMENT_SCHEMA_VERSION,
      kind: "extension.plugin.install",
      status: "completed",
      summary: "installed plugin plugin-demo",
      items: [{
        targetKind: "plugin",
        targetId: "plugin:plugin-demo",
        label: "plugin-demo",
        status: "enabled",
        summary: "plugin-demo@1.0.0 permissions=1",
        provenance: { source: "workspace" },
        permissions: ["workspace:read"],
        actionHints: [{ action: "inspect" }, { action: "verify" }],
        redaction: { class: "internal" }
      }],
      permissionDiffs: [{
        targetId: "plugin:plugin-demo",
        added: ["workspace:read"],
        removed: [],
        referencePitFixtureIds: ["pit.extension-permission-expansion.permission-diff"],
        redaction: { class: "internal" }
      }],
      credentialScopes: [],
      lifecycle: [],
      diagnostics: [],
      audit: { source: "contract-test" },
      referencePitFixtureIds: ["pit.extension-permission-expansion.permission-diff"],
      redaction: { class: "internal" }
    };

    assert.equal(record.schemaVersion, "1.0.0");
    assert.equal(record.items[0]?.targetKind, "plugin");
    assert.equal(record.items[0]?.actionHints.some((hint) => hint.action === "verify"), true);
    assert.equal(record.permissionDiffs[0]?.referencePitFixtureIds.includes("pit.extension-permission-expansion.permission-diff"), true);
  });

  it("serializes credential diagnostics without raw secret values", () => {
    const record: ExtensionManagementRecord = {
      schemaVersion: EXTENSION_MANAGEMENT_SCHEMA_VERSION,
      kind: "extension.auth.scopes",
      status: "completed",
      summary: "diagnosed credential scopes",
      items: [],
      permissionDiffs: [],
      credentialScopes: [{
        targetId: "credential:credential-deepseek-api-key",
        ref: "credential-deepseek-api-key",
        provider: "deepseek",
        profile: "default",
        source: "fake-storage",
        available: true,
        status: "available",
        audit: { operation: "list", at: "1970-01-01T00:00:00.000Z" },
        suggestedActions: [],
        referencePitFixtureIds: ["pit.env-snapshot.immutable-startup", "pit.diagnostic-redaction.support-bundle"],
        redaction: { class: "secret", fields: ["ref"] }
      }],
      lifecycle: [],
      diagnostics: [],
      audit: { source: "contract-test" },
      referencePitFixtureIds: ["pit.env-snapshot.immutable-startup", "pit.diagnostic-redaction.support-bundle"],
      redaction: { class: "internal" }
    };
    const serialized = JSON.stringify(record);

    assert.equal(serialized.includes("sk-extension-secret-123456789"), false);
    assert.equal(serialized.includes("pit.env-snapshot.immutable-startup"), true);
    assert.equal(serialized.includes("pit.diagnostic-redaction.support-bundle"), true);
  });

  it("carries auth diff and readiness evidence for plugin lifecycle output", () => {
    const requirement: ExtensionCredentialRequirement = {
      schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
      requirementId: "req-plugin-auth",
      owner: { kind: "plugin", id: "plugin:plugin-demo" },
      operations: ["diagnose"],
      provider: "deepseek",
      profile: "default",
      required: true,
      redaction: { class: "internal", fields: ["credentialRef"] },
      compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION }
    };
    const record: ExtensionManagementRecord = {
      schemaVersion: EXTENSION_MANAGEMENT_SCHEMA_VERSION,
      kind: "extension.plugin.install",
      status: "completed",
      summary: "installed plugin plugin-demo",
      items: [],
      permissionDiffs: [],
      authDiffs: [{
        added: [requirement],
        removed: [],
        unchanged: [],
        referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
        redaction: { class: "internal", fields: ["*.credentialRef"] },
        replayFingerprint: "requirement-diff:test"
      }],
      authReadiness: [{
        schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
        owner: requirement.owner,
        requirements: [requirement],
        grants: [],
        authorizations: [],
        status: "missing-grant",
        diagnostics: [],
        referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
        audit: { source: "contract-test" },
        redaction: { class: "secret", fields: ["grants.credentialRef"] },
        compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
        replayFingerprint: "readiness:test"
      }],
      credentialScopes: [],
      lifecycle: [],
      diagnostics: [],
      audit: { source: "contract-test" },
      referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
      redaction: { class: "internal" }
    };
    const serialized = JSON.stringify(record);

    assert.equal(record.authDiffs?.[0]?.added[0]?.requirementId, "req-plugin-auth");
    assert.equal(record.authReadiness?.[0]?.status, "missing-grant");
    assert.equal(serialized.includes("sk-extension-secret-123456789"), false);
  });
});
