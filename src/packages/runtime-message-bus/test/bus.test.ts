import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryRuntimeMessageBus } from "../src/index.js";
import { asId } from "@deepseek/platform-contracts";

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
});
