import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  JsonProtocolCodec,
  approvalIdFromProtocolEnvelope,
  createApprovalDecisionControlEnvelope,
  createApprovalLifecycleEnvelope,
  createRunTurnEnvelope
} from "../src/index.js";
import { APPROVAL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { ApprovalDecision, ApprovalId, ApprovalLifecycleRecord } from "@deepseek/platform-contracts";

describe("communication protocol", () => {
  it("round-trips a versioned envelope", () => {
    const codec = new JsonProtocolCodec();
    const envelope = createRunTurnEnvelope("hello", "test");
    assert.deepEqual(codec.decode(codec.encode(envelope)), envelope);
  });

  it("round-trips approval lifecycle protocol records", () => {
    const codec = new JsonProtocolCodec();
    const record = approvalRecord("approval.required");
    const envelope = createApprovalLifecycleEnvelope({ record, host: "test" });
    const decoded = codec.decode(codec.encode(envelope));

    assert.equal(decoded.type, "event");
    assert.equal(decoded.routing.target, "host");
    assert.equal(decoded.payload.approval?.kind, "approval.required");
    assert.equal(decoded.payload.approval?.approvalId, record.approvalId);
    assert.deepEqual(decoded.payload.approval?.decisionOptions, ["allow", "deny", "cancel"]);
    assert.equal(approvalIdFromProtocolEnvelope(decoded), record.approvalId);
  });

  it("routes approval decisions as control messages without resubmitting requests", () => {
    const codec = new JsonProtocolCodec();
    const decision = approvalDecision();
    const envelope = createApprovalDecisionControlEnvelope({
      decision,
      host: "test",
      sessionId: asId<"session">("session-approval-protocol")
    });
    const decoded = codec.decode(codec.encode(envelope));

    assert.equal(decoded.type, "control");
    assert.equal(decoded.routing.target, "runtime");
    assert.equal(decoded.payload.request, undefined);
    assert.equal(decoded.payload.approvalControl?.kind, "approval.decision");
    assert.equal(decoded.payload.approvalControl?.decision.decision, "deny");
    assert.equal(decoded.payload.control?.kind, "approval.decision");
    assert.equal(approvalIdFromProtocolEnvelope(decoded), decision.approvalId);
  });

  it("keeps additive approval fields protocol compatible", () => {
    const codec = new JsonProtocolCodec();
    const envelope = createApprovalLifecycleEnvelope({ record: approvalRecord("approval.denied"), host: "test" });
    const encoded = JSON.parse(codec.encode(envelope)) as Record<string, unknown>;
    const payload = encoded.payload as Record<string, unknown>;
    payload.approval = {
      ...(payload.approval as Record<string, unknown>),
      optionalFutureRisk: { ignored: true }
    };
    const decoded = codec.validate(encoded);

    assert.equal(decoded.payload.approval?.kind, "approval.denied");
    assert.equal(decoded.payload.approval?.approvalId, "approval:protocol");
    assert.equal(decoded.payload.approval?.referencePitFixtureIds.includes("pit.headless-trust.fail-closed"), true);
  });
});

const trace = {
  traceId: asId<"trace">("trace-approval-protocol"),
  spanId: asId<"span">("span-approval-protocol"),
  correlationId: asId<"correlation">("corr-approval-protocol"),
  sessionId: asId<"session">("session-approval-protocol")
};

function approvalRecord(kind: ApprovalLifecycleRecord["kind"]): ApprovalLifecycleRecord {
  const decision = kind === "approval.required" ? undefined : approvalDecision();
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    kind,
    approvalId: "approval:protocol" as ApprovalId,
    sessionId: trace.sessionId,
    trace,
    summary: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      title: "Approval required",
      subject: "protocol",
      action: "execute:test",
      resource: "runtime.echo",
      capability: "runtime.echo",
      targetKind: "capability",
      targetLabel: "runtime.echo",
      riskSummaries: [{
        schemaVersion: APPROVAL_SCHEMA_VERSION,
        kind: "policy",
        severity: "medium",
        title: "Headless approval",
        detail: "Requires explicit approval.",
        reasonCodes: ["policy.approval.required"],
        referencePitFixtureIds: ["pit.headless-trust.fail-closed"],
        redaction: { class: "internal", fields: ["detail"] },
        metadata: {}
      }],
      allowedDecisions: ["allow", "deny", "cancel"],
      referencePitFixtureIds: ["pit.headless-trust.fail-closed"],
      redaction: { class: "internal", fields: ["targetLabel"] },
      metadata: {}
    },
    ...(decision ? { decision } : {}),
    auditReference: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      policyDecision: "ask",
      reasonCodes: ["policy.approval.required"],
      redaction: { class: "internal", fields: ["reasonCodes"] }
    },
    redaction: { class: "internal", fields: ["summary.targetLabel"] },
    compatibility: { schemaVersion: APPROVAL_SCHEMA_VERSION }
  };
}

function approvalDecision(): ApprovalDecision {
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    approvalId: "approval:protocol" as ApprovalId,
    approved: false,
    decision: "deny",
    source: "headless-default",
    reason: "Denied by headless default",
    reasonCode: "headless.fail_closed",
    auditReference: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      policyDecision: "ask",
      reasonCodes: ["headless.fail_closed"],
      redaction: { class: "internal", fields: ["reasonCodes"] }
    },
    trace,
    redaction: { class: "internal", fields: ["reason"] },
    metadata: { referencePitFixtureIds: ["pit.headless-trust.fail-closed"] }
  };
}
