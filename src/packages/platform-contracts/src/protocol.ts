import type { JsonObject, JsonValue, RedactedError, TraceContext, VersionedEnvelope } from "./common.js";
import type { CorrelationId, MessageId, SessionId } from "./ids.js";
import type { ApprovalDecision, ApprovalId, ApprovalLifecycleRecord, ApprovalRenderSummary, ApprovalAuditReference } from "./approval.js";
import type { BusPipeDeliveryClass, BusPipeOverflowPolicy, BusPipePressureState, BusPipeReplayImpact } from "./bus.js";
import type { ContextPipelineLayerId, ContextStatuslineCacheStatus } from "./context.js";
import type { RuntimeEvent, RuntimeRequest } from "./runtime.js";

export type ProtocolMessageKind = "request" | "response" | "event" | "control";
export type HostKind = "cli" | "vscode" | "test" | "server";

export interface ProtocolRouting {
  readonly host: HostKind;
  readonly target: "runtime" | "session" | "workflow" | "host";
  readonly sessionId?: SessionId;
}

export interface ProtocolPayload extends JsonObject {
  readonly request?: RuntimeRequest;
  readonly event?: RuntimeEvent;
  readonly approval?: ApprovalLifecycleProtocolRecord;
  readonly approvalControl?: ApprovalDecisionControlMessage;
  readonly control?: JsonObject;
  readonly response?: JsonObject;
}

export interface ProtocolStreamMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly streamId: string;
  readonly sequence: number;
  readonly pressure: BusPipePressureState;
  readonly overflowPolicy: BusPipeOverflowPolicy;
  readonly delivery: BusPipeDeliveryClass;
  readonly replayImpact: BusPipeReplayImpact;
  readonly droppedRecords?: number;
  readonly compactedRecords?: number;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface ProtocolPipelineMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly pipelineFingerprint: string;
  readonly prefixHashes: readonly {
    readonly layer: ContextPipelineLayerId;
    readonly prefixHash: string;
    readonly estimatedTokens: number;
  }[];
  readonly cache?: {
    readonly status: ContextStatuslineCacheStatus;
    readonly hitRate?: number;
    readonly hitTokens?: number;
    readonly missTokens?: number;
  };
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface ApprovalLifecycleProtocolRecord extends JsonObject {
  readonly protocolVersion: string;
  readonly schemaVersion: string;
  readonly messageId: MessageId;
  readonly kind: ApprovalLifecycleRecord["kind"];
  readonly approvalId: ApprovalId;
  readonly correlationId: CorrelationId;
  readonly sessionId?: SessionId;
  readonly trace: TraceContext;
  readonly redaction: ApprovalLifecycleRecord["redaction"];
  readonly compatibility: ApprovalLifecycleRecord["compatibility"];
  readonly decisionOptions: readonly string[];
  readonly summary: ApprovalRenderSummary;
  readonly auditReference: ApprovalAuditReference;
  readonly decision?: ApprovalDecision;
  readonly referencePitFixtureIds: readonly string[];
}

export interface ApprovalDecisionControlMessage extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "approval.decision";
  readonly approvalId: ApprovalId;
  readonly correlationId: CorrelationId;
  readonly sessionId?: SessionId;
  readonly decision: ApprovalDecision;
  readonly trace: TraceContext;
  readonly redaction: ApprovalDecision["redaction"];
  readonly compatibility: ApprovalLifecycleRecord["compatibility"];
}

export interface ProtocolEnvelope extends VersionedEnvelope<ProtocolMessageKind, ProtocolPayload> {
  readonly messageId: MessageId;
  readonly correlationId: CorrelationId;
  readonly routing: ProtocolRouting;
  readonly stream?: ProtocolStreamMetadata;
  readonly pipeline?: ProtocolPipelineMetadata;
}

export interface ProtocolResponse {
  readonly envelope: ProtocolEnvelope;
  readonly ok: boolean;
  readonly payload?: JsonValue;
  readonly error?: RedactedError;
}

export interface ProtocolTransport {
  send(envelope: ProtocolEnvelope): Promise<void>;
  receive(): AsyncIterable<ProtocolEnvelope>;
}

export interface ProtocolPipelineStage {
  readonly name: string;
  handle(envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
}

export interface ProtocolRouter {
  route(envelope: ProtocolEnvelope): Promise<ProtocolResponse | AsyncIterable<ProtocolEnvelope>>;
}

export interface ProtocolCodec {
  encode(envelope: ProtocolEnvelope): string;
  decode(raw: string): ProtocolEnvelope;
  validate(envelope: unknown): ProtocolEnvelope;
}

export interface ProtocolTraceFactory {
  createTrace(correlationId?: CorrelationId, sessionId?: SessionId): TraceContext;
}
