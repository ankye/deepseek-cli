import type {
  AgentLoopRequest,
  ContextProjectionResult,
  JsonObject,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { kernelError } from "./errors.js";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { countTokens, stableHash } from "./trace.js";

export function projectionEventData(projection: ContextProjectionResult): JsonObject {
  return {
    schemaVersion: projection.schemaVersion,
    status: projection.status,
    selectedNodeCount: projection.selectedNodes.length,
    excludedNodeCount: projection.excludedNodes.length,
    estimatedTokens: projection.estimatedTokens,
    budget: projection.budget,
    redaction: projection.redaction,
    redactionEvidence: projectionRedactionEvidence(projection),
    cache: projection.cache,
    replayFingerprint: projection.replayFingerprint
  };
}

function projectionRedactionEvidence(projection: ContextProjectionResult): readonly JsonObject[] {
  return projection.excludedNodes
    .filter((node) => node.secretDecision || node.reason === "unsafe-secret" || node.reason === "policy-denied")
    .map((node) => ({
      nodeId: node.id,
      reason: node.reason,
      action: node.secretDecision?.action ?? "exclude",
      reasonCode: node.secretDecision?.reasonCode ?? "context.secret.excluded",
      redactedText: node.secretDecision?.redactedText ?? "[REDACTED]",
      classification: node.secretDecision
        ? {
            detected: node.secretDecision.classification.detected,
            kind: node.secretDecision.classification.kind,
            exposure: node.secretDecision.classification.exposure,
            reasonCode: node.secretDecision.classification.reasonCode,
            occurrences: node.secretDecision.classification.occurrences,
            redactionClass: node.secretDecision.classification.redactionClass
          }
        : {
            detected: true,
            kind: "generic-secret",
            exposure: "unsafe",
            reasonCode: "secret.detected",
            occurrences: 1,
            redactionClass: "secret"
          },
      redaction: { class: "secret", fields: ["redactedText"] }
    }));
}

export async function* projectAgentLoopContext(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  trace: TraceContext
): AsyncIterable<RuntimeEvent> {
  const budget = await deps.usage.contextBudget({
    sessionId,
    purpose: "model-request",
    requestedInputTokens: countTokens(request.prompt),
    reservedOutputTokens: 1024
  });

  const started = agentLoopEvent("context.projection.started", sessionId, turnId, trace, {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    purpose: "model-request",
    promptHash: stableHash(request.prompt),
    budget
  }, request.agentId);
  await recordRuntimeAdapterEvent(deps, started);
  yield started;

  const projection = await deps.context.projectGraph({
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    sessionId,
    purpose: "model-request",
    prompt: request.prompt,
    budget: {
      hardLimitTokens: budget.hardLimitTokens,
      ...(budget.softLimitTokens !== undefined ? { softLimitTokens: budget.softLimitTokens } : {}),
      reservedOutputTokens: budget.reservedOutputTokens
    },
    scope: {
      sessionId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      availableRedactionClasses: ["public", "internal", "sensitive"]
    },
    trace,
    policy: { redaction: "fail-closed" },
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION }
  });

  if (projection.cache.hit) {
    const cacheHit = agentLoopEvent("context.projection.cache-hit", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, cacheHit);
    yield cacheHit;
  }
  if (projection.status === "degraded") {
    const degraded = agentLoopEvent("context.projection.degraded", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
  }
  if (projection.status === "rejected") {
    const rejected = agentLoopEvent("context.projection.rejected", sessionId, turnId, trace, projectionEventData(projection), request.agentId, projection.error ?? kernelError("KERNEL_ENVELOPE_INVALID", "Context projection rejected model dispatch"));
    await recordRuntimeAdapterEvent(deps, rejected);
    yield rejected;
    return;
  }

  const completed = agentLoopEvent("context.projection.completed", sessionId, turnId, trace, projectionEventData(projection), request.agentId);
  await recordRuntimeAdapterEvent(deps, completed);
  yield completed;
}
