import type { AgentDelegationDecision, AgentModeName, AgentPhasePlan, AgentWorkOrder, RedactedError, SessionId, TraceContext } from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { stableHash } from "../trace.js";

export const LAZY_DELEGATION_PATTERNS: readonly RegExp[] = [
  /\bbased on (the )?prior findings\b/i,
  /\bcontinue from (the )?(prior|previous) findings\b/i,
  /\bfix what (we )?(discussed|talked about)\b/i,
  /\binspect (the )?(recent|latest) changes\b/i,
  /基于(之前|上面|前面).*继续/,
  /修复(刚才|之前).*问题/,
  /检查(最近|刚才).*修改/
];

export function validateWorkOrderCompleteness(workOrder: AgentWorkOrder): readonly RedactedError[] {
  const errors: RedactedError[] = [];
  if (!workOrder.purpose.trim()) errors.push(diagnostic("WORK_ORDER_PURPOSE_REQUIRED", "Work order purpose is required."));
  if (!workOrder.originalUserGoal.trim()) errors.push(diagnostic("WORK_ORDER_USER_GOAL_REQUIRED", "Original user goal is required."));
  if (!workOrder.taskSummary.trim()) errors.push(diagnostic("WORK_ORDER_TASK_SUMMARY_REQUIRED", "Task summary is required."));
  if (workOrder.targets.length === 0) errors.push(diagnostic("WORK_ORDER_TARGETS_REQUIRED", "At least one typed target is required."));
  if (workOrder.doneCriteria.length === 0) errors.push(diagnostic("WORK_ORDER_DONE_CRITERIA_REQUIRED", "At least one done criterion is required."));
  if (workOrder.verificationExpectations.length === 0) errors.push(diagnostic("WORK_ORDER_VERIFICATION_REQUIRED", "Verification expectations are required."));
  const combined = [workOrder.purpose, workOrder.taskSummary, ...workOrder.doneCriteria].join("\n");
  if (LAZY_DELEGATION_PATTERNS.some((pattern) => pattern.test(combined))) {
    errors.push(diagnostic("WORK_ORDER_LAZY_DELEGATION", "Work order must be self-contained and cannot rely on prior findings without structured context."));
  }
  return errors;
}

export function createDelegationSkipDecision(input: {
  readonly sessionId: SessionId;
  readonly parentAgentId?: import("@deepseek/platform-contracts").AgentId;
  readonly mode: AgentModeName;
  readonly phasePlan: AgentPhasePlan;
  readonly trace: TraceContext;
}): AgentDelegationDecision {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    decisionId: `agent-delegation:${stableHash(`${input.sessionId}:${input.phasePlan.planId}:${input.mode}`)}`,
    kind: "skip",
    reasonCode: input.mode === "coordinator" ? "budget-unavailable" : "trivial-delegation-rejected",
    parentSessionId: input.sessionId,
    ...(input.parentAgentId ? { parentAgentId: input.parentAgentId } : {}),
    evidenceIds: [],
    diagnostics: input.mode === "coordinator"
      ? [diagnostic("DELEGATION_POLICY_DEFERRED", "Coordinator mode is visible but worker launch is deferred until structured work orders are wired.")]
      : [],
    trace: input.trace,
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal" }
  };
}
