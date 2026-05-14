import type {
  CredentialRef,
  JsonObject,
  JsonValue,
  ModelCredentialValue,
  ModelCredentialProvider,
  ModelFinishReason,
  ModelGateway,
  ModelLiveVerificationRequest,
  ModelLiveVerificationResult,
  ModelProfile,
  ModelProviderConfig,
  ModelProviderEventMetadata,
  ModelProviderRequest,
  ModelProviderResponseChunk,
  ModelProviderTransport,
  ModelRequest,
  ModelStreamEvent,
  ModelToolChoice,
  ModelUsageMetadata,
  RedactedError
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import OpenAI from "openai";

const deepSeekProviderId = asId<"modelProvider">("provider-deepseek");
const deepSeekCredentialRef = asId<"credentialRef">("credential-deepseek-api-key");

export const deepSeekOpenAIProviderConfig: ModelProviderConfig = {
  providerId: deepSeekProviderId,
  provider: "deepseek",
  protocol: "openai-chat-completions",
  baseUrl: "https://api.deepseek.com",
  credentialRef: deepSeekCredentialRef
};

export const defaultDeepSeekProfile: ModelProfile = {
  id: asId<"modelProfile">("model-deepseek-default"),
  providerId: deepSeekProviderId,
  model: "deepseek-v4-flash",
  temperature: 0
};

export interface DeepSeekOpenAIProviderOptions {
  readonly config?: ModelProviderConfig;
  readonly transport?: ModelProviderTransport;
  readonly credentials?: ModelCredentialProvider;
  readonly timeoutMs?: number;
}

export class DeterministicMockModelGateway implements ModelGateway {
  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "delta", text: `DeepSeek mock response: ${lastUserMessageContent(request)}` };
    yield {
      kind: "usage",
      inputTokens: await this.countTokens(request.prompt, request.profile),
      outputTokens: 6,
      metadata: {
        inputTokens: await this.countTokens(request.prompt, request.profile),
        outputTokens: 6
      }
    };
    yield { kind: "finish", reason: "stop" };
    yield { kind: "done" };
  }

  async countTokens(text: string, _profile?: ModelProfile): Promise<number> {
    return countWhitespaceTokens(text);
  }

  async verify(request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult> {
    return verifyByStreaming(this, request);
  }
}

function lastUserMessageContent(request: ModelRequest): string {
  const messages = request.messages ?? [];
  const user = [...messages].reverse().find((message) => message.role === "user");
  return user?.content ?? request.prompt;
}

export class DeepSeekModelGatewaySkeleton implements ModelGateway {
  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield {
      kind: "error",
      error: providerError("LIVE_PROVIDER_NOT_CONFIGURED", "DeepSeek live provider adapter is intentionally deferred behind credentials and policy.", false)
    };
  }

  async countTokens(text: string, _profile?: ModelProfile): Promise<number> {
    return countWhitespaceTokens(text);
  }

  async verify(request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult> {
    return verifyByStreaming(this, request);
  }
}

export class DeepSeekOpenAIProvider implements ModelGateway {
  private readonly config: ModelProviderConfig;

  constructor(private readonly options: DeepSeekOpenAIProviderOptions = {}) {
    this.config = options.config ?? deepSeekOpenAIProviderConfig;
  }

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    const provider = this.providerMetadata(request.profile);
    if (!this.options.transport) {
      yield { kind: "error", error: providerError("PROVIDER_TRANSPORT_NOT_CONFIGURED", "DeepSeek provider transport is not configured.", false), provider };
      return;
    }

    const credentialRef = request.credentialRef ?? this.config.credentialRef;
    const credential = credentialRef ? await this.options.credentials?.resolve(credentialRef, request) : undefined;
    if (credentialRef && !credential) {
      yield { kind: "error", error: providerError("PROVIDER_CREDENTIAL_MISSING", "DeepSeek provider credential is missing.", false, { credentialRef }), provider };
      return;
    }

