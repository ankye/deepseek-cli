import type { AgentLoopBudget, JsonObject, SessionForkResult, SessionResumeResult } from "@deepseek/platform-contracts";
import type { CliOptions, CliRunOptions } from "../types.js";
import { resolveSessionDependencies } from "../host/runtime.js";

export async function runSessionCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const deps = await resolveSessionDependencies(runOptions);
  let result: { ok: boolean; value?: SessionResumeResult | SessionForkResult; error?: JsonObject };
  if (options.sessionAction === "fork") {
    result = options.parentSessionId
      ? await deps.sessions.fork({ parentSessionId: options.parentSessionId, reason: "cli session fork" })
      : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "session fork requires a parent session id") };
  } else {
    result = options.sessionId
      ? await deps.sessions.resume(options.sessionId)
      : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "session resume requires a session id") };
  }
  if (options.output !== "text") {
    await write(JSON.stringify(result));
    return;
  }
  if (!result.ok || !result.value) {
    await write(`[session failed] ${String(result.error?.message ?? options.sessionAction ?? "session")}`);
    return;
  }
  if (isForkResult(result.value)) {
    for (const line of renderForkText(result.value)) await write(line);
    return;
  }
  for (const line of renderResumeText(result.value)) await write(line);
}

function cliSessionError(code: string, message: string): JsonObject {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

function isForkResult(value: SessionResumeResult | SessionForkResult): value is SessionForkResult {
  return typeof (value as { readonly childSessionId?: unknown }).childSessionId === "string";
}

function renderForkText(result: SessionForkResult): readonly string[] {
  const forkPoint = result.lineage.modeForkPoint;
  const phaseCount = forkPoint?.agentMode?.phaseStatuses.length ?? 0;
  const workerResultCount = forkPoint?.agentMode?.workerResults.length ?? 0;
  const verifierResultCount = forkPoint?.agentMode?.verifierResults.length ?? 0;
  const delegationCount = forkPoint?.agentMode?.delegationDecisions.length ?? 0;
  return [
    `forked ${result.parentSessionId} -> ${result.childSessionId}`,
    `  fork_point sequence=${result.forkPointSequence} inherited_events=${result.inheritedEventCount}`,
    `  mode interaction=${forkPoint?.interactionMode?.mode ?? "unknown"} agent=${forkPoint?.agentMode?.agentMode ?? "unknown"} phase_plan=${forkPoint?.agentMode?.phasePlanId ?? "none"}`,
    `  active_workers policy=${forkPoint?.activeWorkerPolicy ?? "detach"} worker_results=${workerResultCount} delegation_lineage=${delegationCount}`,
    `  phase_summary phases=${phaseCount} budgets=${budgetText(forkPoint?.agentMode?.budgets ?? [])} verifier_results=${verifierResultCount}`
  ];
}

function renderResumeText(result: SessionResumeResult): readonly string[] {
  const mode = result.mode;
  return [
    `resumed ${result.sessionId} (${result.eventCount} events)`,
    `  mode interaction=${mode?.interactionMode?.mode ?? "unknown"} agent=${mode?.agentMode?.agentMode ?? "unknown"} phase_plan=${mode?.agentMode?.phasePlanId ?? "none"}`,
    `  replay budgets=${budgetText(mode?.agentMode?.budgets ?? [])} reasoning_effort=${mode?.agentMode?.reasoningEffort?.providerEffort ?? "none"}`
  ];
}

function budgetText(budgets: readonly AgentLoopBudget[]): string {
  if (budgets.length === 0) return "none";
  return budgets.map((budget) => `${budget.kind}=${budget.consumed}/${budget.allowed}`).join(",");
}
