import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstPartyPluginCommandContributions as builtinCommandContributions,
  firstPartyTuiContributions as builtinTuiContributions,
  listBuiltInPluginManifests,
  snapshotFirstPartyDevPluginPack as builtinSnapshot
} from "@deepseek/builtin-plugins";
import {
  firstPartyPluginCommandContributions as facadeCommandContributions,
  firstPartyTuiContributions as facadeTuiContributions,
  listFirstPartyDevPluginManifests,
  snapshotFirstPartyDevPluginPack,
  validateFirstPartyDevPluginPack
} from "@deepseek/first-party-dev-plugins";

describe("built-in plugin registry", () => {
  it("keeps the compatibility facade byte-equivalent for manifests and projections", () => {
    assert.deepEqual(listFirstPartyDevPluginManifests(), listBuiltInPluginManifests());
    assert.deepEqual(snapshotFirstPartyDevPluginPack(), builtinSnapshot());
    assert.deepEqual(facadeCommandContributions(), builtinCommandContributions());
    assert.deepEqual(facadeTuiContributions(), builtinTuiContributions());
  });

  it("sources every bundled plugin from its own contribution directory", () => {
    for (const name of ["context-compactor", "dev-checks", "file-manager", "git-review", "jump-navigator", "repo-navigator"]) {
      const base = resolve("src/plugins/builtin/src/plugins", name);
      assert.equal(existsSync(resolve(base, "manifest.ts")), true, `${name} manifest`);
      assert.equal(existsSync(resolve(base, "contributions", "commands.ts")), true, `${name} commands`);
      assert.equal(existsSync(resolve(base, "contributions", "tui.ts")), true, `${name} tui`);
      assert.equal(existsSync(resolve(base, "contributions", "reasoning.ts")), true, `${name} reasoning`);
    }
  });

  it("keeps projections inert and rejects malformed first-party manifests", () => {
    const [manifest] = listBuiltInPluginManifests();
    assert.ok(manifest);

    const malformed = {
      ...manifest,
      source: "workspace",
      contributions: {
        ...manifest.contributions,
        rendererHints: [{ id: "bad-renderer", host: "cli-tui", placement: "panel", execute: "host-private" }]
      }
    };
    const validation = validateFirstPartyDevPluginPack([malformed]);
    const tui = builtinTuiContributions();

    assert.equal(tui.every((contribution) => contribution.governance?.directHostAccess === false), true);
    assert.equal(validation.ok, false);
    assert.equal(validation.errors.some((error) => error.code === "FIRST_PARTY_PLUGIN_SOURCE_INVALID"), true);
    assert.equal(validation.errors.some((error) => error.code === "PLUGIN_EXECUTABLE_METADATA_REJECTED"), true);
  });
});
