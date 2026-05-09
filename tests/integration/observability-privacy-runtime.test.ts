import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("observability privacy runtime integration", () => {
  it("captures runtime events as redacted canonical diagnostic evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "runtime observability" }));
    const records = await deps.observability.drain();
    const bundle = await deps.observability.createDiagnosticBundle({ target: "local-bundle", reason: "runtime integration", maxRecords: 10 });

    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(records.length > 0, true);
    assert.equal(records.every((record) => record.schemaVersion === "1.0.0"), true);
    assert.equal(bundle.records.length > 0, true);
    assert.equal(bundle.privacyDecision.action, "allow-local");
    assert.equal(JSON.stringify(bundle).includes("sk-live"), false);
    await runtime.dispose();
  });
});
