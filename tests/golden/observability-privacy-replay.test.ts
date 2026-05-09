import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectRuntimeEvents, createHeadlessRuntime } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("observability privacy golden replay", () => {
  it("replays runtime trace with redacted observability diagnostic bundle evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const runtime = createHeadlessRuntime(deps);
    const events = await collectRuntimeEvents(runtime.runTurn({ prompt: "observability golden" }));
    const sessionId = events[0]?.sessionId;
    assert.ok(sessionId);

    await deps.observability.emit({
      kind: "audit",
      at: new Date(0).toISOString(),
      name: "golden.secret.fixture",
      fields: { env: "DEEPSEEK_API_KEY=sk-golden-1234567890" }
    });
    const bundle = await deps.observability.createDiagnosticBundle({ target: "local-bundle", reason: "golden replay" });
    const trace = await deps.regression.normalize({
      name: "observability-privacy",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime: events,
      sessions: await deps.sessions.events(sessionId),
      assertions: [
        { expectedKind: "context.projection.completed" },
        { expectedKind: "capability.completed" },
        { diagnosticBundleSchemaVersion: bundle.schemaVersion, privacyAction: bundle.privacyDecision.action }
      ]
    });
    const replay = await deps.regression.replay(trace);

    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal(bundle.schemaVersion, "1.0.0");
    assert.equal(bundle.privacyDecision.action, "allow-local");
    assert.equal(JSON.stringify(bundle).includes("sk-golden-1234567890"), false);
    await runtime.dispose();
  });
});
