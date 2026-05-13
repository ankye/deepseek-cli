import type {
  ApprovalDecision,
  ApprovalDecisionControlMessage,
  ApprovalId,
  ApprovalLifecycleProtocolRecord,
  ApprovalLifecycleRecord,
  HostKind,
  JsonObject,
  ProtocolEnvelope,
  ProtocolMessageKind
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const protocolVersion = "1";
const schemaVersion = "1.0.0";

export function approvalLifecycleProtocolRecord(input: {
  readonly record: ApprovalLifecycleRecord;
  readonly messageId?: ProtocolEnvelope["messageId"];
  readonly correlationId?: ProtocolEnvelope["correlationId"];
}): ApprovalLifecycleProtocolRecord {
  const correlationId = input.correlationId ?? input.record.trace.correlationId;
  return {
    protocolVersion,
    schemaVersion: input.record.schemaVersion,
    messageId: input.messageId ?? asId<"message">(`msg-${input.record.approvalId}-${input.record.kind}`),
    kind: input.record.kind,
    approvalId: input.record.approvalId,
    correlationId,
    ...(input.record.sessionId ? { sessionId: input.record.sessionId } : {}),
    trace: input.record.trace,
    redaction: input.record.redaction,
    compatibility: input.record.compatibility,
    decisionOptions: input.record.summary.allowedDecisions,
    summary: input.record.summary,
    auditReference: input.record.auditReference,
    ...(input.record.decision ? { decision: input.record.decision } : {}),
    referencePitFixtureIds: input.record.summary.referencePitFixtureIds
  };
}

export function createApprovalLifecycleEnvelope(input: {
  readonly record: ApprovalLifecycleRecord;
  readonly host?: HostKind;
}): ProtocolEnvelope {
  const messageId = asId<"message">(`msg-${input.record.approvalId}-${input.record.kind}`);
  const envelope = protocolEnvelope({
    kind: "event",
    host: input.host ?? "cli",
    target: "host",
    payload: {},
    messageId,
    correlationId: input.record.trace.correlationId,
    trace: input.record.trace,
    sessionId: input.record.sessionId
  });
  const approval = approvalLifecycleProtocolRecord({
    record: input.record,
    messageId: envelope.messageId,
    correlationId: envelope.correlationId
  });
  return {
    ...envelope,
    payload: {
      approval
    }
  };
}

export function createApprovalDecisionControlEnvelope(input: {
  readonly decision: ApprovalDecision;
  readonly host?: HostKind;
  readonly sessionId?: ProtocolEnvelope["routing"]["sessionId"];
  readonly metadata?: JsonObject;
}): ProtocolEnvelope {
  const messageId = asId<"message">(`msg-${input.decision.approvalId}-approval-decision`);
  const envelope = protocolEnvelope({
    kind: "control",
    host: input.host ?? "cli",
    target: "runtime",
    payload: {},
    messageId,
    correlationId: input.decision.trace.correlationId,
    trace: input.decision.trace,
    sessionId: input.sessionId
  });
  const control: ApprovalDecisionControlMessage = {
    schemaVersion: input.decision.schemaVersion,
    kind: "approval.decision",
    approvalId: input.decision.approvalId,
    correlationId: envelope.correlationId,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    decision: input.decision,
    trace: input.decision.trace,
    redaction: input.decision.redaction,
    compatibility: { schemaVersion: input.decision.schemaVersion },
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
  return {
    ...envelope,
    payload: {
      approvalControl: control,
      control: {
        kind: control.kind,
        approvalId: control.approvalId,
        decision: control.decision.decision,
        reasonCode: control.decision.reasonCode
      }
    }
  };
}

export function approvalIdFromProtocolEnvelope(envelope: ProtocolEnvelope): ApprovalId | undefined {
  return envelope.payload.approval?.approvalId ?? envelope.payload.approvalControl?.approvalId;
}

function protocolEnvelope(input: {
  readonly kind: ProtocolMessageKind;
  readonly host: HostKind;
  readonly target: ProtocolEnvelope["routing"]["target"];
  readonly payload: JsonObject;
  readonly messageId: ProtocolEnvelope["messageId"];
  readonly correlationId: ProtocolEnvelope["correlationId"];
  readonly trace: ProtocolEnvelope["trace"];
  readonly sessionId?: ProtocolEnvelope["routing"]["sessionId"];
}): ProtocolEnvelope {
  return {
    protocolVersion,
    schemaVersion,
    id: input.messageId,
    messageId: input.messageId,
    correlationId: input.correlationId,
    type: input.kind,
    createdAt: new Date(0).toISOString(),
    trace: input.trace,
    redaction: { class: "internal" },
    compatibility: { schemaVersion },
    routing: {
      host: input.host,
      target: input.target,
      ...(input.sessionId ? { sessionId: input.sessionId } : {})
    },
    payload: input.payload
  };
}
