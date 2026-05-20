import type { JsonObject } from "./common.js";
import type { AuditId } from "./ids.js";
import type { PlatformExecutionContext } from "./platform.js";
import type { ResourceScope, SandboxAuditEvidence, SandboxDecision, SandboxRequirement, SecretRedactionDecision } from "./security.js";
import type { ApprovalLifecycleRecord, ApprovalRenderSummary, ApprovalRequest } from "./approval.js";
export type { ApprovalBroker, ApprovalBrokerRequest, ApprovalBrokerResult, ApprovalDecision, ApprovalRequest } from "./approval.js";

export const POLICY_GATE_SCHEMA_VERSION = "1.0.0";

export type PolicyAction = "allow" | "ask" | "deny" | "rewrite" | "require-sandbox" | "quarantine";
export type RiskyOperationFamily = "file" | "shell" | "mcp" | "plugin" | "credential" | "remote" | "sandbox" | "workspace-mutation";
export type PolicyGateDecision = "allow" | "deny" | "prompt" | "redact" | "audit-only" | "require-sandbox" | "quarantine" | "bypass-detected";
export type PolicyGateReplayBehavior = "deterministic" | "redacted-replay" | "audit-only" | "fail-closed";
export type PolicyGateCoverageStatus = "covered" | "missing" | "bypass-risk" | "deferred";
export type PolicyGateSeverity = "info" | "warning" | "release-blocking";

export interface RiskyOperationTaxonomyEntry extends JsonObject {
  readonly schemaVersion: string;
  readonly family: RiskyOperationFamily;
  readonly operationId: string;
  readonly examples: readonly string[];
  readonly requiredDecision: "mandatory" | "audit-only";
  readonly ownerPackage: string;
  readonly releaseGate: "release-blocking" | "deferred" | "not-product-ready";
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface PolicyDecisionRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly recordId: string;
  readonly actor: string;
  readonly operation: string;
  readonly operationFamily: RiskyOperationFamily;
  readonly scope: ResourceScope;
  readonly decision: PolicyGateDecision;
  readonly reason: string;
  readonly reasonCodes: readonly string[];
  readonly auditId: AuditId;
  readonly replayBehavior: PolicyGateReplayBehavior;
  readonly sandboxProfile?: string;
  readonly bypassAttempted: boolean;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface PolicyGateDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: PolicyGateSeverity;
  readonly operationId: string;
  readonly operationFamily: RiskyOperationFamily;
  readonly message: string;
  readonly releaseBlocking: boolean;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface PolicyGateCoverageRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly operationId: string;
  readonly operationFamily: RiskyOperationFamily;
  readonly ownerPackage: string;
  readonly entrypoints: readonly string[];
  readonly coverage: PolicyGateCoverageStatus;
  readonly releaseGate: PolicyGateSeverity;
  readonly evidenceIds: readonly string[];
  readonly diagnostics: readonly PolicyGateDiagnostic[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export const RISKY_OPERATION_TAXONOMY: readonly RiskyOperationTaxonomyEntry[] = [
  riskyOperation("file", "file.mutation", ["core.file.write", "checkpoint.restore"], "mandatory", "core-coding-tools", "release-blocking"),
  riskyOperation("shell", "shell.execution", ["core.shell.run", "core.test.run", "dev-checks"], "mandatory", "core-coding-tools", "release-blocking"),
  riskyOperation("mcp", "mcp.invocation", ["mcp.tool.call", "mcp.resource.read"], "mandatory", "mcp-gateway", "release-blocking"),
  riskyOperation("plugin", "plugin.execution", ["plugin.command", "plugin.lifecycle", "module.contribution.invoke"], "mandatory", "plugin-system", "release-blocking"),
  riskyOperation("credential", "credential.access", ["credentialRef", "secure-storage"], "mandatory", "credential-auth-management", "release-blocking"),
  riskyOperation("remote", "remote.operation", ["remote-runtime-connectivity"], "mandatory", "remote-runtime-connectivity", "not-product-ready"),
  riskyOperation("sandbox", "sandbox.selection", ["sandbox.profile", "platform-capability"], "mandatory", "policy-sandbox", "release-blocking"),
  riskyOperation("workspace-mutation", "workspace.mutation", ["workspace.edit", "session.checkpoint"], "mandatory", "workspace-state-management", "release-blocking")
];

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
  readonly record?: PolicyDecisionRecord;
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

function riskyOperation(
  family: RiskyOperationFamily,
  operationId: string,
  examples: readonly string[],
  requiredDecision: RiskyOperationTaxonomyEntry["requiredDecision"],
  ownerPackage: string,
  releaseGate: RiskyOperationTaxonomyEntry["releaseGate"]
): RiskyOperationTaxonomyEntry {
  return {
    schemaVersion: POLICY_GATE_SCHEMA_VERSION,
    family,
    operationId,
    examples,
    requiredDecision,
    ownerPackage,
    releaseGate,
    redaction: { class: "internal", fields: ["examples"] }
  };
}
