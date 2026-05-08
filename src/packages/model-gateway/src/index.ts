import type { ModelGateway, ModelProfile, ModelRequest, ModelStreamEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export const defaultDeepSeekProfile: ModelProfile = {
  id: asId<"modelProfile">("model-deepseek-default"),
  providerId: asId<"modelProvider">("provider-deepseek"),
  model: "deepseek-chat",
  temperature: 0
};

export class DeterministicMockModelGateway implements ModelGateway {
  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield { kind: "delta", text: `DeepSeek mock response: ${request.prompt}` };
    yield {
      kind: "usage",
      inputTokens: await this.countTokens(request.prompt, request.profile),
      outputTokens: 6
    };
    yield { kind: "done" };
  }

  async countTokens(text: string, _profile?: ModelProfile): Promise<number> {
    return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  }
}

export class DeepSeekModelGatewaySkeleton implements ModelGateway {
  async *stream(_request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    yield {
      kind: "error",
      error: {
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        message: "DeepSeek live provider adapter is intentionally deferred behind credentials and policy.",
        retryable: false,
        redaction: { class: "public" }
      }
    };
  }

  async countTokens(text: string, _profile?: ModelProfile): Promise<number> {
    return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  }
}
