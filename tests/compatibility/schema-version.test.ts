import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requireSchemaVersion } from "@deepseek/testing-regression";

describe("compatibility checks", () => {
  it("requires schemaVersion on persisted subjects", () => {
    assert.deepEqual(requireSchemaVersion({ schemaVersion: "1.0.0" }), []);
    assert.deepEqual(requireSchemaVersion({}), ["missing schemaVersion"]);
  });
});
