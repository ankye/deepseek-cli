import type {
  AgentContinueRequest,
  AgentContinueResult,
  AgentDelegationDecision,
  AgentDelegationReasonCode,
  AgentSpawnRequest,
  AgentSpawnResult,
  AgentSpawner,
  AgentStopRequest,
  AgentStopResult,
  AgentWorkerLifecycleEvent,
  AgentWorkerResult,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel
} from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { runAgentLoop, defaultAgentLoopLimits } from "./agent-loop.js";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { runtimeTrace, stableHash } from "./trace.js";

export function createAgentSpawner(deps: RuntimeDependencies, kernel: RuntimeKernel, workspaceRoot: string): AgentSpawner {
  return {
    async spawn(request: AgentSpawnRequest): Promise<AgentSpawnResult> {
      const definition = await deps.agents.getDefault();
      const mode = request.agentMode ?? request.workOrder?.mode ?? "worker";
      const workOrderId = request.workOrderId ?? request.workOrder?.workOrderId;
      const run = await runWorkerRequest({
        deps,
        kernel,
        workspaceRoot,
        request,
        source: "core.agent.spawn",
        lifecycleTransitionReasonPrefix: "agent.spawn",
        mode,
        ...(workOrderId ? { workOrderId } : {}),
        prompt: request.workOrder ? workerPromptFromWorkOrder(request.workOrder) : request.prompt,
        delegationDecision: createDelegationDecision({
          kind: "spawn",
          reasonCode: request.agentMode === "verifier" || request.workOrder?.mode === "verifier" ? "fresh-verification" : "parallel-independent-work",
          parentSessionId: request.parentSessionId,
          parentAgentId: request.parentAgentId,
          workOrderId,
          evidenceIds: request.workOrder?.evidenceIds ?? []
        })
      });

      return {
        childSessionId: run.childSessionId,
        workerAgentId: run.workerAgentId,
        workerInstanceId: run.workerInstanceId,
        ...(run.workOrderId ? { workOrderId: run.workOrderId } : {}),
        agentMode: run.agentMode,
        terminalStatus: run.terminalStatus,
        assistantText: run.assistantText,
        iterations: run.iterations,
        toolCalls: run.toolCalls,
        usage: run.usage,
        resultProvenance: run.resultProvenance,
        workerResult: run.workerResult,
        verifierStatus: run.workerResult.verifierVerdict ?? "not-run",
        diagnostics: run.diagnostics
      };
    },

    async continue(request: AgentContinueRequest): Promise<AgentContinueResult> {
      const previous = await deps.agents.getInstance(request.workerInstanceId);
      if (!previous) {
        throw new Error(`Unknown worker instance: ${request.workerInstanceId}`);
      }
      const workOrderId = request.workOrderId ?? request.workOrder?.workOrderId;
      const run = await runWorkerRequest({
        deps,
        kernel,
        workspaceRoot,
        request: {
          prompt: request.prompt,
          ...(request.workOrder ? { workOrder: request.workOrder } : {}),
          agentMode: request.workOrder?.mode ?? previous.mode,
          toolProjection: request.toolProjection ?? "read-only",
          ...(request.toolScope ? { toolScope: request.toolScope } : {}),
          ...(request.contextScope ? { contextScope: request.contextScope } : {}),
          ...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {}),
          ...(request.maxIterations ? { maxIterations: request.maxIterations } : {}),
          parentSessionId: request.parentSessionId ?? previous.parentSessionId ?? previous.sessionId,
          parentAgentId: request.parentAgentId ?? previous.parentAgentId ?? previous.definition.id,
          parentAgentInstanceId: request.parentAgentInstanceId ?? previous.id,
          ...(workOrderId ? { workOrderId } : {}),
          delegationDecisionId: `agent-delegation:${stableHash(`${previous.id}:${workOrderId ?? request.prompt}:continue`)}`,
          reason: request.reason ?? request.reasonCode ?? "high-context-overlap"
        },
        source: "core.agent.continue",
        lifecycleTransitionReasonPrefix: "agent.continue",
        mode: request.workOrder?.mode ?? previous.mode,
        ...(workOrderId ? { workOrderId } : {}),
        continuationOf: previous.id,
        prompt: request.workOrder ? workerPromptFromWorkOrder(request.workOrder) : request.prompt,
        continuationDecision: {
          contextOverlapScore: request.contextOverlapScore ?? 1,
          reasonCode: request.reasonCode ?? "high-context-overlap",
          evidenceIds: request.evidenceIds ?? request.workOrder?.evidenceIds ?? []
        },
        delegationDecision: createDelegationDecision({
          kind: "continue",
          reasonCode: request.reasonCode ?? "high-context-overlap",
          parentSessionId: request.parentSessionId ?? previous.parentSessionId ?? previous.sessionId,
          parentAgentId: request.parentAgentId ?? previous.parentAgentId ?? previous.definition.id,
          workOrderId,
          contextOverlapScore: request.contextOverlapScore ?? 1,
          evidenceIds: request.evidenceIds ?? request.workOrder?.evidenceIds ?? []
        })
      });

      await deps.agents.transitionInstance(previous.id, {
        transition: "continue",
        ...(workOrderId ? { workOrderId } : {}),
        reason: request.reason ?? request.reasonCode ?? "high-context-overlap",
        metadata: {
          continuedBy: run.workerInstanceId,
          contextOverlapScore: request.contextOverlapScore ?? 1
        }
      });

      return {
        childSessionId: run.childSessionId,
        workerAgentId: run.workerAgentId,
        workerInstanceId: run.workerInstanceId,
        continuationOf: previous.id,
        ...(run.workOrderId ? { workOrderId: run.workOrderId } : {}),
        agentMode: run.agentMode,
        terminalStatus: run.terminalStatus,
        assistantText: run.assistantText,
        iterations: run.iterations,
        toolCalls: run.toolCalls,
        usage: run.usage,
        resultProvenance: run.resultProvenance,
        workerResult: run.workerResult,
        verifierStatus: run.workerResult.verifierVerdict ?? "not-run",
        diagnostics: run.diagnostics
      };
    },

    async stop(request: AgentStopRequest): Promise<AgentStopResult> {
      const previous = await deps.agents.getInstance(request.workerInstanceId);
      if (!previous) {
        throw new Error(`Unknown worker instance: ${request.workerInstanceId}`);
      }
      const workOrderId = request.workOrderId ?? previous.workOrderId;
      const stopReason = request.stopReason ?? "manual-stop";
      const stopped = await deps.agents.transitionInstance(previous.id, {
        transition: "stop",
        ...(workOrderId ? { workOrderId } : {}),
        reason: request.reason ?? stopReason
      });
      const usage = emptyUsage();
      const delegationDecision = createDelegationDecision({
        kind: "stop",
        reasonCode: stopReason === "wrong-direction" ? "wrong-approach-retry" : "high-context-overlap",
        parentSessionId: request.parentSessionId ?? stopped.parentSessionId,
        parentAgentId: request.parentAgentId ?? stopped.parentAgentId,
        workerAgentId: stopped.definition.id,
        workerInstanceId: stopped.id,
        workOrderId,
        evidenceIds: []
      });
      const workerResult = createStoppedWorkerResult({
        instance: stopped,
        parentSessionId: request.parentSessionId ?? stopped.parentSessionId,
        stopReason,
        usage
      });
      await emitWorkerLifecycleEvent({
        deps,
        parentSessionId: request.parentSessionId ?? stopped.parentSessionId,
        parentAgentId: request.parentAgentId ?? stopped.parentAgentId,
        workerSessionId: stopped.sessionId,
        workerAgentId: stopped.definition.id,
        workerInstanceId: stopped.id,
        workOrderId,
        status: "stopped",
        stopReason,
        delegationDecision
      });
      await emitParentWorkerResult({
        deps,
        parentSessionId: request.parentSessionId ?? stopped.parentSessionId,
        parentAgentId: request.parentAgentId ?? stopped.parentAgentId,
        workerResult
      });
      return {
        workerInstanceId: stopped.id,
        workerSessionId: stopped.sessionId,
        workerAgentId: stopped.definition.id,
        ...(workOrderId ? { workOrderId } : {}),
        lifecycleState: "stopped",
        status: "stopped",
        stopReason,
        usage,
        resultProvenance: {
          source: "core.agent.stop",
          workerResultId: workerResult.resultId,
          delegationDecision,
          lifecycleEventCount: stopped.lifecycleEvents.length
        },
        workerResult,
        diagnostics: []
      };
    }
  };
}

