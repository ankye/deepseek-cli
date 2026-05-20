import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryRuntimeMessageBus } from "../src/index.js";
import { RUNTIME_PIPE_SCHEMA_VERSION, RUNTIME_PIPE_STREAMS, asId, type BusEnvelope, type BusPipeConfig, type ContextPipelineStreamRecord } from "@deepseek/platform-contracts";

describe("runtime message bus", () => {
  it("records replayable envelopes in publish order", async () => {
    const bus = new InMemoryRuntimeMessageBus();
    await bus.publish({
      protocolVersion: "1",
      schemaVersion: "1",
      id: "bus-1",
      type: "event",
      createdAt: new Date(0).toISOString(),
      trace: {
        traceId: asId<"trace">("trace-1"),
        spanId: asId<"span">("span-1"),
        correlationId: asId<"correlation">("corr-1")
      },
      redaction: { class: "public" },
      compatibility: { schemaVersion: "1" },
      payload: { value: "ok" },
      topic: { name: "runtime.event", owner: "runtime" },
      producer: "test",
      correlationId: asId<"correlation">("corr-1"),
      replayable: true
    });
    assert.equal(bus.getReplayRecords().length, 1);
  });

  it("retains the newest replayable envelopes instead of failing live publishing", async () => {
    const bus = new InMemoryRuntimeMessageBus({ maxRecords: 2 });
    const envelope = (id: string) => ({
      protocolVersion: "1",
      schemaVersion: "1",
      id,
      type: "event" as const,
      createdAt: new Date(0).toISOString(),
      trace: {
        traceId: asId<"trace">(`trace-${id}`),
        spanId: asId<"span">(`span-${id}`),
        correlationId: asId<"correlation">(`corr-${id}`)
      },
      redaction: { class: "public" as const },
      compatibility: { schemaVersion: "1" },
      payload: { value: id },
      topic: { name: "runtime.event", owner: "runtime" },
      producer: "test",
      correlationId: asId<"correlation">(`corr-${id}`),
      replayable: true
    });

    await bus.publish(envelope("bus-1"));
    await bus.publish(envelope("bus-2"));
    await bus.publish(envelope("bus-3"));

    assert.deepEqual(bus.getReplayRecords().map((record) => record.id), ["bus-2", "bus-3"]);
  });

  it("allows live delivery with replay retention disabled", async () => {
    const bus = new InMemoryRuntimeMessageBus({ maxRecords: 0 });
    await bus.publish({
      protocolVersion: "1",
      schemaVersion: "1",
      id: "bus-1",
      type: "event",
      createdAt: new Date(0).toISOString(),
      trace: {
        traceId: asId<"trace">("trace-1"),
        spanId: asId<"span">("span-1"),
        correlationId: asId<"correlation">("corr-1")
      },
      redaction: { class: "public" },
      compatibility: { schemaVersion: "1" },
      payload: { value: "ok" },
      topic: { name: "runtime.event", owner: "runtime" },
      producer: "test",
      correlationId: asId<"correlation">("corr-1"),
      replayable: true
    });

    assert.deepEqual(bus.getReplayRecords(), []);
  });

  it("bounds slow subscriber queues with typed backpressure failure", async () => {
    const bus = new InMemoryRuntimeMessageBus({ maxSubscriberQueueSize: 1 });
    const stream = bus.subscribe({ topic: "runtime.event", consumer: "slow-test" })[Symbol.asyncIterator]();

    const envelope = (id: string) => ({
      protocolVersion: "1",
      schemaVersion: "1",
      id,
      type: "event" as const,
      createdAt: new Date(0).toISOString(),
      trace: {
        traceId: asId<"trace">(`trace-${id}`),
        spanId: asId<"span">(`span-${id}`),
        correlationId: asId<"correlation">(`corr-${id}`)
      },
      redaction: { class: "public" as const },
      compatibility: { schemaVersion: "1" },
      payload: { value: id },
      topic: { name: "runtime.event", owner: "runtime" },
      producer: "test",
      correlationId: asId<"correlation">(`corr-${id}`),
      replayable: true
    });

    const first = stream.next();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await bus.publish(envelope("bus-1"));
    await bus.publish(envelope("bus-2"));
    assert.equal((await first).value.id, "bus-1");
    await assert.rejects(() => stream.next(), /BUS_SUBSCRIBER_BACKPRESSURE/);
  });

  it("records bounded pipe metadata and diagnostics for drop-oldest overflow", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [pipe({ capacity: 2, overflowPolicy: "drop-oldest", delivery: "compactable", replayImpact: "diagnostic-only" })] });

    await bus.publish(envelope("bus-1"));
    await bus.publish(envelope("bus-2"));
    await bus.publish(envelope("bus-3"));

    const records = bus.getReplayRecords();
    const [first, second] = records;
    const diagnostic = bus.getPipeDiagnostics().find((item) => item.streamId === "test.runtime.event");
    assert.deepEqual(records.map((record) => record.id), ["bus-2", "bus-3"]);
    assert.equal(first?.pipe?.sequence, 2);
    assert.equal(second?.pipe?.sequence, 3);
    assert.equal(diagnostic?.droppedRecords, 1);
    assert.equal(diagnostic?.pressure, "overflowing");
  });

  it("fails closed for replay-affecting streams that cannot drop records", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [pipe({ capacity: 1, overflowPolicy: "fail-closed", delivery: "fail-closed", replayImpact: "replay-affecting" })] });

    await bus.publish(envelope("bus-1"));
    await assert.rejects(() => bus.publish(envelope("bus-2")), /BUS_PIPE_FAIL_CLOSED:test\.runtime\.event/);

    const diagnostic = bus.getPipeDiagnostics().find((item) => item.streamId === "test.runtime.event");
    assert.deepEqual(bus.getReplayRecords().map((record) => record.id), ["bus-1"]);
    assert.equal(diagnostic?.failClosedCount, 1);
    assert.equal(diagnostic?.pressure, "failed-closed");
  });

  it("tracks compaction counts for compactable streams under pressure", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [pipe({ capacity: 1, overflowPolicy: "compact", delivery: "compactable", replayImpact: "replay-affecting" })] });

    await bus.publish(envelope("bus-1"));
    await bus.publish(envelope("bus-2"));

    const diagnostic = bus.getPipeDiagnostics().find((item) => item.streamId === "test.runtime.event");
    assert.deepEqual(bus.getReplayRecords().map((record) => record.id), ["bus-2"]);
    assert.equal(diagnostic?.compactedRecords, 1);
    assert.equal(diagnostic?.droppedRecords, 0);
  });

  it("declares runtime pipe stream classes for core bus channels", () => {
    const streams = new Map(RUNTIME_PIPE_STREAMS.map((stream) => [stream.streamId, stream]));
    assert.equal(streams.get("session.replay")?.delivery, "lossless");
    assert.equal(streams.get("session.replay")?.overflowPolicy, "fail-closed");
    assert.equal(streams.get("context.pipeline")?.overflowPolicy, "compact");
    assert.equal(streams.get("tool.results")?.delivery, "summarizable");
    assert.equal(streams.get("plugin.events")?.delivery, "fail-closed");
  });

  it("records context pipeline backpressure with affected block ids and redaction metadata", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [contextPipe()] });
    const payload = contextStreamRecord("context.pipeline.backpressure", {
      affectedBlockIds: ["context-block:project:ctx-a:block:a", "context-block:session:ctx-b:block:b"],
      overflowPolicy: "compact",
      pressure: "overflowing"
    });

    await bus.publish(contextEnvelope("context-pipe-1", payload));

    const [record] = bus.getReplayRecords();
    const recordPayload = record?.payload as ContextPipelineStreamRecord | undefined;
    assert.equal(record?.topic.name, "context.pipeline");
    assert.equal(record?.pipe?.streamId, "context.pipeline");
    assert.equal(recordPayload?.kind, "context.pipeline.backpressure");
    assert.deepEqual(recordPayload?.affectedBlockIds, ["context-block:project:ctx-a:block:a", "context-block:session:ctx-b:block:b"]);
    assert.equal(recordPayload?.redaction.class, "internal");
    assert.deepEqual(recordPayload?.redaction.fields, ["affectedBlockIds", "error"]);
  });
});

