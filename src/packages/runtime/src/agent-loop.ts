import type {
  AgentLoopControl,
  AgentLoopLimits,
  AgentLoopRequest,
  AgentLoopSummary,
  ModelChatMessage,
  RedactedError,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel,
  RuntimeKernelRequest,
  SessionId,
  ToolFeedbackStatus,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { projectAgentLoopContext } from "./context-projection.js";
import { kernelError, toolIntentError } from "./errors.js";
import { agentLoopEvent, collectRuntimeEvents, lastRuntimeEvent, recordRuntimeAdapterEvent } from "./events.js";
import {
  boundedModelText,
  buildToolResultFeedback,
  modelToolResultText,
  modelToolSchema,
  providerMetadata,
  resolveCapabilityId
} from "./model-tooling.js";
import { runtimeTrace, stableHash } from "./trace.js";

export const defaultAgentLoopLimits: AgentLoopLimits = {
  maxModelIterations: 4,
  maxToolCalls: 8,
  turnTimeoutMs: 120_000,
  toolTimeoutMs: 30_000,
  maxOutputBytes: 16_000,
  maxRetries: 0
};

export async function* runAgentLoop(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: AgentLoopRequest,
  control: AgentLoopControl = {}
): AsyncIterable<RuntimeEvent> {
  const sessionId = request.sessionId ?? await deps.sessions.create({ caller: request.caller, workspaceRoot: request.workspaceRoot });
  const trace: TraceContext = request.trace ?? runtimeTrace(sessionId, "agent-loop");
  const turnId = asId<"turn">(`turn-${stableHash(`${sessionId}:${request.prompt}`)}`);
  const limits = { ...defaultAgentLoopLimits, ...(request.limits ?? {}) };
  const diagnostics: RedactedError[] = [];
  let assistantText = "";
  let iterations = 0;
  let toolCalls = 0;
  let terminalEmitted = false;
  const messages: ModelChatMessage[] = [{ role: "user", content: request.prompt }];
  const signal = control.signal;

  const emitCancelled = async function* (): AsyncGenerator<RuntimeEvent, void, void> {
    const summary = summarizeAgentLoop("cancelled", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
    const cancelled = agentLoopEvent("agent.loop.cancelled", sessionId, turnId, trace, { ...summary, reason: "user-cancelled" }, request.agentId);
    await recordRuntimeAdapterEvent(deps, cancelled);
    yield cancelled;
  };

  const started = agentLoopEvent("agent.loop.started", sessionId, turnId, trace, {
    schemaVersion: "1.0.0",
    caller: request.caller,
    outputMode: request.outputMode,
    workspaceRoot: request.workspaceRoot,
    model: request.profile.model,
    limits
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  if (signal?.aborted) {
    yield* emitCancelled();
    return;
  }

  const turnStarted = agentLoopEvent("turn.started", sessionId, turnId, trace, {
    promptHash: stableHash(request.prompt),
    caller: request.caller
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, turnStarted);
  yield turnStarted;

  for await (const projectionEvent of projectAgentLoopContext(deps, request, sessionId, turnId, trace)) {
    yield projectionEvent;
    if (projectionEvent.kind === "context.projection.rejected") {
      diagnostics.push(projectionEvent.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
      const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
      const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, summary.diagnostics[0]);
      await recordRuntimeAdapterEvent(deps, failed);
      yield failed;
      terminalEmitted = true;
      return;
    }
  }

  while (iterations < limits.maxModelIterations) {
    if (signal?.aborted) {
      yield* emitCancelled();
      terminalEmitted = true;
      return;
    }
    iterations += 1;
    let iterationReasoning = "";
    const visibleCapabilities = projectToolSet(await deps.capabilities.listModelVisible(), request);
    const modelRequested = agentLoopEvent("model.requested", sessionId, turnId, trace, {
      iteration: iterations,
      model: request.profile.model,
      visibleToolCount: visibleCapabilities.length
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, modelRequested);
    yield modelRequested;

    let requestedTool = false;
    for await (const modelEvent of deps.models.stream({
      profile: request.profile,
      prompt: messages.map((message) => `${message.role}: ${message.content}`).join("\n"),
      messages,
      tools: visibleCapabilities.map(modelToolSchema),
      ...(request.credentialRef ? { credentialRef: request.credentialRef } : {}),
      ...(request.reasoning ? { reasoning: request.reasoning } : {}),
      ...(signal ? { signal } : {}),
      timeoutMs: request.timeoutMs ?? limits.turnTimeoutMs,
      metadata: {
        agentLoop: true,
        sessionId,
        turnId,
        trace,
        outputMode: request.outputMode,
        live: request.live === true
      }
    })) {
      if (signal?.aborted) {
        yield* emitCancelled();
        terminalEmitted = true;
        return;
      }
      if (modelEvent.kind === "delta") {
        assistantText += modelEvent.text;
        const event = agentLoopEvent("model.delta", sessionId, turnId, trace, {
          text: modelEvent.text,
          iteration: iterations,
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "reasoning") {
        iterationReasoning += modelEvent.text;
        const event = agentLoopEvent("model.reasoning", sessionId, turnId, trace, {
          text: modelEvent.text,
          redaction: modelEvent.redaction,
          iteration: iterations,
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "usage") {
        const event = agentLoopEvent("usage.updated", sessionId, turnId, trace, {
          inputTokens: modelEvent.inputTokens,
          outputTokens: modelEvent.outputTokens,
          metadata: modelEvent.metadata ?? {}
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
        continue;
      }
      if (modelEvent.kind === "tool-call") {
        requestedTool = true;
        const toolCallId = modelEvent.id ?? "";
        const toolName = resolveCapabilityId(modelEvent.name, visibleCapabilities);
        if (toolCalls >= limits.maxToolCalls) {
          const error = kernelError("KERNEL_QUEUE_BACKPRESSURE", "Agent loop tool-call limit exceeded", { maxToolCalls: limits.maxToolCalls });
          diagnostics.push(error);
          const limitFeedback = buildToolResultFeedback({
            toolCallId,
            toolName,
            status: "rejected",
            text: error.message,
            diagnostics: [error],
            trace,
            limitBytes: limits.maxOutputBytes,
            continuation: "terminate"
          });
          const rejected = agentLoopEvent("model.tool.rejected", sessionId, turnId, trace, {
            reason: "tool-call-limit",
            maxToolCalls: limits.maxToolCalls,
            toolName,
            feedback: limitFeedback
          }, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, rejected);
          yield rejected;
          const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
          const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, failed);
          yield failed;
          terminalEmitted = true;
          return;
        }
        toolCalls += 1;
        const intentEvent = agentLoopEvent("model.tool.intent", sessionId, turnId, trace, {
          toolCallId,
          name: toolName,
          input: modelEvent.input,
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, intentEvent);
        yield intentEvent;
        const persistedReasoning = iterationReasoning;
        iterationReasoning = "";
        if (persistedReasoning.length > 0) {
          const persistedEvent = agentLoopEvent("model.reasoning.persisted", sessionId, turnId, trace, {
            iteration: iterations,
            byteLength: Buffer.byteLength(persistedReasoning, "utf8"),
            redaction: { class: "internal" }
          }, request.agentId);
          await recordRuntimeAdapterEvent(deps, persistedEvent);
          yield persistedEvent;
        }
        messages.push({
          role: "assistant",
          content: "",
          toolCalls: [{
            id: modelEvent.id ?? `tool-${iterations}-${toolCalls}`,
            name: toolName,
            input: modelEvent.input
          }],
          ...(persistedReasoning.length > 0 ? { reasoningContent: persistedReasoning, reasoningRedaction: { class: "internal" } } : {})
        });

        const descriptor = await deps.platform.descriptor();
        const preflight = await deps.toolIntentPreflight.check({
          intent: {
            ...(modelEvent.id ? { toolCallId: modelEvent.id } : {}),
            name: toolName,
            input: modelEvent.input,
            source: "model"
          },
          workspaceRoot: request.workspaceRoot,
          platform: descriptor.os,
          modelVisibleCapabilities: visibleCapabilities.map((capability) => capability.id),
          providerId: request.profile.providerId,
          profileId: request.profile.id
        });
        const preflightKind = preflight.status === "rejected" ? "model.tool.rejected" : preflight.status === "repaired" ? "model.tool.repaired" : "model.tool.repaired";
        const preflightEvent = agentLoopEvent(preflightKind, sessionId, turnId, trace, {
          status: preflight.status,
          capabilityId: preflight.capabilityId ?? "",
          repairs: preflight.repairs,
          diagnostics: preflight.diagnostics,
          repaired: preflight.repaired ?? {}
        }, request.agentId, preflight.status === "rejected" ? toolIntentError(preflight.diagnostics) : undefined);
        await recordRuntimeAdapterEvent(deps, preflightEvent);
        yield preflightEvent;
        if (preflight.status === "rejected" || !preflight.capabilityId) {
          const error = toolIntentError(preflight.diagnostics);
          diagnostics.push(error);
          const preflightFeedback = buildToolResultFeedback({
            toolCallId,
            toolName,
            ...(preflight.capabilityId ? { capabilityId: String(preflight.capabilityId) } : {}),
            status: "rejected",
            text: `Tool request rejected: ${error.message}`,
            diagnostics: [error, ...preflight.diagnostics],
            trace,
            limitBytes: limits.maxOutputBytes,
            continuation: "continue"
          });
          const preflightResultEvent = agentLoopEvent("model.tool.result", sessionId, turnId, trace, {
            toolCallId,
            toolName,
            result: preflightFeedback.preview.text,
            terminalKind: "preflight.rejected",
            feedback: preflightFeedback
          }, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, preflightResultEvent);
          yield preflightResultEvent;
          messages.push({ role: "tool", content: preflightFeedback.preview.text, toolCallId, toolName });
          continue;
        }

        const toolInput = preflight.repaired?.input ?? modelEvent.input;
        const kernelRequest: RuntimeKernelRequest = {
          capabilityId: preflight.capabilityId,
          caller: request.caller,
          input: toolInput,
          sessionId,
          timeoutMs: limits.toolTimeoutMs,
          trace
        };
        const toolEvents = await collectRuntimeEvents(kernel.execute({
          ...kernelRequest,
          ...(request.agentId ? { agentId: request.agentId } : {}),
          ...(modelEvent.id ? { parentInvocationId: modelEvent.id } : {})
        }));
        for (const event of toolEvents) {
          yield event;
        }
        const terminal = lastRuntimeEvent(toolEvents, (event) => event.kind === "capability.completed" || event.kind === "capability.failed" || event.kind === "capability.cancelled" || event.kind === "execution.rejected");
        const toolResultText = modelToolResultText(terminal);
        messages.push({ role: "tool", content: toolResultText, toolCallId, toolName });
        const executionFeedback = buildToolResultFeedback({
          toolCallId,
          toolName,
          capabilityId: String(preflight.capabilityId),
          status: executionFeedbackStatus(terminal),
          text: toolResultText,
          diagnostics: terminal?.error ? [terminal.error] : [],
          trace,
          limitBytes: limits.maxOutputBytes
        });
        const resultEvent = agentLoopEvent("model.tool.result", sessionId, turnId, trace, {
          toolCallId,
          toolName,
          result: boundedModelText(toolResultText, limits.maxOutputBytes),
          terminalKind: terminal?.kind ?? "unknown",
          feedback: executionFeedback
        }, request.agentId, terminal?.error);
        await recordRuntimeAdapterEvent(deps, resultEvent);
        yield resultEvent;
        if (terminal?.error) {
          diagnostics.push(terminal.error);
          if (executionFeedback.continuation === "continue") {
            continue;
          }
          const status = terminal.kind === "capability.cancelled"
            ? "cancelled"
            : terminal.kind === "execution.rejected"
              ? "rejected"
              : "failed";
          const summary = summarizeAgentLoop(status, request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
          const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, terminal.error);
          await recordRuntimeAdapterEvent(deps, failed);
          yield failed;
          terminalEmitted = true;
          return;
        }
      }
      if (modelEvent.kind === "finish") {
        const event = agentLoopEvent("model.finished", sessionId, turnId, trace, {
          reason: modelEvent.reason,
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
      }
      if (modelEvent.kind === "done") {
        const event = agentLoopEvent("model.done", sessionId, turnId, trace, {
          provider: modelEvent.provider ?? providerMetadata(request),
          iteration: iterations
        }, request.agentId);
        await recordRuntimeAdapterEvent(deps, event);
        yield event;
      }
      if (modelEvent.kind === "error") {
        diagnostics.push(modelEvent.error);
        const failed = agentLoopEvent("runtime.error", sessionId, turnId, trace, {
          source: "model",
          provider: modelEvent.provider ?? providerMetadata(request)
        }, request.agentId, modelEvent.error);
        await recordRuntimeAdapterEvent(deps, failed);
        yield failed;
        const summary = summarizeAgentLoop("failed", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
        const terminal = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, modelEvent.error);
        await recordRuntimeAdapterEvent(deps, terminal);
        yield terminal;
        terminalEmitted = true;
        return;
      }
    }
    if (!requestedTool) {
      const summary = summarizeAgentLoop("completed", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
      const completed = agentLoopEvent("turn.completed", sessionId, turnId, trace, summary, request.agentId);
      await recordRuntimeAdapterEvent(deps, completed);
      yield completed;
      const loopCompleted = agentLoopEvent("agent.loop.completed", sessionId, turnId, trace, summary, request.agentId);
      await recordRuntimeAdapterEvent(deps, loopCompleted);
      yield loopCompleted;
      terminalEmitted = true;
      return;
    }
  }

  if (!terminalEmitted) {
    const error = kernelError("KERNEL_QUEUE_BACKPRESSURE", "Agent loop model iteration limit exceeded", { maxModelIterations: limits.maxModelIterations });
    diagnostics.push(error);
    const summary = summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
    const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId, error);
    await recordRuntimeAdapterEvent(deps, failed);
    yield failed;
  }
}

export function summarizeAgentLoop(
  status: AgentLoopSummary["status"],
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext,
  assistantText: string,
  iterations: number,
  toolCalls: number,
  diagnostics: readonly RedactedError[]
): AgentLoopSummary {
  return {
    schemaVersion: "1.0.0",
    status,
    sessionId,
    turnId,
    traceId: String(trace.traceId),
    assistantText: boundedModelText(assistantText, request.limits?.maxOutputBytes ?? defaultAgentLoopLimits.maxOutputBytes),
    iterations,
    toolCalls,
    modelProvider: request.profile.providerId,
    modelProfile: request.profile.id,
    diagnostics,
    redaction: { class: "internal", fields: ["assistantText", "diagnostics.details"] }
  };
}

function executionFeedbackStatus(terminal: RuntimeEvent | undefined): ToolFeedbackStatus {
  if (!terminal) return "failed";
  if (terminal.kind === "capability.completed") return "success";
  if (terminal.kind === "capability.cancelled") return "cancelled";
  if (terminal.kind === "execution.rejected") {
    return terminal.error?.code === "KERNEL_POLICY_DENIED" ? "denied" : "rejected";
  }
  if (terminal.error?.code === "KERNEL_SCHEDULER_TIMEOUT") return "timeout";
  return "failed";
}

function projectToolSet(
  capabilities: readonly import("@deepseek/platform-contracts").CapabilityManifest[],
  request: AgentLoopRequest
): readonly import("@deepseek/platform-contracts").CapabilityManifest[] {
  const policy = request.toolProjection ?? (request.live ? "read-only" : "all");
  if (policy === "all") return capabilities;
  if (policy === "read-write") {
    return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read" || manifest.sideEffect === "write");
  }
  return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read");
}
