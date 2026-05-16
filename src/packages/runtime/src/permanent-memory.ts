import type {
  AgentLoopRequest,
  PermanentMemoryCandidateInput,
  PermanentMemoryManager,
  RuntimeDependencies,
  RuntimeEvent,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { agentLoopEvent, recordRuntimeAdapterEvent } from "./events.js";
import { stableHash } from "./trace.js";

export async function* proposePermanentMemoryCandidates(
  deps: RuntimeDependencies,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext
): AsyncGenerator<RuntimeEvent, void, void> {
  const memory = permanentMemoryManager(deps.memory);
  if (!memory) return;
  const settings = await memory.settings();
  if (!settings.enabled || settings.generateEnabled === false) {
    const disabled = agentLoopEvent("memory.permanent.disabled", sessionId, turnId, trace, {
      schemaVersion: "1.0.0",
      providerId: settings.providerId,
      enabled: settings.enabled,
      generateEnabled: settings.generateEnabled ?? true,
      redaction: { class: "internal" }
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, disabled);
    yield disabled;
    return;
  }
  const candidates = candidateInputsFromPrompt(request, sessionId, settings);
  for (const candidate of candidates) {
    const result = await memory.putCandidate(candidate);
    const proposed = agentLoopEvent("memory.permanent.candidate.proposed", sessionId, turnId, trace, {
      schemaVersion: "1.0.0",
      providerId: settings.providerId,
      ok: result.ok,
      status: result.status,
      memoryId: result.entry?.id ?? "",
      state: result.entry?.state ?? "",
      candidateKind: result.entry?.candidateKind ?? candidate.candidateKind ?? "",
      sourceEvidenceCount: candidate.sourceEvidence?.length ?? 0,
      diagnostics: result.diagnostics,
      replayFingerprint: `permanent-memory.candidate:${stableHash(JSON.stringify({
        providerId: settings.providerId,
        ok: result.ok,
        status: result.status,
        memoryId: result.entry?.id ?? "",
        diagnostics: result.diagnostics
      }))}`,
      redaction: { class: "internal", fields: ["diagnostics", "memoryId"] }
    }, request.agentId);
    await recordRuntimeAdapterEvent(deps, proposed);
    yield proposed;
  }
}

function permanentMemoryManager(memory: RuntimeDependencies["memory"]): PermanentMemoryManager | undefined {
  const candidate = memory as Partial<PermanentMemoryManager>;
  return typeof candidate.putCandidate === "function" && typeof candidate.queryPermanent === "function" && typeof candidate.settings === "function"
    ? candidate as PermanentMemoryManager
    : undefined;
}

function candidateInputsFromPrompt(request: AgentLoopRequest, sessionId: SessionId, settings: Awaited<ReturnType<PermanentMemoryManager["settings"]>>): readonly PermanentMemoryCandidateInput[] {
  if (isExcludedAutomaticSource(request.caller) && !explicitRememberText(request.prompt)) return [];
  const prompt = request.prompt.trim();
  const explicit = explicitRememberText(prompt);
  const decision = decisionText(prompt);
  const correction = correctionText(prompt);
  const candidates: PermanentMemoryCandidateInput[] = [];
  if (explicit) candidates.push(candidateForText(request, sessionId, explicit, "user-explicit"));
  if (backgroundExtractionEligible(request, settings)) {
    if (!explicit && decision) candidates.push(candidateForText(request, sessionId, decision, "runtime-event", "project-decision"));
    if (!explicit && correction) candidates.push(candidateForText(request, sessionId, correction, "runtime-event", "correction"));
  }
  return candidates.slice(0, Math.max(1, settings.maxCandidatesPerTurn ?? 3));
}

function candidateForText(
  request: AgentLoopRequest,
  sessionId: SessionId,
  content: string,
  sourceKind: "user-explicit" | "runtime-event",
  forcedKind?: PermanentMemoryCandidateInput["candidateKind"]
): PermanentMemoryCandidateInput {
  const candidateKind: NonNullable<PermanentMemoryCandidateInput["candidateKind"]> = forcedKind ?? candidateKindFor(content);
  const scope = candidateKind === "preference" ? "user" : candidateKind === "workflow-procedure" ? "skill" : "project";
  return {
    scope,
    content,
    sessionId,
    candidateKind,
    promotionMode: "manual",
    tags: [candidateKind, "runtime-candidate"],
    confidence: sourceKind === "user-explicit" ? 0.95 : 0.7,
    scopeSelector: {
      scope,
      workspaceRoot: request.workspaceRoot,
      ...(request.agentId ? { agentId: request.agentId } : {})
    },
    sourceEvidence: [{
      sourceKind,
      sourceId: `${request.caller}:${stableHash(request.prompt)}`,
      sourceHash: stableHash(content),
      sourceClass: request.caller,
      redaction: { class: "internal" }
    }],
    ...(candidateKind === "workflow-procedure" ? {
      procedure: { routeTo: "skill", reason: "repeatable workflow candidates are governed as skills/procedures" }
    } : {}),
    provenance: {
      source: "runtime.permanent-memory-extraction",
      caller: request.caller,
      promptHash: stableHash(request.prompt),
      extraction: {
        backgroundEligible: sourceKind === "runtime-event",
        lockId: "permanent-memory.cli-background-extraction",
        budgetClass: "candidate-per-turn"
      }
    }
  };
}

function backgroundExtractionEligible(request: AgentLoopRequest, settings: Awaited<ReturnType<PermanentMemoryManager["settings"]>>): boolean {
  if (settings.backgroundExtractionEnabled === false) return false;
  if (isExcludedAutomaticSource(request.caller)) return false;
  if (request.prompt.trim().length < (settings.minimumCandidateChars ?? 24)) return false;
  return true;
}

function explicitRememberText(prompt: string): string | undefined {
  const english = /\bremember(?: that| this|:)?\s+([\s\S]{6,})$/i.exec(prompt);
  if (english?.[1]) return english[1].trim();
  const chinese = /(?:记住|记一下|以后记得)[:：]?\s*([\s\S]{4,})$/.exec(prompt);
  return chinese?.[1]?.trim();
}

function decisionText(prompt: string): string | undefined {
  const match = /\b(?:decision|decided|architecture decision|adr)[:：]?\s+([\s\S]{8,})$/i.exec(prompt);
  return match?.[1]?.trim();
}

function correctionText(prompt: string): string | undefined {
  if (/\b(actually|correction|not .+ but)\b/i.test(prompt) || /不是.+是/.test(prompt)) return prompt;
  return undefined;
}

function candidateKindFor(content: string): NonNullable<PermanentMemoryCandidateInput["candidateKind"]> {
  if (/\b(prefer|preference|my default|use .+ by default)\b/i.test(content) || /我偏好|默认用/.test(content)) return "preference";
  if (/\b(step|workflow|procedure|whenever|each time)\b/i.test(content) || /每次|流程|步骤/.test(content)) return "workflow-procedure";
  if (/\b(decision|decided|architecture|adr)\b/i.test(content) || /决策|架构/.test(content)) return "project-decision";
  if (/\b(actually|correction|not .+ but)\b/i.test(content) || /不是.+是/.test(content)) return "correction";
  return "fact";
}

function isExcludedAutomaticSource(caller: string): boolean {
  return /(mcp|web|connector|browser|screen|third-party)/i.test(caller);
}
