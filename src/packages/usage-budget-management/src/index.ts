import type { ContextBudgetDecision, ContextBudgetRequest, SessionId, UsageBudgetManager, UsageRecord } from "@deepseek/platform-contracts";

export interface InMemoryUsageBudgetOptions {
  readonly contextHardLimitTokens?: number;
  readonly contextSoftLimitTokens?: number;
  readonly reservedOutputTokens?: number;
}

export class InMemoryUsageBudgetManager implements UsageBudgetManager {
  private readonly records: UsageRecord[] = [];

  constructor(private readonly options: InMemoryUsageBudgetOptions = {}) {}

  async record(record: UsageRecord): Promise<void> {
    this.records.push(record);
  }

  async check(): Promise<{ allowed: boolean; warning?: string; hardLimit?: string }> {
    return { allowed: true };
  }

  async total(sessionId: SessionId): Promise<UsageRecord> {
    return this.records
      .filter((record) => record.sessionId === sessionId)
      .reduce(
        (acc, record) => ({
          sessionId,
          inputTokens: acc.inputTokens + record.inputTokens,
          outputTokens: acc.outputTokens + record.outputTokens,
          costMicros: acc.costMicros + record.costMicros,
          elapsedMs: acc.elapsedMs + record.elapsedMs
        }),
        { sessionId, inputTokens: 0, outputTokens: 0, costMicros: 0, elapsedMs: 0 }
      );
  }

  async contextBudget(request: ContextBudgetRequest): Promise<ContextBudgetDecision> {
    const hardLimitTokens = this.options.contextHardLimitTokens ?? 8192;
    const softLimitTokens = this.options.contextSoftLimitTokens ?? Math.floor(hardLimitTokens * 0.8);
    return {
      hardLimitTokens,
      softLimitTokens,
      reservedOutputTokens: request.reservedOutputTokens ?? this.options.reservedOutputTokens ?? 1024,
      reason: "deterministic-default"
    };
  }
}
