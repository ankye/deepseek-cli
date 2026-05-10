import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { CredentialRef, ModelProfileId, ModelProviderId } from "./ids.js";

export type ModelProviderProtocol = "openai-chat-completions" | "anthropic-messages";

export interface ModelProviderConfig extends JsonObject {
  readonly providerId: ModelProviderId;
  readonly provider: string;
  readonly protocol: ModelProviderProtocol;
  readonly baseUrl: string;
  readonly defaultHeaders?: JsonObject;
  readonly credentialRef?: CredentialRef;
}

export interface ModelProfile extends JsonObject {
  readonly id: ModelProfileId;
  readonly providerId: ModelProviderId;
  readonly model: string;
  readonly temperature?: number;
  readonly providerOptions?: JsonObject;
}

export interface ModelReasoningOptions extends JsonObject {
  readonly enabled?: boolean;
  readonly effort?: "low" | "medium" | "high";
}

export type ModelChatMessageRole = "system" | "user" | "assistant" | "tool";

export interface ModelChatToolCall extends JsonObject {
  readonly id: string;
  readonly name: string;
  readonly input: JsonObject;
}

export interface ModelChatMessage extends JsonObject {
  readonly role: ModelChatMessageRole;
  readonly content: string;
  readonly toolCallId?: string;
  readonly toolName?: string;
  readonly toolCalls?: readonly ModelChatToolCall[];
  readonly reasoningContent?: string;
  readonly reasoningRedaction?: RedactionMetadata;
}

export type ModelToolChoice =
  | "auto"
  | "required"
  | "none"
  | { readonly type: "function"; readonly name: string };

export interface ModelRequest {
  readonly profile: ModelProfile;
  readonly prompt: string;
  readonly messages?: readonly ModelChatMessage[];
  readonly credentialRef?: CredentialRef;
  readonly timeoutMs?: number;
  readonly tools?: readonly JsonObject[];
  readonly toolChoice?: ModelToolChoice;
  readonly reasoning?: ModelReasoningOptions;
  readonly metadata?: JsonObject;
  readonly signal?: AbortSignal;
}

export interface ModelProviderRequest extends JsonObject {
  readonly url: string;
  readonly method: "POST";
  readonly headers: JsonObject;
  readonly body: JsonObject;
  readonly timeoutMs?: number;
}

export interface ModelProviderResponseChunk extends JsonObject {
  readonly data: JsonObject;
}

export interface ModelProviderTransportOptions {
  readonly signal?: AbortSignal;
}

export interface ModelProviderTransport {
  stream(request: ModelProviderRequest, options?: ModelProviderTransportOptions): AsyncIterable<ModelProviderResponseChunk>;
}

export interface ModelCredentialValue extends JsonObject {
  readonly ref: CredentialRef;
  readonly value: string;
  readonly redaction: RedactionMetadata;
}

export interface ModelCredentialProvider {
  resolve(ref: CredentialRef, request: ModelRequest): Promise<ModelCredentialValue | undefined>;
}

export interface ModelProviderEventMetadata extends JsonObject {
  readonly provider: string;
  readonly protocol: ModelProviderProtocol;
  readonly model: string;
  readonly requestId?: string;
}

export interface ModelUsageCacheMetadata extends JsonObject {
  readonly hitTokens?: number;
  readonly missTokens?: number;
}

export interface ModelUsageMetadata extends JsonObject {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly reasoningTokens?: number;
  readonly cache?: ModelUsageCacheMetadata;
  readonly provider?: ModelProviderEventMetadata;
}

export type ModelFinishReason = "stop" | "length" | "tool-call" | "content-filter" | "error" | "unknown";

export type ModelStreamEvent =
  | { readonly kind: "delta"; readonly text: string; readonly provider?: ModelProviderEventMetadata }
  | { readonly kind: "reasoning"; readonly text: string; readonly redaction: RedactionMetadata; readonly provider?: ModelProviderEventMetadata }
  | { readonly kind: "tool-call"; readonly id?: string; readonly name: string; readonly input: JsonObject; readonly provider?: ModelProviderEventMetadata }
  | { readonly kind: "usage"; readonly inputTokens: number; readonly outputTokens: number; readonly metadata?: ModelUsageMetadata }
  | { readonly kind: "finish"; readonly reason: ModelFinishReason; readonly provider?: ModelProviderEventMetadata }
  | { readonly kind: "error"; readonly error: RedactedError; readonly provider?: ModelProviderEventMetadata }
  | { readonly kind: "done"; readonly provider?: ModelProviderEventMetadata };

export interface ModelGateway {
  stream(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
  countTokens(text: string, profile?: ModelProfile): Promise<number>;
  verify?(request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult>;
}

export interface ModelLiveVerificationRequest {
  readonly profile: ModelProfile;
  readonly credentialRef?: CredentialRef;
  readonly prompt: string;
  readonly timeoutMs?: number;
}

export interface ModelLiveVerificationResult extends JsonObject {
  readonly ok: boolean;
  readonly provider: ModelProviderEventMetadata;
  readonly reachable: boolean;
  readonly terminalStatus: "completed" | "failed" | "missing-credential" | "unsupported";
  readonly latencyMs?: number;
  readonly eventKinds: readonly string[];
  readonly usage?: ModelUsageMetadata;
  readonly error?: RedactedError;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
}
