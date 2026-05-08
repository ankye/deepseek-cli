import type { ObservabilityEvent, ObservabilitySink } from "@deepseek/platform-contracts";

export class InMemoryObservabilitySink implements ObservabilitySink {
  private readonly events: ObservabilityEvent[] = [];

  async emit(event: ObservabilityEvent): Promise<void> {
    this.events.push(event);
  }

  async drain(): Promise<readonly ObservabilityEvent[]> {
    return [...this.events];
  }
}
