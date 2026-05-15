import type {
  AgentLoopBudget,
  AgentModeBinding,
  AgentModeName,
  AgentPhasePlan,
  AgentPhasePlanItem,
  AgentReasoningEffortMapping,
  AgentVerifierResult,
  AgentWorkerLifecycleEvent,
  AgentWorkerResult,
  InteractionModeDegradationReason,
  InteractionModeName,
  InteractionModeState,
  InteractionModeTransition,
  JsonObject,
  RedactedError,
  RuntimeEvent,
  SessionModeMetadata,
  SessionId,
  TurnId
} from "@deepseek/platform-contracts";
import { INTERACTION_MODE_COMPATIBILITY, INTERACTION_MODE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { modeControlVisibilityProfiles } from "@deepseek/command-system";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import type { CliModeAction, CliOptions } from "../types.js";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";

export interface ChatModeControlState {
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly interactionMode: InteractionModeName;
  readonly agentMode: AgentModeName;
  readonly availableTransitions: readonly InteractionModeName[];
  readonly degradationReasons: readonly string[];
  readonly transitions: readonly InteractionModeTransition[];
  readonly agentBinding?: AgentModeBinding;
  readonly phasePlan?: AgentPhasePlan;
  readonly skippedPhases: readonly AgentPhasePlanItem[];
  readonly budgets: readonly AgentLoopBudget[];
  readonly workers: readonly AgentWorkerLifecycleEvent[];
  readonly workerResults: readonly AgentWorkerResult[];
  readonly verifierResults: readonly AgentVerifierResult[];
  readonly reasoningEffort?: AgentReasoningEffortMapping;
}

export type ChatModeControlCommand = "mode" | "agent" | "workers" | "verify" | "plan";

export function isChatModeControlCommand(value: string): value is ChatModeControlCommand {
  return value === "mode" || value === "agent" || value === "workers" || value === "verify" || value === "plan";
}

export function modeControlRequestedTransition(command: ChatModeControlCommand, raw: string): string | undefined {
  return command === "mode" ? raw.split(/\s+/).filter(Boolean)[0] : undefined;
}

export function createInitialChatModeControlState(sessionId?: SessionId): ChatModeControlState {
  return {
    ...(sessionId ? { sessionId } : {}),
    interactionMode: "chat",
    agentMode: "default",
    availableTransitions: ["chat", "headless", "one-shot", "result-list", "approval"],
    degradationReasons: [],
    transitions: [],
    skippedPhases: [],
    budgets: [],
    workers: [],
    workerResults: [],
    verifierResults: []
  };
}

export function updateChatModeControlState(
  previous: ChatModeControlState,
  events: readonly RuntimeEvent[]
): ChatModeControlState {
  let state = previous;
  for (const event of events) {
    state = updateFromEvent(state, event);
  }
  return state;
}

export function sessionModeResumeEvents(mode: SessionModeMetadata, sessionId: SessionId): readonly RuntimeEvent[] {
  const trace: RuntimeEvent["trace"] = {
    traceId: "trace-chat-resume-mode" as RuntimeEvent["trace"]["traceId"],
    spanId: "span-chat-resume-mode" as RuntimeEvent["trace"]["spanId"],
    correlationId: "corr-chat-resume-mode" as RuntimeEvent["trace"]["correlationId"]
  };
  const base = {
    sessionId,
    createdAt: new Date(0).toISOString(),
    trace
  };
  const hasInteractionTransitions = (mode.interactionTransitions?.length ?? 0) > 0;
  const restoredInteractionTransition = mode.interactionMode && !mode.interactionMode.degraded && !hasInteractionTransitions
    ? [{
        ...base,
        kind: "mode.interaction.changed" as const,
        data: {
          schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
          transitionId: `interaction-transition:resume:${sessionId}`,
          sessionId,
          previousMode: mode.interactionMode.previousMode ?? mode.interactionMode.mode,
          nextMode: mode.interactionMode.mode,
          reason: "resume-restore",
          initiator: "resume",
          at: new Date(0).toISOString(),
          diagnostics: [],
          redaction: { class: "internal" },
          compatibility: INTERACTION_MODE_COMPATIBILITY
        } satisfies InteractionModeTransition
      }]
    : [];
  return [
    ...(mode.interactionTransitions ?? []).map((transition) => ({ ...base, kind: "mode.interaction.changed" as const, data: transition })),
    ...restoredInteractionTransition,
    ...(mode.interactionMode?.degraded ? [{ ...base, kind: "mode.interaction.degraded" as const, data: mode.interactionMode }] : []),
    ...(mode.agentMode?.phaseStatuses.length ? [{
      ...base,
      kind: "agent.phase.plan.created" as const,
      data: {
        schemaVersion: mode.agentMode.schemaVersion,
        planId: mode.agentMode.phasePlanId ?? "restored",
        sessionId,
        interactionMode: mode.agentMode.interactionMode ?? mode.interactionMode?.mode ?? "chat",
        agentMode: mode.agentMode.agentMode ?? "default",
        phases: mode.agentMode.phaseStatuses,
        budgets: mode.agentMode.budgets,
        reason: "Restored from session mode metadata.",
        diagnostics: [],
        redaction: { class: "internal" },
        compatibility: mode.agentMode.compatibility
      }
    }] : []),
    ...(mode.agentMode?.workerResults ?? []).map((result) => ({ ...base, kind: "agent.worker.result" as const, data: result })),
    ...(mode.agentMode?.verifierResults ?? []).map((result) => ({ ...base, kind: "agent.verifier.verdict" as const, data: result })),
    ...(mode.agentMode?.reasoningEffort ? [{ ...base, kind: "model.reasoning.effort.mapped" as const, data: mode.agentMode.reasoningEffort }] : [])
  ];
}

export function sessionModeHostDegradationEvents(
  state: ChatModeControlState,
  terminalProfile: CliTerminalCapabilityProfile,
  output: CliOptions["output"]
): readonly RuntimeEvent[] {
  const reasons = unsupportedResumeReasons(state.interactionMode, terminalProfile, output);
  if (reasons.length === 0 || !state.sessionId) return [];
  const diagnostics = reasons.map((reason) => ({
    code: `CLI_RESUME_${reason.toUpperCase().replace(/-/g, "_")}`,
    message: `Restored interaction mode ${state.interactionMode} is unsupported by this CLI host profile: ${reason}.`,
    retryable: false,
    redaction: { class: "public" as const }
  }));
  return [{
    kind: "mode.interaction.degraded",
    sessionId: state.sessionId,
    createdAt: new Date(0).toISOString(),
    trace: {
      traceId: "trace-chat-resume-degraded" as RuntimeEvent["trace"]["traceId"],
      spanId: "span-chat-resume-degraded" as RuntimeEvent["trace"]["spanId"],
      correlationId: "corr-chat-resume-degraded" as RuntimeEvent["trace"]["correlationId"]
    },
    data: {
      schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
      sessionId: state.sessionId,
      mode: safeResumeMode(terminalProfile, output),
      previousMode: state.interactionMode,
      degraded: true,
      degradationReasons: reasons,
      availableTransitions: ["chat", "headless", "one-shot"],
      diagnostics,
      redaction: { class: "internal" },
      compatibility: INTERACTION_MODE_COMPATIBILITY
    } satisfies InteractionModeState
  }];
}

export function restoreChatModeControlState(
  initial: ChatModeControlState,
  mode: SessionModeMetadata,
  sessionId: SessionId,
  terminalProfile: CliTerminalCapabilityProfile,
  output: CliOptions["output"]
): { readonly state: ChatModeControlState; readonly degradationEvents: readonly RuntimeEvent[] } {
  const restored = updateChatModeControlState(initial, sessionModeResumeEvents(mode, sessionId));
  const degradationEvents = sessionModeHostDegradationEvents(restored, terminalProfile, output);
  return {
    state: updateChatModeControlState(restored, degradationEvents),
    degradationEvents
  };
}

export function renderChatModeControl(
  command: ChatModeControlCommand,
  state: ChatModeControlState,
  output: CliOptions["output"],
  input: { readonly requestedTransition?: string } = {}
): readonly string[] {
  const unsupported = unsupportedTransition(input.requestedTransition, state);
  if (unsupported) {
    return renderRecords(output, [{
      kind: "mode.transition.unsupported",
      command,
      requestedTransition: input.requestedTransition ?? "",
      preservedMode: state.interactionMode,
      code: "CLI_MODE_TRANSITION_UNSUPPORTED",
      redaction: { class: "public" }
    }], [
      `[chat] mode transition unsupported: ${input.requestedTransition ?? ""} (current=${state.interactionMode})`
    ]);
  }
  switch (command) {
    case "mode":
      return renderModeStatus(state, output);
    case "agent":
      return renderAgentStatus(state, output);
    case "workers":
      return renderWorkerStatus(state, output);
    case "verify":
      return renderVerifyStatus(state, output);
    case "plan":
      return renderPlanStatus(state, output);
  }
}

export function renderScriptableModeControl(options: Pick<CliOptions, "modeAction" | "modeRequestedTransition" | "output" | "sessionId">): readonly string[] {
  const state = createInitialChatModeControlState(options.sessionId);
  const command = modeActionCommand(options.modeAction);
  return renderChatModeControl(command, state, options.output, {
    ...(options.modeRequestedTransition ? { requestedTransition: options.modeRequestedTransition } : {})
  });
}

export function renderChatModelStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const mapping = state.reasoningEffort;
  const support = {
    providerReasoning: true,
    providerThinking: true,
    source: "deepseek-openai-compatible-profile"
  };
  const record = {
    kind: "model.status",
    model: mapping?.model ?? defaultDeepSeekProfile.model,
    provider: mapping?.provider ?? String(defaultDeepSeekProfile.providerId),
    reasoningSupport: support,
    requestedEffort: mapping?.requestedEffort ?? "none",
    providerMappedEffort: mapping?.providerEffort ?? "none",
    mapped: mapping?.mapped ?? false,
    supported: mapping?.supported ?? true,
    disabledReason: mapping?.supported === false ? mapping.reason ?? "unsupported" : undefined,
    evidenceLoops: budgetCount(state.budgets, "evidence"),
    verificationLoops: budgetCount(state.budgets, "verification"),
    repairAttempts: budgetCount(state.budgets, "repair"),
    delegationFanOut: budgetCount(state.budgets, "delegation"),
    redaction: { class: "internal" }
  };
  return renderRecords(output, [record], [
    `[chat] model=${record.model} provider=${record.provider}`,
    `  reasoning_support provider=true thinking=true requested=${record.requestedEffort} mapped=${record.providerMappedEffort} disabled_reason=${record.disabledReason ?? "none"}`,
    `  orchestration evidence_loops=${record.evidenceLoops.consumed}/${record.evidenceLoops.allowed} verification_loops=${record.verificationLoops.consumed}/${record.verificationLoops.allowed} repair=${record.repairAttempts.consumed}/${record.repairAttempts.allowed} delegation=${record.delegationFanOut.consumed}/${record.delegationFanOut.allowed}`
  ]);
}

