import type {
  AgentLoopTerminalStatus,
  IndexFreshnessEvidence,
  IndexFreshnessStatus,
  IndexProviderState,
  IndexProviderStatus,
  IndexRankingKind,
  IndexRecallItem,
  IndexRecallResult,
  IndexRecallScope,
  JsonObject,
  PageIndexEvidenceQuality,
  PageIndexPage,
  PageIndexSemanticMetadata,
  RuntimeEvent,
  SessionId,
  TurnId
} from "@deepseek/platform-contracts";
import { INDEX_PROVIDER_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

export const PAGEINDEX_PROVIDER_ID = "pageindex";
export const PAGEINDEX_DEFAULT_PREVIEW_LIMIT = 160;
export const PAGEINDEX_DEFAULT_PAGE_LIMIT = 500;
export const CHAT_PAGEINDEX_STORAGE_PAGE_LIMIT = PAGEINDEX_DEFAULT_PAGE_LIMIT;
export const PAGEINDEX_DEFAULT_RESULT_LIMIT = 100;
export const PAGEINDEX_DEFAULT_CREATED_AT = "1970-01-01T00:00:00.000Z";

export interface RecordPageIndexTurnInput {
  readonly prompt: string;
  readonly terminal: RuntimeEvent | undefined;
  readonly previewLimit?: number;
  readonly pageLimit?: number;
}

export interface WorkspacePageIndexInput {
  readonly workspaceRoot: string;
  readonly workspaceCheckpointWatermark?: number;
}

export interface PageIndexTurnOrderEntry {
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly index: number;
}

export interface PageIndexWorkspaceMutationEvidence {
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
}

export interface PageIndexWorkspaceWatermarkInput {
  readonly workspaceCheckpointWatermark: number;
}

interface PageSearchMatch {
  readonly page: PageIndexPage;
  readonly score: number;
  readonly matchedFields: readonly string[];
}

export function createPageIndexProviderState(status: IndexProviderStatus = "enabled"): IndexProviderState {
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    providerId: PAGEINDEX_PROVIDER_ID,
    kind: "pageindex",
    status,
    diagnostics: [],
    metadata: { ranking: "deterministic-text" },
    redaction: { class: "internal" }
  };
}

export function recordPageIndexTurn(
  pages: readonly PageIndexPage[],
  input: RecordPageIndexTurnInput
): readonly PageIndexPage[] {
  const terminal = input.terminal;
  if (!terminal?.turnId) return pages;
  if (pages.some((page) => page.turnId === terminal.turnId && page.sessionId === terminal.sessionId)) return pages;
  const previewLimit = input.previewLimit ?? PAGEINDEX_DEFAULT_PREVIEW_LIMIT;
  const pageLimit = input.pageLimit ?? PAGEINDEX_DEFAULT_PAGE_LIMIT;
  const sequence = pages.reduce((max, page) => Math.max(max, page.sequence), 0) + 1;
  const sessionId = terminal.sessionId;
  const turnId = terminal.turnId;
  const createdAtInfo = pageCreatedAt(terminal);
  const evidenceQuality = pageEvidenceQuality(createdAtInfo.value, createdAtInfo.source);
  const page: PageIndexPage = {
    kind: "pageindex.page",
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    scope: "session",
    pageId: pageId(sessionId, turnId, sequence),
    sessionId,
    turnId,
    sequence,
    status: terminalStatus(terminal),
    traceId: String(terminal.trace.traceId),
    createdAt: createdAtInfo.value,
    promptPreview: previewText(input.prompt, previewLimit),
    assistantPreview: previewText(String(terminal.data.assistantText ?? ""), previewLimit),
    evidenceQuality,
    freshnessEvidence: freshnessEvidenceFromQuality(evidenceQuality),
    redaction: { class: "internal", fields: ["promptPreview", "assistantPreview", "traceId", "evidenceQuality", "freshnessEvidence"] },
    semantic: { status: "deferred", provider: "zvec" }
  };
  return boundPageIndexPages([...pages, page], pageLimit);
}

export function normalizePageIndexPages(
  pages: readonly PageIndexPage[],
  options: { readonly previewLimit?: number; readonly pageLimit?: number } = {}
): readonly PageIndexPage[] {
  return boundPageIndexPages(
    pages.map((page) => normalizePageIndexPage(page, options.previewLimit ?? PAGEINDEX_DEFAULT_PREVIEW_LIMIT)),
    options.pageLimit ?? PAGEINDEX_DEFAULT_PAGE_LIMIT
  );
}