async function runWorkerRequest(input: {
  readonly deps: RuntimeDependencies;
  readonly kernel: RuntimeKernel;
  readonly workspaceRoot: string;
  readonly request: AgentSpawnRequest;
  readonly source: string;
  readonly lifecycleTransitionReasonPrefix: string;
  readonly mode: import("@deepseek/platform-contracts").AgentModeName;
  readonly workOrderId?: string;
  readonly prompt: string;
  readonly continuationOf?: import("@deepseek/platform-contracts").AgentInstanceId;
  readonly continuationDecision?: {
    readonly contextOverlapScore: number;
    readonly reasonCode: string;
    readonly evidenceIds: readonly string[];
  };
  readonly delegationDecision: AgentDelegationDecision;
}) {
  const parentSessionId = input.request.parentSessionId;
  let forkedSessionId = parentSessionId;
  if (parentSessionId) {
    const forked = await input.deps.sessions.fork({
      parentSessionId,
      reason: input.request.reason ?? input.source
    });
    if (forked.ok && forked.value) forkedSessionId = forked.value.childSessionId;
  }

  const definition = await input.deps.agents.getDefault();
  const selectedMode = definition.supportedAgentModes.includes(input.mode) ? input.mode : definition.defaultAgentMode;
  const scopeProjection = await input.deps.agents.projectScopes(definition.id, selectedMode);
  const sessionId = forkedSessionId ?? await input.deps.sessions.create({ caller: input.source, workspaceRoot: input.workspaceRoot });
  const instance = await input.deps.agents.createInstance(definition.id, sessionId, {
    mode: selectedMode,
    ...(input.request.parentAgentId ? { parentAgentId: input.request.parentAgentId } : {}),
    ...(parentSessionId ? { parentSessionId } : {}),
    childSessionId: sessionId,
    ...(input.workOrderId ? { workOrderId: input.workOrderId } : {}),
    ...(input.request.delegationDecisionId ? { delegationDecisionId: input.request.delegationDecisionId } : {}),
    ...(input.continuationOf ? { continuationOf: input.continuationOf } : {}),
    scopeProjection,
    metadata: {
      source: input.source,
      toolProjection: input.request.toolProjection ?? "read-only",
      ...(input.request.toolScope ? { toolScope: input.request.toolScope } : {}),
      ...(input.request.contextScope ? { contextScope: input.request.contextScope } : {}),
      delegationDecision: input.delegationDecision,
      ...(input.continuationDecision ? { continuationDecision: input.continuationDecision } : {})
    }
  });

  await emitWorkerLifecycleEvent({
    deps: input.deps,
    parentSessionId,
    parentAgentId: input.request.parentAgentId,
    workerSessionId: instance.sessionId,
    workerAgentId: definition.id,
    workerInstanceId: instance.id,
    workOrderId: input.workOrderId,
    status: input.continuationOf ? "continued" : "spawned",
    delegationDecision: {
      ...input.delegationDecision,
      workerAgentId: definition.id,
      workerInstanceId: instance.id
    }
  });

  const limits = {
    ...defaultAgentLoopLimits,
    maxModelIterations: Math.min(input.request.maxIterations ?? 8, defaultAgentLoopLimits.maxModelIterations * 2)
  };

  const events: RuntimeEvent[] = [];
  for await (const event of runAgentLoop(input.deps, input.kernel, {
    prompt: input.prompt,
    sessionId: instance.sessionId,
    agentId: definition.id,
    agentMode: instance.mode,
    caller: input.source,
    workspaceRoot: input.workspaceRoot,
    outputMode: "jsonl",
    profile: defaultDeepSeekProfile,
    toolProjection: input.request.toolProjection ?? "read-only",
    ...(input.request.timeoutMs ? { timeoutMs: input.request.timeoutMs } : {}),
    limits
  })) {
    events.push(event);
  }

  const terminal = [...events].reverse().find((event) =>
    event.kind === "agent.loop.completed" || event.kind === "agent.loop.failed" || event.kind === "agent.loop.cancelled"
  );
  const summary = (terminal?.data as import("@deepseek/platform-contracts").AgentLoopSummary | undefined);
  const terminalStatus = (summary?.status ?? "failed") as AgentSpawnResult["terminalStatus"];
  const lifecycleTransition = terminalStatus === "completed" ? "complete" : terminalStatus === "cancelled" ? "stop" : "fail";
  const finalInstance = await input.deps.agents.transitionInstance(instance.id, {
    transition: lifecycleTransition,
    ...(input.workOrderId ? { workOrderId: input.workOrderId } : {}),
    reason: `${input.lifecycleTransitionReasonPrefix}.${terminalStatus}`
  });
  const workerResult = createWorkerResult({
    request: input.request,
    childSessionId: finalInstance.sessionId,
    workerAgentId: definition.id,
    workerInstanceId: finalInstance.id,
    terminalStatus,
    summary,
    events
  });
  await emitParentWorkerResult({
    deps: input.deps,
    parentSessionId,
    parentAgentId: input.request.parentAgentId,
    workerResult,
    ...(summary?.turnId ? { turnId: summary.turnId } : {})
  });

  return {
    childSessionId: summary?.sessionId ?? finalInstance.sessionId,
    workerAgentId: definition.id,
    workerInstanceId: finalInstance.id,
    workOrderId: input.workOrderId,
    agentMode: finalInstance.mode,
    terminalStatus,
    assistantText: String(summary?.assistantText ?? ""),
    iterations: Number(summary?.iterations ?? 0),
    toolCalls: Number(summary?.toolCalls ?? 0),
    usage: summarizeUsage(events),
    resultProvenance: {
      source: input.source,
      eventCount: events.length,
      terminalEventKind: terminal?.kind ?? "missing",
      workerResultId: workerResult.resultId,
      delegationDecision: {
        ...input.delegationDecision,
        workerAgentId: definition.id,
        workerInstanceId: finalInstance.id
      },
      workerLaunchEvent: input.continuationOf ? "agent.worker.continued" : "agent.worker.launched"
    },
    workerResult,
    diagnostics: summary?.diagnostics ?? []
  };
}

