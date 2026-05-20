import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectGovernanceEvidenceMatrix } from "@deepseek/testing-regression";

describe("governance evidence matrix golden replay", () => {
  it("replays deterministic evidence records and findings", () => {
    const first = collectGovernanceEvidenceMatrix();
    const second = collectGovernanceEvidenceMatrix();

    assert.deepEqual(second, first);
    assert.equal(first.records.length, 10);
    assert.equal(first.records.some((record) => record.capability === "cli-release-surface" && record.productReadiness === "ready"), true);
    assert.equal(first.records.some((record) => record.capability === "remote-runtime-connectivity" && record.productReadiness === "gated"), true);
    assert.equal(JSON.stringify(first).includes("sk-live-secret-value"), false);
  });

  it("replays product-ready conflicts as stable release blockers", () => {
    const first = collectGovernanceEvidenceMatrix({
      productReadyClaims: [{
        capability: "vscode-host-adapter",
        claimedState: "product-ready",
        evidenceIds: ["tests/acceptance/product-ready-vscode.fixture"],
        redaction: { class: "internal" }
      }]
    });
    const second = collectGovernanceEvidenceMatrix({
      productReadyClaims: [{
        capability: "vscode-host-adapter",
        claimedState: "product-ready",
        evidenceIds: ["tests/acceptance/product-ready-vscode.fixture"],
        redaction: { class: "internal" }
      }]
    });
    const blocker = first.findings.find((finding) => finding.id === "governance.evidence-matrix.product-ready-claim.vscode-host-adapter.conflict");

    assert.deepEqual(second, first);
    assert.equal(first.status, "fail");
    assert.equal(blocker?.releaseBlocking, true);
    assert.equal(blocker?.evidenceIds.includes("tests/acceptance/product-ready-vscode.fixture"), true);
  });
});
