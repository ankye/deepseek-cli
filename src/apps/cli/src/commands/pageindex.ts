import {
  CHAT_PAGEINDEX_STORAGE_PAGE_LIMIT as SHARED_PAGEINDEX_STORAGE_PAGE_LIMIT,
  PAGEINDEX_DEFAULT_PREVIEW_LIMIT,
  PAGEINDEX_DEFAULT_RESULT_LIMIT,
  freshnessEvidenceFromMetadata,
  markStalePageIndexPagesAfterWorkspaceEdits as markSharedStaleAfterWorkspaceEdits,
  markStalePageIndexPagesFromWorkspaceWatermark as markSharedStaleFromWorkspaceWatermark,
  normalizePageIndexPages,
  pageIndexPagesFromUnknown,
  pageIndexResultListItemId,
  recordPageIndexTurn,
  renderFreshnessEvidence,
  resolvePageIndexRecall,
  workspacePageIndexPagesFromSessionPages as sharedWorkspacePageIndexPagesFromSessionPages
} from "@deepseek/index-provider";
import type {
  AgentLoopOutputMode,
  AgentLoopTerminalStatus,
  CliCompositionSnapshot,
  CliResultList,
  CliResultListItem,
  IndexRecallItem,
  IndexRecallScope,
  JsonObject,
  PageIndexPage,
  RuntimeEvent,
  SessionId,
  TurnId
} from "@deepseek/platform-contracts";
import { SESSION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { ChatPaletteState } from "./palette-state.js";

export interface ChatPageIndexPage extends JsonObject {
  readonly kind: "pageindex.page";
  readonly schemaVersion?: string;
  readonly scope: "session" | "workspace";
  readonly pageId: string;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly sequence: number;
  readonly status: AgentLoopTerminalStatus;
  readonly traceId: string;
  readonly createdAt: string;
  readonly promptPreview: string;
  readonly assistantPreview: string;
  readonly evidenceQuality: JsonObject;
  readonly freshnessEvidence?: JsonObject;
  readonly redaction: JsonObject;
  readonly semantic: JsonObject;
}

export type ChatPageIndexRecallScope = IndexRecallScope;

export interface ChatPageIndexRecallRequest extends JsonObject {
  readonly scope: ChatPageIndexRecallScope;
  readonly query: string;
}

export type ChatPageIndexRecallParseResult =
  | { readonly ok: true; readonly value: ChatPageIndexRecallRequest }
  | { readonly ok: false; readonly code: "CLI_PALETTE_RECALL_SCOPE_REQUIRED" | "CLI_PALETTE_RECALL_SCOPE_INVALID"; readonly scopeValue?: string };

export interface ChatPageIndexRecallSummary extends JsonObject {
  readonly kind: "palette.recall";
  readonly query: string;
  readonly resultListId: string;
  readonly scope: ChatPageIndexRecallScope;
  readonly indexedCount: number;
  readonly matchedCount: number;
  readonly renderedCount: number;
  readonly activeItemId: string | undefined;
  readonly redaction: JsonObject;
}

export interface ChatPageIndexRecallDeferred extends JsonObject {
  readonly kind: "palette.recall.deferred";
  readonly query: string;
  readonly requestedScope: "workspace" | "global";
  readonly availableScopes: readonly ChatPageIndexRecallScope[];
  readonly code: "CLI_PALETTE_RECALL_SCOPE_DEFERRED";
  readonly reason: string;
  readonly redaction: JsonObject;
}

export interface ChatPageIndexRecallExplain extends JsonObject {
  readonly kind: "palette.recall.explain";
  readonly ok: boolean;
  readonly selector: string;
  readonly resultListId: string | undefined;
  readonly itemId: string | undefined;
  readonly targetId: string | undefined;
  readonly scope: string | undefined;
  readonly pageId: string | undefined;
  readonly sessionId: string | undefined;
  readonly turnId: string | undefined;
  readonly createdAt: string | undefined;
  readonly status: string | undefined;
  readonly deterministicScore: number | undefined;
  readonly ranking: string | undefined;
  readonly rankingReason: string | undefined;
  readonly matchedFields: readonly string[];
  readonly freshnessStatus: string | undefined;
  readonly freshnessEvidence: JsonObject;
  readonly semanticStatus: string | undefined;
  readonly promptPreview: string | undefined;
  readonly assistantPreview: string | undefined;
  readonly diagnosticCode: string | undefined;
  readonly redaction: JsonObject;
}

export interface ChatPageIndexSnapshotPayload extends JsonObject {
  readonly kind: "chat.pageindex.snapshot";
  readonly schemaVersion: string;
  readonly scope: "session";
  readonly pageCount: number;
  readonly pages: readonly ChatPageIndexPage[];
  readonly redaction: JsonObject;
}

export interface ChatPageIndexTurnOrderEntry {
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly index: number;
}

export interface ChatPageIndexWorkspaceMutationEvidence {
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
}

export interface ChatPageIndexWorkspaceWatermarkInput {
  readonly workspaceCheckpointWatermark: number;
}

const RECALL_RESULT_LIST_ID = "result-list:pageindex-recall";
export const CHAT_PAGEINDEX_PREVIEW_LIMIT = PAGEINDEX_DEFAULT_PREVIEW_LIMIT;
export const CHAT_PAGEINDEX_STORAGE_PAGE_LIMIT = SHARED_PAGEINDEX_STORAGE_PAGE_LIMIT;

export function parseChatPageIndexRecallRequest(input: string): ChatPageIndexRecallParseResult {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  const scopeIndex = parts.indexOf("--scope");
  let scope: ChatPageIndexRecallScope = "session";
  if (scopeIndex >= 0) {
    const scopeValue = parts[scopeIndex + 1];
    if (!scopeValue) return { ok: false, code: "CLI_PALETTE_RECALL_SCOPE_REQUIRED" };
    if (!isRecallScope(scopeValue)) return { ok: false, code: "CLI_PALETTE_RECALL_SCOPE_INVALID", scopeValue };
    scope = scopeValue;
    parts.splice(scopeIndex, 2);
  }
  return {
    ok: true,
    value: {
      scope,
      query: parts.join(" ").trim()
    }
  };
}

export function recordChatPageIndexTurn(
  pages: readonly ChatPageIndexPage[],
  input: {
    readonly prompt: string;
    readonly terminal: RuntimeEvent | undefined;
  }
): readonly ChatPageIndexPage[] {
  return asChatPages(recordPageIndexTurn(asSharedPages(pages), input));
}

export function createChatPageIndexSnapshotPayload(pages: readonly ChatPageIndexPage[]): ChatPageIndexSnapshotPayload {
  const boundedPages = asChatPages(normalizePageIndexPages(asSharedPages(pages)));
  return {
    kind: "chat.pageindex.snapshot",
    schemaVersion: SESSION_SCHEMA_VERSION,
    scope: "session",
    pageCount: boundedPages.length,
    pages: boundedPages,
    redaction: {
      class: "internal",
      fields: ["pages.promptPreview", "pages.assistantPreview", "pages.traceId", "pages.evidenceQuality", "pages.freshnessEvidence"]
    }
  };
}

export function chatPageIndexPagesFromSnapshot(payload: JsonObject | undefined): readonly ChatPageIndexPage[] {
  if (!payload || payload.kind !== "chat.pageindex.snapshot" || payload.schemaVersion !== SESSION_SCHEMA_VERSION) return [];
  const rawPages = Array.isArray(payload.pages) ? payload.pages : [];
  return asChatPages(pageIndexPagesFromUnknown(rawPages));
}

export function normalizeChatPageIndexPages(pages: readonly ChatPageIndexPage[]): readonly ChatPageIndexPage[] {
  return asChatPages(normalizePageIndexPages(asSharedPages(pages)));
}

export function workspaceChatPageIndexPagesFromSessionPages(
  pages: readonly ChatPageIndexPage[],
  input: {
    readonly workspaceRoot: string;
    readonly workspaceCheckpointWatermark?: number;
  }
): readonly ChatPageIndexPage[] {
  return asChatPages(sharedWorkspacePageIndexPagesFromSessionPages(asSharedPages(pages), input));
}

export function markStalePageIndexPagesAfterWorkspaceEdits(
  pages: readonly ChatPageIndexPage[],
  input: {
    readonly turnOrder: readonly ChatPageIndexTurnOrderEntry[];
    readonly mutations: readonly ChatPageIndexWorkspaceMutationEvidence[];
  }
): readonly ChatPageIndexPage[] {
  return asChatPages(markSharedStaleAfterWorkspaceEdits(asSharedPages(pages), input));
}

export function markStalePageIndexPagesFromWorkspaceWatermark(
  pages: readonly ChatPageIndexPage[],
  input: ChatPageIndexWorkspaceWatermarkInput
): readonly ChatPageIndexPage[] {
  return asChatPages(markSharedStaleFromWorkspaceWatermark(asSharedPages(pages), input));
}

export function resolveChatPageIndexRecall(
  state: ChatPaletteState,
  pages: readonly ChatPageIndexPage[],
  query: string,
  scope: ChatPageIndexRecallScope = "session"
): { readonly state: ChatPaletteState; readonly summary: ChatPageIndexRecallSummary; readonly resultList: CliResultList } {
  const recall = resolvePageIndexRecall(asSharedPages(pages), {
    query,
    scope,
    limit: PAGEINDEX_DEFAULT_RESULT_LIMIT
  });
  const resultList: CliResultList = {
    id: RECALL_RESULT_LIST_ID,
    kind: "search",
    sourceCommand: "palette.recall",
    label: `PageIndex recall ${recall.query}`,
    items: recall.items.map((item, index) => pageRecallResultListItem(item, index)),
    ...(recall.items.length > 0 ? { activeItemId: pageIndexResultListItemId(recall.items[0]?.page) } : {}),
    metadata: {
      query: recall.query,
      indexedCount: recall.indexedCount,
      matchedCount: recall.matchedCount,
      renderedCount: recall.renderedCount,
      ranking: recall.ranking,
      scope: recall.scope,
      semanticStatus: recall.semanticStatus,
      provider: recall.provider
    }
  };
  const activeItem = resultList.items.find((item) => item.id === resultList.activeItemId) ?? resultList.items[0];
  const snapshot: CliCompositionSnapshot = {
    ...state.snapshot,
    mode: "result-list",
    ...(activeItem ? { activeTarget: activeItem.target } : {}),
    resultLists: [resultList, ...state.snapshot.resultLists.filter((list) => list.id !== resultList.id)]
  };
  return {
    state: { ...state, snapshot },
    summary: {
      kind: "palette.recall",
      query: recall.query,
      resultListId: resultList.id,
      scope,
      indexedCount: recall.indexedCount,
      matchedCount: recall.matchedCount,
      renderedCount: recall.renderedCount,
      activeItemId: resultList.activeItemId,
      redaction: { class: "internal", fields: ["query"] }
    },
    resultList
  };
}

export function createChatPageIndexRecallDeferred(request: ChatPageIndexRecallRequest): ChatPageIndexRecallDeferred | undefined {
  if (request.scope === "session" || request.scope === "workspace") return undefined;
  return {
    kind: "palette.recall.deferred",
    query: request.query,
    requestedScope: request.scope,
    availableScopes: ["session", "workspace"],
    code: "CLI_PALETTE_RECALL_SCOPE_DEFERRED",
    reason: "PageIndex workspace/global storage is not enabled in this CLI build.",
    redaction: { class: "internal", fields: ["query"] }
  };
}

export function renderChatPageIndexRecall(
  summary: ChatPageIndexRecallSummary,
  resultList: CliResultList,
  output: AgentLoopOutputMode
): readonly string[] {
  if (output === "json") return [JSON.stringify({ ...summary, resultList })];
  if (output === "jsonl") {
    return [
      JSON.stringify(summary),
      ...resultList.items.map((item) => JSON.stringify({ kind: "palette.recall.item", resultListId: resultList.id, active: resultList.activeItemId === item.id, item }))
    ];
  }
  if (resultList.items.length === 0) return [`palette recall: 0 matches for ${summary.query}`];
  return [
    `palette recall: ${summary.renderedCount}/${summary.matchedCount} matches active=${summary.activeItemId ?? "none"}`,
    ...resultList.items.map((item) => `  ${resultList.activeItemId === item.id ? "*" : " "} ${item.order + 1} ${item.label}`)
  ];
}

export function explainChatPageIndexRecallItem(
  snapshot: CliCompositionSnapshot,
  selector: string | undefined
): ChatPageIndexRecallExplain {
  const normalizedSelector = selector?.trim() || "current";
  const resultList = snapshot.resultLists.find((list) => list.id === RECALL_RESULT_LIST_ID);
  const item = resultList ? selectRecallItem(resultList, normalizedSelector) : undefined;
  if (!resultList || !item || item.target.kind !== "turn") {
    return {
      kind: "palette.recall.explain",
      ok: false,
      selector: normalizedSelector,
      resultListId: resultList?.id,
      itemId: item?.id,
      targetId: item?.target.id,
      scope: undefined,
      pageId: undefined,
      sessionId: undefined,
      turnId: undefined,
      createdAt: undefined,
      status: undefined,
      deterministicScore: undefined,
      ranking: undefined,
      rankingReason: undefined,
      matchedFields: [],
      freshnessStatus: undefined,
      freshnessEvidence: {},
      semanticStatus: undefined,
      promptPreview: undefined,
      assistantPreview: undefined,
      diagnosticCode: "CLI_PAGEINDEX_RECALL_EXPLAIN_TARGET_NOT_FOUND",
      redaction: { class: "internal", fields: ["selector", "targetId"] }
    };
  }
  const metadata = item.target.metadata ?? {};
  return {
    kind: "palette.recall.explain",
    ok: true,
    selector: normalizedSelector,
    resultListId: resultList.id,
    itemId: item.id,
    targetId: item.target.id,
    scope: stringValue(metadata.scope),
    pageId: stringValue(metadata.pageId),
    sessionId: stringValue(item.target.sessionId),
    turnId: stringValue(item.target.turnId),
    createdAt: stringValue(metadata.createdAt),
    status: stringValue(metadata.status),
    deterministicScore: numberMetadata(metadata, "deterministicScore"),
    ranking: stringValue(metadata.ranking),
    rankingReason: stringValue(metadata.rankingReason),
    matchedFields: stringArrayValue(metadata.matchedFields),
    freshnessStatus: stringValue(metadata.freshnessStatus),
    freshnessEvidence: freshnessEvidenceFromMetadata(metadata),
    semanticStatus: semanticStatus(metadata.semantic),
    promptPreview: stringValue(metadata.promptPreview),
    assistantPreview: stringValue(metadata.assistantPreview),
    diagnosticCode: undefined,
    redaction: { class: "internal", fields: ["promptPreview", "assistantPreview", "targetId"] }
  };
}

export function renderChatPageIndexRecallExplain(
  explain: ChatPageIndexRecallExplain,
  output: AgentLoopOutputMode
): readonly string[] {
  if (output === "json" || output === "jsonl") return [JSON.stringify(explain)];
  if (!explain.ok) return [`palette recall explain: failed code=${explain.diagnosticCode ?? "unknown"}`];
  return [
    `palette recall explain: item=${explain.itemId ?? "none"} scope=${explain.scope ?? "unknown"} page=${explain.pageId ?? "unknown"}`,
    `  source session=${explain.sessionId ?? "unknown"} turn=${explain.turnId ?? "unknown"} status=${explain.status ?? "unknown"} createdAt=${explain.createdAt ?? "unknown"}`,
    `  quality freshness=${explain.freshnessStatus ?? "unknown"} matchedFields=${explain.matchedFields.join(",") || "none"} ranking=${explain.ranking ?? "unknown"} reason=${explain.rankingReason ?? "unknown"} score=${explain.deterministicScore ?? 0}`,
    `  freshness evidence: ${renderFreshnessEvidence(explain.freshnessEvidence)}`,
    `  prompt: ${explain.promptPreview ?? ""}`,
    `  assistant: ${explain.assistantPreview ?? ""}`
  ];
}

export function renderChatPageIndexRecallDeferred(
  deferred: ChatPageIndexRecallDeferred,
  output: AgentLoopOutputMode
): readonly string[] {
  if (output === "json" || output === "jsonl") return [JSON.stringify(deferred)];
  return [
    `palette recall: scope=${deferred.requestedScope} deferred code=${deferred.code} available=${deferred.availableScopes.join(",")}`
  ];
}

function pageRecallResultListItem(item: IndexRecallItem, order: number): CliResultListItem {
  const page = item.page;
  const metadata: JsonObject = {
    sourceCommand: "palette.recall",
    scope: item.scope,
    pageId: page.pageId,
    sequence: page.sequence,
    status: page.status,
    traceId: page.traceId,
    createdAt: page.createdAt,
    promptPreview: page.promptPreview,
    assistantPreview: page.assistantPreview,
    deterministicScore: item.deterministicScore,
    ranking: item.ranking,
    rankingReason: item.rankingReason,
    matchedFields: item.matchedFields,
    freshnessStatus: item.freshnessStatus,
    freshnessEvidence: item.freshnessEvidence,
    evidenceQuality: page.evidenceQuality,
    semantic: page.semantic,
    semanticStatus: item.semanticStatus,
    providerId: item.providerId,
    providerKind: item.providerKind,
    redaction: page.redaction
  };
  return {
    id: pageIndexResultListItemId(page),
    target: {
      kind: "turn",
      id: page.turnId,
      label: `Turn ${page.sequence}`,
      sessionId: page.sessionId,
      turnId: page.turnId,
      metadata
    },
    label: `#${page.sequence} ${page.status}: ${page.promptPreview}`,
    order,
    metadata
  };
}

function selectRecallItem(resultList: CliResultList, selector: string): CliResultListItem | undefined {
  if (selector === "current") return resultList.items.find((item) => item.id === resultList.activeItemId) ?? resultList.items[0];
  return resultList.items.find((item) => item.id === selector || item.target.id === selector);
}

function asSharedPages(pages: readonly ChatPageIndexPage[]): readonly PageIndexPage[] {
  return normalizePageIndexPages(pages as readonly unknown[] as readonly PageIndexPage[]);
}

function asChatPages(pages: readonly PageIndexPage[]): readonly ChatPageIndexPage[] {
  return pages as readonly unknown[] as readonly ChatPageIndexPage[];
}

function isRecallScope(value: string): value is ChatPageIndexRecallScope {
  return value === "session" || value === "workspace" || value === "global";
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stringArrayValue(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function numberMetadata(metadata: JsonObject, key: string): number | undefined {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function semanticStatus(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return stringValue(value.status);
}
