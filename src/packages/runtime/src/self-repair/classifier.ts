import type {
  RedactedError,
  RuntimeEvent,
  SelfRepairAffectedScope,
  SelfRepairFailureClassification,
  SelfRepairFailureSource,
  SelfRepairRepairability,
  SelfRepairSafetyClass,
  TraceContext
} from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { diagnosticFingerprint, eventFingerprint, stableHash } from "./helpers.js";

export interface SelfRepairFailureInput {
  readonly terminalKind: string;
  readonly error?: RedactedError;
  readonly event?: RuntimeEvent;
  readonly trace: TraceContext;
  readonly evidenceFingerprint?: string;
}

export function classifyRepairFailure(input: SelfRepairFailureInput): SelfRepairFailureClassification {
  const failureSource = failureSourceFor(input);
  const repairability = repairabilityFor(input, failureSource);
  const safetyClass = safetyClassFor(input, failureSource);
  const affectedScope = affectedScopeFor(input, failureSource);
  const evidence = input.evidenceFingerprint ?? (input.event ? eventFingerprint(input.event, input.terminalKind) : diagnosticFingerprint(input.error, input.terminalKind));
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    classificationId: `repair-classification:${stableHash(`${input.terminalKind}:${input.error?.code ?? ""}:${evidence}`)}`,
    failureSource,
    status: "classified",
    repairability,
    safetyClass,
    affectedScope,
    severity: input.error ? "error" : "warn",
    evidenceFingerprints: [evidence],
    diagnostics: input.error ? [input.error] : [],
    trace: input.trace,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["diagnostics.details", "evidenceFingerprints"] }
  };
}

function failureSourceFor(input: SelfRepairFailureInput): SelfRepairFailureSource {
  const code = input.error?.code ?? "";
  const terminal = input.terminalKind;
  if (code.includes("TYPECHECK") || code.includes("LINT") || code.includes("TEST") || code.includes("BUILD")) return "build-test-error";
  if (code.includes("ARTIFACT") || code.includes("WEBPAGE") || code.includes("EVIDENCE")) return "task-output-error";
  if (terminal.includes("verifier") || terminal.includes("verification") || code.includes("VERIFIER")) return "task-output-error";
  if (code.includes("WORKSPACE") || code.includes("CHECKPOINT") || code.includes("PATH")) return "workspace-error";
  if (code.startsWith("MODEL_") || terminal === "runtime.error") return "provider-error";
  if (terminal.includes("tool") || terminal.includes("capability") || terminal === "execution.rejected" || code.startsWith("TOOL_") || code.startsWith("KERNEL_CAPABILITY")) return "tool-error";
  return "agent-strategy-error";
}

function repairabilityFor(input: SelfRepairFailureInput, source: SelfRepairFailureSource): SelfRepairRepairability {
  const code = input.error?.code ?? "";
  if (code.includes("POLICY_DENIED") || code.includes("HOOK_BLOCKED")) return "needs-user";
  if (code.includes("CANCELLED") || code.includes("MISSING_CREDENTIAL")) return "not-repairable";
  if (source === "tool-error" || source === "task-output-error" || source === "build-test-error" || source === "agent-strategy-error") return "repairable";
  if (source === "provider-error") return input.error?.retryable ? "repairable" : "unknown";
  return "unknown";
}

function safetyClassFor(input: SelfRepairFailureInput, source: SelfRepairFailureSource): SelfRepairSafetyClass {
  const code = input.error?.code ?? "";
  if (code.includes("POLICY_DENIED")) return "requires-approval";
  if (source === "workspace-error" || source === "build-test-error" || source === "task-output-error") return "safe-write";
  if (source === "tool-error" || source === "provider-error") return "safe-read";
  return "safe-read";
}

function affectedScopeFor(input: SelfRepairFailureInput, source: SelfRepairFailureSource): SelfRepairAffectedScope {
  if (source === "provider-error") return "model";
  if (source === "tool-error") return "tool";
  if (source === "workspace-error") return "workspace";
  if (source === "build-test-error") return "test";
  if (source === "task-output-error") return "artifact";
  return input.terminalKind.includes("architecture") ? "architecture" : "unknown";
}
