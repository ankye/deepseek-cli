import type {
  JsonObject,
  LosslessContextEdge,
  LosslessContextNode,
  LosslessContextSourceClass,
  LosslessContextRecordResult,
  LosslessContextSummarizeResult,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { LOSSLESS_CONTEXT_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { stableHash } from "./trace.js";

const createdAt = new Date(0).toISOString();

export async function* recordLosslessUserMessage(
  deps: RuntimeDependencies,
  input: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
    readonly trace: TraceContext;
    readonly content: string;
    readonly agentId?: import("@deepseek/platform-contracts").AgentId;
  }
): AsyncGenerator<RuntimeEvent, string | undefined, void> {
  return yield* recordLosslessNode(deps, {
    sessionId: input.sessionId,
    turnId: input.turnId,
    trace: input.trace,
    node: messageNode(input.sessionId, input.turnId, "user", input.content, {
      source: "runtime.turn.user",
      reversible: true
    }),
    edges: [],
    ...(input.agentId ? { agentId: input.agentId } : {})
  });
}

export async function* recordLosslessToolResult(
  deps: RuntimeDependencies,
  input: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
    readonly trace: TraceContext;
    readonly toolCallId: string;
    readonly toolName: string;
    readonly content: string;
    readonly assistantNodeId?: string;
    readonly agentId?: import("@deepseek/platform-contracts").AgentId;
  }
): AsyncGenerator<RuntimeEvent, string | undefined, void> {
  const node = messageNode(input.sessionId, input.turnId, "tool", input.content, {
    source: "runtime.turn.tool-result",
    toolCallId: input.toolCallId,
    toolName: input.toolName,
    reversible: true
  }, "tool-result", "model-facing-tool-result");
  const edges = input.assistantNodeId
    ? [edge(node.nodeId, input.assistantNodeId, "tool-result-for", { toolCallId: input.toolCallId, toolName: input.toolName })]
    : [];
  return yield* recordLosslessNode(deps, {
    sessionId: input.sessionId,
    turnId: input.turnId,
    trace: input.trace,
    node,
    edges,
    ...(input.agentId ? { agentId: input.agentId } : {})
  });
}

export async function* recordLosslessAssistantMessage(
  deps: RuntimeDependencies,
  input: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
    readonly trace: TraceContext;
    readonly content: string;
    readonly userNodeId?: string;
    readonly agentId?: import("@deepseek/platform-contracts").AgentId;
  }
): AsyncGenerator<RuntimeEvent, string | undefined, void> {
  if (input.content.trim().length === 0) return undefined;
  const node = messageNode(input.sessionId, input.turnId, "assistant", input.content, {
    source: "runtime.turn.assistant",
    reversible: true
  });
  const edges = input.userNodeId
    ? [edge(node.nodeId, input.userNodeId, "responds-to", { source: "runtime.turn.assistant" })]
    : [];
  const nodeId = yield* recordLosslessNode(deps, {
    sessionId: input.sessionId,
    turnId: input.turnId,
    trace: input.trace,
    node,
    edges,
    ...(input.agentId ? { agentId: input.agentId } : {})
  });
  yield* maybeRecordLosslessSummary(deps, input.sessionId, input.turnId, input.trace, input.agentId);
  return nodeId;
}

