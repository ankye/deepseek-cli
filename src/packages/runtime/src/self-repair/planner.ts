import type {
  SelfRepairActionType,
  SelfRepairFailureClassification,
  SelfRepairPlan,
  TraceContext
} from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { stableHash } from "./helpers.js";
import { verificationLadderFor } from "./verifier.js";

export function createRepairPlan(input: {
  readonly classification: SelfRepairFailureClassification;
  readonly attemptNumber: number;
  readonly requiresCheckpoint: boolean;
  readonly verificationMode?: import("@deepseek/platform-contracts").SelfRepairConfig["verificationMode"];
  readonly trace: TraceContext;
}): SelfRepairPlan {
  const actionType = actionFor(input.classification);
  const attemptId = `repair-attempt:${stableHash(`${input.classification.classificationId}:${input.attemptNumber}`)}`;
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    planId: `repair-plan:${stableHash(`${attemptId}:${actionType}`)}`,
    classificationId: input.classification.classificationId,
    attemptId,
    actionType,
    targetScope: input.classification.affectedScope,
    expectedVerification: verificationLadderFor(input.classification, input.verificationMode ?? "minimal"),
    stopCriteria: ["completed", "budget-exhausted", "verification-failed", "terminal-failure"],
    requiresCheckpoint: input.requiresCheckpoint,
    evidenceFingerprints: input.classification.evidenceFingerprints,
    trace: input.trace,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["evidenceFingerprints", "expectedVerification"] }
  };
}

function actionFor(classification: SelfRepairFailureClassification): SelfRepairActionType {
  if (classification.repairability !== "repairable" && classification.repairability !== "unknown") return "escalate";
  if (classification.failureSource === "build-test-error" || classification.failureSource === "task-output-error") return "model-feedback";
  if (classification.failureSource === "tool-error" || classification.failureSource === "agent-strategy-error") return "model-feedback";
  if (classification.failureSource === "provider-error") return "model-feedback";
  return "fail-closed";
}
