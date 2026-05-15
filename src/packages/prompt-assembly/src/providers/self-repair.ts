import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";

export function createSelfRepairProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createSelfRepairOperatingRulesProvider(),
    createSelfRepairFailureEvidenceProvider(),
    createSelfRepairAttemptProvider(),
    createSelfRepairVerificationProvider()
  ];
}

function createSelfRepairOperatingRulesProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.self-repair-operating-rules",
    version: "1.0.0",
    kind: "system.operating-rules",
    source: "self-repair",
    priority: 930,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const repair = input.selfRepair;
      if (!repair?.activated) return [];
      return [createPromptSection({
        id: "section.self-repair-operating-rules",
        providerId: "core.self-repair-operating-rules",
        kind: "system.operating-rules",
        source: "self-repair",
        role: "system",
        content: [
          "Self-repair operating rules:",
          "- Diagnose the failure from bounded runtime evidence before changing anything.",
          "- Make the smallest targeted correction that addresses the classified failure.",
          "- Treat any model diagnosis as a bounded hypothesis; runtime policy and deterministic evidence decide execution.",
          "- Use only model-visible governed tools; do not bypass policy, sandbox, checkpoint, or approval controls.",
          "- Verify through the listed ladder and stop when the repair is proven or no longer justified.",
          "- Preserve the original user task exactly; repair context is runtime-owned evidence."
        ].join("\n"),
        priority: 930,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          attemptCount: repair.attemptCount,
          stopReason: repair.stopReason
        }
      })];
    }
  };
}

function createSelfRepairFailureEvidenceProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.self-repair-failure-evidence",
    version: "1.0.0",
    kind: "repair.diagnostics",
    source: "self-repair",
    priority: 920,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const repair = input.selfRepair;
      if (!repair?.activated || repair.classifications.length === 0) return [];
      return [createPromptSection({
        id: "section.self-repair-failure-evidence",
        providerId: "core.self-repair-failure-evidence",
        kind: "repair.diagnostics",
        source: "self-repair",
        role: "system",
        content: [
          "Self-repair failure evidence:",
          ...repair.classifications.map((classification, index) => [
            `[#${index + 1}] ${classification.failureSource}`,
            `Repairability: ${classification.repairability}`,
            `Safety: ${classification.safetyClass}`,
            `Scope: ${classification.affectedScope}`,
            `Evidence fingerprints: ${classification.evidenceFingerprints.join(", ") || "none"}`,
            `Diagnostics: ${classification.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join("; ") || "none"}`
          ].join("\n"))
        ].join("\n\n"),
        priority: 920,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          classificationIds: repair.classifications.map((classification) => classification.classificationId)
        }
      })];
    }
  };
}

function createSelfRepairAttemptProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.self-repair-attempts",
    version: "1.0.0",
    kind: "repair.diagnostics",
    source: "self-repair",
    priority: 915,
    budgetClass: "normal",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const repair = input.selfRepair;
      if (!repair?.activated) return [];
      return [createPromptSection({
        id: "section.self-repair-attempts",
        providerId: "core.self-repair-attempts",
        kind: "repair.diagnostics",
        source: "self-repair",
        role: "system",
        content: [
          "Self-repair prior attempts and allowed actions:",
          "Allowed actions: model-feedback, rerun-check, deterministic-repair, revert, escalate, fail-closed",
          repair.attempts.length > 0
            ? repair.attempts.map((attempt, index) => [
              `[#${index + 1}] ${attempt.actionType}`,
              `Status: ${attempt.status}`,
              `Attempt id: ${attempt.attemptId}`,
              `Tools: ${attempt.toolIds.join(", ") || "none"}`,
              `Touched files: ${attempt.touchedFiles.join(", ") || "none"}`,
              `Material change: ${attempt.materialChangeFingerprint ?? "unknown"}`
            ].join("\n")).join("\n\n")
            : "Prior attempts: none"
        ].join("\n"),
        priority: 915,
        budgetClass: "normal",
        trust: "system",
        required: false,
        provenance: {
          attemptIds: repair.attempts.map((attempt) => attempt.attemptId),
          materialChangeFingerprints: repair.attempts.map((attempt) => attempt.materialChangeFingerprint ?? "unknown")
        }
      })];
    }
  };
}

function createSelfRepairVerificationProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.self-repair-verification",
    version: "1.0.0",
    kind: "repair.verification",
    source: "self-repair",
    priority: 910,
    budgetClass: "normal",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const repair = input.selfRepair;
      if (!repair?.activated || repair.verification.length === 0) return [];
      return [createPromptSection({
        id: "section.self-repair-verification",
        providerId: "core.self-repair-verification",
        kind: "repair.verification",
        source: "self-repair",
        role: "system",
        content: [
          "Self-repair verification ladder:",
          ...repair.verification.map((verification, index) => [
            `[#${index + 1}] ${verification.command ?? "next model iteration"}`,
            `Status: ${verification.status}`,
            verification.exitCode !== undefined ? `Exit code: ${verification.exitCode}` : "",
            verification.decision ? `Decision: ${verification.decision}` : "",
            verification.outputDigest ? `Output digest: ${verification.outputDigest}` : ""
          ].filter(Boolean).join("\n"))
        ].join("\n\n"),
        priority: 910,
        budgetClass: "normal",
        trust: "system",
        required: false,
        provenance: {
          verificationIds: repair.verification.map((verification) => verification.verificationId)
        }
      })];
    }
  };
}
