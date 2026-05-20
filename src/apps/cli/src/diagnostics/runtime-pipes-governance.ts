import {
  RUNTIME_PIPE_SCHEMA_VERSION,
  RUNTIME_PIPE_STREAMS,
  type BusPipeConfig,
  type BusPipeDeliveryClass,
  type BusPipeOverflowPolicy,
  type JsonObject,
  type ReadinessCheck
} from "@deepseek/platform-contracts";

export interface RuntimePipesGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly streamCount: number;
  readonly requiredStreamIds: readonly string[];
  readonly deliveryClasses: readonly BusPipeDeliveryClass[];
  readonly overflowPolicies: readonly BusPipeOverflowPolicy[];
  readonly replayAffectingStreamIds: readonly string[];
  readonly streams: readonly BusPipeConfig[];
  readonly diagnostics: readonly JsonObject[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

const requiredStreamIds = [
  "runtime.events",
  "session.replay",
  "context.pipeline",
  "tool.results",
  "agent.stream",
  "plugin.events",
  "mcp.events"
] as const;

const requiredDeliveryClasses: readonly BusPipeDeliveryClass[] = [
  "lossless",
  "compactable",
  "summarizable",
  "fail-closed"
];

const requiredOverflowPolicies: readonly BusPipeOverflowPolicy[] = [
  "block",
  "drop-oldest",
  "compact",
  "summarize",
  "fail-closed"
];

export function collectRuntimePipesGovernanceEvidence(): RuntimePipesGovernanceEvidence {
  const streams = [...RUNTIME_PIPE_STREAMS];
  const streamIds = streams.map((stream) => stream.streamId);
  const deliveryClasses = unique(streams.map((stream) => stream.delivery));
  const overflowPolicies = unique(streams.map((stream) => stream.overflowPolicy));
  const replayAffectingStreamIds = streams.filter((stream) => stream.replayImpact === "replay-affecting").map((stream) => stream.streamId);
  const diagnostics: JsonObject[] = [];

  for (const streamId of requiredStreamIds) {
    if (!streamIds.includes(streamId)) {
      diagnostics.push({ code: "RUNTIME_PIPE_STREAM_MISSING", streamId, message: "Required runtime pipe stream is not declared." });
    }
  }
  for (const deliveryClass of requiredDeliveryClasses) {
    if (!deliveryClasses.includes(deliveryClass)) {
      diagnostics.push({ code: "RUNTIME_PIPE_DELIVERY_CLASS_MISSING", deliveryClass, message: "Required pipe delivery class is not represented." });
    }
  }
  for (const overflowPolicy of requiredOverflowPolicies) {
    if (!overflowPolicies.includes(overflowPolicy)) {
      diagnostics.push({ code: "RUNTIME_PIPE_OVERFLOW_POLICY_MISSING", overflowPolicy, message: "Required pipe overflow policy is not represented." });
    }
  }
  for (const stream of streams) {
    if (stream.capacity <= 0 || stream.highWatermark <= 0 || stream.highWatermark > stream.capacity) {
      diagnostics.push({ code: "RUNTIME_PIPE_CAPACITY_INVALID", streamId: stream.streamId, message: "Pipe capacity and high watermark must be positive and ordered." });
    }
    if (stream.replayImpact === "replay-affecting" && ["drop-newest", "drop-oldest"].includes(stream.overflowPolicy)) {
      diagnostics.push({ code: "RUNTIME_PIPE_REPLAY_UNSAFE_DROP", streamId: stream.streamId, message: "Replay-affecting pipes cannot use silent drop policies." });
    }
    if (stream.redaction.class !== "internal") {
      diagnostics.push({ code: "RUNTIME_PIPE_REDACTION_MISSING", streamId: stream.streamId, message: "Pipe governance records must carry internal redaction metadata." });
    }
  }

  return {
    schemaVersion: RUNTIME_PIPE_SCHEMA_VERSION,
    status: diagnostics.length === 0 ? "pass" : "fail",
    streamCount: streams.length,
    requiredStreamIds: [...requiredStreamIds],
    deliveryClasses,
    overflowPolicies,
    replayAffectingStreamIds,
    streams,
    diagnostics,
    redaction: { class: "internal", fields: ["streams.description", "diagnostics.message"] }
  };
}

export function runtimePipesGovernanceCheck(
  evidence: RuntimePipesGovernanceEvidence = collectRuntimePipesGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.runtime-pipes",
    label: "Runtime bounded pipes",
    status: evidence.status,
    message: `Runtime pipes governed: streams=${evidence.streamCount}, delivery-classes=${evidence.deliveryClasses.length}, overflow-policies=${evidence.overflowPolicies.length}, replay-affecting=${evidence.replayAffectingStreamIds.length}.`,
    suggestedActions: evidence.status === "pass" ? [] : ["Fix runtime pipe stream declarations before enabling broader context, plugin, MCP, or agent streams."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.streams.description", "metadata.evidence.diagnostics.message"] }
  };
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort() as readonly T[];
}
