import type { JsonObject } from "./common.js";
import type { ModelProfileId, SessionId } from "./ids.js";

export interface ContextBudgetRequest extends JsonObject {
  readonly sessionId: SessionId;
  readonly modelProfileId?: ModelProfileId;
  readonly purpose: string;
  readonly requestedInputTokens?: number;
  readonly reservedOutputTokens?: number;
}

export interface ContextBudgetDecision extends JsonObject {
  readonly hardLimitTokens: number;
  readonly softLimitTokens?: number;
  readonly reservedOutputTokens: number;
  readonly reason: string;
}

export interface UsageRecord {
  readonly sessionId: SessionId;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costMicros: number;
  readonly elapsedMs: number;
}

export interface BudgetDecision {
  readonly allowed: boolean;
  readonly warning?: string;
  readonly hardLimit?: string;
}

export interface UsageBudgetManager {
  record(record: UsageRecord): Promise<void>;
  check(sessionId: SessionId, proposed: Partial<UsageRecord>): Promise<BudgetDecision>;
  total(sessionId: SessionId): Promise<UsageRecord>;
  contextBudget(request: ContextBudgetRequest): Promise<ContextBudgetDecision>;
}
