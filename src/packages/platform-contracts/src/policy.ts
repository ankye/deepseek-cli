import type { JsonObject } from "./common.js";
import type { AuditId } from "./ids.js";
import type { PlatformExecutionContext } from "./platform.js";
import type { ResourceScope, SandboxAuditEvidence, SandboxDecision, SandboxRequirement, SecretRedactionDecision } from "./security.js";
import type { ApprovalLifecycleRecord, ApprovalRenderSummary, ApprovalRequest } from "./approval.js";
export type { ApprovalBroker, ApprovalBrokerRequest, ApprovalBrokerResult, ApprovalDecision, ApprovalRequest } from "./approval.js";

export type PolicyAction = "allow" | "ask" | "deny" | "rewrite" | "require-sandbox" | "quarantine";

export interface PolicyRequest extends JsonObject {
  readonly subject: string;
  readonly action: string;
  readonly resource: string;
  readonly metadata: JsonObject;
  readonly platform?: PlatformExecutionContext;
  readonly secret?: SecretRedactionDecision;
  readonly resourceScope?: ResourceScope;
  readonly sandbox?: SandboxRequirement;
  readonly auditEvidence?: SandboxAuditEvidence;
}

export interface PolicyDecision {
  readonly action: PolicyAction;
  readonly reason: string;
  readonly rewritten?: JsonObject;
  readonly audit?: JsonObject;
  readonly sandboxProfile?: string;
  readonly secret?: SecretRedactionDecision;
  readonly sandbox?: SandboxDecision;
  readonly auditEvidence?: SandboxAuditEvidence;
  readonly approval?: ApprovalLifecycleRecord;
  readonly approvalRequest?: ApprovalRequest;
  readonly approvalSummary?: ApprovalRenderSummary;
}

export interface AuditRecord {
  readonly id: AuditId;
  readonly at: string;
  readonly kind: string;
  readonly metadata: JsonObject;
}

export interface SandboxRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly controls: readonly string[];
}

export interface SandboxEvent {
  readonly kind: "recorded" | "started" | "completed" | "blocked";
  readonly mode: "development" | "enforced";
  readonly metadata: JsonObject;
}

export interface PolicyEngine {
  decide(request: PolicyRequest): Promise<PolicyDecision>;
}

export interface SandboxRuntime {
  run(request: SandboxRequest): AsyncIterable<SandboxEvent>;
}
