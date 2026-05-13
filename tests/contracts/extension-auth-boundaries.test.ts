import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  authorizeExtensionCredential,
  createExtensionAuthReadinessEvidence,
  createExtensionCredentialGrant,
  createExtensionCredentialRequirement,
  diffExtensionCredentialRequirements,
} from "@deepseek/credential-auth-management";
import { EXTENSION_AUTH_SCHEMA_VERSION, asId, type ExtensionCredentialOwner } from "@deepseek/platform-contracts";

const owner: ExtensionCredentialOwner = {
  kind: "mcp-server",
  id: "mcp:repo",
  mcpServerId: asId<"mcpServer">("mcp-repo"),
  trust: "trusted",
};

describe("extension auth boundary contracts", () => {
  it("serializes scoped grants without raw secret values", () => {
    const grant = createExtensionCredentialGrant({
      grantId: "grant-repo-read",
      credentialRef: asId<"credentialRef">("credential-repo-token"),
      owner,
      operations: ["read-resource"],
      trust: "trusted",
    });
    const serialized = JSON.stringify(grant);

    assert.equal(grant.schemaVersion, EXTENSION_AUTH_SCHEMA_VERSION);
    assert.equal(grant.status, "active");
    assert.equal(grant.redaction.class, "secret");
    assert.equal(serialized.includes("sk-extension-secret-123456789"), false);
    assert.ok(grant.replayFingerprint.startsWith("grant:"));
  });

  it("authorizes matching owner, operation, trust, and credential reference", () => {
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-resource-read",
      credentialRef: asId<"credentialRef">("credential-repo-token"),
      owner,
      operations: ["read-resource"],
      trust: "trusted",
    });
    const grant = createExtensionCredentialGrant({
      grantId: "grant-repo-read",
      credentialRef: asId<"credentialRef">("credential-repo-token"),
      owner,
      operations: ["read-resource"],
      trust: "trusted",
    });

    const authorization = authorizeExtensionCredential({
      requirement,
      operation: "read-resource",
      grants: [grant],
      owner,
      trust: "trusted",
    });

    assert.equal(authorization.status, "allowed");
    assert.equal(authorization.grantId, "grant-repo-read");
    assert.equal(authorization.diagnostics.length, 0);
    assert.ok(authorization.replayFingerprint.startsWith("authorization:"));
  });

  it("denies scope mismatch before raw credential resolution is possible", () => {
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-tool-use",
      credentialRef: asId<"credentialRef">("credential-repo-token"),
      owner,
      operations: ["use-tool"],
      trust: "trusted",
    });
    const grant = createExtensionCredentialGrant({
      grantId: "grant-resource-only",
      credentialRef: asId<"credentialRef">("credential-repo-token"),
      owner,
      operations: ["read-resource"],
      trust: "trusted",
    });

    const authorization = authorizeExtensionCredential({
      requirement,
      operation: "use-tool",
      grants: [grant],
      owner,
      trust: "trusted",
    });

    assert.equal(authorization.status, "denied");
    assert.equal(authorization.reason, "operation-mismatch");
    assert.equal(authorization.diagnostics[0]?.code, "EXTENSION_CREDENTIAL_OPERATION_MISMATCH");
    assert.equal(authorization.referencePitFixtureIds.includes("pit.extension-auth.credential-scope-denial"), true);
    assert.equal(JSON.stringify(authorization).includes("sk-extension-secret-123456789"), false);
  });

  it("creates metadata-only readiness evidence for missing grants", () => {
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-install",
      owner: { kind: "plugin", id: "plugin:demo", pluginId: asId<"plugin">("plugin-demo") },
      operations: ["install"],
      provider: "deepseek",
      profile: "default",
    });

    const readiness = createExtensionAuthReadinessEvidence({
      owner: requirement.owner,
      requirements: [requirement],
      grants: [],
    });

    assert.equal(readiness.status, "missing-grant");
    assert.equal(readiness.authorizations[0]?.status, "denied");
    assert.equal(readiness.referencePitFixtureIds.includes("pit.diagnostic-redaction.support-bundle"), true);
    assert.equal(JSON.stringify(readiness).includes("sk-extension-secret-123456789"), false);
  });

  it("diffs auth requirements deterministically", () => {
    const before = createExtensionCredentialRequirement({
      requirementId: "req-before",
      owner,
      operations: ["diagnose"],
    });
    const after = createExtensionCredentialRequirement({
      requirementId: "req-after",
      owner,
      operations: ["diagnose", "read-resource"],
    });

    const diff = diffExtensionCredentialRequirements([before], [after]);

    assert.equal(diff.added.length, 1);
    assert.equal(diff.removed.length, 1);
    assert.equal(diff.unchanged.length, 0);
    assert.equal(diff.referencePitFixtureIds.includes("pit.extension-permission-expansion.permission-diff"), true);
    assert.ok(diff.replayFingerprint.startsWith("requirement-diff:"));
  });
});
