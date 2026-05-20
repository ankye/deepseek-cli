import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { GovernanceEvidenceMatrixSummary } from "@deepseek/platform-contracts";
import { collectGovernanceEvidenceMatrix } from "@deepseek/testing-regression";
import { collectReleaseReadinessEvidence } from "../../src/apps/cli/src/diagnostics/release-evidence.js";

describe("governance evidence matrix contracts", () => {
  it("emits machine-readable package evidence records", () => {
    const matrix: GovernanceEvidenceMatrixSummary = collectGovernanceEvidenceMatrix();

    assert.equal(matrix.schemaVersion, "1.0.0");
    assert.equal(matrix.kind, "governance.evidence-matrix");
    assert.equal(matrix.records.every((record) => record.id.startsWith("governance.evidence.")), true);
    assert.equal(matrix.records.every((record) => record.requiredEvidenceTypes.length > 0), true);
    assert.equal(matrix.records.every((record) => record.evidence.length === matrix.evidenceTypes.length), true);
    assert.equal(matrix.records.every((record) => Boolean(record.redaction)), true);
    assert.equal(matrix.findings.every((finding) => finding.sectionId === "governance.evidence-matrix" && Boolean(finding.redaction)), true);
  });

  it("is consumed by release readiness without treating contract-only coverage as product readiness", async () => {
    const release = await collectReleaseReadinessEvidence();
    const matrix = release.governanceEvidenceMatrix;

    assert.equal(matrix?.kind, "governance.evidence-matrix");
    assert.equal(release.checks.some((check) => check.id === "governance.evidence-matrix"), true);
    assert.equal(matrix?.records.some((record) => record.capability === "platform-contracts-uapi" && record.productReadiness === "ready"), true);
    assert.equal(matrix?.records.some((record) => record.capability === "vscode-host-adapter" && record.productReadiness === "gated"), true);
    assert.equal(matrix?.records.some((record) => record.capability === "remote-runtime-connectivity" && record.maturityState === "placeholder"), true);
  });

  it("blocks release readiness for product-ready claims without accepted evidence", async () => {
    const release = await collectReleaseReadinessEvidence({
      productReadyClaims: [{
        capability: "semantic-indexing",
        claimedState: "product-ready",
        evidenceIds: ["tests/acceptance/product-ready-semantic.fixture"],
        redaction: { class: "internal" }
      }]
    });
    const matrixBlocker = release.governanceEvidenceMatrix?.findings.find((finding) => finding.id === "governance.evidence-matrix.product-ready-claim.semantic-indexing.conflict");

    assert.equal(release.status, "fail");
    assert.equal(release.checks.some((check) => check.id === "governance.evidence-matrix" && check.status === "fail"), true);
    assert.equal(matrixBlocker?.severity, "release-blocking");
    assert.equal(matrixBlocker?.evidenceIds.includes("tests/acceptance/product-ready-semantic.fixture"), true);
  });
});
