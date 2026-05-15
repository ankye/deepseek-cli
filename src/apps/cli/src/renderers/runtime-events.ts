import type { AgentLoopOutputMode, AgentLoopSummary, RuntimeDependencies, RuntimeEvent, RuntimeKernel } from "@deepseek/platform-contracts";
import type { AgentLoopBudget, AgentPhasePlan, AgentPhasePlanItem, AgentVerifierResult, AgentWorkerLifecycleEvent, AgentWorkerResult } from "@deepseek/platform-contracts";
import { runAgentLoop } from "@deepseek/runtime";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";
import { isApprovalEvent, renderApprovalJson, renderApprovalText } from "./approval.js";

interface TextStreamState {
  deltaOpen: boolean;
  reasoningOpen: boolean;
  inlineBuffer: string;
}

export async function emitAgentLoop(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: Parameters<typeof runAgentLoop>[2],
  write: (line: string) => Promise<void>,
  writeInline: (chunk: string) => Promise<void> = write,
  bufferedInline = false,
  signal?: AbortSignal,
  terminalProfile?: CliTerminalCapabilityProfile
): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  const stream: TextStreamState = { deltaOpen: false, reasoningOpen: false, inlineBuffer: "" };
  const inline = async (chunk: string): Promise<void> => {
    if (bufferedInline) {
      stream.inlineBuffer += chunk;
      return;
    }
    await writeInline(chunk);
  };
  const flushInline = async (): Promise<void> => {
    if (bufferedInline && stream.inlineBuffer.length > 0) {
      await write(stream.inlineBuffer);
      stream.inlineBuffer = "";
      return;
    }
    if (!bufferedInline) {
      await write("");
    }
  };
  for await (const event of runAgentLoop(deps, kernel, request, signal ? { signal } : {})) {
    events.push(event);
    if (request.outputMode === "jsonl") {
      await write(renderJsonLine(event));
      continue;
    }
    if (request.outputMode === "text") {
      await renderTextEvent(event, stream, write, inline, flushInline, terminalProfile);
    }
  }
  await closeOpenTextStreams(stream, flushInline);
  return events;
}

export function renderText(event: RuntimeEvent): string {
  if (isApprovalEvent(event)) return renderApprovalText(event);
  if (event.kind === "model.requested") return `[model] request iteration=${String(event.data.iteration ?? "")}`;
  if (event.kind === "evidence.classified") return `[evidence] required=${String(event.data.evidenceRequired ?? false)} intents=${eventDataList(event.data.intents)}`;
  if (event.kind === "evidence.plan.created") return `[evidence] plan sources=${eventDataCount(event.data.sources)} claims=${eventDataCount(event.data.claims)}`;
  if (event.kind === "evidence.selected") return `[evidence] selected=${String(event.data.selectedEvidenceCount ?? 0)}`;
  if (event.kind === "agent.phase.plan.created") return renderPhasePlan(event.data as unknown as AgentPhasePlan);
  if (event.kind === "agent.phase.skipped") return renderSkippedPhase(event.data as unknown as AgentPhasePlanItem);
  if (event.kind === "agent.loop.budget.consumed") return renderBudget(event.data as unknown as AgentLoopBudget);
  if (event.kind === "agent.worker.launched" || event.kind === "agent.worker.continued" || event.kind === "agent.worker.stopped") return renderWorkerLifecycle(event.data as unknown as AgentWorkerLifecycleEvent);
  if (event.kind === "agent.worker.result") return renderWorkerResult(event.data as unknown as AgentWorkerResult);
  if (event.kind === "agent.verifier.verdict") return renderVerifierVerdict(event.data as unknown as AgentVerifierResult);
  if (event.kind === "model.reasoning.effort.mapped") return `[model] reasoning requested=${String(event.data.requestedEffort ?? "none")} provider=${String(event.data.providerEffort ?? "none")} supported=${String(event.data.supported ?? true)}`;
  if (event.kind === "model.tool.intent") return `[tool] ${String(event.data.name ?? "")}`;
  if (event.kind === "model.tool.repaired") return "[tool repaired]";
  if (event.kind === "model.tool.rejected") return `[tool rejected] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "model.tool.result") return `[tool result] ${String(event.data.terminalKind ?? "")}`;
  if (event.kind === "agent.loop.completed") {
    const summary = event.data as AgentLoopSummary;
    return `[completed] trace=${summary.traceId} session=${summary.sessionId}`;
  }
  if (event.kind === "agent.loop.cancelled") {
    const summary = event.data as AgentLoopSummary;
    return `[cancelled] trace=${summary.traceId} session=${summary.sessionId}`;
  }
  if (event.kind === "agent.loop.failed") return `[failed] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "runtime.error") return `[error] ${event.error?.message ?? ""}`.trim();
  return "";
}

