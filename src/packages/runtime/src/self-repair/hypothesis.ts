import type { SelfRepairActionType, SelfRepairFailureClassification, SelfRepairModelHypothesis, TraceContext } from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { boundedPreview, stableHash } from "./helpers.js";

export function validateRepairHypothesis(input: {
  readonly classification: SelfRepairFailureClassification;
  readonly text: string;
  readonly proposedActionType?: SelfRepairActionType;
  readonly trace: TraceContext;
}): SelfRepairModelHypothesis {
  const hypothesisPreview = boundedPreview(input.text, 500);
  const diagnostics = hypothesisDiagnostics(input.classification, input.text, input.proposedActionType);
  const status = diagnostics.length > 0 ? "rejected" : "accepted";
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    hypothesisId: `repair-hypothesis:${stableHash(`${input.classification.classificationId}:${hypothesisPreview}:${input.proposedActionType ?? ""}`)}`,
    classificationId: input.classification.classificationId,
    status,
    hypothesisPreview,
    ...(input.proposedActionType ? { proposedActionType: input.proposedActionType } : {}),
    evidenceFingerprints: input.classification.evidenceFingerprints,
    diagnostics,
    trace: input.trace,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["hypothesisPreview", "diagnostics.details", "evidenceFingerprints"] }
  };
}

function hypothesisDiagnostics(
  classification: SelfRepairFailureClassification,
  text: string,
  proposedActionType: SelfRepairActionType | undefined
): SelfRepairModelHypothesis["diagnostics"] {
  const normalized = text.toLowerCase();
  const diagnostics: SelfRepairModelHypothesis["diagnostics"][number][] = [];
  if (normalized.trim().length === 0) {
    diagnostics.push({
      code: "SELF_REPAIR_HYPOTHESIS_EMPTY",
      message: "Repair hypothesis is empty and cannot justify an action.",
      retryable: true,
      redaction: { class: "internal" }
    });
  }
  if (/(rewrite|replace)\s+(the\s+)?(entire|whole)\s+(project|repo|codebase)|remove\s+tests?|delete\s+tests?|disable\s+(lint|typecheck|tests?)|ignore\s+(lint|typecheck|tests?)|edit\s+(secret|credential|token)/i.test(text)) {
    diagnostics.push({
      code: "SELF_REPAIR_HYPOTHESIS_BROAD_OR_UNSAFE",
      message: "Repair hypothesis proposes broad, check-weakening, or secret-editing work without deterministic evidence.",
      retryable: false,
      redaction: { class: "internal" }
    });
  }
  if (classification.repairability === "not-repairable" && proposedActionType && proposedActionType !== "escalate" && proposedActionType !== "fail-closed") {
    diagnostics.push({
      code: "SELF_REPAIR_HYPOTHESIS_NON_REPAIRABLE_ACTION",
      message: "Repair hypothesis proposes execution for a non-repairable failure.",
      retryable: false,
      redaction: { class: "internal" }
    });
  }
  if (classification.affectedScope !== "architecture" && /architecture boundary|dependency direction|package boundary/i.test(text)) {
    diagnostics.push({
      code: "SELF_REPAIR_HYPOTHESIS_SCOPE_MISMATCH",
      message: "Repair hypothesis broadens scope beyond the deterministic failure classification.",
      retryable: false,
      redaction: { class: "internal" }
    });
  }
  return diagnostics;
}
