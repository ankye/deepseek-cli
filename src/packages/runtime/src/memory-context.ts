import type {
  AgentLoopRequest,
  ContextGraphNode,
  MemoryEntry,
  MemoryScope,
  RedactedError,
  RuntimeDependencies,
  RuntimeMemoryCollectionEvidence,
  SessionId
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { memoryCandidateFingerprint } from "@deepseek/memory-cache-management";
import { countTokens, stableHash } from "./trace.js";

export async function memoryContextCandidates(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId
): Promise<{ readonly nodes: readonly ContextGraphNode[]; readonly evidence: RuntimeMemoryCollectionEvidence }> {
  const scopes: readonly MemoryScope[] = ["working", "session", "project", "user", "semantic", "skill"];
  const nodes: ContextGraphNode[] = [];
  const degradedScopes: MemoryScope[] = [];
  const diagnostics: RedactedError[] = [];
  const scopeCounts: Record<string, number> = {};
  const permanent = permanentMemoryDiagnostics(deps.memory);
  for (const scope of scopes) {
    let entries: readonly MemoryEntry[];
    try {
      entries = await deps.memory.query(scope, sessionId);
    } catch (error) {
      degradedScopes.push(scope);
      diagnostics.push({
        code: "MEMORY_QUERY_FAILED",
        message: error instanceof Error ? error.message : "Memory query failed",
        retryable: true,
        redaction: { class: "internal" },
        details: { scope }
      });
      continue;
    }
    scopeCounts[scope] = entries.length;
    entries.forEach((entry, index) => {
      nodes.push(memoryEntryNode(entry, request, sessionId, turnId, index));
    });
  }
  const replayFingerprint = stableHash(JSON.stringify({
    scopes,
    scopeCounts,
    degradedScopes,
    permanent,
    fingerprints: nodes.flatMap((node) => node.dependencyFingerprints)
  }));
  return {
    nodes,
    evidence: {
      schemaVersion: "1.0.0",
      status: degradedScopes.length > 0 ? "degraded" : "completed",
      scopes,
      scopeCounts,
      candidateCount: nodes.length,
      degradedScopes,
      permanentMemory: {
        configured: permanent.configured,
        providerId: permanent.providerId,
        promotedFreshCount: nodes.filter((node) => node.provenance.permanentMemory === true).length,
        staleSkippedCount: permanent.staleSkippedCount,
        conflictedSkippedCount: permanent.conflictedSkippedCount,
        roles: permanent.roles,
        diagnostics: permanent.diagnostics
      },
      diagnostics,
      replayFingerprint,
      redaction: { class: "internal", fields: ["diagnostics.details", "permanentMemory.diagnostics"] }
    }
  };
}

function memoryEntryNode(
  entry: MemoryEntry,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: import("@deepseek/platform-contracts").TurnId,
  index: number
): ContextGraphNode {
  const fingerprint = memoryCandidateFingerprint({ entry, sessionId });
  const permanent = entry.provenance.permanentMemory === true;
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`context-memory-${sanitizeId(entry.scope)}-${sanitizeId(String(entry.id))}`),
    kind: "memory-ref",
    source: "memory",
    lifecycle: memoryLifecycle(entry.scope),
    scope: {
      sessionId,
      turnId,
      ...(request.agentId ? { agentId: request.agentId } : {}),
      workspaceRoot: request.workspaceRoot,
      host: request.caller
    },
    priority: memoryPriority(entry.scope, permanent) - index,
    content: formatMemoryContent(entry),
    contentRef: `memory:${entry.scope}:${entry.id}`,
    estimatedTokens: countTokens(entry.content),
    redaction: entry.redaction,
    provenance: {
      ...entry.provenance,
      source: "runtime.memory",
      memoryRole: permanent ? "permanent-memory" : entry.provenance.pageId ? "pageindex-recall" : "scoped-memory",
      memoryId: entry.id,
      scope: entry.scope,
      confidence: entry.confidence ?? 1,
      redaction: { class: "internal", fields: ["memoryId"] }
    },
    dependencyFingerprints: [fingerprint],
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION },
    createdAt: "1970-01-01T00:00:00.000Z"
  };
}

function memoryLifecycle(scope: MemoryScope): ContextGraphNode["lifecycle"] {
  if (scope === "working") return "turn";
  if (scope === "session") return "session";
  if (scope === "user" || scope === "semantic" || scope === "skill") return "global";
  return "project";
}

function memoryPriority(scope: MemoryScope, permanent: boolean): number {
  if (permanent) return scope === "project" ? 760 : 740;
  if (scope === "working") return 780;
  if (scope === "session") return 720;
  return 650;
}

function formatMemoryContent(entry: MemoryEntry): string {
  if (entry.provenance.permanentMemory === true) {
    return [
      `Permanent memory ${entry.id}`,
      `Scope: ${entry.scope}`,
      `Freshness: ${String(entry.provenance.freshnessStatus ?? "fresh")}`,
      `Conflict: ${String(entry.provenance.conflictStatus ?? "none")}`,
      "Priority: lower than current user instructions, repository guidance, and host policy.",
      entry.content
    ].join("\n");
  }
  return [
    `Memory ${entry.id}`,
    `Scope: ${entry.scope}`,
    entry.content
  ].join("\n");
}

function permanentMemoryDiagnostics(memory: RuntimeDependencies["memory"]): {
  readonly configured: boolean;
  readonly providerId: string;
  readonly staleSkippedCount: number;
  readonly conflictedSkippedCount: number;
  readonly roles: readonly string[];
  readonly diagnostics: readonly string[];
} {
  const maybe = memory as Partial<{
    manifest: () => { readonly providerId: string };
  }>;
  const configured = typeof maybe.manifest === "function";
  return {
    configured,
    providerId: configured ? maybe.manifest?.().providerId ?? "" : "",
    staleSkippedCount: 0,
    conflictedSkippedCount: 0,
    roles: configured ? ["source-evidence", "governed-promoted-memory"] : ["scoped-memory"],
    diagnostics: configured ? [] : ["permanent-memory.provider-not-configured"]
  };
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "-");
}
