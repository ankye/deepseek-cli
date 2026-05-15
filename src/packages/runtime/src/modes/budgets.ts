import type { AgentLoopBudget, AgentLoopBudgetKind, AgentPhasePlan } from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export interface AgentLoopBudgetInput {
  readonly kind: AgentLoopBudgetKind;
  readonly requested: number;
  readonly allowed?: number;
  readonly consumed?: number;
  readonly stopReason?: string;
  readonly policySource: string;
}

export function createAgentLoopBudget(input: AgentLoopBudgetInput): AgentLoopBudget {
  const allowed = input.allowed ?? input.requested;
  const consumed = input.consumed ?? 0;
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    kind: input.kind,
    requested: input.requested,
    allowed,
    consumed,
    remaining: Math.max(allowed - consumed, 0),
    ...(input.stopReason ? { stopReason: input.stopReason } : {}),
    policy: { source: input.policySource },
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

export function consumedBudgetEvents(plan: AgentPhasePlan): readonly AgentLoopBudget[] {
  return plan.budgets.filter((budget) => budget.consumed > 0);
}
