import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryRuntimeMessageBus } from "@deepseek/runtime-message-bus";
import { RUNTIME_PIPE_SCHEMA_VERSION, asId, type BusEnvelope, type BusPipeConfig } from "@deepseek/platform-contracts";

describe("runtime message bus bounded pipe replay", () => {
  it("replays compacted stream records with deterministic pipe metadata", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [pipe({ capacity: 1, overflowPolicy: "compact", delivery: "compactable", replayImpact: "replay-affecting" })] });

    await bus.publish(envelope("bus-1"));
    await bus.publish(envelope("bus-2"));

    assert.deepEqual(
      bus.getReplayRecords().map((record) => ({
        id: record.id,
        streamId: record.pipe?.streamId,
        sequence: record.pipe?.sequence,
        compactedRecords: record.pipe?.compactedRecords,
        pressure: record.pipe?.pressure
      })),
      [
        {
          id: "bus-2",
          streamId: "golden.runtime.event",
          sequence: 2,
          compactedRecords: 1,
          pressure: "overflowing"
        }
      ]
    );
  });

  it("fails replay-affecting fail-closed streams with stable diagnostics", async () => {
    const bus = new InMemoryRuntimeMessageBus({ pipes: [pipe({ capacity: 1, overflowPolicy: "fail-closed", delivery: "fail-closed", replayImpact: "replay-affecting" })] });

    await bus.publish(envelope("bus-1"));
    await assert.rejects(() => bus.publish(envelope("bus-2")), /BUS_PIPE_FAIL_CLOSED:golden\.runtime\.event/);

    assert.deepEqual(
      bus.getPipeDiagnostics().map((diagnostic) => ({
        streamId: diagnostic.streamId,
        pressure: diagnostic.pressure,
        overflowPolicy: diagnostic.overflowPolicy,
        failClosedCount: diagnostic.failClosedCount,
        replayImpact: diagnostic.replayImpact
      })),
      [
        {
          streamId: "golden.runtime.event",
          pressure: "failed-closed",
          overflowPolicy: "fail-closed",
          failClosedCount: 1,
          replayImpact: "replay-affecting"
        }
      ]
    );
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
    producer: "golden",
    correlationId: asId<"correlation">(`corr-${id}`),
    replayable: true
  };
}

function pipe(overrides: Pick<BusPipeConfig, "capacity" | "overflowPolicy" | "delivery" | "replayImpact">): BusPipeConfig {
  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    streamId: "golden.runtime.event",
    topic: "runtime.event",
    owner: "runtime-message-bus",
    highWatermark: 1,
    description: "golden pipe",
    redaction: { class: "internal", fields: ["description"] },
    ...overrides
  };
}