function envelope(id: string): BusEnvelope {
  return {
    protocolVersion: "1",
    schemaVersion: "1",
    id,
    type: "event",
    createdAt: new Date(0).toISOString(),
    trace: {
      traceId: asId<"trace">(`trace-${id}`),
      spanId: asId<"span">(`span-${id}`),
      correlationId: asId<"correlation">(`corr-${id}`)
    },
    redaction: { class: "public" },
    compatibility: { schemaVersion: "1" },
    payload: { value: id },
    topic: { name: "runtime.event", owner: "runtime" },
    producer: "test",
    correlationId: asId<"correlation">(`corr-${id}`),
    replayable: true
  };
}

function pipe(overrides: Pick<BusPipeConfig, "capacity" | "overflowPolicy" | "delivery" | "replayImpact">): BusPipeConfig {
  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    streamId: "test.runtime.event",
    topic: "runtime.event",
    owner: "runtime-message-bus",
    highWatermark: 1,
    description: "test pipe",
    redaction: { class: "internal", fields: ["description"] },
    ...overrides
  };
}

function contextPipe(): BusPipeConfig {
  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    streamId: "context.pipeline",
    topic: "context.pipeline",
    owner: "context-engine",
    capacity: 2,
    highWatermark: 1,
    overflowPolicy: "compact",
    delivery: "compactable",
    replayImpact: "replay-affecting",
    description: "test context pipeline pipe",
    redaction: { class: "internal", fields: ["description"] }
  };
}

function contextEnvelope(id: string, payload: ContextPipelineStreamRecord): BusEnvelope<ContextPipelineStreamRecord> {
  return {
    protocolVersion: "1",
    schemaVersion: "1",
    id,
    type: "event",
    createdAt: new Date(0).toISOString(),
    trace: {
      traceId: asId<"trace">(`trace-${id}`),
      spanId: asId<"span">(`span-${id}`),
      correlationId: asId<"correlation">(`corr-${id}`)
    },
    redaction: { class: "internal", fields: ["payload"] },
    compatibility: { schemaVersion: "1" },
    payload,
    topic: { name: "context.pipeline", owner: "context-engine" },
    producer: "context-engine",
    correlationId: asId<"correlation">(`corr-${id}`),
    replayable: true
  };
}

function contextStreamRecord(kind: ContextPipelineStreamRecord["kind"], overrides: Partial<ContextPipelineStreamRecord>): ContextPipelineStreamRecord {
  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    kind,
    streamId: "context.pipeline",
    correlationId: asId<"correlation">("corr-context-pipeline"),
    sequence: 1,
    blockIds: [],
    pipelineFingerprint: "pipeline:test",
    redaction: { class: "internal", fields: ["affectedBlockIds", "error"] },
    compatibility: { schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION },
    ...overrides
  };
}
