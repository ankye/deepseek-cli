import type { AgentLoopBudget, AgentLoopRequest, AgentModeSessionSummary, AgentPhasePlan, AgentVerifierResult, AgentVerifierVerdict, AgentWorkOrderTarget, JsonObject, RedactedError, RuntimeDependencies, RuntimeEvent, SessionId, TraceContext, TurnId } from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { stableHash } from "../trace.js";

export interface VerifierPolicyResult {
  readonly verdict: AgentVerifierResult;
  readonly verificationBudget?: AgentLoopBudget;
  readonly repairBudget?: AgentLoopBudget;
  readonly repairEvents: readonly JsonObject[];
  readonly reconciliation: JsonObject;
  readonly terminalStatus: "completed" | "failed";
  readonly diagnostics: readonly RedactedError[];
}

export async function evaluateVerifierPolicy(input: {
  readonly deps: RuntimeDependencies;
  readonly request: AgentLoopRequest;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly trace: TraceContext;
  readonly phasePlan: AgentPhasePlan;
  readonly modeSummary: AgentModeSessionSummary;
  readonly assistantText: string;
  readonly toolEvents: readonly RuntimeEvent[];
  readonly existingDiagnostics: readonly RedactedError[];
  readonly iteration: number;
}): Promise<VerifierPolicyResult | undefined> {
  const verifyPhase = input.phasePlan.phases.find((phase) => phase.phase === "verify");
  if (!verifyPhase?.required) return undefined;
  const baseVerificationBudget = input.phasePlan.budgets.find((budget) => budget.kind === "verification");
  const baseRepairBudget = input.phasePlan.budgets.find((budget) => budget.kind === "repair");
  const verifierVerdict = await createRuntimeVerifierResult({
    deps: input.deps,
    request: input.request,
    sessionId: input.sessionId,
    trace: input.trace,
    assistantText: input.assistantText,
    toolEvents: input.toolEvents,
    existingDiagnostics: input.existingDiagnostics
  });
  const repairNeeded = verifierVerdict.verdict === "fail";
  const repairAllowed = (baseRepairBudget?.allowed ?? 0) > 0;
  const repairConsumed = repairNeeded && repairAllowed ? 1 : 0;
  const repairBudget = baseRepairBudget ? budgetWith(baseRepairBudget, repairConsumed, repairNeeded && !repairAllowed ? "repair-budget-unavailable" : undefined) : undefined;
  const verificationBudget = baseVerificationBudget ? budgetWith(baseVerificationBudget, 1) : undefined;
  const repairEvents = repairNeeded
    ? [
        {
          schemaVersion: AGENT_MODE_SCHEMA_VERSION,
          repairAttemptId: `agent-repair:${stableHash(`${input.sessionId}:${input.turnId}:${verifierVerdict.verifierResultId}`)}`,
          sessionId: input.sessionId,
          turnId: input.turnId,
          verifierResultId: verifierVerdict.verifierResultId,
          status: repairAllowed ? "attempted" : "skipped",
          reason: repairAllowed ? "verifier-failed" : "repair-budget-unavailable",
          budget: repairBudget,
          diagnostics: verifierVerdict.diagnostics,
          trace: input.trace,
          redaction: { class: "internal" },
          compatibility: AGENT_MODE_COMPATIBILITY
        }
      ]
    : [];
  const terminalStatus = verifierVerdict.verdict === "fail" && !repairAllowed ? "failed" : "completed";
  const reconciliation = {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    reconciliationId: `agent-reconciliation:${stableHash(`${input.sessionId}:${input.turnId}:${verifierVerdict.verdict}`)}`,
    sessionId: input.sessionId,
    turnId: input.turnId,
    status: verifierVerdict.verdict,
    terminalStatus,
    verifierResultId: verifierVerdict.verifierResultId,
    workerResultCount: input.modeSummary.workerResults.length,
    repairAttemptCount: repairEvents.length,
    summary: reconciliationSummary(verifierVerdict.verdict, repairEvents.length, terminalStatus),
    diagnostics: verifierVerdict.diagnostics,
    trace: input.trace,
    redaction: { class: "internal", fields: ["summary", "diagnostics.details"] },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
  return {
    verdict: verifierVerdict,
    ...(verificationBudget ? { verificationBudget } : {}),
    ...(repairBudget ? { repairBudget } : {}),
    repairEvents,
    reconciliation,
    terminalStatus,
    diagnostics: verifierVerdict.diagnostics
  };
}

export function createPendingVerifierResult(input: {
  readonly sessionId: SessionId;
  readonly checkedTargets?: readonly AgentWorkOrderTarget[];
  readonly summary?: string;
  readonly trace: TraceContext;
}): AgentVerifierResult {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    verifierResultId: `agent-verifier:${stableHash(`${input.sessionId}:${input.summary ?? "pending"}`)}`,
    verdict: "partial",
    sessionId: input.sessionId,
    checkedTargets: input.checkedTargets ?? [],
    commandEvidenceIds: [],
    evidenceIds: [],
    unverifiedAreas: ["verifier-execution-not-yet-wired"],
    summary: input.summary ?? "Verification is required by policy but verifier execution has not been wired yet.",
    diagnostics: [diagnostic("VERIFIER_POLICY_PENDING", "Verifier result is partial until runtime verifier execution is integrated.")],
    trace: input.trace,
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

async function createRuntimeVerifierResult(input: {
  readonly deps: RuntimeDependencies;
  readonly request: AgentLoopRequest;
  readonly sessionId: SessionId;
  readonly trace: TraceContext;
  readonly assistantText: string;
  readonly toolEvents: readonly RuntimeEvent[];
  readonly existingDiagnostics: readonly RedactedError[];
}): Promise<AgentVerifierResult> {
  const toolFailures = input.toolEvents.filter((event) => (event.kind === "model.tool.result" || event.kind === "capability.failed" || event.kind === "execution.rejected") && event.error);
  const commandEvidenceIds = input.toolEvents
    .filter((event) => event.kind === "model.tool.result")
    .map((event, index) => `command:${String(event.data.toolName ?? "tool")}:${index}`);
  const evidenceIds = input.toolEvents
    .filter((event) => event.kind === "model.tool.result" && typeof event.data.evidence === "object")
    .map((event, index) => {
      const evidence = event.data.evidence as { replayHash?: unknown; toolCallId?: unknown };
      return typeof evidence.replayHash === "string" ? `tool-evidence:${evidence.replayHash}` : `tool-evidence:${String(evidence.toolCallId ?? index)}`;
    });
  const liveVerification = await input.deps.models.verify?.({
    profile: input.request.profile,
    ...(input.request.credentialRef ? { credentialRef: input.request.credentialRef } : {}),
    prompt: verifierPrompt(input.request.prompt, input.assistantText),
    ...(input.request.timeoutMs ? { timeoutMs: input.request.timeoutMs } : {})
  }).catch((error: unknown) => ({
    ok: false,
    provider: { provider: String(input.request.profile.providerId), protocol: "openai-chat-completions" as const, model: input.request.profile.model },
    reachable: false,
    terminalStatus: "failed" as const,
    eventKinds: [],
    diagnostics: [diagnostic("VERIFIER_MODEL_FAILED", error instanceof Error ? error.message : "Verifier model check failed.")],
    redaction: { class: "internal" as const }
  }));
  const verdict = verifierVerdict({
    toolFailureCount: toolFailures.length,
    commandEvidenceCount: commandEvidenceIds.length,
    diagnosticCount: input.existingDiagnostics.length,
    ...(liveVerification ? { liveOk: liveVerification.ok } : {})
  });
  const diagnostics = [
    ...input.existingDiagnostics,
    ...toolFailures.map((event) => event.error).filter((error): error is RedactedError => Boolean(error)),
    ...(liveVerification?.diagnostics ?? []),
    ...(verdict === "partial" ? [diagnostic("VERIFIER_PARTIAL_EVIDENCE", "Non-trivial task has no independent command evidence; result is partial rather than an unqualified pass.")] : []),
    ...(verdict === "fail" ? [diagnostic("VERIFIER_FAILED", "Verifier found failed tool, model, or runtime evidence.")] : [])
  ];
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    verifierResultId: `agent-verifier:${stableHash(`${input.sessionId}:${input.request.prompt}:${verdict}:${commandEvidenceIds.join(",")}`)}`,
    verdict,
    sessionId: input.sessionId,
    checkedTargets: checkedTargetsFor(input.request),
    commandEvidenceIds,
    evidenceIds,
    unverifiedAreas: verdict === "pass" ? [] : ["independent-verifier-agent"],
    summary: verifierSummary(verdict, commandEvidenceIds.length, evidenceIds.length),
    diagnostics,
    trace: input.trace,
    redaction: { class: "internal", fields: ["summary", "diagnostics.details"] },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function verifierVerdict(input: {
  readonly toolFailureCount: number;
  readonly commandEvidenceCount: number;
  readonly liveOk?: boolean;
  readonly diagnosticCount: number;
}): AgentVerifierVerdict {
  if (input.toolFailureCount > 0 || input.liveOk === false) return "fail";
  if (input.commandEvidenceCount > 0) return "pass";
  return "partial";
}

function checkedTargetsFor(request: AgentLoopRequest): readonly AgentWorkOrderTarget[] {
  const targets: AgentWorkOrderTarget[] = [];
  if (request.referenceContext) {
    for (const set of request.referenceContext.sets) {
      for (const item of set.items) {
        targets.push({ kind: item.target.kind, id: item.target.id, label: item.label, metadata: { source: "reference-context" } });
      }
    }
  }
  return targets.length > 0 ? targets : [{ kind: "workspace", id: "workspace:current", path: request.workspaceRoot, label: "Current workspace" }];
}

function verifierPrompt(userPrompt: string, assistantText: string): string {
  return [
    "Verify whether the assistant output is externally supported.",
    `User task: ${userPrompt}`,
    `Assistant output preview: ${assistantText.slice(0, 1000)}`,
    "Return evidence-backed pass/fail/partial observations."
  ].join("\n");
}

function verifierSummary(verdict: AgentVerifierVerdict, commandEvidenceCount: number, evidenceCount: number): string {
  if (verdict === "pass") return `Independent verification passed with ${commandEvidenceCount} command references and ${evidenceCount} evidence references.`;
  if (verdict === "fail") return "Independent verification failed; repair or user-visible partial status is required.";
  return "Verification is partial because no independent command evidence was recorded.";
}

function reconciliationSummary(verdict: AgentVerifierVerdict, repairAttemptCount: number, terminalStatus: "completed" | "failed"): string {
  if (terminalStatus === "failed") return "Final result failed because verifier failure could not enter repair under the current budget.";
  if (repairAttemptCount > 0) return "Final result is partial after verifier failure and governed repair attempt recording.";
  if (verdict === "pass") return "Final result reconciled as pass with verifier evidence.";
  return "Final result reconciled as partial; completion is not overstated as verified success.";
}

function budgetWith(budget: AgentLoopBudget, consumed: number, stopReason?: string): AgentLoopBudget {
  return {
    ...budget,
    consumed,
    remaining: Math.max(0, budget.allowed - consumed),
    ...(stopReason ? { stopReason } : {})
  };
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal" }
  };
}
