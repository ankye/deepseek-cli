import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectGovernanceEvidenceMatrix,
  createGovernanceEvidenceMatrixFixtures
} from "./index.js";

describe("governance evidence matrix", () => {
  it("distinguishes evidence categories and risk-based product readiness", () => {
    const matrix = collectGovernanceEvidenceMatrix();
    const cli = matrix.records.find((record) => record.capability === "cli-release-surface");
    const remote = matrix.records.find((record) => record.capability === "remote-runtime-connectivity");
    const semantic = matrix.records.find((record) => record.capability === "semantic-indexing");

    assert.equal(matrix.kind, "governance.evidence-matrix");
    assert.equal(matrix.evidenceTypes.includes("contract"), true);
    assert.equal(matrix.evidenceTypes.includes("live-smoke"), true);
    assert.equal(cli?.productReadiness, "ready");
    assert.equal(remote?.productReadiness, "gated");
    assert.equal(remote?.maturityState, "placeholder");
    assert.equal(semantic?.missingEvidenceTypes.includes("integration"), true);
    assert.equal(matrix.findings.some((finding) => finding.capability === "remote-runtime-connectivity" && finding.severity === "warning"), true);
  });

  it("keeps deterministic fixtures for common evidence gaps", () => {
    const fixtures = createGovernanceEvidenceMatrixFixtures();

    assert.equal(fixtures.some((record) => record.packageName === "fixture-contract-only" && record.missingEvidenceTypes.includes("integration")), true);
    assert.equal(fixtures.some((record) => record.packageName === "fixture-integration-only" && record.missingEvidenceTypes.includes("contract")), true);
    assert.equal(fixtures.some((record) => record.packageName === "fixture-e2e-missing" && record.missingEvidenceTypes.includes("e2e")), true);
    assert.equal(fixtures.some((record) => record.packageName === "fixture-live-smoke-missing" && record.missingEvidenceTypes.includes("live-smoke")), true);
    assert.equal(fixtures.some((record) => record.packageName === "fixture-acceptance-ready" && record.productReadiness === "ready"), true);
  });

  it("turns conflicting product-ready claims into release blockers", () => {
    const matrix = collectGovernanceEvidenceMatrix({
      productReadyClaims: [{
        capability: "remote-runtime-connectivity",
        claimedState: "product-ready",
        evidenceIds: ["tests/acceptance/product-ready-remote.fixture"],
        redaction: { class: "internal" }
      }]
    });
    const blocker = matrix.findings.find((finding) => finding.id === "governance.evidence-matrix.product-ready-claim.remote-runtime-connectivity.conflict");

    assert.equal(matrix.status, "fail");
    assert.equal(blocker?.releaseBlocking, true);
    assert.equal(blocker?.severity, "release-blocking");
    assert.equal(blocker?.evidenceIds.includes("tests/acceptance/product-ready-remote.fixture"), true);
  });
});
