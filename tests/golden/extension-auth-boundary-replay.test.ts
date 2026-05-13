import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { createExtensionAuthReadinessEvidence, createExtensionCredentialRequirement } from "@deepseek/credential-auth-management";
import { InMemoryPluginManager } from "@deepseek/platform-abstraction";

describe("extension auth boundary golden replay", () => {
  it("replays redacted readiness and plugin activation denial fingerprints deterministically", async () => {
    const pluginId = asId<"plugin">("golden-plugin");
    const owner = {
      kind: "plugin-contribution" as const,
      id: "plugin:golden-plugin:contribution:golden.command",
      pluginId,
      contributionId: "golden.command",
    };
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-golden-activation",
      owner,
      operations: ["activate-contribution"],
      credentialRef: asId<"credentialRef">("credential-golden-plugin"),
      referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
    });
    const manager = new InMemoryPluginManager();

    const readiness = createExtensionAuthReadinessEvidence({
      owner,
      requirements: [requirement],
      grants: [],
      operations: ["activate-contribution"],
    });
    const activation = await manager.authorizeContributionActivation({
      pluginId,
      contributionId: "golden.command",
      contributionKind: "command",
      ownerSubsystem: "command-system",
      credentialRequirements: [requirement],
      grants: [],
    });
    const activationReplay = await manager.authorizeContributionActivation({
      pluginId,
      contributionId: "golden.command",
      contributionKind: "command",
      ownerSubsystem: "command-system",
      credentialRequirements: [requirement],
      grants: [],
    });

    const normalized = {
      readiness: {
        status: readiness.status,
        reason: readiness.authorizations[0]?.status === "denied" ? readiness.authorizations[0].reason : undefined,
        pits: readiness.referencePitFixtureIds,
        fingerprint: readiness.replayFingerprint,
      },
      activation: {
        status: activation.status,
        diagnostics: activation.diagnostics.map((diagnostic) => diagnostic.code),
        pits: activation.referencePitFixtureIds,
        fingerprint: activation.replayFingerprint,
        authorizationFingerprint: activation.authorizations[0]?.replayFingerprint,
      },
    };
    const serialized = JSON.stringify({ normalized, activation });

    assert.deepEqual(normalized.readiness.status, "missing-grant");
    assert.deepEqual(normalized.activation.status, "denied");
    assert.deepEqual(normalized.activation.diagnostics, ["PLUGIN_CREDENTIAL_MISSING"]);
    assert.equal(normalized.readiness.pits.includes("pit.extension-auth.credential-scope-denial"), true);
    assert.equal(normalized.activation.pits.includes("pit.extension-auth.credential-scope-denial"), true);
    assert.equal(activationReplay.replayFingerprint, activation.replayFingerprint);
    assert.equal(activationReplay.authorizations[0]?.replayFingerprint, activation.authorizations[0]?.replayFingerprint);
    assert.equal(serialized.includes("sk-extension-secret-123456789"), false);
    assert.equal(serialized.includes("[DETERMINISTIC_TEST_SECRET]"), false);
  });
});
