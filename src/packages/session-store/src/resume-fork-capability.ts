import type {
  JsonObject,
  SessionForkRequest,
  SessionId,
  SessionStore
} from "@deepseek/platform-contracts";

export type SessionResumeForkOperation =
  | { readonly action: "resume"; readonly sessionId: SessionId }
  | (SessionForkRequest & { readonly action: "fork" });

export interface SessionResumeForkEvidence extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly familyId: "session.resume-fork";
  readonly action: SessionResumeForkOperation["action"];
  readonly status: "completed" | "rejected";
  readonly sessionId: SessionId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly latestSequence?: number;
  readonly forkPointSequence?: number;
  readonly inheritedEventCount?: number;
  readonly diagnostics: readonly string[];
  readonly replayFingerprint: string;
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export async function executeSessionResumeFork(store: SessionStore, operation: SessionResumeForkOperation): Promise<SessionResumeForkEvidence> {
  if (operation.action === "resume") {
    const result = await store.resume(operation.sessionId);
    if (!result.ok || !result.value) {
      return sessionResumeForkEvidence({
        action: "resume",
        status: "rejected",
        sessionId: operation.sessionId,
        diagnostics: [result.error?.code ?? "SESSION_RESUME_REJECTED"]
      });
    }
    return sessionResumeForkEvidence({
      action: "resume",
      status: "completed",
      sessionId: result.value.sessionId,
      latestSequence: result.value.latestSequence,
      inheritedEventCount: result.value.eventCount,
      diagnostics: []
    });
  }

  const result = await store.fork(operation);
  if (!result.ok || !result.value) {
    return sessionResumeForkEvidence({
      action: "fork",
      status: "rejected",
      sessionId: operation.parentSessionId,
      parentSessionId: operation.parentSessionId,
      diagnostics: [result.error?.code ?? "SESSION_FORK_REJECTED"]
    });
  }
  return sessionResumeForkEvidence({
    action: "fork",
    status: "completed",
    sessionId: result.value.childSessionId,
    parentSessionId: result.value.parentSessionId,
    childSessionId: result.value.childSessionId,
    forkPointSequence: result.value.forkPointSequence,
    inheritedEventCount: result.value.inheritedEventCount,
    diagnostics: []
  });
}

function sessionResumeForkEvidence(input: {
  readonly action: SessionResumeForkEvidence["action"];
  readonly status: SessionResumeForkEvidence["status"];
  readonly sessionId: SessionId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly latestSequence?: number;
  readonly forkPointSequence?: number;
  readonly inheritedEventCount?: number;
  readonly diagnostics: readonly string[];
}): SessionResumeForkEvidence {
  return {
    schemaVersion: "1.0.0",
    familyId: "session.resume-fork",
    action: input.action,
    status: input.status,
    sessionId: input.sessionId,
    ...(input.parentSessionId ? { parentSessionId: input.parentSessionId } : {}),
    ...(input.childSessionId ? { childSessionId: input.childSessionId } : {}),
    ...(input.latestSequence !== undefined ? { latestSequence: input.latestSequence } : {}),
    ...(input.forkPointSequence !== undefined ? { forkPointSequence: input.forkPointSequence } : {}),
    ...(input.inheritedEventCount !== undefined ? { inheritedEventCount: input.inheritedEventCount } : {}),
    diagnostics: input.diagnostics,
    replayFingerprint: `session.resume-fork:${stableHash(JSON.stringify(input))}`,
    redaction: { class: "internal", fields: ["sessionId", "parentSessionId", "childSessionId"] }
  };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