export function pageIndexPagesFromUnknown(
  values: readonly unknown[],
  options: { readonly previewLimit?: number; readonly pageLimit?: number } = {}
): readonly PageIndexPage[] {
  return normalizePageIndexPages(
    values.map((value) => pageFromUnknown(value, options.previewLimit ?? PAGEINDEX_DEFAULT_PREVIEW_LIMIT)).filter((page): page is PageIndexPage => Boolean(page)),
    options
  );
}

export function workspacePageIndexPagesFromSessionPages(
  pages: readonly PageIndexPage[],
  input: WorkspacePageIndexInput,
  options: { readonly previewLimit?: number; readonly pageLimit?: number } = {}
): readonly PageIndexPage[] {
  return normalizePageIndexPages(pages.map((page) => {
    const evidenceQuality = withWorkspaceCheckpointWatermark(page.evidenceQuality, input.workspaceCheckpointWatermark);
    return {
      ...page,
      scope: "workspace",
      pageId: workspacePageId(input.workspaceRoot, page.sessionId, page.turnId, page.sequence),
      evidenceQuality,
      freshnessEvidence: freshnessEvidenceFromQuality(evidenceQuality),
      semantic: {
        ...page.semantic,
        scope: "workspace",
        workspaceRootHash: stableId(input.workspaceRoot)
      }
    };
  }), options);
}

export function markStalePageIndexPagesAfterWorkspaceEdits(
  pages: readonly PageIndexPage[],
  input: {
    readonly turnOrder: readonly PageIndexTurnOrderEntry[];
    readonly mutations: readonly PageIndexWorkspaceMutationEvidence[];
  }
): readonly PageIndexPage[] {
  if (pages.length === 0 || input.turnOrder.length === 0 || input.mutations.length === 0) return pages;
  const orderedTurns = new Map<string, number>();
  for (const entry of input.turnOrder) {
    if (entry.index > 0) orderedTurns.set(turnOrderKey(entry.sessionId, entry.turnId), entry.index);
  }
  if (orderedTurns.size === 0) return pages;
  let changed = false;
  const adjusted = pages.map((page) => {
    if (freshnessStatus(page) !== "fresh") return page;
    const pageOrder = orderedTurns.get(turnOrderKey(page.sessionId, page.turnId));
    if (!pageOrder) return page;
    const laterMutation = input.mutations.find((mutation) => {
      if (mutation.sessionId !== page.sessionId || !mutation.turnId) return false;
      const mutationOrder = orderedTurns.get(turnOrderKey(mutation.sessionId, mutation.turnId));
      return Boolean(mutationOrder && mutationOrder > pageOrder);
    });
    if (!laterMutation) return page;
    changed = true;
    return withEvidenceQuality(page, {
      ...page.evidenceQuality,
      freshnessStatus: "stale",
      staleReason: "workspace-edit-after-page",
      staleScope: "session-turn-order",
      staleMutationTurnId: String(laterMutation.turnId)
    });
  });
  return changed ? adjusted : pages;
}

export function markStalePageIndexPagesFromWorkspaceWatermark(
  pages: readonly PageIndexPage[],
  input: PageIndexWorkspaceWatermarkInput
): readonly PageIndexPage[] {
  const currentWatermark = validWatermark(input.workspaceCheckpointWatermark);
  if (pages.length === 0 || currentWatermark === undefined) return pages;
  let changed = false;
  const adjusted = pages.map((page) => {
    if (page.scope !== "workspace" || freshnessStatus(page) !== "fresh") return page;
    const pageWatermark = validWatermark(page.evidenceQuality.workspaceCheckpointWatermark);
    if (pageWatermark === undefined) {
      if (currentWatermark <= 0) return page;
      changed = true;
      return withEvidenceQuality(page, {
        ...page.evidenceQuality,
        freshnessStatus: "unknown",
        staleReason: "workspace-watermark-missing",
        staleScope: "workspace-checkpoint-watermark",
        currentWorkspaceCheckpointWatermark: currentWatermark
      });
    }
    if (currentWatermark <= pageWatermark) return page;
    changed = true;
    return withEvidenceQuality(page, {
      ...page.evidenceQuality,
      freshnessStatus: "stale",
      staleReason: "workspace-checkpoint-watermark-advanced",
      staleScope: "workspace-checkpoint-watermark",
      currentWorkspaceCheckpointWatermark: currentWatermark
    });
  });
  return changed ? adjusted : pages;
}

