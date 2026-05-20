import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ReadinessCheck, ReleaseVerificationEvidence } from "@deepseek/platform-contracts";
import { collectGovernanceDiagnostics } from "../../src/apps/cli/src/diagnostics/governance-diagnostics.js";

const checks: readonly ReadinessCheck[] = [
  check("governance.runtime-kernel-boundary"),
  check("governance.platform-contracts-uapi"),
  check("governance.runtime-pipes"),
  check("governance.policy-sandbox-gates"),
  check("governance.agent-namespace-quotas"),
  check("governance.plugin-module-boundaries"),
  check("governance.architecture-drift"),
  check("release.acceptance")
];

const verification: ReleaseVerificationEvidence = {
  schemaVersion: "1.0.0",
  requiredCommands: ["npm run typecheck"],
  acceptanceEvidencePaths: [
    "tests/acceptance/acceptance-index.md",
    "tests/acceptance/latest/deepseek-provider-response-cache.json"
  ],
  missingAcceptanceEvidencePaths: [],
  referencePitFixtureIds: ["pit.governance-diagnostics.replay"],
  dryRunCommand: "npm publish --dry-run --workspace deepseek-agent-cli --access public",
  rollbackGuidance: "Do not publish until all governance diagnostics pass.",
  redaction: { class: "internal", fields: ["missingAcceptanceEvidencePaths"] }
};

describe("governance diagnostics golden replay", () => {
  it("projects deterministic proc-style sections from release checks", () => {
    const first = collectGovernanceDiagnostics({ checks, verification });
    const second = collectGovernanceDiagnostics({ checks, verification });

    assert.deepEqual(second, first);
    assert.equal(first.sections.length, 9);
    assert.deepEqual(first.sections.map((section) => section.sectionId), [
      "governance.kernel-boundary",
      "governance.uapi-compatibility",
      "governance.context-cache-health",
      "governance.bus-pressure",
      "governance.policy-gates",
      "governance.agent-scopes",
      "governance.module-status",
      "governance.roadmap-drift",
      "governance.evidence-matrix"
    ]);
    assert.equal(first.findings.every((finding) => finding.evidenceIds.length > 0), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.remote-runtime-connectivity-placeholder" && finding.maturityState === "placeholder"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.distribution-update-management-placeholder" && finding.maturityState === "placeholder"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.extension-system-placeholder" && finding.maturityState === "placeholder"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.evolution-engine-placeholder" && finding.maturityState === "placeholder"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.semantic-indexing-deferred" && finding.maturityState === "deferred"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.vscode-host-adapter-skeleton" && finding.ownerPackage === "vscode-extension"), true);
    assert.equal(first.findings.some((finding) => finding.id === "governance.finding.multi-agent-rollout-gated-defaults" && finding.maturityState === "rollout-gated"), true);
    assert.equal(first.sections.find((section) => section.sectionId === "governance.roadmap-drift")?.findings.some((finding) => finding.sourceCheckId === "governance.architecture-drift"), true);
    assert.equal(JSON.stringify(first).includes("sk-live-secret-value"), false);
  });

  it("records a stable release blocker for conflicting product-ready claims", () => {
    const summary = collectGovernanceDiagnostics({
      checks,
      verification,
      productReadyClaims: [{
        capability: "plugin-module-boundaries",
        claimedState: "product-ready",
        evidenceIds: ["tests/acceptance/product-ready-claim.fixture"],
        redaction: { class: "internal" }
      }]
    });
    const blocker = summary.findings.find((finding) => finding.id === "governance.product-ready-claim.plugin-module-boundaries.conflict");

    assert.equal(summary.status, "fail");
    assert.equal(blocker?.severity, "release-blocking");
    assert.equal(blocker?.maturityState, "rollout-gated");
    assert.equal(blocker?.evidenceIds.includes("tests/acceptance/product-ready-claim.fixture"), true);
    assert.equal(blocker?.nextAction, "Downgrade the product-ready claim or complete the required governance evidence first.");
  });
});

function check(id: string): ReadinessCheck {
  return {
    id,
    label: id,
    status: "pass",
    message: `${id} passed.`,
    metadata: {
      evidenceIds: [`tests/acceptance/${id}.fixture`]
    },
    suggestedActions: [`Keep ${id} evidence current.`],
    redaction: { class: "internal", fields: ["metadata"] }
  };
}