export function renderChatCostStatus(
  usage: { readonly inputTokens: number; readonly outputTokens: number; readonly elapsedMs: number },
  output: CliOptions["output"]
): readonly string[] {
  const record = {
    kind: "cost.status",
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    elapsedMs: usage.elapsedMs,
    redaction: { class: "internal" }
  };
  return renderRecords(output, [record], [`[chat] tokens in=${usage.inputTokens} out=${usage.outputTokens} elapsed_ms=${usage.elapsedMs}`]);
}

function updateFromEvent(state: ChatModeControlState, event: RuntimeEvent): ChatModeControlState {
  const sessionFields = {
    sessionId: event.sessionId ?? state.sessionId,
    ...(event.turnId ? { turnId: event.turnId } : state.turnId ? { turnId: state.turnId } : {})
  };
  if (event.kind === "mode.interaction.changed") {
    const transition = event.data as unknown as InteractionModeTransition;
    return {
      ...state,
      ...sessionFields,
      interactionMode: transition.nextMode ?? state.interactionMode,
      transitions: [...state.transitions, transition]
    };
  }
  if (event.kind === "mode.interaction.degraded") {
    const data = event.data as { degradationReasons?: readonly string[]; diagnostics?: readonly RedactedError[]; mode?: InteractionModeName };
    return {
      ...state,
      ...sessionFields,
      ...(data.mode ? { interactionMode: data.mode } : {}),
      degradationReasons: [...new Set([...state.degradationReasons, ...(data.degradationReasons ?? [])])]
    };
  }
  if (event.kind === "mode.agent.bound") {
    const binding = event.data as unknown as AgentModeBinding;
    return {
      ...state,
      ...sessionFields,
      agentMode: binding.mode,
      agentBinding: binding
    };
  }
  if (event.kind === "agent.phase.plan.created") {
    const phasePlan = event.data as unknown as AgentPhasePlan;
    return {
      ...state,
      ...sessionFields,
      interactionMode: phasePlan.interactionMode,
      agentMode: phasePlan.agentMode,
      phasePlan,
      budgets: phasePlan.budgets
    };
  }
  if (event.kind === "agent.phase.skipped") {
    return {
      ...state,
      ...sessionFields,
      skippedPhases: upsertBy(state.skippedPhases, event.data as unknown as AgentPhasePlanItem, (item) => item.phase)
    };
  }
  if (event.kind === "agent.loop.budget.consumed") {
    return {
      ...state,
      ...sessionFields,
      budgets: upsertBy(state.budgets, event.data as unknown as AgentLoopBudget, (item) => item.kind)
    };
  }
  if (event.kind === "agent.worker.launched" || event.kind === "agent.worker.continued" || event.kind === "agent.worker.stopped") {
    return {
      ...state,
      ...sessionFields,
      workers: upsertBy(state.workers, event.data as unknown as AgentWorkerLifecycleEvent, (item) => item.workerEventId)
    };
  }
  if (event.kind === "agent.worker.result") {
    return {
      ...state,
      ...sessionFields,
      workerResults: upsertBy(state.workerResults, event.data as unknown as AgentWorkerResult, (item) => item.resultId)
    };
  }
  if (event.kind === "agent.verifier.verdict") {
    return {
      ...state,
      ...sessionFields,
      verifierResults: upsertBy(state.verifierResults, event.data as unknown as AgentVerifierResult, (item) => item.verifierResultId)
    };
  }
  if (event.kind === "model.reasoning.effort.mapped") {
    return {
      ...state,
      ...sessionFields,
      reasoningEffort: event.data as unknown as AgentReasoningEffortMapping
    };
  }
  if (event.kind === "agent.loop.completed" || event.kind === "agent.loop.failed" || event.kind === "agent.loop.cancelled") {
    const summary = event.data as {
      interactionMode?: InteractionModeName;
      agentMode?: AgentModeName;
      phasePlan?: AgentPhasePlan;
      modeSummary?: {
        budgets?: readonly AgentLoopBudget[];
        workerResults?: readonly AgentWorkerResult[];
        verifierResults?: readonly AgentVerifierResult[];
        reasoningEffort?: AgentReasoningEffortMapping;
      };
      reasoningEffortMapping?: AgentReasoningEffortMapping;
    };
    return {
      ...state,
      ...sessionFields,
      ...(summary.interactionMode ? { interactionMode: summary.interactionMode } : {}),
      ...(summary.agentMode ? { agentMode: summary.agentMode } : {}),
      ...(summary.phasePlan ? { phasePlan: summary.phasePlan, budgets: summary.phasePlan.budgets } : {}),
      ...(summary.modeSummary?.budgets ? { budgets: mergeBy(summary.phasePlan?.budgets ?? state.budgets, summary.modeSummary.budgets, (item) => item.kind) } : {}),
      ...(summary.modeSummary?.workerResults ? { workerResults: mergeBy(state.workerResults, summary.modeSummary.workerResults, (item) => item.resultId) } : {}),
      ...(summary.modeSummary?.verifierResults ? { verifierResults: mergeBy(state.verifierResults, summary.modeSummary.verifierResults, (item) => item.verifierResultId) } : {}),
      ...(summary.modeSummary?.reasoningEffort || summary.reasoningEffortMapping ? { reasoningEffort: summary.modeSummary?.reasoningEffort ?? summary.reasoningEffortMapping } : {})
    };
  }
  return { ...state, ...sessionFields };
}

function renderModeStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const record = {
    kind: "mode.status",
    interactionMode: state.interactionMode,
    agentMode: state.agentMode,
    sessionId: state.sessionId,
    turnId: state.turnId,
    availableTransitions: state.availableTransitions,
    degradationReasons: state.degradationReasons,
    transitionCount: state.transitions.length,
    budgets: budgetSummary(state.budgets),
    commandVisibilityProfiles: modeControlVisibilityProfiles(state.interactionMode),
    redaction: { class: "internal" }
  };
  return renderRecords(output, [record], [
    `mode: interaction=${state.interactionMode} agent=${state.agentMode} transitions=${state.availableTransitions.join(",")}`,
    `  budgets ${budgetText(state.budgets)}`,
    `  degradation=${state.degradationReasons.length > 0 ? state.degradationReasons.join(",") : "none"} transition_history=${state.transitions.length}`
  ]);
}

function renderAgentStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const record = {
    kind: "agent.status",
    agentMode: state.agentMode,
    binding: state.agentBinding,
    workerCount: state.workers.length,
    workerResultCount: state.workerResults.length,
    verifierResultCount: state.verifierResults.length,
    phasePlanId: state.phasePlan?.planId,
    redaction: { class: "internal" }
  };
  return renderRecords(output, [record], [
    `agent: mode=${state.agentMode} binding=${state.agentBinding?.agentId ?? "default"} role=${state.agentBinding?.productRole ?? "default-coding-agent"}`,
    `  workers=${state.workers.length} worker_results=${state.workerResults.length} verifier_results=${state.verifierResults.length} phase_plan=${state.phasePlan?.planId ?? "none"}`
  ]);
}

function renderWorkerStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const records: JsonObject[] = [{
    kind: "workers.summary",
    workerCount: state.workers.length,
    resultCount: state.workerResults.length,
    activeCount: state.workers.filter((worker) => worker.status === "spawned" || worker.status === "running" || worker.status === "continued").length,
    redaction: { class: "internal" }
  }];
  records.push(...state.workers.map((worker) => ({ kind: "workers.lifecycle", worker })));
  records.push(...state.workerResults.map((result) => ({ kind: "workers.result", result })));
  const text = state.workers.length === 0 && state.workerResults.length === 0
    ? ["workers: none"]
    : [
        `workers: lifecycle=${state.workers.length} results=${state.workerResults.length}`,
        ...state.workers.map((worker) => `  ${worker.status} worker=${worker.workerAgentId ?? "unknown"} instance=${worker.workerInstanceId ?? "none"} work_order=${worker.workOrderId ?? "none"}`),
        ...state.workerResults.map((result) => `  result ${result.resultId} status=${result.status} worker_session=${result.workerSessionId}`)
      ];
  return renderRecords(output, records, text);
}

function renderVerifyStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const verification = budgetCount(state.budgets, "verification");
  const records: JsonObject[] = [{
    kind: "verify.summary",
    verdictCount: state.verifierResults.length,
    verificationBudget: verification,
    required: state.phasePlan?.phases.some((phase) => phase.phase === "verify" && phase.required) ?? false,
    redaction: { class: "internal" }
  }];
  records.push(...state.verifierResults.map((verdict) => ({ kind: "verify.verdict", verdict })));
  const text = state.verifierResults.length === 0
    ? [`verify: verdicts=0 budget=${verification.consumed}/${verification.allowed} required=${records[0]?.required === true}`]
    : [
        `verify: verdicts=${state.verifierResults.length} budget=${verification.consumed}/${verification.allowed}`,
        ...state.verifierResults.map((result) => `  ${result.verdict} ${result.verifierResultId} evidence=${result.evidenceIds.length} commands=${result.commandEvidenceIds.length}`)
      ];
  return renderRecords(output, records, text);
}