export function resolvePageIndexRecall(
  pages: readonly PageIndexPage[],
  input: {
    readonly query: string;
    readonly scope?: IndexRecallScope;
    readonly limit?: number;
  }
): IndexRecallResult {
  const scope = input.scope ?? "session";
  const normalizedQuery = input.query.trim();
  const scopedPages = pages.filter((page) => page.scope === scope);
  const matches = searchPages(scopedPages, normalizedQuery);
  const selected = matches.slice(0, input.limit ?? PAGEINDEX_DEFAULT_RESULT_LIMIT);
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    providerId: PAGEINDEX_PROVIDER_ID,
    providerKind: "pageindex",
    scope,
    query: normalizedQuery,
    indexedCount: scopedPages.length,
    matchedCount: matches.length,
    renderedCount: selected.length,
    ranking: "deterministic-text",
    semanticStatus: "deferred",
    items: selected.map((match) => recallItem(match)),
    provider: createPageIndexProviderState(),
    redaction: { class: "internal", fields: ["query", "items.page.promptPreview", "items.page.assistantPreview"] },
    metadata: { ranking: "deterministic-text" }
  };
}

export function freshnessEvidenceFromMetadata(metadata: JsonObject): IndexFreshnessEvidence {
  const evidence = isRecord(metadata.freshnessEvidence)
    ? metadata.freshnessEvidence
    : freshnessEvidenceFromQuality(isRecord(metadata.evidenceQuality) ? metadata.evidenceQuality : metadata);
  return freshnessEvidenceFromQuality(evidence);
}

export function freshnessEvidenceFromQuality(quality: JsonObject): IndexFreshnessEvidence {
  const evidence: Record<string, string | number> = {};
  const reason = stringValue(quality.staleReason ?? quality.reason);
  const scope = stringValue(quality.staleScope ?? quality.scope);
  const staleMutationTurnId = stringValue(quality.staleMutationTurnId);
  const pageWatermark = numberMetadata(quality, "workspaceCheckpointWatermark");
  const currentWatermark = numberMetadata(quality, "currentWorkspaceCheckpointWatermark");
  if (reason) evidence.reason = reason;
  if (scope) evidence.scope = scope;
  if (staleMutationTurnId) evidence.staleMutationTurnId = staleMutationTurnId;
  if (pageWatermark !== undefined) evidence.workspaceCheckpointWatermark = pageWatermark;
  if (currentWatermark !== undefined) evidence.currentWorkspaceCheckpointWatermark = currentWatermark;
  return evidence;
}

