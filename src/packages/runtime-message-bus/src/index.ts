import {
  RUNTIME_PIPE_SCHEMA_VERSION,
  RUNTIME_PIPE_STREAMS,
  type BusEnvelope,
  type BusPipeConfig,
  type BusPipeDiagnostic,
  type BusPipeMetadata,
  type BusPipePressureState,
  type BusSubscription,
  type RuntimeMessageBus,
  type SessionId
} from "@deepseek/platform-contracts";

export interface InMemoryBusOptions {
  readonly maxRecords?: number;
  readonly maxSubscriberQueueSize?: number;
  readonly pipes?: readonly BusPipeConfig[];
}

interface PipeStats {
  sequence: number;
  droppedRecords: number;
  compactedRecords: number;
  failClosedCount: number;
  blockedProducers: Set<string>;
  pressure: BusPipePressureState;
  lastDepth: number;
  lastProducer?: string;
  lastConsumer?: string;
}

export class InMemoryRuntimeMessageBus implements RuntimeMessageBus {
  private readonly records: BusEnvelope[] = [];
  private readonly subscribers = new Map<string, Array<(envelope: BusEnvelope) => void>>();
  private readonly maxRecords: number;
  private readonly maxSubscriberQueueSize: number;
  private readonly pipeConfigsByTopic = new Map<string, BusPipeConfig>();
  private readonly pipeStats = new Map<string, PipeStats>();

  constructor(options: InMemoryBusOptions = {}) {
    this.maxRecords = options.maxRecords ?? 1000;
    this.maxSubscriberQueueSize = options.maxSubscriberQueueSize ?? 100;
    for (const pipe of options.pipes ?? RUNTIME_PIPE_STREAMS) {
      this.pipeConfigsByTopic.set(pipe.topic, pipe);
    }
  }

  async publish(envelope: BusEnvelope): Promise<void> {
    const config = this.configForTopic(envelope.topic.name);
    const stats = this.statsFor(config);
    const sequence = ++stats.sequence;
    const streamRecordCount = this.records.filter((record) => record.pipe?.streamId === config.streamId).length;
    const atCapacity = envelope.replayable && config.capacity > 0 && streamRecordCount >= config.capacity;
    let storeReplayRecord = envelope.replayable && config.capacity > 0;

    if (atCapacity) {
      storeReplayRecord = this.applyOverflowPolicy(config, stats, envelope.producer);
    }

    const depthAfter = storeReplayRecord
      ? Math.min(config.capacity, streamRecordCount + 1)
      : streamRecordCount;
    stats.lastDepth = depthAfter;
    stats.lastProducer = envelope.producer;
    stats.pressure = pressureFor(config, stats.lastDepth, stats.pressure);

    const pipe = this.metadataFor(config, stats, sequence, stats.lastDepth);
    const projected = { ...envelope, pipe };

    if (envelope.replayable) {
      if (!storeReplayRecord || this.maxRecords <= 0) {
        // Retention can be disabled for constrained hosts while live delivery remains available.
      } else if (this.records.length >= this.maxRecords) {
        this.records.shift();
        this.records.push(projected);
      } else {
        this.records.push(projected);
      }
    }
    for (const listener of this.subscribers.get(projected.topic.name) ?? []) {
      listener(projected);
    }
  }

