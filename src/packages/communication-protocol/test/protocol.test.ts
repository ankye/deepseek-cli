import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { JsonProtocolCodec, createRunTurnEnvelope } from "../src/index.js";

describe("communication protocol", () => {
  it("round-trips a versioned envelope", () => {
    const codec = new JsonProtocolCodec();
    const envelope = createRunTurnEnvelope("hello", "test");
    assert.deepEqual(codec.decode(codec.encode(envelope)), envelope);
  });
});
