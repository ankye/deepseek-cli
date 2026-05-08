import type { JsonObject } from "./common.js";
import type { AuditId } from "./ids.js";

export type PolicyAction = "allow" | "ask" | "deny" | "rewrite" | "require-sandbox" | "quarantine";

export interface PolicyRequest {
  readonly subject: string;
  readonly action: string;
  readonly resource: string;
  readonly metadata: JsonObject;
}

export interface PolicyDecision {
  readonly action: PolicyAction;
  readonly reason: string;
  readonly rewritten?: JsonObject;
  readonly audit?: JsonObject;
  readonly sandboxProfile?: string;
}

export interface ApprovalRequest extends PolicyRequest {
  readonly prompt: string;
}

export interface ApprovalDecision {
  readonly approved: boolean;
  readonly reason: string;
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

export interface ApprovalBroker {
  requestApproval(request: ApprovalRequest): Promise<ApprovalDecision>;
}

export interface SandboxRuntime {
  run(request: SandboxRequest): AsyncIterable<SandboxEvent>;
}
