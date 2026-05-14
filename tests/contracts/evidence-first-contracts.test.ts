import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EVIDENCE_FIRST_COMPATIBILITY,
  EVIDENCE_FIRST_SCHEMA_VERSION,
  asId,
  type ClaimGrounding,
  type EvidenceItem,
  type EvidenceManifest,
  type EvidencePlan,
  type EvidenceSourceCoverage,
  type EvidenceTaskClassification,
  type RuntimeEventKind,
  type UnsupportedClaimDiagnostic
} from "@deepseek/platform-contracts";

describe("evidence-first contracts", () => {
  it("declares versioned, redacted, stable evidence DTOs", () => {
    const classification: EvidenceTaskClassification = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      classificationId: "evidence-classification:webpage",
      sensitivity: "fact-sensitive",
      intents: ["product", "generated-artifact", "command"],
      factClasses: ["package", "command", "product-copy"],
      evidenceRequired: true,
      reason: "Product webpage and CLI command claims require repository evidence.",
      trace: { taskId: asId<"task">("task:webpage") },
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["reason"] }
    };
    const plan: EvidencePlan = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      planId: "evidence-plan:webpage",
      classificationId: classification.classificationId,
      requiredFactClasses: ["package", "command", "product-copy"],
      candidateSourceGroups: [{
        sourceGroup: "package-metadata",
        required: true,
        factClasses: ["package", "executable"],
        minimumItemCount: 1
      }],
      minimumSourceCoverage: 1,
      freshnessPolicy: "local-current-worktree",
      redactionPolicy: "bounded-previews-and-fingerprints",
      stopConditions: ["unsupported strict command"],
      trace: classification.trace,
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["stopConditions"] }
    };
    const item: EvidenceItem = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      evidenceId: "evidence:package-json",
      sourceGroup: "package-metadata",
      sourcePath: "src/apps/cli/package.json",
      sourceLabel: "CLI package metadata",
      factClasses: ["package", "executable"],
      preview: "name deepseek-agent-cli, bin deepseek",
      fingerprint: "sha256:package-json",
      freshness: { status: "current", observedAt: "1970-01-01T00:00:00.000Z" },
      trace: classification.trace,
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["preview"] }
    };
    const coverage: EvidenceSourceCoverage = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      sourceGroup: "package-metadata",
      covered: true,
      itemCount: 1,
      factClasses: ["package", "executable"],
      fingerprints: [item.fingerprint],
      missingFactClasses: [],
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["fingerprints"] }
    };
    const claim: ClaimGrounding = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      claimId: "claim:package-name",
      claimPreview: "Published package is deepseek-agent-cli.",
      claimFingerprint: "claim:package-name:fingerprint",
      factClass: "package",
      certainty: "verified",
      evidenceIds: [item.evidenceId],
      outputScope: "generated-webpage/index.html",
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["claimPreview"] }
    };
    const unsupported: UnsupportedClaimDiagnostic = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      diagnosticId: "unsupported:npx-deepseek-cli-init",
      code: "unsupported-command",
      severity: "error",
      claimFingerprint: "claim:npx-deepseek-cli-init",
      claimPreview: "npx deepseek-cli init",
      missingFactClass: "command",
      artifactId: "generated-webpage",
      remediationHint: "Use package metadata or README-backed commands only.",
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["claimPreview", "remediationHint"] }
    };
    const manifest: EvidenceManifest = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      manifestId: "evidence-manifest:webpage",
      artifactId: "generated-webpage",
      artifactKind: "webpage",
      status: "passed",
      generatedAt: "1970-01-01T00:00:00.000Z",
      sourceCoverage: [coverage],
      evidenceItems: [item],
      claimGroundings: [claim],
      assumptions: [],
      unsupportedClaims: [unsupported],
      unsupportedClaimCount: 1,
      trace: classification.trace,
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["evidenceItems.preview", "claimGroundings.claimPreview"] }
    };

    assert.equal(classification.schemaVersion, "1.0.0");
    assert.equal(plan.compatibility.minReaderVersion, "1.0.0");
    assert.equal(manifest.unsupportedClaims[0]?.code, "unsupported-command");
    assert.equal(manifest.redaction.class, "internal");
  });

  it("includes evidence-first runtime event kinds", () => {
    const eventKinds: readonly RuntimeEventKind[] = [
      "evidence.classified",
      "evidence.plan.created",
      "evidence.selected",
      "evidence.claims.grounded",
      "evidence.manifest.created",
      "evidence.unsupported-claim"
    ];

    assert.deepEqual(eventKinds, [
      "evidence.classified",
      "evidence.plan.created",
      "evidence.selected",
      "evidence.claims.grounded",
      "evidence.manifest.created",
      "evidence.unsupported-claim"
    ]);
  });
});
