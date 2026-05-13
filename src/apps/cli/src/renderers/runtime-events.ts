import type { AgentLoopOutputMode, AgentLoopSummary, RuntimeDependencies, RuntimeEvent, RuntimeKernel } from "@deepseek/platform-contracts";
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
