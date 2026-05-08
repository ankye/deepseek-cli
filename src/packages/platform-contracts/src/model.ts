import type { JsonObject, RedactedError } from "./common.js";
import type { ModelProfileId, ModelProviderId } from "./ids.js";

export interface ModelProfile {
  readonly id: ModelProfileId;
  readonly providerId: ModelProviderId;
  readonly model: string;
  readonly temperature?: number;
}

export interface ModelRequest {
  readonly profile: ModelProfile;
  readonly prompt: string;
  readonly tools?: readonly JsonObject[];
}

export type ModelStreamEvent =
  | { readonly kind: "delta"; readonly text: string }
  | { readonly kind: "tool-call"; readonly name: string; readonly input: JsonObject }
  | { readonly kind: "usage"; readonly inputTokens: number; readonly outputTokens: number }
  | { readonly kind: "error"; readonly error: RedactedError }
  | { readonly kind: "done" };

export interface ModelGateway {
  stream(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
  countTokens(text: string, profile?: ModelProfile): Promise<number>;
}
