import type {
  AgentLoopRequest,
  AgentModeSessionSummary,
  AgentPhasePlan,
  RedactedError,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { evaluateVerifierPolicy } from "./modes/verifier-policy.js";

export interface FinalVerificationInput {
  readonly deps: RuntimeDependencies;
  readonly request: AgentLoopRequest;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly trace: TraceContext;
  readonly phasePlan?: AgentPhasePlan;
  readonly modeSummary?: AgentModeSessionSummary;
  readonly assistantText: string;
  readonly toolEvents: readonly RuntimeEvent[];
  readonly diagnostics: RedactedError[];
  readonly iteration: number;
}

export interface FinalVerificationResult {
  readonly modeSummary?: AgentModeSessionSummary;
  readonly terminalStatus: "completed" | "failed";
  readonly events: readonly RuntimeEvent[];
}

export async function runFinalVerification(input: FinalVerificationInput): Promise<FinalVerificationResult> {
  if (!input.phasePlan || !input.modeSummary) {
    return {
      ...(input.modeSummary ? { modeSummary: input.modeSummary } : {}),
      terminalStatus: "completed",
      events: []
    };
  }
  const verifierPolicy = await evaluateVerifierPolicy({
    deps: input.deps,
    request: input.request,
    sessionId: input.sessionId,
    turnId: input.turnId,
    trace: input.trace,
    phasePlan: input.phasePlan,
    modeSummary: input.modeSummary,
    assistantText: input.assistantText,
    toolEvents: input.toolEvents,
    existingDiagnostics: input.diagnostics,
    iteration: input.iteration
  });
  if (!verifierPolicy) return { modeSummary: input.modeSummary, terminalStatus: "completed", events: [] };

  input.diagnostics.push(...verifierPolicy.diagnostics);
  const modeSummary = {
    ...input.modeSummary,
    budgets: input.modeSummary.budgets.map((budget) => {
      if (budget.kind === "verification" && verifierPolicy.verificationBudget) return verifierPolicy.verificationBudget;
      if (budget.kind === "repair" && verifierPolicy.repairBudget) return verifierPolicy.repairBudget;
      return budget;
    }),
    verifierResults: [...input.modeSummary.verifierResults, verifierPolicy.verdict]
  };
  const events: RuntimeEvent[] = [];
  await appendEvent(events, input, "agent.verifier.verdict", verifierPolicy.verdict);
  if (verifierPolicy.verificationBudget) await appendEvent(events, input, "agent.loop.budget.consumed", verifierPolicy.verificationBudget);
  if (verifierPolicy.repairBudget?.consumed) await appendEvent(events, input, "agent.loop.budget.consumed", verifierPolicy.repairBudget);
  for (const repair of verifierPolicy.repairEvents) {
    await appendEvent(events, input, "agent.repair.attempted", repair);
    if (repair.status === "attempted") {
      await appendEvent(events, input, "agent.repair.rerun", {
        schemaVersion: "1.0.0",
        sessionId: input.sessionId,
        turnId: input.turnId,
        verifierResultId: verifierPolicy.verdict.verifierResultId,
        status: "deferred",
        reason: "repair-rerun-recorded-for-replay",
        trace: input.trace,
        redaction: { class: "internal" }
      });
    }
  }
  await appendEvent(events, input, "agent.result.reconciled", verifierPolicy.reconciliation);
  return { modeSummary, terminalStatus: verifierPolicy.terminalStatus, events };
}

async function appendEvent(
  events: RuntimeEvent[],
  input: FinalVerificationInput,
  kind: RuntimeEvent["kind"],
  data: RuntimeEvent["data"]
): Promise<void> {
  const event = agentLoopEvent(kind, input.sessionId, input.turnId, input.trace, data, input.request.agentId);
  await recordRuntimeAdapterEvent(input.deps, event);
  events.push(event);
}