export function renderFreshnessEvidence(evidence: JsonObject): string {
  const parts = ([
    ["reason", stringValue(evidence.reason)],
    ["scope", stringValue(evidence.scope)],
    ["staleMutationTurnId", stringValue(evidence.staleMutationTurnId)],
    ["workspaceCheckpointWatermark", numberMetadata(evidence, "workspaceCheckpointWatermark")],
    ["currentWorkspaceCheckpointWatermark", numberMetadata(evidence, "currentWorkspaceCheckpointWatermark")]
  ] as readonly (readonly [string, string | number | undefined])[])
    .filter((entry): entry is readonly [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function pageIndexResultListItemId(page: PageIndexPage | undefined): string {
  if (!page) return "pageindex-result:missing";
  return `pageindex-result:${stableId(page.pageId)}`;
}

export function stablePageIndexId(value: string): string {
  return stableId(value);
}

function recallItem(match: PageSearchMatch): IndexRecallItem {
  const page = match.page;
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    providerId: PAGEINDEX_PROVIDER_ID,
    providerKind: "pageindex",
    scope: page.scope,
    page,
    deterministicScore: match.score,
    ranking: "deterministic-text",
    rankingReason: "deterministic-text-match",
    matchedFields: match.matchedFields,
    freshnessStatus: freshnessStatus(page),
    freshnessEvidence: freshnessEvidenceFromQuality(page.evidenceQuality),
    semanticStatus: semanticStatus(page.semantic),
    redaction: { class: "internal", fields: ["page.promptPreview", "page.assistantPreview", "page.traceId"] },
    metadata: { sourceProvider: PAGEINDEX_PROVIDER_ID }
  };
}

function searchPages(pages: readonly PageIndexPage[], query: string): readonly PageSearchMatch[] {
  const terms = normalizedTerms(query);
  if (terms.length === 0) return [];
  return pages
    .map((page) => {
      const score = scorePage(page, terms);
      return { page, score: score.score, matchedFields: score.matchedFields };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.page.sequence !== b.page.sequence) return b.page.sequence - a.page.sequence;
      return a.page.pageId.localeCompare(b.page.pageId);
    });
}

function scorePage(page: PageIndexPage, terms: readonly string[]): { readonly score: number; readonly matchedFields: readonly string[] } {
  const prompt = normalizeSearchText(page.promptPreview);
  const assistant = normalizeSearchText(page.assistantPreview);
  const ids = normalizeSearchText(`${page.pageId} ${page.sessionId} ${page.turnId} ${page.status} ${page.traceId}`);
  let score = 0;
  const matchedFields = new Set<string>();
  for (const term of terms) {
    if (prompt.includes(term)) {
      score += 8;
      matchedFields.add("promptPreview");
    }
    if (assistant.includes(term)) {
      score += 4;
      matchedFields.add("assistantPreview");
    }
    if (ids.includes(term)) {
      score += 2;
      matchedFields.add("metadata");
    }
  }
  return { score, matchedFields: [...matchedFields].sort() };
}

function pageFromUnknown(value: unknown, previewLimit: number): PageIndexPage | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind !== "pageindex.page") return undefined;
  const pageIdValue = stringValue(value.pageId);
  const sessionIdValue = stringValue(value.sessionId);
  const turnIdValue = stringValue(value.turnId);
  const sequence = numberValue(value.sequence);
  const status = statusValue(value.status);
  const traceId = stringValue(value.traceId);
  const createdAtValue = stringValue(value.createdAt);
  const promptPreview = stringValue(value.promptPreview);
  const assistantPreview = stringValue(value.assistantPreview);
  if (!pageIdValue || !sessionIdValue || !turnIdValue || !sequence || !status || !traceId) return undefined;
  const createdAt = normalizeCreatedAt(createdAtValue);
  const evidenceQuality = normalizeEvidenceQuality(
    isRecord(value.evidenceQuality) ? value.evidenceQuality : undefined,
    createdAt,
    createdAtValue ? "runtime-event" : "deterministic-fallback"
  );
  return normalizePageIndexPage({
    kind: "pageindex.page",
    schemaVersion: stringValue(value.schemaVersion) ?? INDEX_PROVIDER_SCHEMA_VERSION,
    pageId: pageIdValue,
    scope: scopeValue(value.scope),
    sessionId: asId<"session">(sessionIdValue),
    turnId: asId<"turn">(turnIdValue),
    sequence,
    status,
    traceId,
    createdAt,
    promptPreview: promptPreview ?? "",
    assistantPreview: assistantPreview ?? "",
    evidenceQuality,
    freshnessEvidence: freshnessEvidenceFromQuality(evidenceQuality),
    redaction: redactionValue(value.redaction),
    semantic: semanticValue(value.semantic)
  }, previewLimit);
}

function normalizePageIndexPage(page: PageIndexPage, previewLimit: number): PageIndexPage {
  const createdAt = normalizeCreatedAt(page.createdAt);
  const source = stringValue(page.evidenceQuality.createdAtSource) === "deterministic-fallback" ? "deterministic-fallback" : "runtime-event";
  const evidenceQuality = normalizeEvidenceQuality(page.evidenceQuality, createdAt, source);
  return {
    ...page,
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    createdAt,
    promptPreview: previewText(page.promptPreview, previewLimit),
    assistantPreview: previewText(page.assistantPreview, previewLimit),
    evidenceQuality,
    freshnessEvidence: freshnessEvidenceFromQuality(evidenceQuality),
    redaction: page.redaction ?? { class: "internal", fields: ["promptPreview", "assistantPreview", "traceId", "evidenceQuality", "freshnessEvidence"] },
    semantic: semanticValue(page.semantic)
  };
}

function withEvidenceQuality(page: PageIndexPage, evidenceQuality: PageIndexEvidenceQuality): PageIndexPage {
  return {
    ...page,
    evidenceQuality,
    freshnessEvidence: freshnessEvidenceFromQuality(evidenceQuality)
  };
}

function boundPageIndexPages(pages: readonly PageIndexPage[], limit: number): readonly PageIndexPage[] {
  return pages.slice(-limit);
}

function terminalStatus(event: RuntimeEvent): AgentLoopTerminalStatus {
  if (event.kind === "agent.loop.completed") return "completed";
  if (event.kind === "agent.loop.cancelled") return "cancelled";
  if (event.kind === "agent.loop.failed") return "failed";
  return "failed";
}

function statusValue(value: unknown): AgentLoopTerminalStatus | undefined {
  if (value === "completed" || value === "failed" || value === "cancelled" || value === "timed-out" || value === "rejected") return value;
  return undefined;
}

function scopeValue(value: unknown): PageIndexPage["scope"] {
  return value === "workspace" ? "workspace" : "session";
}

function semanticValue(value: unknown): PageIndexSemanticMetadata {
  if (!isRecord(value)) return { status: "deferred", provider: "zvec" };
  const status = semanticStatus(value);
  return {
    ...value,
    status,
    provider: stringValue(value.provider) ?? "zvec"
  };
}

