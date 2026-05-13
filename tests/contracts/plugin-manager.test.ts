import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IntegrityMismatchError, asId, type ExtensionCredentialAuthorizationResult, type PluginManifest } from "@deepseek/platform-contracts";
import { createExtensionCredentialGrant, createExtensionCredentialRequirement } from "@deepseek/credential-auth-management";
import { InMemoryPluginManager } from "@deepseek/platform-abstraction";
import { DeterministicCredentialStorageAdapter, getReferencePitFixture } from "@deepseek/testing-regression";

function manifest(overrides: Partial<PluginManifest> & Pick<PluginManifest, "id" | "integrity">): PluginManifest {
  return {
    name: overrides.name ?? overrides.id,
    version: overrides.version ?? "1.0.0",
    source: overrides.source ?? "workspace",
    permissions: overrides.permissions ?? [],
    contributions: overrides.contributions ?? {},
    ...overrides,
  };
}

describe("plugin manager contracts", () => {
  it("first install returns lock entry with full diff.added and empty diff.removed", async () => {
    const pm = new InMemoryPluginManager();
    const manifestA = manifest({
      id: asId<"plugin">("p-a"),
      integrity: "sha256:aaa",
      permissions: ["capability:read", "capability:write"],
    });

    const { diff, lockEntry } = await pm.install(manifestA);

    assert.deepEqual([...diff.added].sort(), ["capability:read", "capability:write"]);
    assert.deepEqual(diff.removed, []);
    assert.equal(lockEntry.pluginId, manifestA.id);
    assert.equal(lockEntry.integrity, "sha256:aaa");
    assert.ok(!Number.isNaN(Date.parse(lockEntry.installedAt)));
  });

  it("re-install of same id with wider permissions reports added + removed precisely", async () => {
    const fixture = getReferencePitFixture("pit.extension-permission-expansion.permission-diff");
    assert.equal(fixture?.evidenceIds.includes("plugin:permission-expansion"), true);
    const pm = new InMemoryPluginManager();
    const id = asId<"plugin">("p-b");
    await pm.install(manifest({ id, integrity: "sha256:bbb", permissions: ["a", "b"] }));
    const second = await pm.install(manifest({ id, integrity: "sha256:bbb", permissions: ["b", "c"] }));

    assert.deepEqual([...second.diff.added], ["c"]);
    assert.deepEqual([...second.diff.removed], ["a"]);
  });

  it("install throws IntegrityMismatchError when integrity conflicts with locked entry", async () => {
    const fixture = getReferencePitFixture("pit.extension-permission-expansion.permission-diff");
    assert.equal(fixture?.family, "extension-permission-expansion");
    const pm = new InMemoryPluginManager();
    const id = asId<"plugin">("p-c");
    await pm.install(manifest({ id, integrity: "sha256:abc" }));

    await assert.rejects(
      () => pm.install(manifest({ id, integrity: "sha256:def" })),
      (err: unknown) => {
        assert.ok(err instanceof IntegrityMismatchError);
        assert.equal(err.expected, "sha256:abc");
        assert.equal(err.actual, "sha256:def");
        return true;
      },
    );

    const snap = await pm.snapshot();
    assert.equal(snap.entries[0]?.integrity, "sha256:abc");
  });

  it("snapshot returns frozen entries sorted by pluginId", async () => {
    const pm = new InMemoryPluginManager();
    await pm.install(manifest({ id: asId<"plugin">("p-zeta"), integrity: "sha256:z" }));
    await pm.install(manifest({ id: asId<"plugin">("p-alpha"), integrity: "sha256:a" }));
    await pm.install(manifest({ id: asId<"plugin">("p-middle"), integrity: "sha256:m" }));

    const snap = await pm.snapshot();
    assert.equal(snap.version, 1);
    assert.ok(Object.isFrozen(snap));
    assert.ok(Object.isFrozen(snap.entries));
    for (const entry of snap.entries) {
      assert.ok(Object.isFrozen(entry));
    }
    assert.deepEqual(
      snap.entries.map((e) => e.pluginId),
      ["p-alpha", "p-middle", "p-zeta"],
    );
  });

  it("applyLockfile is idempotent: replaying the same lockfile yields empty diffs", async () => {
    const a = new InMemoryPluginManager();
    await a.install(manifest({ id: asId<"plugin">("p-x"), integrity: "sha256:x", permissions: ["p1"] }));
    await a.install(manifest({ id: asId<"plugin">("p-y"), integrity: "sha256:y", permissions: ["p2"] }));
    const lockfile = await a.snapshot();

    const b = new InMemoryPluginManager();
    const firstApply = await b.applyLockfile(lockfile);
    assert.equal(firstApply.length, 2);
    assert.ok(firstApply.every((r) => r.diff.added.length > 0 || r.diff.removed.length === 0));

    const secondApply = await b.applyLockfile(lockfile);
    assert.equal(secondApply.length, 2);
    for (const result of secondApply) {
      assert.deepEqual(result.diff.added, []);
      assert.deepEqual(result.diff.removed, []);
    }
  });

  it("install and snapshot preserve plugin credential requirement diffs", async () => {
    const pm = new InMemoryPluginManager();
    const id = asId<"plugin">("p-auth");
    const firstRequirement = createExtensionCredentialRequirement({
      requirementId: "req-diagnose",
      owner: { kind: "plugin", id: "plugin:p-auth", pluginId: id },
      operations: ["diagnose"],
    });
    const secondRequirement = createExtensionCredentialRequirement({
      requirementId: "req-read-resource",
      owner: { kind: "plugin", id: "plugin:p-auth", pluginId: id },
      operations: ["read-resource"],
    });

    const first = await pm.install(manifest({
      id,
      integrity: "sha256:auth",
      credentialRequirements: [firstRequirement],
    }));
    const second = await pm.install(manifest({
      id,
      integrity: "sha256:auth",
      credentialRequirements: [firstRequirement, secondRequirement],
    }));
    const snap = await pm.snapshot();

    assert.equal(first.authDiff?.added.length, 1);
    assert.equal(second.authDiff?.added.length, 1);
    assert.equal(second.authDiff?.removed.length, 0);
    assert.equal(second.authDiff?.referencePitFixtureIds.includes("pit.extension-auth.credential-scope-denial"), true);
    assert.equal(snap.entries[0]?.credentialRequirements?.length, 2);
  });

  it("denies credential-backed contribution activation before owner subsystem registration", async () => {
    const storage = new DeterministicCredentialStorageAdapter();
    const pm = new InMemoryPluginManager();
    const pluginId = asId<"plugin">("p-contribution-auth");
    let registered = false;
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-contribution-activate",
      owner: { kind: "plugin-contribution", id: "plugin:p-contribution-auth:contribution:cmd.secure", pluginId, contributionId: "cmd.secure" },
      operations: ["activate-contribution"],
      credentialRef: asId<"credentialRef">("credential-secure-plugin"),
      referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
    });

    const result = await pm.authorizeContributionActivation({
      pluginId,
      contributionId: "cmd.secure",
      contributionKind: "command",
      ownerSubsystem: "command-system",
      credentialRequirements: [requirement],
      grants: [],
    });
    if (result.status === "activated") registered = true;

    assert.equal(result.status, "denied");
    assert.equal(registered, false);
    assert.equal(result.authorizations[0]?.status, "denied");
    assert.equal(result.authReadiness?.status, "missing-grant");
    assert.equal(result.referencePitFixtureIds.includes("pit.extension-auth.credential-scope-denial"), true);
    assert.equal(storage.resolveCallCount, 0);
    assert.equal(JSON.stringify(result).includes("[DETERMINISTIC_TEST_SECRET]"), false);
  });

  it("allows credential-backed contribution activation only with matching scoped grant", async () => {
    const pluginId = asId<"plugin">("p-contribution-granted");
    const owner = { kind: "plugin-contribution" as const, id: "plugin:p-contribution-granted:contribution:cmd.secure", pluginId, contributionId: "cmd.secure" };
    const requirement = createExtensionCredentialRequirement({
      requirementId: "req-contribution-granted",
      owner,
      operations: ["activate-contribution"],
      credentialRef: asId<"credentialRef">("credential-secure-plugin"),
    });
    const grant = createExtensionCredentialGrant({
      grantId: "grant-contribution-granted",
      credentialRef: asId<"credentialRef">("credential-secure-plugin"),
      owner,
      operations: ["activate-contribution"],
    });
    const pm = new InMemoryPluginManager({
      authorizeCredential: ({ requirement: req, operation, grants, owner: requestOwner }): ExtensionCredentialAuthorizationResult => {
        const matched = grants.find((candidate) => candidate.credentialRef === req.credentialRef && candidate.operations.includes(operation) && candidate.owner.id === requestOwner.id);
        if (!matched) {
          return {
            schemaVersion: "1.0.0",
            status: "denied",
            owner: requestOwner,
            operation,
            requirementId: req.requirementId,
            reason: "missing",
            diagnostics: [],
            referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial"],
            audit: { source: "test" },
            redaction: { class: "secret", fields: ["credentialRef"] },
            compatibility: { schemaVersion: "1.0.0" },
            replayFingerprint: "authorization:test-denied",
          };
        }
        return {
          schemaVersion: "1.0.0",
          status: "allowed",
          owner: requestOwner,
          operation,
          requirementId: req.requirementId,
          grantId: matched.grantId,
          credentialRef: matched.credentialRef,
          diagnostics: [],
          referencePitFixtureIds: [],
          audit: { source: "test" },
          redaction: { class: "secret", fields: ["credentialRef"] },
          compatibility: { schemaVersion: "1.0.0" },
          replayFingerprint: "authorization:test-allowed",
        };
      },
    });

    const result = await pm.authorizeContributionActivation({
      pluginId,
      contributionId: "cmd.secure",
      contributionKind: "command",
      ownerSubsystem: "command-system",
      credentialRequirements: [requirement],
      grants: [grant],
    });

    assert.equal(result.status, "activated");
    assert.equal(result.authorizations[0]?.status, "allowed");
    assert.equal(result.authReadiness?.status, "ready");
  });

  it("verify returns { ok: true } under TOFU when no lock entry exists", async () => {
    const pm = new InMemoryPluginManager();
    const verdict = await pm.verify(manifest({ id: asId<"plugin">("p-new"), integrity: "sha256:new" }));
    assert.equal(verdict.ok, true);
  });

  it("verify returns mismatch with expected/actual when integrity diverges from locked entry", async () => {
    const pm = new InMemoryPluginManager();
    const id = asId<"plugin">("p-verify");
    await pm.install(manifest({ id, integrity: "sha256:1" }));
    const verdict = await pm.verify(manifest({ id, integrity: "sha256:2" }));
    assert.equal(verdict.ok, false);
    if (verdict.ok === false) {
      assert.equal(verdict.reason, "mismatch");
      assert.equal(verdict.expected, "sha256:1");
      assert.equal(verdict.actual, "sha256:2");
    }
    const snapBefore = await pm.snapshot();
    await pm.verify(manifest({ id, integrity: "sha256:2" }));
    const snapAfter = await pm.snapshot();
    assert.deepEqual(snapBefore, snapAfter);
  });
});