function renderPlanStatus(state: ChatModeControlState, output: CliOptions["output"]): readonly string[] {
  const plan = state.phasePlan;
  const records: JsonObject[] = [{
    kind: "plan.summary",
    planId: plan?.planId ?? "none",
    phaseCount: plan?.phases.length ?? 0,
    skippedCount: state.skippedPhases.length,
    reason: plan?.reason,
    redaction: { class: "internal", fields: ["reason"] }
  }];
  if (plan) records.push(...plan.phases.map((phase) => ({ kind: "plan.phase", phase })));
  const text = plan
    ? [
        `plan: ${plan.planId} phases=${plan.phases.length} skipped=${state.skippedPhases.length}`,
        ...plan.phases.map((phase) => `  ${phase.phase}: ${phase.status} required=${phase.required}${phase.skipReason ? ` skip=${phase.skipReason}` : ""}`)
      ]
    : ["plan: none"];
  return renderRecords(output, records, text);
}

function renderRecords(output: CliOptions["output"], records: readonly JsonObject[], text: readonly string[]): readonly string[] {
  if (output === "json") return [JSON.stringify(records.length === 1 ? records[0] : records)];
  if (output === "jsonl") return records.map((record) => JSON.stringify(record));
  return text;
}

function unsupportedTransition(value: string | undefined, state: ChatModeControlState): boolean {
  if (!value) return false;
  return !state.availableTransitions.includes(value as InteractionModeName);
}

