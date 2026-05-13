import type { CompatibilityMetadata, JsonObject, RedactionMetadata, TraceContext } from "./common.js";
import type { AuditId, CorrelationId, SessionId } from "./ids.js";
import type { PolicyRequest } from "./policy.js";

export const APPROVAL_SCHEMA_VERSION = "1.0.0";

export type ApprovalId = string & { readonly __brand: "ApprovalId" };
export type ApprovalDecisionKind = "allow" | "deny" | "timeout" | "cancel";
export type ApprovalDecisionSource = "interactive-user" | "headless-default" | "scripted" | "automation" | "remote-host" | "test";
export type ApprovalRiskKind = "file" | "shell" | "capability" | "extension" | "platform" | "redaction" | "policy";
export type ApprovalTargetKind = "message" | "turn" | "capability" | "command" | "tool" | "mcp" | "plugin" | "extension" | "session" | "result-list-item";

export interface ApprovalAuditReference extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly auditId?: AuditId;
  readonly traceId: string;
  readonly correlationId: CorrelationId;
  readonly policyDecision?: string;
  readonly reasonCodes: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ApprovalRiskSummary extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly kind: ApprovalRiskKind;
  readonly severity: "info" | "low" | "medium" | "high" | "critical";
  readonly title: string;
  readonly detail: string;
  readonly reasonCodes: readonly string[];
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
  readonly metadata: JsonObject;
}

export interface ApprovalRenderSummary extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly title: string;
  readonly subject: string;
  readonly action: string;
  readonly resource: string;
  readonly capability?: string;
  readonly targetKind: ApprovalTargetKind;
  readonly targetLabel: string;
  readonly riskSummaries: readonly ApprovalRiskSummary[];
  readonly allowedDecisions: readonly ApprovalDecisionKind[];
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
  readonly metadata: JsonObject;
}

export interface ApprovalRequest extends PolicyRequest {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly approvalId: ApprovalId;
  readonly prompt: string;
  readonly decisionOptions: readonly ApprovalDecisionKind[];
  readonly summary: ApprovalRenderSummary;
  readonly auditReference: ApprovalAuditReference;
  readonly trace: TraceContext;
  readonly sessionId?: SessionId;
  readonly compatibility: CompatibilityMetadata;
}

export interface ApprovalBrokerRequest extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly request: ApprovalRequest;
  readonly mode: "interactive" | "headless" | "scripted" | "remote" | "test";
  readonly timeoutMs?: number;
  readonly redaction: RedactionMetadata;
}

export interface ApprovalDecision extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly approvalId: ApprovalId;
  readonly approved: boolean;
  readonly decision: ApprovalDecisionKind;
  readonly source: ApprovalDecisionSource;
  readonly reason: string;
  readonly reasonCode: string;
  readonly auditReference: ApprovalAuditReference;
  readonly trace: TraceContext;
  readonly redaction: RedactionMetadata;
  readonly metadata: JsonObject;
}

export type ApprovalBrokerResult = ApprovalDecision;

export interface ApprovalLifecycleRecord extends JsonObject {
  readonly schemaVersion: typeof APPROVAL_SCHEMA_VERSION;
  readonly kind:
    | "approval.required"
    | "approval.decided"
    | "approval.denied"
    | "approval.timeout"
    | "approval.cancelled"
    | "approval.audit-linked";
  readonly approvalId: ApprovalId;
  readonly sessionId?: SessionId;
  readonly trace: TraceContext;
  readonly summary: ApprovalRenderSummary;
  readonly decision?: ApprovalDecision;
  readonly auditReference: ApprovalAuditReference;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ApprovalBroker {
  requestApproval(request: ApprovalRequest): Promise<ApprovalDecision>;
}
