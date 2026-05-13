import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  APPROVAL_SCHEMA_VERSION,
  asId,
  type ApprovalAuditReference,
  type ApprovalBroker,
  type ApprovalDecision,
  type ApprovalId,
  type ApprovalLifecycleRecord,
  type ApprovalRenderSummary,
  type JsonValue
} from "@deepseek/platform-contracts";
import {
  approvalEvidenceSubjectFromRecord,
  assertApprovalEvidenceParity,
  assertApprovalReferencePitIds,
  missingApprovalReferencePitIds
} from "@deepseek/testing-regression";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type _ReadonlyApprovalSummary = Expect<Equal<ApprovalRenderSummary["riskSummaries"], readonly ApprovalRenderSummary["riskSummaries"][number][]>>;
type _ReadonlyReasonCodes = Expect<Equal<ApprovalAuditReference["reasonCodes"], readonly string[]>>;

const trace = {
  traceId: asId<"trace">("trace-approval-contract"),
  spanId: asId<"span">("span-approval-contract"),
  correlationId: asId<"correlation">("correlation-approval-contract"),
  sessionId: asId<"session">("session-approval-contract")
};

function auditReference(): ApprovalAuditReference {
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    auditId: asId<"audit">("audit-approval-contract"),
    traceId: trace.traceId,
    correlationId: trace.correlationId,
    policyDecision: "ask",
    reasonCodes: ["policy.ask", "shell.analysis.manually-reviewable"],
    redaction: { class: "internal", fields: ["reasonCodes"] }
  };
}

function summary(): ApprovalRenderSummary {
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    title: "Approval required",
    subject: "runtime",
    action: "execute:shell",
    resource: "core.shell.run",
    capability: "core.shell.run",
    targetKind: "capability",
    targetLabel: "npm test",
    riskSummaries: [{
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      kind: "shell",
      severity: "critical",
      title: "Shell requires review",
      detail: "Wrapped command requires sandbox or approval.",
      reasonCodes: ["shell.analysis.manually-reviewable"],
      referencePitFixtureIds: ["pit.shell-parser.fallback-risk"],
      redaction: { class: "internal", fields: ["detail"] },
      metadata: { shellProfile: "powershell" }
    }],
    allowedDecisions: ["allow", "deny", "cancel"],
    referencePitFixtureIds: ["pit.headless-trust.fail-closed", "pit.shell-parser.fallback-risk"],
    redaction: { class: "internal", fields: ["targetLabel", "riskSummaries.detail"] },
    metadata: { renderer: "text" }
  };
}

function decision(): ApprovalDecision {
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    approvalId: "approval:contract" as ApprovalId,
    approved: false,
    decision: "deny",
    source: "headless-default",
    reason: "Denied by headless default",
    reasonCode: "headless.fail_closed",
    auditReference: auditReference(),
    trace,
    redaction: { class: "internal", fields: ["reason"] },
    metadata: { referencePitFixtureIds: ["pit.headless-trust.fail-closed"] }
  };
}

function lifecycleRecord(): ApprovalLifecycleRecord {
  return {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    kind: "approval.denied",
    approvalId: "approval:contract" as ApprovalId,
    sessionId: trace.sessionId,
    trace,
    summary: summary(),
    decision: decision(),
    auditReference: auditReference(),
    redaction: { class: "internal", fields: ["summary.targetLabel", "decision.reason"] },
    compatibility: { schemaVersion: APPROVAL_SCHEMA_VERSION }
  };
}

describe("approval contracts", () => {
  it("exports versioned serializable approval lifecycle DTOs", () => {
    const record = lifecycleRecord();
    const serialized = JSON.parse(JSON.stringify(record)) as ApprovalLifecycleRecord;

    assert.equal(serialized.schemaVersion, APPROVAL_SCHEMA_VERSION);
    assert.equal(serialized.summary.schemaVersion, APPROVAL_SCHEMA_VERSION);
    assert.equal(serialized.auditReference.schemaVersion, APPROVAL_SCHEMA_VERSION);
    assert.equal(serialized.decision?.schemaVersion, APPROVAL_SCHEMA_VERSION);
    assert.equal(serialized.kind, "approval.denied");
    assert.equal(serialized.summary.allowedDecisions.includes("allow"), true);
    assert.equal(JSON.stringify(serialized).includes("function"), false);
  });

  it("keeps approval broker contracts host agnostic and typed", async () => {
    const broker: ApprovalBroker = {
      async requestApproval(request) {
        return {
          ...decision(),
          approvalId: request.approvalId,
          auditReference: request.auditReference,
          trace: request.trace
        };
      }
    };
    const result = await broker.requestApproval({
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      approvalId: "approval:contract" as ApprovalId,
      subject: "runtime",
      action: "execute:shell",
      resource: "core.shell.run",
      metadata: {},
      prompt: "Run shell command?",
      decisionOptions: ["allow", "deny", "cancel"],
      summary: summary(),
      auditReference: auditReference(),
      trace,
      compatibility: { schemaVersion: APPROVAL_SCHEMA_VERSION }
    });

    assert.equal(result.decision, "deny");
    assert.equal(result.source, "headless-default");
    assert.equal(result.auditReference.correlationId, trace.correlationId);
  });

  it("is structurally assignable to JSON values for protocol and diagnostics", () => {
    const record: JsonValue = lifecycleRecord();

    assert.equal((record as ApprovalLifecycleRecord).compatibility.schemaVersion, APPROVAL_SCHEMA_VERSION);
  });

  it("asserts approval evidence parity and required pit ids", () => {
    const first = approvalEvidenceSubjectFromRecord(lifecycleRecord());
    const { decision: _decision, ...requiredRecord } = lifecycleRecord();
    const second = approvalEvidenceSubjectFromRecord({ ...requiredRecord, kind: "approval.required" });

    assertApprovalEvidenceParity([first, second]);
    assert.deepEqual(missingApprovalReferencePitIds(first.referencePitFixtureIds, ["pit.headless-trust.fail-closed"]), []);
    assert.throws(
      () => assertApprovalReferencePitIds(first.referencePitFixtureIds, ["pit.permission-bypass.hard-safety"]),
      /APPROVAL_REFERENCE_PIT_IDS_MISSING/
    );
  });
});
