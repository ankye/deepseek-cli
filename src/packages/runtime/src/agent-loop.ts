import type {
  AgentLoopControl,
  AgentLoopLimits,
  AgentLoopRequest,
  AgentLoopSummary,
  ContextProjectionResult,
  HookInvocationResult,
  HookLifecyclePoint,
  JsonObject,
  ModelChatMessage,
  RedactedError,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel,
  RuntimeKernelRequest,
  SessionId,
  ToolFeedbackStatus,
  ToolResultFeedback,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createToolResultEvidence, createToolResultEvidenceCacheEntry } from "@deepseek/memory-cache-management";
import { projectAgentLoopContext, projectionEventData } from "./context-projection.js";
import { kernelError, toolIntentError } from "./errors.js";
import { agentLoopEvent, collectRuntimeEvents, lastRuntimeEvent, recordRuntimeAdapterEvent } from "./events.js";
import {
  boundedModelText,
  buildToolResultFeedback,
  modelToolResultText,
  providerMetadata,
  resolveCapabilityId
} from "./model-tooling.js";
import { assemblePromptForIteration, promptAssemblyEventPayload, toolProjectionPolicy } from "./prompt-assembly-integration.js";
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
  let contextProjection: ContextProjectionResult | undefined;
  const signal = control.signal;

  const emitCancelled = async function* (): AsyncGenerator<RuntimeEvent, void, void> {
    const summary = summarizeAgentLoop("cancelled", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics);
    const cancelled = agentLoopEvent("agent.loop.cancelled", sessionId, turnId, trace, { ...summary, reason: "user-cancelled" }, request.agentId);
    await recordRuntimeAdapterEvent(deps, cancelled);
    yield cancelled;
  };

  const fireHooks = async function* (point: HookLifecyclePoint, input: JsonObject): AsyncGenerator<RuntimeEvent, HookInvocationResult, void> {
    let result: HookInvocationResult;
    try {
      result = await deps.hooks.invokeHooks({
        schemaVersion: "1.0.0",
        point,
        input,
        sessionId,
        trace,
        ...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {})
      });
    } catch (error) {
      result = {
        schemaVersion: "1.0.0",
        point,
        status: "failed",
        orderedHookIds: [],
        executions: [],
        diagnostics: [{
          code: "HOOK_SYSTEM_FAILED",
          message: error instanceof Error ? error.message : "hook system threw",
          retryable: false,
          redaction: { class: "internal" }
        }],
        redaction: { class: "internal" },
        compatibility: { schemaVersion: "1.0.0" },
        replayFingerprint: "hook-invoke-error"
      };
    }
    const event = agentLoopEvent("hooks.invoked", sessionId, turnId, trace, {
      point,
      status: result.status,
      hookCount: result.orderedHookIds.length,
      diagnostics: result.diagnostics
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, event);
    yield event;
    return result;
  };

  const started = agentLoopEvent("agent.loop.started", sessionId, turnId, trace, {
    schemaVersion: "1.0.0",
    caller: request.caller,
    outputMode: request.outputMode,
    workspaceRoot: request.workspaceRoot,
    model: request.profile.model,
    ...(request.referenceContext ? { referenceContext: referenceContextSummary(request) } : {}),
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
    caller: request.caller,
    ...(request.referenceContext ? { referenceContext: request.referenceContext } : {})
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, turnStarted);
  yield turnStarted;

  const userInputResult = yield* fireHooks("user-input.before", {
    promptHash: stableHash(request.prompt),
    caller: request.caller,
    workspaceRoot: request.workspaceRoot,
    ...(request.referenceContext ? { referenceContext: request.referenceContext } : {})
  });
  if (userInputResult.status === "blocked") {
    diagnostics.push({ code: "HOOK_BLOCKED", message: "user-input.before hook blocked this turn", retryable: false, redaction: { class: "internal" } });
    const summary = { ...summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics), reason: "blocked-by-hook" };
    const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId);
    await recordRuntimeAdapterEvent(deps, failed);
    yield failed;
    terminalEmitted = true;
    return;
  }

  const projectionStream = projectAgentLoopContext(deps, request, sessionId, turnId, trace);
  let projectionStep = await projectionStream.next();
  while (!projectionStep.done) {
    const projectionEvent = projectionStep.value;
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
    projectionStep = await projectionStream.next();
  }
  contextProjection = projectionStep.value?.projection;

  while (iterations < limits.maxModelIterations) {
    if (signal?.aborted) {
      yield* emitCancelled();
      terminalEmitted = true;
      return;
    }
    iterations += 1;
    let iterationReasoning = "";
    let reasoningPersistedForIteration = false;
    const availableCapabilities = await deps.capabilities.listModelVisible();
    const assembly = await assemblePromptForIteration(deps, request, sessionId, turnId, trace, messages, contextProjection, availableCapabilities, limits);
    if (assembly.status === "rejected") {
      diagnostics.push(...assembly.diagnostics);
      const error = assembly.diagnostics[0] ?? kernelError("KERNEL_ENVELOPE_INVALID", "Prompt assembly rejected model dispatch");
      const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, {
        ...summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics),
        reason: "prompt-assembly-rejected",
        promptAssembly: promptAssemblyEventPayload(assembly, request)
      }, request.agentId, error);
      await recordRuntimeAdapterEvent(deps, failed);
      yield failed;
      terminalEmitted = true;
      return;
    }
    const visibleCapabilities = projectToolSet(availableCapabilities, request);
    const modelBeforeResult = yield* fireHooks("model-call.before", {
      iteration: iterations,
      model: request.profile.model,
      messageCount: assembly.messages.length,
      visibleToolCount: assembly.toolPlan.visibleToolCount,
      promptAssembly: {
        fingerprint: assembly.fingerprint,
        sectionCount: assembly.sections.length,
        budgetStatus: assembly.budget.status
      },
      ...(contextProjection ? { contextProjection: projectionEventData(contextProjection) } : {})
    });
    if (modelBeforeResult.status === "blocked") {
      diagnostics.push({ code: "HOOK_BLOCKED", message: "model-call.before hook blocked this iteration", retryable: false, redaction: { class: "internal" } });
      const blockedEvent = agentLoopEvent("model.blocked", sessionId, turnId, trace, {
        iteration: iterations,
        reason: "blocked-by-hook"
      }, request.agentId);
      await recordRuntimeAdapterEvent(deps, blockedEvent);
      yield blockedEvent;
      const summary = { ...summarizeAgentLoop("rejected", request, sessionId, turnId, trace, assistantText, iterations, toolCalls, diagnostics), reason: "blocked-by-hook" };
      const failed = agentLoopEvent("agent.loop.failed", sessionId, turnId, trace, summary, request.agentId);
      await recordRuntimeAdapterEvent(deps, failed);
      yield failed;
      terminalEmitted = true;
      return;
    }
    const promptAssembled = agentLoopEvent("prompt.assembled", sessionId, turnId, trace, promptAssemblyEventPayload(assembly, request), request.agentId);
    await recordRuntimeAdapterEvent(deps, promptAssembled);
    yield promptAssembled;

    const modelRequested = agentLoopEvent("model.requested", sessionId, turnId, trace, {
      iteration: iterations,
      model: request.profile.model,
      visibleToolCount: assembly.toolPlan.visibleToolCount,
      promptAssembly: {
        fingerprint: assembly.fingerprint,
        sectionCount: assembly.sections.length,
        budgetStatus: assembly.budget.status
      },
      ...(contextProjection ? { contextProjection: projectionEventData(contextProjection) } : {}),
      ...(request.referenceContext ? { referenceContext: referenceContextSummary(request) } : {})
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, modelRequested);
    yield modelRequested;

    let requestedTool = false;
    for await (const modelEvent of deps.models.stream({
      profile: request.profile,
      prompt: assembly.promptText,
      messages: assembly.messages,
      tools: assembly.toolPlan.visibleTools,
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
        ...(contextProjection ? { contextProjection: projectionEventData(contextProjection) } : {}),
        promptAssembly: {
          fingerprint: assembly.fingerprint,
          budget: assembly.budget,
          replay: assembly.trace.replay
        },
        ...(request.referenceContext ? { referenceContext: request.referenceContext } : {}),
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
            feedback: limitFeedback,
            evidence: await recordToolResultEvidence(deps, {
              toolCallId,
              toolName,
              terminalKind: "tool-call-limit",
              feedback: limitFeedback
            })
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
        if (persistedReasoning.length > 0 && !reasoningPersistedForIteration) {
          reasoningPersistedForIteration = true;
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
            feedback: preflightFeedback,
            evidence: await recordToolResultEvidence(deps, {
              toolCallId,
              toolName,
              ...(preflight.capabilityId ? { capabilityId: String(preflight.capabilityId) } : {}),
              terminalKind: "preflight.rejected",
              feedback: preflightFeedback
            })
          }, request.agentId, error);
          await recordRuntimeAdapterEvent(deps, preflightResultEvent);
          yield preflightResultEvent;
          messages.push({ role: "tool", content: preflightFeedback.preview.text, toolCallId, toolName });
          continue;
        }

        const toolInput = preflight.repaired?.input ?? modelEvent.input;
        const toolBeforeResult = yield* fireHooks("tool-execution.before", {
          toolName,
          capabilityId: String(preflight.capabilityId),
          toolCallId,
          input: toolInput
        });
        if (toolBeforeResult.status === "blocked") {
          const blockError: RedactedError = {
            code: "HOOK_TOOL_BLOCKED",
            message: `tool-execution.before hook blocked ${toolName}`,
            retryable: false,
            redaction: { class: "internal" }
          };
          diagnostics.push(blockError);
          const deniedFeedback = buildToolResultFeedback({
            toolCallId,
            toolName,
            capabilityId: String(preflight.capabilityId),
            status: "denied",
            text: blockError.message,
            diagnostics: [blockError],
            trace,
            limitBytes: limits.maxOutputBytes,
            continuation: "continue"
          });
          const deniedEvent = agentLoopEvent("model.tool.result", sessionId, turnId, trace, {
            toolCallId,
            toolName,
            result: deniedFeedback.preview.text,
            terminalKind: "hook.blocked",
            feedback: deniedFeedback,
            evidence: await recordToolResultEvidence(deps, {
              toolCallId,
              toolName,
              capabilityId: String(preflight.capabilityId),
              terminalKind: "hook.blocked",
              feedback: deniedFeedback
            })
          }, request.agentId, blockError);
          await recordRuntimeAdapterEvent(deps, deniedEvent);
          yield deniedEvent;
          messages.push({ role: "tool", content: deniedFeedback.preview.text, toolCallId, toolName });
          continue;
        }
        const kernelRequest: RuntimeKernelRequest = {
          capabilityId: preflight.capabilityId,
          caller: request.caller,
          input: toolInput,
          sessionId,
          turnId,
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
          feedback: executionFeedback,
          evidence: await recordToolResultEvidence(deps, {
            toolCallId,
            toolName,
            capabilityId: String(preflight.capabilityId),
            terminalKind: terminal?.kind ?? "unknown",
            feedback: executionFeedback
          })
        }, request.agentId, terminal?.error);
        await recordRuntimeAdapterEvent(deps, resultEvent);
        yield resultEvent;
        if (toolName === "core.skill.activate" && terminal?.kind === "capability.completed") {
          const metadata = extractSkillActivateMetadata(terminal);
          if (metadata && metadata.status === "activated") {
            const skillEvent = agentLoopEvent("skill.activated", sessionId, turnId, trace, {
              name: metadata.name,
              status: metadata.status,
              segmentCount: metadata.segmentCount,
              loadingState: metadata.loadingState
            }, request.agentId);
            await recordRuntimeAdapterEvent(deps, skillEvent);
            yield skillEvent;
          }
        }
        yield* fireHooks("tool-execution.after", {
          toolName,
          capabilityId: String(preflight.capabilityId),
          toolCallId,
          terminalKind: terminal?.kind ?? "unknown",
          feedbackStatus: executionFeedback.status
        });
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
    yield* fireHooks("model-call.after", {
      iteration: iterations,
      toolRequested: requestedTool,
      messageCount: messages.length
    });
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

function referenceContextSummary(request: AgentLoopRequest): JsonObject {
  const context = request.referenceContext;
  if (!context) return {};
  return {
    schemaVersion: context.schemaVersion,
    source: context.source,
    activeSetId: context.activeSetId,
    activeItemId: context.activeItemId,
    setCount: context.setCount,
    itemCount: context.itemCount,
    targets: context.sets.flatMap((set) => set.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      targetId: item.target.id,
      targetKind: item.target.kind,
      order: item.order
    }))),
    redaction: { class: "internal", fields: ["targets.targetId"] }
  };
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

