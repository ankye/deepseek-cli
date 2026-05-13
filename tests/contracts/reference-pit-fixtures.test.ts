import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertReferencePitCoverage,
  coveredReferencePitFixtureIds,
  listReferencePitFixtures,
  missingReferencePitCoverage,
  referencePitFixturesByOwner,
  referencePitFixturesByRisk,
  requiredReferencePitFamilies,
  serializeReferencePitCatalog
} from "@deepseek/testing-regression";

describe("reference pit fixture catalog", () => {
  it("declares every required pit family with stable auditable metadata", () => {
    const fixtures = listReferencePitFixtures();
    const families = new Set(fixtures.map((fixture) => fixture.family));

    for (const family of requiredReferencePitFamilies) {
      assert.equal(families.has(family), true, `missing family ${family}`);
    }
    for (const fixture of fixtures) {
      assert.match(fixture.id, /^pit\.[a-z0-9-]+\.[a-z0-9-]+/);
      assert.equal(fixture.owners.length > 0, true);
      assert.equal(fixture.requiredAssertion.length > 0, true);
      if (fixture.status === "covered" || fixture.status === "partial") {
        assert.equal(fixture.evidenceIds.length > 0, true, `${fixture.id} must cite executable evidence`);
      }
    }
  });

  it("filters fixtures by owner and risk deterministically", () => {
    const policyFixtures = referencePitFixturesByOwner("policy-sandbox");
    const criticalFixtures = referencePitFixturesByRisk("critical");

    assert.equal(policyFixtures.some((fixture) => fixture.id === "pit.permission-bypass.hard-safety"), true);
    assert.equal(criticalFixtures.some((fixture) => fixture.id === "pit.diagnostic-redaction.support-bundle"), true);
    assert.deepEqual([...policyFixtures].map((fixture) => fixture.id), referencePitFixturesByOwner("policy-sandbox").map((fixture) => fixture.id));
  });

  it("detects missing coverage ids for covered and partial fixtures", () => {
    const coveredIds = coveredReferencePitFixtureIds();
    const partial = coveredIds.filter((id) => id !== "pit.env-snapshot.immutable-startup");

    assert.deepEqual(missingReferencePitCoverage(coveredIds), []);
    assert.throws(() => assertReferencePitCoverage(partial), /pit\.env-snapshot\.immutable-startup/);
  });

  it("serializes without raw secrets or copied reference implementation details", () => {
    const serialized = JSON.stringify(serializeReferencePitCatalog());

    assert.equal(serialized.includes("sk-live-"), false);
    assert.equal(serialized.includes("Bearer abc"), false);
    assert.equal(serialized.includes("claude-code"), false);
    assert.equal(serialized.includes("main.tsx"), false);
    assert.equal(serialized.includes("[REDACTED:"), true);
  });

  it("tracks executable coverage ids for covered and partial fixtures", () => {
    assertReferencePitCoverage([
      "pit.permission-bypass.hard-safety",
      "pit.headless-trust.fail-closed",
      "pit.shell-parser.fallback-risk",
      "pit.path-canonicalization.unsafe-syntax",
      "pit.extension-auth.credential-scope-denial",
      "pit.extension-permission-expansion.permission-diff",
      "pit.legacy-contribution-normalization.manifest-boundary",
      "pit.remote-identity.separate-domains",
      "pit.env-snapshot.immutable-startup",
      "pit.diagnostic-redaction.support-bundle"
    ]);
  });
});