async function* recordLosslessNode(
  deps: RuntimeDependencies,
  input: {
    readonly sessionId: SessionId;
    readonly turnId: TurnId;
    readonly trace: TraceContext;
    readonly node: LosslessContextNode;
    readonly edges: readonly LosslessContextEdge[];
    readonly agentId?: import("@deepseek/platform-contracts").AgentId;
  }
): AsyncGenerator<RuntimeEvent, string | undefined, void> {
  if (!deps.losslessContext) return undefined;
  let result: LosslessContextRecordResult;
  try {
    result = await deps.losslessContext.recordNode({ node: input.node, edges: input.edges });
  } catch (error) {
    const degraded = agentLoopEvent("context.lcm.degraded", input.sessionId, input.turnId, input.trace, {
      status: "failed",
      nodeId: input.node.nodeId,
      reason: error instanceof Error ? error.message : "Lossless context record failed",
      redaction: { class: "internal", fields: ["reason"] }
    }, input.agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
    return undefined;
  }
  const event = agentLoopEvent(result.status === "failed" ? "context.lcm.degraded" : "context.lcm.node-recorded", input.sessionId, input.turnId, input.trace, {
    schemaVersion: LOSSLESS_CONTEXT_SCHEMA_VERSION,
    status: result.status,
    nodeId: result.nodeId,
    nodeKind: input.node.kind,
    role: input.node.role,
    sourceClass: input.node.sourceClass,
    edgeCount: result.edgeCount,
    contentHash: result.contentHash,
    diagnostics: result.diagnostics,
    replayFingerprint: result.replayFingerprint,
    redaction: { class: "internal", fields: ["diagnostics.details"] }
  }, input.agentId);
  await recordRuntimeAdapterEvent(deps, event);
  yield event;
  return result.status === "recorded" || result.status === "duplicate" ? result.nodeId : undefined;
}

async function* maybeRecordLosslessSummary(
  deps: RuntimeDependencies,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext,
  agentId?: import("@deepseek/platform-contracts").AgentId
): AsyncGenerator<RuntimeEvent, void, void> {
  if (!deps.losslessContext) return;
  let result: LosslessContextSummarizeResult;
  try {
    result = await deps.losslessContext.summarize({ sessionId });
  } catch (error) {
    const degraded = agentLoopEvent("context.lcm.degraded", sessionId, turnId, trace, {
      status: "failed",
      reason: error instanceof Error ? error.message : "Lossless context summary failed",
      redaction: { class: "internal", fields: ["reason"] }
    }, agentId);
    await recordRuntimeAdapterEvent(deps, degraded);
    yield degraded;
    return;
  }
  if (result.status === "skipped") return;
  const event = agentLoopEvent(result.status === "failed" ? "context.lcm.degraded" : "context.lcm.summary-recorded", sessionId, turnId, trace, {
    schemaVersion: LOSSLESS_CONTEXT_SCHEMA_VERSION,
    status: result.status,
    summaryNodeId: result.summaryNodeId ?? "",
    coveredNodeCount: result.coveredNodeCount,
    freshTailCount: result.freshTailCount,
    diagnostics: result.diagnostics,
    replayFingerprint: result.replayFingerprint,
    redaction: { class: "internal", fields: ["diagnostics.details"] }
  }, agentId);
  await recordRuntimeAdapterEvent(deps, event);
  yield event;
}

function messageNode(
  sessionId: SessionId,
  turnId: TurnId,
  role: "user" | "assistant" | "tool",
  content: string,
  metadata: JsonObject,
  kind: "message" | "tool-result" = "message",
  sourceClass: LosslessContextSourceClass = role === "assistant" ? "assistant-output" : "user-prompt"
): LosslessContextNode {
  const contentHash = stableHash(content);
  return {
    schemaVersion: LOSSLESS_CONTEXT_SCHEMA_VERSION,
    nodeId: `lcm-${role}-${turnId}-${contentHash}`,
    sessionId,
    turnId,
    kind,
    role,
    sourceClass,
    content,
    contentHash,
    createdAt,
    coversNodeIds: [],
    metadata,
    redaction: { class: "internal", fields: ["content"] }
  };
}

function edge(
  fromNodeId: string,
  toNodeId: string,
  kind: LosslessContextEdge["kind"],
  metadata: JsonObject
): LosslessContextEdge {
  return {
    schemaVersion: LOSSLESS_CONTEXT_SCHEMA_VERSION,
    fromNodeId,
    toNodeId,
    kind,
    createdAt,
    metadata,
    redaction: { class: "internal" }
  };
}
