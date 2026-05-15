import type {
  SelfRepairConfig,
  SelfRepairFailureClassification,
  SelfRepairOutcomeSummary,
  SelfRepairStopReason
} from "@deepseek/platform-contracts";

export interface SelfRepairPolicyDecision {
  readonly allowed: boolean;
  readonly stopReason: SelfRepairStopReason;
  readonly requiresCheckpoint: boolean;
}

export function decideRepairPolicy(
  config: SelfRepairConfig,
  classification: SelfRepairFailureClassification,
  currentOutcome: SelfRepairOutcomeSummary
): SelfRepairPolicyDecision {
  if (!config.enabled) return { allowed: false, stopReason: "disabled", requiresCheckpoint: false };
  if (currentOutcome.attemptCount >= config.maxAttempts) return { allowed: false, stopReason: "budget-exhausted", requiresCheckpoint: false };
  if (currentOutcome.repeatedNoopCount > 0) return { allowed: false, stopReason: "repeated-noop", requiresCheckpoint: false };
  if (classification.repairability === "not-repairable") return { allowed: false, stopReason: "not-repairable", requiresCheckpoint: false };
  if (classification.repairability === "needs-user") return { allowed: false, stopReason: "escalated", requiresCheckpoint: false };
  if (classification.safetyClass === "unsafe") return { allowed: false, stopReason: "unsafe", requiresCheckpoint: false };
  const requiresCheckpoint = config.requireCheckpointForWrites && classification.safetyClass === "safe-write";
  return { allowed: true, stopReason: "terminal-failure", requiresCheckpoint };
}
