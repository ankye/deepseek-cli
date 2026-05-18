import type {
  AgentId,
  CliTargetRef,
  JsonObject,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext,
  TurnId,
  VisibleReasoningActor,
  VisibleReasoningCertainty,
  VisibleReasoningEvidenceKind,
  VisibleReasoningEvidenceLink,
  VisibleReasoningProjection,
  VisibleReasoningRecord,
  VisibleReasoningStatus,
  VisibleReasoningStepKind
} from "@deepseek/platform-contracts";
import { createVisibleReasoningRecord, projectVisibleReasoning } from "@deepseek/platform-contracts";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";

const VISIBLE_REASONING_CREATED_AT = new Date(0).toISOString();

export interface RuntimeVisibleReasoningInput {
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly trace: TraceContext;
  readonly sequence: number;
  readonly actor: VisibleReasoningActor;
  readonly stepKind: VisibleReasoningStepKind;
  readonly status: VisibleReasoningStatus;
  readonly summary: string;
  readonly detail?: string;
  readonly phase?: string;
  readonly certainty?: VisibleReasoningCertainty;
  readonly evidence?: readonly VisibleReasoningEvidenceLink[];
  readonly metadata?: JsonObject;
  readonly agentId?: AgentId;
}

export async function recordVisibleReasoning(
  deps: RuntimeDependencies,
  input: RuntimeVisibleReasoningInput
): Promise<{ readonly event: RuntimeEvent; readonly record: VisibleReasoningRecord }> {
  const record = createVisibleReasoningRecord({
    sessionId: input.sessionId,
    turnId: input.turnId,
    trace: input.trace,
    createdAt: VISIBLE_REASONING_CREATED_AT,
    actor: input.actor,
    stepKind: input.stepKind,
    status: input.status,
    ...(input.certainty ? { certainty: input.certainty } : {}),
    summary: input.summary,
    ...(input.detail ? { detail: input.detail } : {}),
    evidence: input.evidence ?? [],
    sequence: input.sequence,
    ...(input.phase ? { phase: input.phase } : {}),
    metadata: input.metadata ?? {},
    privacyClass: "internal",
    redaction: { class: "internal", fields: ["summary", "detail", "metadata", "evidence"] }
  });
  const event = agentLoopEvent("visible.reasoning.recorded", input.sessionId, input.turnId, input.trace, record, input.agentId);
  await recordRuntimeAdapterEvent(deps, event);
  return { event, record };
}

export async function recordVisibleReasoningProjection(
  deps: RuntimeDependencies,
  input: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
    readonly trace: TraceContext;
    readonly records: readonly VisibleReasoningRecord[];
    readonly outputMode: "text" | "json" | "jsonl";
    readonly agentId?: AgentId;
  }
): Promise<{ readonly event: RuntimeEvent; readonly projection: VisibleReasoningProjection }> {
  const projection = projectVisibleReasoning(input.records, {
    renderer: input.outputMode === "jsonl" ? "jsonl" : input.outputMode === "json" ? "json" : "text",
    detailLevel: input.outputMode === "text" ? "compact" : "full"
  });
  const event = agentLoopEvent("visible.reasoning.projected", input.sessionId, input.turnId, input.trace, projection, input.agentId);
  await recordRuntimeAdapterEvent(deps, event);
  return { event, projection };
}

export function projectReasoningForOutput(
  records: readonly VisibleReasoningRecord[],
  outputMode: "text" | "json" | "jsonl"
): VisibleReasoningProjection {
  return projectVisibleReasoning(records, {
    renderer: outputMode === "jsonl" ? "jsonl" : outputMode === "json" ? "json" : "text",
    detailLevel: outputMode === "text" ? "compact" : "full"
  });
}

export function visibleReasoningEvidence(
  kind: VisibleReasoningEvidenceKind,
  target: CliTargetRef,
  label: string,
  fingerprint?: string
): VisibleReasoningEvidenceLink {
  return {
    kind,
    target,
    label,
    ...(fingerprint ? { fingerprint } : {}),
    supports: true,
    redaction: { class: "internal", fields: ["target.metadata", "label"] }
  };
}