function workOrderIdFrom(request: AgentSpawnRequest): string | undefined {
  return request.workOrderId ?? request.workOrder?.workOrderId;
}

function createDelegationDecision(input: {
  readonly kind: AgentDelegationDecision["kind"];
  readonly reasonCode: AgentDelegationReasonCode;
  readonly parentSessionId: import("@deepseek/platform-contracts").SessionId | undefined;
  readonly parentAgentId: import("@deepseek/platform-contracts").AgentId | undefined;
  readonly workerAgentId?: import("@deepseek/platform-contracts").AgentId;
  readonly workerInstanceId?: import("@deepseek/platform-contracts").AgentInstanceId;
  readonly workOrderId: string | undefined;
  readonly contextOverlapScore?: number;
  readonly evidenceIds: readonly string[];
}): AgentDelegationDecision {
  const fingerprint = [
    input.kind,
    input.reasonCode,
    input.parentSessionId ?? "",
    input.parentAgentId ?? "",
    input.workerInstanceId ?? "",
    input.workOrderId ?? "",
    input.evidenceIds.join(",")
  ].join(":");
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    decisionId: `agent-delegation:${stableHash(fingerprint)}`,
    kind: input.kind,
    reasonCode: input.reasonCode,
    ...(input.parentSessionId ? { parentSessionId: input.parentSessionId } : {}),
    ...(input.parentAgentId ? { parentAgentId: input.parentAgentId } : {}),
    ...(input.workerAgentId ? { workerAgentId: input.workerAgentId } : {}),
    ...(input.workerInstanceId ? { workerInstanceId: input.workerInstanceId } : {}),
    ...(input.workOrderId ? { workOrderId: input.workOrderId } : {}),
    ...(typeof input.contextOverlapScore === "number" ? { contextOverlapScore: input.contextOverlapScore } : {}),
    evidenceIds: input.evidenceIds,
    diagnostics: [],
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

async function emitWorkerLifecycleEvent(input: {
  readonly deps: RuntimeDependencies;
  readonly parentSessionId: import("@deepseek/platform-contracts").SessionId | undefined;
  readonly parentAgentId: import("@deepseek/platform-contracts").AgentId | undefined;
  readonly workerSessionId: import("@deepseek/platform-contracts").SessionId;
  readonly workerAgentId: import("@deepseek/platform-contracts").AgentId;
  readonly workerInstanceId: import("@deepseek/platform-contracts").AgentInstanceId;
  readonly workOrderId: string | undefined;
  readonly status: AgentWorkerLifecycleEvent["status"];
  readonly stopReason?: AgentWorkerLifecycleEvent["stopReason"];
  readonly delegationDecision?: AgentDelegationDecision;
}): Promise<void> {
  const eventSessionId = input.parentSessionId ?? input.workerSessionId;
  const trace = runtimeTrace(eventSessionId, `agent-worker-${input.status}`);
  const lifecycle: AgentWorkerLifecycleEvent = {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    workerEventId: `agent-worker:${input.status}:${stableHash(`${input.workerInstanceId}:${input.workOrderId ?? ""}`)}`,
    status: input.status,
    sessionId: eventSessionId,
    workerSessionId: input.workerSessionId,
    ...(input.parentAgentId ? { parentAgentId: input.parentAgentId } : {}),
    workerAgentId: input.workerAgentId,
    workerInstanceId: input.workerInstanceId,
    ...(input.workOrderId ? { workOrderId: input.workOrderId } : {}),
    ...(input.stopReason ? { stopReason: input.stopReason } : {}),
    ...(input.delegationDecision ? { delegationDecision: input.delegationDecision } : {}),
    at: new Date(0).toISOString(),
    diagnostics: [],
    trace,
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
  const kind = input.status === "continued" ? "agent.worker.continued" : input.status === "stopped" ? "agent.worker.stopped" : "agent.worker.launched";
  const event = agentLoopEvent(kind, eventSessionId, asId<"turn">(`turn-${stableHash(lifecycle.workerEventId)}`), trace, lifecycle, input.parentAgentId);
  await recordRuntimeAdapterEvent(input.deps, event);
}

async function emitParentWorkerResult(input: {
  readonly deps: RuntimeDependencies;
  readonly parentSessionId: import("@deepseek/platform-contracts").SessionId | undefined;
  readonly parentAgentId: import("@deepseek/platform-contracts").AgentId | undefined;
  readonly workerResult: AgentWorkerResult;
  readonly turnId?: import("@deepseek/platform-contracts").TurnId;
}): Promise<void> {
  if (!input.parentSessionId) return;
  const trace = runtimeTrace(input.parentSessionId, "agent-worker-result");
  const event = agentLoopEvent(
    "agent.worker.result",
    input.parentSessionId,
    input.turnId ?? asId<"turn">(`turn-${stableHash(input.workerResult.resultId)}`),
    trace,
    input.workerResult,
    input.parentAgentId
  );
  await recordRuntimeAdapterEvent(input.deps, event);
}

function workerPromptFromWorkOrder(workOrder: NonNullable<AgentSpawnRequest["workOrder"]>): string {
  return [
    workOrder.originalUserGoal,
    "",
    "Structured worker task:",
    workOrder.taskSummary,
    "",
    `Purpose: ${workOrder.purpose}`,
    `Targets: ${workOrder.targets.map((target) => target.path ?? target.id).join(", ") || "none"}`,
    `Done criteria: ${workOrder.doneCriteria.join("; ")}`
  ].join("\n");
}

function createStoppedWorkerResult(input: {
  readonly instance: import("@deepseek/platform-contracts").AgentInstance;
  readonly parentSessionId: import("@deepseek/platform-contracts").SessionId | undefined;
  readonly stopReason: NonNullable<AgentStopRequest["stopReason"]>;
  readonly usage: ReturnType<typeof emptyUsage>;
}): AgentWorkerResult {
  const summary = `Worker stopped: ${input.stopReason}`;
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    resultId: `agent-worker-result:${stableHash(`${input.instance.sessionId}:${input.instance.id}:stopped:${input.stopReason}`)}`,
    workerSessionId: input.instance.sessionId,
    ...(input.parentSessionId ? { parentSessionId: input.parentSessionId } : {}),
    workerAgentId: input.instance.definition.id,
    workerInstanceId: input.instance.id,
    ...(input.instance.workOrderId ? { workOrderId: input.instance.workOrderId } : {}),
    status: "stopped",
    summary,
    evidenceIds: [],
    changedScope: [],
    usage: input.usage,
    diagnostics: [],
    redaction: { class: "internal", fields: ["summary"] },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function createWorkerResult(input: {
  readonly request: AgentSpawnRequest;
  readonly childSessionId: import("@deepseek/platform-contracts").SessionId;
  readonly workerAgentId: import("@deepseek/platform-contracts").AgentId;
  readonly workerInstanceId: import("@deepseek/platform-contracts").AgentInstanceId;
  readonly terminalStatus: AgentSpawnResult["terminalStatus"];
  readonly summary: import("@deepseek/platform-contracts").AgentLoopSummary | undefined;
  readonly events: readonly RuntimeEvent[];
}): AgentWorkerResult {
  const workOrderId = workOrderIdFrom(input.request);
  const verifierVerdict = input.summary?.phasePlan?.phases.some((phase) => phase.phase === "verify" && phase.status === "required") ? "partial" : undefined;
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    resultId: `agent-worker-result:${stableHash(`${input.childSessionId}:${input.request.workOrderId ?? input.request.workOrder?.workOrderId ?? input.request.prompt}`)}`,
    workerSessionId: input.childSessionId,
    ...(input.request.parentSessionId ? { parentSessionId: input.request.parentSessionId } : {}),
    workerAgentId: input.workerAgentId,
    workerInstanceId: input.workerInstanceId,
    ...(workOrderId ? { workOrderId } : {}),
    status: input.terminalStatus,
    summary: String(input.summary?.assistantText ?? ""),
    evidenceIds: evidenceIdsFrom(input.request),
    changedScope: [],
    usage: summarizeUsage(input.events),
    ...(verifierVerdict ? { verifierVerdict } : {}),
    diagnostics: input.summary?.diagnostics ?? [],
    redaction: { class: "internal", fields: ["summary", "diagnostics.details"] },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function evidenceIdsFrom(request: AgentSpawnRequest): readonly string[] {
  return request.workOrder?.evidenceIds ?? [];
}

function summarizeUsage(events: readonly RuntimeEvent[]) {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const event of events) {
    if (event.kind !== "usage.updated") continue;
    inputTokens += typeof event.data.inputTokens === "number" ? event.data.inputTokens : 0;
    outputTokens += typeof event.data.outputTokens === "number" ? event.data.outputTokens : 0;
  }
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
}

function emptyUsage() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}
