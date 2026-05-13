import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { APPROVAL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { ApprovalId, ApprovalLifecycleRecord } from "@deepseek/platform-contracts";
import { approvalEvidenceSubjectFromRecord, assertApprovalEvidenceParity } from "@deepseek/testing-regression";

describe("approval lifecycle golden replay", () => {
  it("keeps approval lifecycle evidence replayable and immutable for future revert", () => {
    const required = approvalRecord("approval.required");
    const denied = approvalRecord("approval.denied");
    const replayable = [required, denied].map((record) => JSON.parse(JSON.stringify(record)) as ApprovalLifecycleRecord);

    assertApprovalEvidenceParity(replayable.map(approvalEvidenceSubjectFromRecord));
    assert.equal(replayable.every((record) => record.approvalId === "approval:golden"), true);
    assert.equal(replayable.every((record) => record.auditReference.reasonCodes.includes("headless.fail_closed") || record.auditReference.reasonCodes.includes("policy.approval.required")), true);
    assert.equal(JSON.stringify(replayable).includes("pit.headless-trust.fail-closed"), true);
    assert.equal(JSON.stringify(replayable).includes("before content"), false);
  });
});

function approvalRecord(kind: ApprovalLifecycleRecord["kind"]): ApprovalLifecycleRecord {
  const trace = {
    traceId: asId<"trace">("trace-approval-golden"),
    spanId: asId<"span">("span-approval-golden"),
    correlationId: asId<"correlation">("corr-approval-golden"),
    sessionId: asId<"session">("session-approval-golden")
  };
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    kind,
    approvalId: "approval:golden" as ApprovalId,
    sessionId: trace.sessionId,
    trace,
    summary: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      title: "Approval required",
      subject: "golden",
      action: "execute:file.write",
      resource: "core.file.write",
      targetKind: "capability",
      targetLabel: "core.file.write",
      riskSummaries: [{
        schemaVersion: APPROVAL_SCHEMA_VERSION,
        kind: "policy",
        severity: "medium",
        title: "Approval replay",
        detail: "Approval evidence remains addressable after future revert operations.",
        reasonCodes: ["policy.approval.required"],
        referencePitFixtureIds: ["pit.headless-trust.fail-closed"],
        redaction: { class: "internal", fields: ["detail"] },
        metadata: { immutable: true }
      }],
      allowedDecisions: ["allow", "deny", "cancel"],
      referencePitFixtureIds: ["pit.headless-trust.fail-closed"],
      redaction: { class: "internal", fields: ["targetLabel"] },
      metadata: { revertEvidence: "approval-history" }
    },
    ...(kind === "approval.denied"
      ? {
          decision: {
            schemaVersion: APPROVAL_SCHEMA_VERSION,
            approvalId: "approval:golden" as ApprovalId,
            approved: false,
            decision: "deny" as const,
            source: "headless-default" as const,
            reason: "Denied by headless default",
            reasonCode: "headless.fail_closed",
            auditReference: {
              schemaVersion: APPROVAL_SCHEMA_VERSION,
              traceId: trace.traceId,
              correlationId: trace.correlationId,
              policyDecision: "ask",
              reasonCodes: ["headless.fail_closed"],
              redaction: { class: "internal" }
            },
            trace,
            redaction: { class: "internal", fields: ["reason"] },
            metadata: { referencePitFixtureIds: ["pit.headless-trust.fail-closed"] }
          }
        }
      : {}),
    auditReference: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      policyDecision: "ask",
      reasonCodes: kind === "approval.denied" ? ["headless.fail_closed"] : ["policy.approval.required"],
      redaction: { class: "internal" }
    },
    redaction: { class: "internal", fields: ["summary.targetLabel", "decision.reason"] },
    compatibility: { schemaVersion: APPROVAL_SCHEMA_VERSION }
  };
}
