import type { SessionId, UsageBudgetManager, UsageRecord } from "@deepseek/platform-contracts";

export class InMemoryUsageBudgetManager implements UsageBudgetManager {
  private readonly records: UsageRecord[] = [];

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
}