  async *subscribe(subscription: BusSubscription): AsyncIterable<BusEnvelope> {
    const queue: BusEnvelope[] = [];
    let backpressure: Error | undefined;
    const listener = (envelope: BusEnvelope) => {
      if (queue.length >= this.maxSubscriberQueueSize) {
        const config = this.configForTopic(subscription.topic);
        const stats = this.statsFor(config);
        stats.pressure = "overflowing";
        stats.lastConsumer = subscription.consumer;
        stats.blockedProducers.add(`consumer:${subscription.consumer}`);
        backpressure = new Error("BUS_SUBSCRIBER_BACKPRESSURE");
        return;
      }
      queue.push(envelope);
    };
    const listeners = this.subscribers.get(subscription.topic) ?? [];
    listeners.push(listener);
    this.subscribers.set(subscription.topic, listeners);
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift() as BusEnvelope;
        } else if (backpressure) {
          throw backpressure;
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

  getPipeDiagnostics(): readonly BusPipeDiagnostic[] {
    return [...this.pipeConfigsByTopic.values()].map((config) => {
      const stats = this.statsFor(config);
      return {
        schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
        streamId: config.streamId,
        topic: config.topic,
        ...(stats.lastProducer ? { producer: stats.lastProducer } : {}),
        ...(stats.lastConsumer ? { consumer: stats.lastConsumer } : {}),
        capacity: config.capacity,
        depth: stats.lastDepth,
        pressure: stats.pressure,
        overflowPolicy: config.overflowPolicy,
        delivery: config.delivery,
        replayImpact: config.replayImpact,
        droppedRecords: stats.droppedRecords,
        blockedProducers: [...stats.blockedProducers].sort(),
        compactedRecords: stats.compactedRecords,
        failClosedCount: stats.failClosedCount,
        suggestedAction: suggestedActionFor(config, stats.pressure),
        redaction: { class: "internal", fields: ["producer", "consumer", "suggestedAction"] }
      };
    });
  }

  private applyOverflowPolicy(config: BusPipeConfig, stats: PipeStats, producer: string): boolean {
    stats.pressure = "overflowing";

    if (config.delivery === "lossless" && config.replayImpact === "replay-affecting" && ["drop-newest", "drop-oldest", "compact", "summarize"].includes(config.overflowPolicy)) {
      stats.failClosedCount += 1;
      throw new Error(`BUS_PIPE_FAIL_CLOSED:${config.streamId}`);
    }

    if (config.overflowPolicy === "fail-closed") {
      stats.failClosedCount += 1;
      stats.pressure = "failed-closed";
      throw new Error(`BUS_PIPE_FAIL_CLOSED:${config.streamId}`);
    }

    if (config.overflowPolicy === "block") {
      stats.blockedProducers.add(producer);
      throw new Error(`BUS_PIPE_BACKPRESSURE:${config.streamId}`);
    }

    if (config.overflowPolicy === "drop-newest") {
      stats.droppedRecords += 1;
      return false;
    }

    const oldestIndex = this.records.findIndex((record) => record.pipe?.streamId === config.streamId);
    if (oldestIndex >= 0) {
      this.records.splice(oldestIndex, 1);
    }

    if (config.overflowPolicy === "compact" || config.overflowPolicy === "summarize") {
      stats.compactedRecords += 1;
    } else {
      stats.droppedRecords += 1;
    }

    return true;
  }

  private configForTopic(topic: string): BusPipeConfig {
    const configured = this.pipeConfigsByTopic.get(topic);
    if (configured) return configured;

    const fallback: BusPipeConfig = {
      schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
      streamId: `runtime.pipe.${topic}`,
      topic,
      owner: "runtime-message-bus",
      capacity: Math.max(0, this.maxRecords),
      highWatermark: Math.max(1, Math.floor(Math.max(1, this.maxRecords) * 0.8)),
      overflowPolicy: "drop-oldest",
      delivery: "compactable",
      replayImpact: "diagnostic-only",
      description: "Fallback bounded pipe for unclassified runtime-message-bus topics.",
      redaction: { class: "internal", fields: ["description"] }
    };
    this.pipeConfigsByTopic.set(topic, fallback);
    return fallback;
  }

  private statsFor(config: BusPipeConfig): PipeStats {
    const existing = this.pipeStats.get(config.streamId);
    if (existing) return existing;
    const created: PipeStats = {
      sequence: 0,
      droppedRecords: 0,
      compactedRecords: 0,
      failClosedCount: 0,
      blockedProducers: new Set<string>(),
      pressure: "normal" as BusPipePressureState,
      lastDepth: 0
    };
    this.pipeStats.set(config.streamId, created);
    return created;
  }

  private metadataFor(config: BusPipeConfig, stats: PipeStats, sequence: number, depth: number): BusPipeMetadata {
    return {
      schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
      streamId: config.streamId,
      sequence,
      capacity: config.capacity,
      depth,
      pressure: stats.pressure,
      overflowPolicy: config.overflowPolicy,
      delivery: config.delivery,
      replayImpact: config.replayImpact,
      droppedRecords: stats.droppedRecords,
      compactedRecords: stats.compactedRecords
    };
  }
}

function pressureFor(config: BusPipeConfig, depth: number, current: BusPipePressureState): BusPipePressureState {
  if (current === "failed-closed" || current === "overflowing") return current;
  if (config.capacity > 0 && depth >= config.highWatermark) return "pressured";
  return "normal";
}

function suggestedActionFor(config: BusPipeConfig, pressure: BusPipePressureState): string {
  if (pressure === "normal") return "No action required.";
  if (config.overflowPolicy === "fail-closed") return "Increase capacity or reduce producer rate before enabling this stream for broader rollout.";
  if (config.overflowPolicy === "block") return "Drain consumers or lower producer concurrency.";
  if (config.overflowPolicy === "compact" || config.overflowPolicy === "summarize") return "Inspect compaction summaries and replay fingerprints.";
  return "Inspect dropped record counts and consider a lossless policy for replay-affecting streams.";
}
