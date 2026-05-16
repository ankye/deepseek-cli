import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { SessionId, TurnId } from "./ids.js";

export const LOSSLESS_CONTEXT_SCHEMA_VERSION = "1.0.0";

export type LosslessContextNodeKind = "message" | "tool-result" | "summary";
export type LosslessContextNodeRole = "user" | "assistant" | "tool" | "system" | "summary";
export type LosslessContextSourceClass =
  | "user-prompt"
  | "assistant-output"
  | "model-facing-tool-result"
  | "mcp-result"
  | "web-result"
  | "connector-result"
  | "browser-screen-context"
  | "imported-transcript"
  | "summary"
  | "unknown";
export type LosslessContextEdgeKind = "follows" | "responds-to" | "tool-result-for" | "summarizes" | "references";

export interface LosslessContextNode extends JsonObject {
  readonly schemaVersion: string;
  readonly nodeId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly kind: LosslessContextNodeKind;
  readonly role: LosslessContextNodeRole;
  readonly sourceClass: LosslessContextSourceClass;
  readonly content: string;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly coversNodeIds: readonly string[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextEdge extends JsonObject {
  readonly schemaVersion: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly kind: LosslessContextEdgeKind;
  readonly createdAt: string;
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextRecordInput extends JsonObject {
  readonly node: LosslessContextNode;
  readonly edges?: readonly LosslessContextEdge[];
}

export interface LosslessContextRecordResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "recorded" | "duplicate" | "ignored" | "failed";
  readonly nodeId: string;
  readonly sessionId: SessionId;
  readonly edgeCount: number;
  readonly contentHash: string;
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextMatch extends JsonObject {
  readonly nodeId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly kind: LosslessContextNodeKind;
  readonly role: LosslessContextNodeRole;
  readonly sourceClass: LosslessContextSourceClass;
  readonly score: number;
  readonly preview: string;
  readonly contentHash: string;
  readonly coveredNodeCount: number;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextGrepRequest extends JsonObject {
  readonly sessionId?: SessionId;
  readonly query: string;
  readonly regex?: boolean;
  readonly limit?: number;
}

export interface LosslessContextGrepResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "completed" | "rejected";
  readonly query: string;
  readonly matchCount: number;
  readonly matches: readonly LosslessContextMatch[];
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextDescribeRequest extends JsonObject {
  readonly nodeId: string;
}

export interface LosslessContextDescribeResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "completed" | "missing";
  readonly node?: LosslessContextNode;
  readonly inboundEdges: readonly LosslessContextEdge[];
  readonly outboundEdges: readonly LosslessContextEdge[];
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextExpandRequest extends JsonObject {
  readonly nodeId?: string;
  readonly query?: string;
  readonly sessionId?: SessionId;
  readonly limit?: number;
}

export interface LosslessContextExpandResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "completed" | "missing" | "rejected";
  readonly sourceNodeIds: readonly string[];
  readonly expandedNodes: readonly LosslessContextNode[];
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextSummarizeRequest extends JsonObject {
  readonly sessionId: SessionId;
  readonly freshTailCount?: number;
  readonly thresholdNodeCount?: number;
  readonly maxSummaryChars?: number;
}

export interface LosslessContextSummarizeResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "recorded" | "skipped" | "failed";
  readonly sessionId: SessionId;
  readonly summaryNodeId?: string;
  readonly coveredNodeCount: number;
  readonly freshTailCount: number;
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
}

export interface LosslessContextManager {
  recordNode(input: LosslessContextRecordInput): Promise<LosslessContextRecordResult>;
  grep(request: LosslessContextGrepRequest): Promise<LosslessContextGrepResult>;
  describe(request: LosslessContextDescribeRequest): Promise<LosslessContextDescribeResult>;
  expand(request: LosslessContextExpandRequest): Promise<LosslessContextExpandResult>;
  summarize(request: LosslessContextSummarizeRequest): Promise<LosslessContextSummarizeResult>;
}
