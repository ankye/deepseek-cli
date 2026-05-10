import type {
  AgentLoopRequest,
  CapabilityManifest,
  JsonObject,
  ModelProviderEventMetadata,
  RuntimeEvent
} from "@deepseek/platform-contracts";
import { redactSecretTextForRuntime } from "./errors.js";

export function modelToolSchema(manifest: CapabilityManifest): JsonObject {
  return {
    type: "function",
    function: {
      name: String(manifest.id),
      description: manifest.description ?? manifest.name,
      parameters: manifest.inputSchema
    },
    metadata: {
      capabilityId: manifest.id,
      version: manifest.version,
      sideEffect: manifest.sideEffect,
      permissions: manifest.permissions,
      timeoutMs: manifest.timeoutMs ?? 30_000,
      replayPolicy: manifest.replayPolicy ?? {}
    }
  };
}

export function providerMetadata(request: AgentLoopRequest): ModelProviderEventMetadata {
  return {
    provider: String(request.profile.providerId),
    protocol: "openai-chat-completions",
    model: request.profile.model
  };
}

export function modelToolResultText(event: RuntimeEvent | undefined): string {
  if (!event) return "Tool execution produced no terminal event.";
  if (event.error) return `Tool execution failed: ${event.error.message}`;
  const output = event.data.output;
  if (isJsonObjectForRuntime(output)) {
    const evidence = output.evidence;
    if (isJsonObjectForRuntime(evidence)) {
      const preview = evidence.preview;
      if (isJsonObjectForRuntime(preview) && typeof preview.text === "string") return preview.text;
      return JSON.stringify({
        status: evidence.status ?? "completed",
        tool: evidence.tool ?? "",
        affectedPaths: evidence.affectedPaths ?? []
      });
    }
  }
  return JSON.stringify(event.data);
}

export function boundedModelText(value: string, limitBytes: number): string {
  const safe = redactSecretTextForRuntime(value);
  return Buffer.byteLength(safe, "utf8") > limitBytes ? safe.slice(0, limitBytes) : safe;
}

export function isJsonObjectForRuntime(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