async function recordToolResultEvidence(
  deps: RuntimeDependencies,
  input: {
    readonly toolCallId: string;
    readonly toolName: string;
    readonly capabilityId?: string;
    readonly terminalKind: string;
    readonly feedback: ToolResultFeedback;
  }
): Promise<import("@deepseek/platform-contracts").RuntimeToolResultEvidence> {
  const evidence = createToolResultEvidence(input);
  await deps.cache.set(createToolResultEvidenceCacheEntry(evidence));
  return evidence;
}

function projectToolSet(
  capabilities: readonly import("@deepseek/platform-contracts").CapabilityManifest[],
  request: AgentLoopRequest
): readonly import("@deepseek/platform-contracts").CapabilityManifest[] {
  const policy = toolProjectionPolicy(request);
  if (policy === "all") return capabilities;
  if (policy === "read-write") {
    return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read" || manifest.sideEffect === "write");
  }
  return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read");
}

interface SkillActivateTerminalMetadata {
  readonly name: string;
  readonly status: string;
  readonly segmentCount: number;
  readonly loadingState: string;
}

function extractSkillActivateMetadata(terminal: RuntimeEvent): SkillActivateTerminalMetadata | undefined {
  const output = terminal.data?.output;
  if (!output || typeof output !== "object") return undefined;
  const evidence = (output as { evidence?: unknown }).evidence;
  if (!evidence || typeof evidence !== "object") return undefined;
  const metadata = (evidence as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const record = metadata as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : undefined;
  const status = typeof record.status === "string" ? record.status : undefined;
  const segmentCount = typeof record.segmentCount === "number" ? record.segmentCount : undefined;
  const loadingState = typeof record.loadingState === "string" ? record.loadingState : undefined;
  if (!name || !status || segmentCount === undefined || !loadingState) return undefined;
  return { name, status, segmentCount, loadingState };
}
