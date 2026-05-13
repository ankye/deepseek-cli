import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IntegrityMismatchError, asId, type PluginManifest } from "@deepseek/platform-contracts";
import { InMemoryPluginManager } from "@deepseek/platform-abstraction";

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

describe("plugin lockfile roundtrip", () => {
  it("A.install + A.snapshot + B.applyLockfile -> B.list matches A.list by pluginId and permissions", async () => {
    const a = new InMemoryPluginManager();
    await a.install(manifest({
      id: asId<"plugin">("p1"),
      integrity: "sha256:p1",
      version: "1.0.0",
      permissions: ["capability:read"],
    }));
    await a.install(manifest({
      id: asId<"plugin">("p2"),
      integrity: "sha256:p2",
      version: "2.5.0",
      permissions: ["capability:read", "capability:write"],
    }));

    const lockfile = await a.snapshot();
    const b = new InMemoryPluginManager();
    await b.applyLockfile(lockfile);

    const aList = await a.list();
    const bList = await b.list();
    assert.equal(bList.length, aList.length);
    for (let i = 0; i < aList.length; i += 1) {
      assert.equal(bList[i]?.id, aList[i]?.id);
      assert.deepEqual([...(bList[i]?.permissions ?? [])].sort(), [...(aList[i]?.permissions ?? [])].sort());
    }

    const bSnapshot = await b.snapshot();
    assert.deepEqual(
      bSnapshot.entries.map((e) => ({ id: e.pluginId, integrity: e.integrity })),
      lockfile.entries.map((e) => ({ id: e.pluginId, integrity: e.integrity })),
    );
  });

  it("attempting to install same plugin id with divergent integrity after lockfile apply throws", async () => {
    const a = new InMemoryPluginManager();
    await a.install(manifest({
      id: asId<"plugin">("p1"),
      integrity: "sha256:good",
      version: "1.0.0",
      permissions: [],
    }));
    const lockfile = await a.snapshot();

    const b = new InMemoryPluginManager();
    await b.applyLockfile(lockfile);

    await assert.rejects(
      () =>
        b.install(manifest({
          id: asId<"plugin">("p1"),
          integrity: "sha256:tampered",
          version: "1.0.0",
        })),
      (err: unknown) => {
        assert.ok(err instanceof IntegrityMismatchError);
        assert.equal(err.expected, "sha256:good");
        assert.equal(err.actual, "sha256:tampered");
        return true;
      },
    );
  });
});
