import type { BusEnvelope, BusSubscription, RuntimeMessageBus, SessionId } from "@deepseek/platform-contracts";

export interface InMemoryBusOptions {
  readonly maxRecords?: number;
}

export class InMemoryRuntimeMessageBus implements RuntimeMessageBus {
  private readonly records: BusEnvelope[] = [];
  private readonly subscribers = new Map<string, Array<(envelope: BusEnvelope) => void>>();
  private readonly maxRecords: number;

  constructor(options: InMemoryBusOptions = {}) {
    this.maxRecords = options.maxRecords ?? 1000;
  }

  async publish(envelope: BusEnvelope): Promise<void> {
    if (this.records.length >= this.maxRecords) {
      throw new Error("BUS_BACKPRESSURE");
    }
    if (envelope.replayable) {
      this.records.push(envelope);
    }
    for (const listener of this.subscribers.get(envelope.topic.name) ?? []) {
      listener(envelope);
    }
  }

  async *subscribe(subscription: BusSubscription): AsyncIterable<BusEnvelope> {
    const queue: BusEnvelope[] = [];
    const listener = (envelope: BusEnvelope) => queue.push(envelope);
    const listeners = this.subscribers.get(subscription.topic) ?? [];
    listeners.push(listener);
    this.subscribers.set(subscription.topic, listeners);
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift() as BusEnvelope;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      const current = this.subscribers.get(subscription.topic) ?? [];
      this.subscribers.set(
        subscription.topic,
        current.filter((item) => item !== listener)
      );
    }
  }

  getReplayRecords(sessionId?: SessionId): readonly BusEnvelope[] {
    return sessionId ? this.records.filter((record) => record.sessionId === sessionId) : [...this.records];
  }
}