function semanticStatus(value: unknown): IndexProviderStatus {
  if (!isRecord(value)) return "deferred";
  const status = stringValue(value.status);
  if (status === "enabled" || status === "deferred" || status === "disabled" || status === "unavailable" || status === "degraded") return status;
  return "deferred";
}

function pageCreatedAt(event: RuntimeEvent): { readonly value: string; readonly source: "runtime-event" | "deterministic-fallback" } {
  const raw = stringValue(event.createdAt) ?? stringValue(event.data.createdAt);
  return raw && !Number.isNaN(Date.parse(raw))
    ? { value: raw, source: "runtime-event" }
    : { value: PAGEINDEX_DEFAULT_CREATED_AT, source: "deterministic-fallback" };
}

function normalizeCreatedAt(value: string | undefined): string {
  return value && !Number.isNaN(Date.parse(value)) ? value : PAGEINDEX_DEFAULT_CREATED_AT;
}

function pageEvidenceQuality(createdAt: string, source: "runtime-event" | "deterministic-fallback"): PageIndexEvidenceQuality {
  return {
    createdAt,
    createdAtSource: source,
    freshnessStatus: source === "runtime-event" ? "fresh" : "unknown",
    ranking: "deterministic-text",
    semanticStatus: "deferred"
  };
}

function withWorkspaceCheckpointWatermark(value: PageIndexEvidenceQuality, watermark: number | undefined): PageIndexEvidenceQuality {
  const normalized = validWatermark(watermark);
  return normalized === undefined ? value : { ...value, workspaceCheckpointWatermark: normalized };
}

function normalizeEvidenceQuality(
  value: JsonObject | undefined,
  createdAt: string,
  source: "runtime-event" | "deterministic-fallback"
): PageIndexEvidenceQuality {
  const rawSource = stringValue(value?.createdAtSource);
  const createdAtSource = rawSource === "deterministic-fallback" ? "deterministic-fallback" : source;
  const rawFreshness = stringValue(value?.freshnessStatus);
  return {
    ...value,
    createdAt,
    createdAtSource,
    freshnessStatus: normalizeFreshnessStatus(rawFreshness, createdAtSource),
    ranking: rankingValue(value?.ranking),
    semanticStatus: semanticStatus(value ?? {})
  };
}

function freshnessStatus(page: PageIndexPage): IndexFreshnessStatus {
  const source = stringValue(page.evidenceQuality.createdAtSource) === "runtime-event" ? "runtime-event" : "deterministic-fallback";
  return normalizeFreshnessStatus(stringValue(page.evidenceQuality.freshnessStatus), source);
}

function normalizeFreshnessStatus(
  status: string | undefined,
  source: "runtime-event" | "deterministic-fallback"
): IndexFreshnessStatus {
  if (status === "fresh" || status === "stale" || status === "unknown") return status;
  if (status === "known") return source === "runtime-event" ? "fresh" : "unknown";
  return source === "runtime-event" ? "fresh" : "unknown";
}

function rankingValue(value: unknown): IndexRankingKind {
  return value === "semantic" || value === "hybrid" ? value : "deterministic-text";
}

function redactionValue(value: unknown): PageIndexPage["redaction"] {
  if (isRecord(value) && (value.class === "public" || value.class === "internal" || value.class === "sensitive" || value.class === "secret")) {
    return {
      class: value.class,
      ...(Array.isArray(value.fields) ? { fields: value.fields.filter((item): item is string => typeof item === "string") } : {})
    };
  }
  return { class: "internal", fields: ["promptPreview", "assistantPreview", "traceId", "evidenceQuality", "freshnessEvidence"] };
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberMetadata(metadata: JsonObject, key: string): number | undefined {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function validWatermark(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return Number.isInteger(value) && typeof value === "number" && value > 0 ? value : undefined;
}

function pageId(sessionId: SessionId, turnId: TurnId, sequence: number): string {
  return `page:${sequence}:${stableId(`${sessionId}:${turnId}`)}`;
}

function workspacePageId(workspaceRoot: string, sessionId: SessionId, turnId: TurnId, sequence: number): string {
  return `workspace-page:${sequence}:${stableId(`${workspaceRoot}:${sessionId}:${turnId}`)}`;
}

function turnOrderKey(sessionId: SessionId, turnId: TurnId): string {
  return `${sessionId}:${turnId}`;
}

function normalizedTerms(query: string): readonly string[] {
  return [...new Set(normalizeSearchText(query).split(" ").filter(Boolean))];
}

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function previewText(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 3)}...` : normalized;
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
