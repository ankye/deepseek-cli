import type { ContextBudgetDecision, ContextBudgetRequest, SessionId, UsageBudgetManager, UsageRecord } from "@deepseek/platform-contracts";

export interface InMemoryUsageBudgetOptions {
  readonly contextHardLimitTokens?: number;
  readonly contextSoftLimitTokens?: number;
  readonly reservedOutputTokens?: number;
  readonly maxInputTokens?: number;
  readonly maxOutputTokens?: number;
  readonly maxCostMicros?: number;
}

export class InMemoryUsageBudgetManager implements UsageBudgetManager {
  private readonly records: UsageRecord[] = [];

  constructor(private readonly options: InMemoryUsageBudgetOptions = {}) {}

  async record(record: UsageRecord): Promise<void> {
    this.records.push(record);
  }

  async check(sessionId: SessionId, proposed: Partial<UsageRecord> = {}): Promise<{ allowed: boolean; warning?: string; hardLimit?: string }> {
    const total = await this.total(sessionId);
    const nextInputTokens = total.inputTokens + (proposed.inputTokens ?? 0);
    const nextOutputTokens = total.outputTokens + (proposed.outputTokens ?? 0);
    const nextCostMicros = total.costMicros + (proposed.costMicros ?? 0);
    if (this.options.maxInputTokens !== undefined && nextInputTokens > this.options.maxInputTokens) {
      return { allowed: false, hardLimit: "usage.inputTokens" };
    }
    if (this.options.maxOutputTokens !== undefined && nextOutputTokens > this.options.maxOutputTokens) {
      return { allowed: false, hardLimit: "usage.outputTokens" };
    }
    if (this.options.maxCostMicros !== undefined && nextCostMicros > this.options.maxCostMicros) {
      return { allowed: false, hardLimit: "usage.costMicros" };
    }
    const warning = this.options.maxInputTokens !== undefined && nextInputTokens > this.options.maxInputTokens * 0.8
      ? "usage.inputTokens.near-limit"
      : undefined;
    return warning ? { allowed: true, warning } : { allowed: true };
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