    const providerRequest = this.buildProviderRequest(request, credential?.value);
    const accumulator = createToolCallAccumulator();
    try {
      for await (const chunk of this.options.transport.stream(providerRequest, request.signal ? { signal: request.signal } : undefined)) {
        for (const event of normalizeDeepSeekChunk(chunk, provider, accumulator)) {
          yield event;
        }
      }
      for (const event of accumulator.flush(provider)) yield event;
      yield { kind: "done", provider };
    } catch (error) {
      yield {
        kind: "error",
        error: providerError("PROVIDER_TRANSPORT_FAILED", error instanceof Error ? error.message : "DeepSeek provider transport failed.", true),
        provider
      };
    }
  }

  async countTokens(text: string, _profile?: ModelProfile): Promise<number> {
    return countWhitespaceTokens(text);
  }

  async verify(request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult> {
    return verifyByStreaming(this, request);
  }

  buildProviderRequest(request: ModelRequest, credentialValue = ""): ModelProviderRequest {
    const body: JsonObject = {
      model: request.profile.model,
      messages: providerMessagesFrom(request),
      stream: true,
      temperature: request.profile.temperature ?? 0,
      ...(request.tools && request.tools.length > 0 ? { tools: request.tools } : {}),
      ...(request.toolChoice !== undefined ? { tool_choice: formatToolChoice(request.toolChoice) } : {}),
      ...(request.reasoning ? { thinking: { type: request.reasoning.enabled === false ? "disabled" : "enabled" } } : {}),
      ...(request.reasoning?.effort ? { reasoning_effort: request.reasoning.effort } : {}),
      ...(request.profile.providerOptions ? request.profile.providerOptions : {})
    };

    return {
      url: `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(credentialValue ? { authorization: `Bearer ${credentialValue}` } : {}),
        ...(this.config.defaultHeaders ?? {})
      },
      body,
      ...(request.timeoutMs ?? this.options.timeoutMs ? { timeoutMs: request.timeoutMs ?? this.options.timeoutMs } : {})
    };
  }

  private providerMetadata(profile: ModelProfile): ModelProviderEventMetadata {
    return {
      provider: this.config.provider,
      protocol: this.config.protocol,
      model: profile.model
    };
  }
}

function providerMessagesFrom(request: ModelRequest): readonly JsonObject[] {
  const sourceMessages = request.messages && request.messages.length > 0
    ? request.messages
    : [{ role: "user" as const, content: request.prompt }];
  return sourceMessages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.toolCallId ?? message.toolName ?? "tool-call"
      };
    }
    const toolCalls = message.toolCalls?.map((toolCall) => ({
      id: toolCall.id,
      type: "function",
      function: {
        name: toolCall.name,
        arguments: JSON.stringify(toolCall.input)
      }
    }));
    const reasoningContent = typeof (message as { reasoningContent?: unknown }).reasoningContent === "string"
      ? (message as { reasoningContent: string }).reasoningContent
      : undefined;
    return {
      role: message.role,
      content: message.content,
      ...(reasoningContent && reasoningContent.length > 0 ? { reasoning_content: reasoningContent } : {}),
      ...(toolCalls && toolCalls.length > 0 ? { tool_calls: toolCalls } : {})
    };
  });
}

export class StaticCredentialProvider implements ModelCredentialProvider {
  constructor(private readonly value: string, private readonly ref: CredentialRef = deepSeekCredentialRef) {}

  async resolve(): Promise<ModelCredentialValue> {
    return {
      ref: this.ref,
      value: this.value,
      redaction: { class: "secret" }
    };
  }
}

export class FixtureModelProviderTransport implements ModelProviderTransport {
  readonly requests: ModelProviderRequest[] = [];

  constructor(private readonly chunks: readonly ModelProviderResponseChunk[] = [], private readonly failure?: Error) {}

  async *stream(request: ModelProviderRequest): AsyncIterable<ModelProviderResponseChunk> {
    this.requests.push(request);
    if (this.failure) throw this.failure;
    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}

export class FetchModelProviderTransport implements ModelProviderTransport {
  async *stream(request: ModelProviderRequest, options?: { signal?: AbortSignal }): AsyncIterable<ModelProviderResponseChunk> {
    const init: RequestInit = {
      method: request.method,
      headers: request.headers as Record<string, string>,
      body: JSON.stringify(request.body)
    };
    const signals: AbortSignal[] = [];
    if (request.timeoutMs) signals.push(AbortSignal.timeout(request.timeoutMs));
    if (options?.signal) signals.push(options.signal);
    if (signals.length === 1) {
      const only = signals[0];
      if (only) init.signal = only;
    } else if (signals.length > 1) {
      init.signal = AbortSignal.any(signals);
    }
    const response = await fetch(request.url, init);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`DeepSeek provider HTTP ${response.status}: ${redactProviderErrorBody(body)}`);
    }

    if (!response.body) {
      throw new Error("DeepSeek provider response body is empty.");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const parsed = parseServerSentEventLine(line);
        if (parsed) yield parsed;
      }
    }

    buffer += decoder.decode();
    for (const line of buffer.split(/\r?\n/)) {
      const parsed = parseServerSentEventLine(line);
      if (parsed) yield parsed;
    }
  }
}

export class OpenAIModelProviderTransport implements ModelProviderTransport {
  async *stream(request: ModelProviderRequest, options?: { signal?: AbortSignal }): AsyncIterable<ModelProviderResponseChunk> {
    const apiKey = authorizationBearerToken(request.headers.authorization);
    if (!apiKey) {
      throw new Error("DeepSeek provider credential is missing.");
    }

    const client = new OpenAI({
      apiKey,
      baseURL: baseUrlFromRequestUrl(request.url),
      timeout: request.timeoutMs
    });

    const createParams = options?.signal
      ? await client.chat.completions.create(request.body as never, { signal: options.signal })
      : await client.chat.completions.create(request.body as never);
    if (isAsyncIterable(createParams)) {
      for await (const chunk of createParams) {
        yield { data: chunk as unknown as JsonObject };
      }
      return;
    }

    yield { data: createParams as unknown as JsonObject };
  }
}

export interface ToolCallAccumulator {
  ingest(value: unknown, provider: ModelProviderEventMetadata): ModelStreamEvent[];
  flush(provider: ModelProviderEventMetadata): ModelStreamEvent[];
}

interface ToolCallFragment {
  id?: string;
  name?: string;
  argumentsBuffer: string;
  argumentsIsString: boolean;
  argumentsObject?: JsonObject;
}

export function createToolCallAccumulator(): ToolCallAccumulator {
  const fragments = new Map<number, ToolCallFragment>();
  let fallbackIndex = 0;

  function ingest(value: unknown, _provider: ModelProviderEventMetadata): ModelStreamEvent[] {
    if (!isJsonObject(value)) return [];
    const rawIndex = numberValue(value.index);
    const index = rawIndex !== undefined ? rawIndex : fallbackIndex;
    if (rawIndex === undefined) fallbackIndex += 1;

    let fragment = fragments.get(index);
    if (!fragment) {
      fragment = { argumentsBuffer: "", argumentsIsString: false };
      fragments.set(index, fragment);
    }
    if (typeof value.id === "string" && value.id) fragment.id = value.id;
    const fn = isJsonObject(value.function) ? value.function : undefined;
    const name = stringValue(fn?.name) ?? stringValue(value.name);
    if (name) fragment.name = name;
    const rawArguments = fn?.arguments ?? value.arguments ?? value.input;
    if (typeof rawArguments === "string") {
      fragment.argumentsBuffer += rawArguments;
      fragment.argumentsIsString = true;
    } else if (isJsonObject(rawArguments)) {
      fragment.argumentsObject = rawArguments;
    }
    return [];
  }

  function flush(provider: ModelProviderEventMetadata): ModelStreamEvent[] {
    const events: ModelStreamEvent[] = [];
    const indices = [...fragments.keys()].sort((a, b) => a - b);
    for (const index of indices) {
      const fragment = fragments.get(index);
      if (!fragment || !fragment.name) continue;
      const input = fragment.argumentsObject
        ? fragment.argumentsObject
        : fragment.argumentsIsString
          ? parseToolInput(fragment.argumentsBuffer)
          : {};
      events.push({
        kind: "tool-call",
        ...(fragment.id ? { id: fragment.id } : {}),
        name: fragment.name,
        input,
        provider
      });
    }
    fragments.clear();
    fallbackIndex = 0;
    return events;
  }

  return { ingest, flush };
}

export function normalizeDeepSeekChunk(
  chunk: ModelProviderResponseChunk,
  provider: ModelProviderEventMetadata,
  accumulator?: ToolCallAccumulator
): readonly ModelStreamEvent[] {
  const data = chunk.data;
  if (typeof data.error === "object" && data.error !== null) {
    const error = data.error as JsonObject;
    return [{ kind: "error", error: providerError(String(error.code ?? "PROVIDER_ERROR"), String(error.message ?? "DeepSeek provider error."), Boolean(error.retryable ?? false)), provider }];
  }

  const events: ModelStreamEvent[] = [];
  const requestProvider = typeof data.id === "string" ? { ...provider, requestId: data.id } : provider;
  const choices = Array.isArray(data.choices) ? data.choices : [];
  for (const choice of choices) {
    if (!isJsonObject(choice)) continue;
    const delta = isJsonObject(choice.delta) ? choice.delta : isJsonObject(choice.message) ? choice.message : undefined;
    if (delta) {
      const reasoningText = stringValue(delta.reasoning_content) ?? stringValue(delta.reasoning) ?? stringValue(delta.thinking);
      if (reasoningText) {
        events.push({ kind: "reasoning", text: reasoningText, redaction: { class: "internal" }, provider: requestProvider });
      }
      const text = stringValue(delta.content);
      if (text) {
        events.push({ kind: "delta", text, provider: requestProvider });
      }
      const toolCalls = Array.isArray(delta.tool_calls) ? delta.tool_calls : [];
      for (const toolCall of toolCalls) {
        if (accumulator) {
          events.push(...accumulator.ingest(toolCall, requestProvider));
        } else {
          const event = normalizeToolCall(toolCall, requestProvider);
          if (event) events.push(event);
        }
      }
    }
    const finishReason = normalizeFinishReason(choice.finish_reason);
    if (finishReason) {
      if (accumulator && (finishReason === "tool-call" || finishReason === "stop" || finishReason === "length")) {
        events.push(...accumulator.flush(requestProvider));
      }
      events.push({ kind: "finish", reason: finishReason, provider: requestProvider });
    }
  }

  const usage = normalizeUsage(data.usage, requestProvider);
  if (usage) {
    events.push({
      kind: "usage",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      metadata: usage
    });
  }

  return events;
}

function normalizeToolCall(value: unknown, provider: ModelProviderEventMetadata): ModelStreamEvent | undefined {
  if (!isJsonObject(value)) return undefined;
  const fn = isJsonObject(value.function) ? value.function : undefined;
  const name = stringValue(fn?.name) ?? stringValue(value.name);
  if (!name) return undefined;
  const rawArguments = fn?.arguments ?? value.arguments ?? value.input ?? {};
  return {
    kind: "tool-call",
    ...(typeof value.id === "string" ? { id: value.id } : {}),
    name,
    input: parseToolInput(rawArguments),
    provider
  };
}

function normalizeUsage(value: unknown, provider: ModelProviderEventMetadata): ModelUsageMetadata | undefined {
  if (!isJsonObject(value)) return undefined;
  const inputTokens = numberValue(value.prompt_tokens) ?? numberValue(value.input_tokens);
  const outputTokens = numberValue(value.completion_tokens) ?? numberValue(value.output_tokens);
  if (inputTokens === undefined || outputTokens === undefined) return undefined;
  const details = isJsonObject(value.completion_tokens_details) ? value.completion_tokens_details : {};
  const promptDetails = isJsonObject(value.prompt_tokens_details) ? value.prompt_tokens_details : {};
  const reasoningTokens = numberValue(details.reasoning_tokens);
  const hitTokens = numberValue(value.prompt_cache_hit_tokens) ?? numberValue(promptDetails.cached_tokens);
  const missTokens = numberValue(value.prompt_cache_miss_tokens);
  return {
    inputTokens,
    outputTokens,
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
    ...(hitTokens !== undefined || missTokens !== undefined ? { cache: { ...(hitTokens !== undefined ? { hitTokens } : {}), ...(missTokens !== undefined ? { missTokens } : {}) } } : {}),
    provider
  };
}

function normalizeFinishReason(value: unknown): ModelFinishReason | undefined {
  if (value === undefined || value === null) return undefined;
  switch (String(value)) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
    case "tool_call":
      return "tool-call";
    case "content_filter":
      return "content-filter";
    default:
      return "unknown";
  }
}

function parseToolInput(value: unknown): JsonObject {
  if (isJsonObject(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isJsonObject(parsed) ? parsed : { value: parsed as JsonValue };
  } catch {
    return { raw: value };
  }
}

export function formatToolChoice(choice: ModelToolChoice): JsonValue {
  if (choice === "auto" || choice === "required" || choice === "none") return choice;
  return { type: "function", function: { name: choice.name } };
}

function providerError(code: string, message: string, retryable: boolean, details: JsonObject = {}): RedactedError {
  return {
    code,
    message,
    retryable,
    redaction: { class: "public" },
    ...(Object.keys(details).length > 0 ? { details } : {})
  };
}

export async function verifyByStreaming(gateway: ModelGateway, request: ModelLiveVerificationRequest): Promise<ModelLiveVerificationResult> {
  const started = Date.now();
  const eventKinds: string[] = [];
  const diagnostics: RedactedError[] = [];
  let usage: ModelLiveVerificationResult["usage"];
  let terminalStatus: ModelLiveVerificationResult["terminalStatus"] = "failed";
  let reachable = false;

  for await (const event of gateway.stream({
    profile: request.profile,
    prompt: request.prompt,
    ...(request.credentialRef ? { credentialRef: request.credentialRef } : {}),
    ...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {}),
    metadata: { liveVerification: true, ...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {}) }
  } as ModelRequest)) {
    eventKinds.push(event.kind);
    if (event.kind === "delta" || event.kind === "reasoning" || event.kind === "finish" || event.kind === "usage" || event.kind === "done") reachable = true;
    if (event.kind === "usage") usage = event.metadata;
    if (event.kind === "error") {
      diagnostics.push(redactProviderError(event.error));
      terminalStatus = event.error.code === "PROVIDER_CREDENTIAL_MISSING" ? "missing-credential" : "failed";
    }
    if (event.kind === "done" || event.kind === "finish") terminalStatus = diagnostics.length === 0 ? "completed" : terminalStatus;
  }

  return {
    ok: terminalStatus === "completed",
    provider: { provider: "deepseek", protocol: "openai-chat-completions", model: request.profile.model },
    reachable,
    terminalStatus,
    latencyMs: Date.now() - started,
    eventKinds,
    ...(usage ? { usage } : {}),
    ...(diagnostics[0] ? { error: diagnostics[0] } : {}),
    diagnostics,
    redaction: { class: "internal" }
  };
}

function redactProviderError(error: RedactedError): RedactedError {
  return {
    ...error,
    message: error.message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED]"),
    redaction: { class: "public" }
  };
}

function countWhitespaceTokens(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function authorizationBearerToken(value: JsonValue | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim();
}

function baseUrlFromRequestUrl(url: string): string {
  return url.replace(/\/chat\/completions$/, "");
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value;
}

function parseServerSentEventLine(line: string): ModelProviderResponseChunk | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return undefined;
  const payload = trimmed.slice("data:".length).trim();
  if (payload === "" || payload === "[DONE]") return undefined;
  try {
    const data: unknown = JSON.parse(payload);
    if (!isJsonObject(data)) {
      throw new Error("SSE payload is not a JSON object.");
    }
    return { data };
  } catch (error) {
    throw new Error(error instanceof Error ? `DeepSeek provider SSE parse failed: ${error.message}` : "DeepSeek provider SSE parse failed.");
  }
}

function redactProviderErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "empty response";
  return trimmed.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").slice(0, 500);
}