function renderPhasePlan(plan: AgentPhasePlan): string {
  const required = plan.phases.filter((phase) => phase.required).map((phase) => phase.phase).join(",");
  const skipped = plan.phases.filter((phase) => phase.status === "skipped").map((phase) => `${phase.phase}:${phase.skipReason ?? "unknown"}`).join(",");
  return `[plan] mode=${plan.agentMode} required=${required || "none"} skipped=${skipped || "none"}`;
}

function renderSkippedPhase(phase: AgentPhasePlanItem): string {
  return `[phase skipped] ${phase.phase} reason=${phase.skipReason ?? "unknown"} mode=${phase.mode}`;
}

function renderBudget(budget: AgentLoopBudget): string {
  return `[budget] ${budget.kind} consumed=${budget.consumed}/${budget.allowed} remaining=${budget.remaining}${budget.stopReason ? ` stop=${budget.stopReason}` : ""}`;
}

function renderWorkerLifecycle(worker: AgentWorkerLifecycleEvent): string {
  return `[worker] ${worker.status} worker=${worker.workerAgentId ?? "unknown"} instance=${worker.workerInstanceId ?? "none"} work_order=${worker.workOrderId ?? "none"}`;
}

function renderWorkerResult(result: AgentWorkerResult): string {
  return `[worker] result=${result.resultId} status=${result.status} evidence=${result.evidenceIds.length} changed_scope=${result.changedScope.length}`;
}

function renderVerifierVerdict(result: AgentVerifierResult): string {
  return `[verify] verdict=${result.verdict} evidence=${result.evidenceIds.length} commands=${result.commandEvidenceIds.length} unchecked=${result.unverifiedAreas.length}`;
}

function eventDataList(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(",") || "none" : "none";
}

function eventDataCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function renderJsonLine(event: RuntimeEvent): string {
  const approval = renderApprovalJson(event);
  if (approval) {
    return JSON.stringify({
      ...event,
      data: {
        ...event.data,
        approval
      }
    });
  }
  return JSON.stringify(event);
}

export async function renderFinalJsonIfNeeded(output: AgentLoopOutputMode, events: readonly RuntimeEvent[], write: (line: string) => Promise<void>): Promise<void> {
  if (output !== "json") return;
  const terminal = finalAgentLoopEvent(events);
  const fallback = events.at(-1);
  const sessionId = terminal?.sessionId ?? fallback?.sessionId ?? "";
  await write(JSON.stringify({
    schemaVersion: "1.0.0",
    status: String(terminal?.data.status ?? (terminal?.kind === "agent.loop.completed" ? "completed" : "failed")),
    sessionId,
    turnId: terminal?.turnId ?? fallback?.turnId ?? "",
    traceId: String(terminal?.trace.traceId ?? fallback?.trace.traceId ?? ""),
    assistantText: String(terminal?.data.assistantText ?? ""),
    diagnostics: Array.isArray(terminal?.data.diagnostics) ? terminal?.data.diagnostics : [],
    ...(terminal?.data.selfRepair && typeof terminal.data.selfRepair === "object" ? { selfRepair: terminal.data.selfRepair } : {}),
    resumeCommand: sessionId ? `deepseek session resume ${sessionId}` : "",
    redaction: terminal?.data.redaction ?? { class: "internal" }
  }));
}

export function finalAgentLoopEvent(events: readonly RuntimeEvent[]): RuntimeEvent | undefined {
  return [...events].reverse().find((event) => event.kind === "agent.loop.completed" || event.kind === "agent.loop.failed" || event.kind === "agent.loop.cancelled");
}

export function resumeHint(sessionId: string): string {
  return `[session] deepseek session resume ${sessionId}`;
}

async function renderTextEvent(
  event: RuntimeEvent,
  stream: TextStreamState,
  write: (line: string) => Promise<void>,
  writeInline: (chunk: string) => Promise<void>,
  flushInline: () => Promise<void>,
  terminalProfile?: CliTerminalCapabilityProfile
): Promise<void> {
  if (event.kind === "model.delta") {
    if (stream.reasoningOpen) {
      await flushInline();
      stream.reasoningOpen = false;
    }
    stream.deltaOpen = true;
    await writeInline(String(event.data.text ?? ""));
    return;
  }
  if (event.kind === "model.reasoning") {
    if (stream.deltaOpen) {
      await flushInline();
      stream.deltaOpen = false;
    }
    if (!stream.reasoningOpen) {
      await writeInline("[reasoning] ");
      stream.reasoningOpen = true;
    }
    await writeInline(String(event.data.text ?? ""));
    return;
  }
  if (event.kind === "model.requested") {
    await closeOpenTextStreams(stream, flushInline);
    return;
  }
  await closeOpenTextStreams(stream, flushInline);
  const line = isApprovalEvent(event) ? renderApprovalText(event, terminalProfile) : renderText(event);
  if (line) await write(line);
}

async function closeOpenTextStreams(stream: TextStreamState, flushInline: () => Promise<void>): Promise<void> {
  if (stream.deltaOpen || stream.reasoningOpen) {
    await flushInline();
    stream.deltaOpen = false;
    stream.reasoningOpen = false;
  }
}
