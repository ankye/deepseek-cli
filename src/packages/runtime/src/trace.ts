import type { SessionId, TraceContext } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export function runtimeTrace(sessionId: SessionId, scope: string): TraceContext {
  return {
    traceId: asId<"trace">(`trace-${scope}-${sessionId}`),
    spanId: asId<"span">(`span-${scope}-${sessionId}`),
    correlationId: asId<"correlation">(`corr-${scope}-${sessionId}`),
    sessionId
  };
}

export function countTokens(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

export function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
