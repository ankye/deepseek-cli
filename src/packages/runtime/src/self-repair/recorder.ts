import type {
  JsonObject,
  RuntimeDependencies,
  RuntimeEvent,
  SelfRepairAttemptRecord,
  SelfRepairFailureClassification,
  SelfRepairPlan,
  SelfRepairStopReason,
  SelfRepairVerificationSummary,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "../events.js";

export async function repairEvent(
  deps: RuntimeDependencies,
  kind: Extract<RuntimeEvent["kind"], `agent.repair.${string}`>,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext,
  data: JsonObject,
  agentId?: import("@deepseek/platform-contracts").AgentId
): Promise<RuntimeEvent> {
  const event = agentLoopEvent(kind, sessionId, turnId, trace, {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    ...data,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: data.redaction && typeof data.redaction === "object" ? data.redaction as JsonObject : { class: "internal" }
  }, agentId);
  await recordRuntimeAdapterEvent(deps, event);
  return event;
}

export function createAttemptRecord(input: {
  readonly plan: SelfRepairPlan;
  readonly status: SelfRepairAttemptRecord["status"];
  readonly diagnostics?: readonly import("@deepseek/platform-contracts").RedactedError[];
  readonly verification?: readonly SelfRepairVerificationSummary[];
  readonly materialChangeFingerprint?: string;
  readonly toolIds?: readonly string[];
  readonly touchedFiles?: readonly string[];
}): SelfRepairAttemptRecord {
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    attemptId: input.plan.attemptId,
    planId: input.plan.planId,
    status: input.status,
    actionType: input.plan.actionType,
    toolIds: input.toolIds ?? [],
    touchedFiles: input.touchedFiles ?? [],
    ...(input.materialChangeFingerprint ? { materialChangeFingerprint: input.materialChangeFingerprint } : {}),
    diagnostics: input.diagnostics ?? [],
    verification: input.verification ?? [],
    trace: input.plan.trace,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["diagnostics.details", "verification.stdoutPreview", "verification.stderrPreview", "touchedFiles"] }
  };
}

export function stopPayload(input: {
  readonly stopReason: SelfRepairStopReason;
  readonly classification?: SelfRepairFailureClassification;
  readonly plan?: SelfRepairPlan;
  readonly attempt?: SelfRepairAttemptRecord;
}): JsonObject {
  return {
    stopReason: input.stopReason,
    ...(input.classification ? { classification: input.classification } : {}),
    ...(input.plan ? { plan: input.plan } : {}),
    ...(input.attempt ? { attempt: input.attempt } : {}),
    redaction: { class: "internal", fields: ["classification.diagnostics", "plan.evidenceFingerprints", "attempt.diagnostics"] }
  };
}
