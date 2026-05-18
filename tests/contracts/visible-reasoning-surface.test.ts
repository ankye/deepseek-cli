import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VISIBLE_REASONING_PROVIDER_REASONING_PIT,
  VISIBLE_REASONING_SCHEMA_VERSION,
  VISIBLE_REASONING_SECRET_REDACTION_PIT,
  asId,
  createVisibleReasoningRecord,
  projectVisibleReasoning,
  replayVisibleReasoningProjection,
  validatePluginVisibleReasoningContribution,
  validateVisibleReasoningRecord,
  validateVisibleReasoningRecords,
  type PluginId,
  type TraceContext,
  type VisibleReasoningEvidenceLink
} from "@deepseek/platform-contracts";

describe("visible reasoning surface contracts", () => {
  it("creates serializable, ordered, evidence-linked reasoning records", () => {
    const record = createVisibleReasoningRecord({
      sessionId: asId<"session">("session-visible"),
      turnId: asId<"turn">("turn-visible"),
      trace: trace(),
      createdAt: "1970-01-01T00:00:00.000Z",
      actor: "runtime",
      stepKind: "context-selection",
      status: "completed",
      certainty: "verified",
      summary: "Selected README and package metadata because the task asks about CLI behavior.",
      evidence: [evidence("context-node", "context:readme")],
      sequence: 20,
      phase: "context"
    });

    assert.equal(record.schemaVersion, VISIBLE_REASONING_SCHEMA_VERSION);
    assert.equal(record.order.sequence, 20);
    assert.equal(record.evidence[0]?.target.kind, "tool-evidence");
    assert.deepEqual(validateVisibleReasoningRecord(record).errors, []);
    assert.deepEqual(validateVisibleReasoningRecords([record]), { ok: true, errors: [] });
    assert.equal(JSON.parse(JSON.stringify(record)).summary.includes("README"), true);
  });

  it("projects records deterministically for compact text and structured output", () => {
    const records = [
      createVisibleReasoningRecord({
        sessionId: asId<"session">("session-visible"),
        turnId: asId<"turn">("turn-visible"),
        trace: trace(),
        createdAt: "1970-01-01T00:00:00.000Z",
        actor: "verifier",
        stepKind: "verification",
        status: "completed",
        summary: "Typecheck and lint passed.",
        detail: "Full verification detail should be hidden in compact projections.",
        evidence: [evidence("check", "check:typecheck")],
        sequence: 30
      }),
      createVisibleReasoningRecord({
        sessionId: asId<"session">("session-visible"),
        turnId: asId<"turn">("turn-visible"),
        trace: trace(),
        createdAt: "1970-01-01T00:00:00.000Z",
        actor: "runtime",
        stepKind: "intent",
        status: "completed",
        summary: "Understand and explain the requested implementation.",
        sequence: 10
      })
    ];

    const compact = projectVisibleReasoning(records, { renderer: "text", detailLevel: "compact" });
    const json = projectVisibleReasoning(records, { renderer: "json", detailLevel: "full" });

    assert.deepEqual(compact.records.map((record) => record.stepKind), ["intent", "verification"]);
    assert.equal(compact.records[1]?.detail, undefined);
    assert.equal(json.records[1]?.detail?.includes("Full verification detail"), true);
    assert.equal(compact.summary.evidenceLinkCount, 1);
    assert.equal(compact.replayFingerprint, projectVisibleReasoning(records, { renderer: "jsonl", detailLevel: "compact" }).replayFingerprint);
  });

  it("redacts secret-like text and cites redaction pit fixtures", () => {
    const record = createVisibleReasoningRecord({
      sessionId: asId<"session">("session-visible"),
      turnId: asId<"turn">("turn-visible"),
      trace: trace(),
      createdAt: "1970-01-01T00:00:00.000Z",
      actor: "runtime",
      stepKind: "risk",
      status: "warning",
      summary: "Do not show Bearer abcdefghijklmnopqrstuvwxyz or DEEPSEEK_API_KEY=ds-1234567890abcdef.",
      metadata: { authorization: "Bearer abcdefghijklmnopqrstuvwxyz" },
      sequence: 40
    });

    const serialized = JSON.stringify(record);
    assert.equal(serialized.includes("abcdefghijklmnopqrstuvwxyz"), false);
    assert.equal(serialized.includes("ds-1234567890abcdef"), false);
    assert.equal(record.pitFixtureIds.includes(VISIBLE_REASONING_SECRET_REDACTION_PIT), true);
    assert.equal(record.privacyClass, "secret");
    assert.deepEqual(validateVisibleReasoningRecord(record).errors, []);
  });

  it("rejects raw provider/internal reasoning contribution metadata", () => {
    const record = createVisibleReasoningRecord({
      sessionId: asId<"session">("session-visible"),
      turnId: asId<"turn">("turn-visible"),
      trace: trace(),
      createdAt: "1970-01-01T00:00:00.000Z",
      actor: "model-summary",
      stepKind: "intent",
      status: "completed",
      summary: "I will explain the work using a bounded visible summary.",
      metadata: { rawProviderReasoning: "hidden chain-of-thought payload" },
      sequence: 1
    });

    const validation = validateVisibleReasoningRecord(record);

    assert.equal(record.pitFixtureIds.includes(VISIBLE_REASONING_PROVIDER_REASONING_PIT), true);
    assert.equal(validation.ok, false);
    assert.equal(validation.errors.some((error) => error.code === "VISIBLE_REASONING_RAW_PROVIDER_REASONING_REJECTED"), true);
    assert.equal(JSON.stringify(record).includes("hidden chain-of-thought payload"), false);
  });

  it("validates plugin reasoning contributions before projection", () => {
    const pluginId = asId<"plugin">("@deepseek/plugin-dev-checks") as PluginId;
    const good = createVisibleReasoningRecord({
      sessionId: asId<"session">("session-visible"),
      turnId: asId<"turn">("turn-visible"),
      trace: trace(),
      createdAt: "1970-01-01T00:00:00.000Z",
      actor: "plugin",
      pluginId,
      stepKind: "verification",
      status: "completed",
      summary: "Dev Checks ran a fixed typecheck descriptor.",
      evidence: [evidence("check", "checks:typecheck")],
      sequence: 1
    });
    const bad = { ...good, pluginId: asId<"plugin">("@deepseek/other") as PluginId };

    assert.equal(validatePluginVisibleReasoningContribution(pluginId, [good]).ok, true);
    assert.equal(validatePluginVisibleReasoningContribution(pluginId, [bad]).errors.some((error) => error.code === "VISIBLE_REASONING_PLUGIN_ID_MISMATCH"), true);
  });

  it("detects replay drift without raw private content", () => {
    const captured = projectVisibleReasoning([
      createVisibleReasoningRecord({
        sessionId: asId<"session">("session-visible"),
        turnId: asId<"turn">("turn-visible"),
        trace: trace(),
        createdAt: "1970-01-01T00:00:00.000Z",
        actor: "runtime",
        stepKind: "intent",
        status: "completed",
        summary: "Initial intent.",
        sequence: 1
      })
    ], { renderer: "jsonl" });
    const replayed = projectVisibleReasoning([
      createVisibleReasoningRecord({
        sessionId: asId<"session">("session-visible"),
        turnId: asId<"turn">("turn-visible"),
        trace: trace(),
        createdAt: "1970-01-01T00:00:00.000Z",
        actor: "runtime",
        stepKind: "intent",
        status: "failed",
        summary: "Initial intent.",
        sequence: 1
      })
    ], { renderer: "jsonl" });

    const report = replayVisibleReasoningProjection(captured, replayed);

    assert.equal(report.status, "drifted");
    assert.equal(report.firstDrift?.kind, "status");
    assert.equal(JSON.stringify(report).includes("Initial intent"), false);
  });
});

function trace(): TraceContext {
  return {
    traceId: asId<"trace">("trace-visible"),
    spanId: asId<"span">("span-visible"),
    correlationId: asId<"correlation">("corr-visible"),
    sessionId: asId<"session">("session-visible")
  };
}

function evidence(kind: VisibleReasoningEvidenceLink["kind"], id: string): VisibleReasoningEvidenceLink {
  return {
    kind,
    target: {
      kind: "tool-evidence",
      id,
      label: id
    },
    label: id,
    fingerprint: `fingerprint:${id}`,
    supports: true,
    redaction: { class: "internal" }
  };
}