function unsupportedResumeReasons(
  mode: InteractionModeName,
  terminalProfile: CliTerminalCapabilityProfile,
  output: CliOptions["output"]
): readonly InteractionModeDegradationReason[] {
  const reasons: InteractionModeDegradationReason[] = [];
  if ((mode === "interactive" || mode === "command-palette" || mode === "result-list" || mode === "approval" || mode === "review-diff") && !terminalProfile.stdoutIsTTY) {
    reasons.push("redirected-io");
  }
  if ((mode === "interactive" || mode === "command-palette") && !terminalProfile.rawInput) {
    reasons.push("raw-input-unavailable");
  }
  if (mode === "remote") reasons.push("remote-unsafe-command");
  if (mode === "approval" && output !== "text") reasons.push("permission-ui-unavailable");
  return [...new Set(reasons)];
}

function safeResumeMode(terminalProfile: CliTerminalCapabilityProfile, output: CliOptions["output"]): InteractionModeName {
  if (output === "json" || output === "jsonl" || terminalProfile.rendererProfile === "json" || terminalProfile.rendererProfile === "jsonl") return "headless";
  return "chat";
}

function modeActionCommand(action: CliModeAction | undefined): ChatModeControlCommand {
  if (action === "agent" || action === "workers" || action === "verify" || action === "plan") return action;
  return "mode";
}

function budgetSummary(budgets: readonly AgentLoopBudget[]): readonly JsonObject[] {
  return budgets.map((budget) => ({
    kind: budget.kind,
    requested: budget.requested,
    allowed: budget.allowed,
    consumed: budget.consumed,
    remaining: budget.remaining,
    stopReason: budget.stopReason
  }));
}

function budgetText(budgets: readonly AgentLoopBudget[]): string {
  if (budgets.length === 0) return "none";
  return budgets.map((budget) => `${budget.kind}=${budget.consumed}/${budget.allowed}`).join(" ");
}

function budgetCount(budgets: readonly AgentLoopBudget[], kind: AgentLoopBudget["kind"]): JsonObject {
  const budget = budgets.find((item) => item.kind === kind);
  return {
    requested: budget?.requested ?? 0,
    allowed: budget?.allowed ?? 0,
    consumed: budget?.consumed ?? 0,
    remaining: budget?.remaining ?? 0,
    stopReason: budget?.stopReason
  };
}

function upsertBy<T>(items: readonly T[], next: T, key: (item: T) => string): readonly T[] {
  const nextKey = key(next);
  const index = items.findIndex((item) => key(item) === nextKey);
  if (index < 0) return [...items, next];
  return items.map((item, itemIndex) => itemIndex === index ? next : item);
}

function mergeBy<T>(left: readonly T[], right: readonly T[], key: (item: T) => string): readonly T[] {
  let merged = left;
  for (const item of right) merged = upsertBy(merged, item, key);
  return merged;
}
