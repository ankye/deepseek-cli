import type { SessionId } from "./ids.js";

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
}
