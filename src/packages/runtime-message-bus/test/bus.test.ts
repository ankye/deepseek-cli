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
});
