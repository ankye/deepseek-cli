import type { RuntimeEvent } from "@deepseek/platform-contracts";

export interface ChatUsageAccumulator {
  inputTokens: number;
  outputTokens: number;
  elapsedMs: number;
}

export function accumulateChatUsage(usage: ChatUsageAccumulator, events: readonly RuntimeEvent[]): void {
  for (const event of events) {
    if (event.kind !== "usage.updated") continue;
    usage.inputTokens += typeof event.data.inputTokens === "number" ? event.data.inputTokens : 0;
    usage.outputTokens += typeof event.data.outputTokens === "number" ? event.data.outputTokens : 0;
  }
}
