import type {
  AgentLoopOutputMode,
  AgentLoopReferenceContext,
  CliActionKind,
  CliActionResolutionResult,
  CliCompositionSnapshot,
  CliPaletteProjectionResult,
  CliReferenceItem,
  CliReferenceSet,
  CliResultList,
  CliResultListItem,
  CliTargetRef,
  JsonObject
} from "@deepseek/platform-contracts";
import type { PlatformRuntime, SearchResult } from "@deepseek/platform-contracts";
import { resolveCliAction } from "@deepseek/command-system";
import { createCliPaletteProjection, createPaletteCompositionSnapshot, renderPaletteActionResult } from "./palette.js";

export interface ChatPaletteState {
  readonly projection: CliPaletteProjectionResult;
  readonly snapshot: CliCompositionSnapshot;
}

export interface ChatPaletteStateSummary extends JsonObject {
  readonly kind: "palette.state";
  readonly mode: CliCompositionSnapshot["mode"];
  readonly activeTargetId: string | undefined;
  readonly activeTargetKind: string | undefined;
  readonly resultListId: string | undefined;
  readonly activeItemId: string | undefined;
  readonly jumpCount: number;
  readonly jumpCursor: number;
  readonly referenceSetCount: number;
  readonly referenceCount: number;
}

export interface ChatPaletteReferenceSummary extends JsonObject {
  readonly kind: "palette.references";
  readonly referenceSetCount: number;
  readonly referenceCount: number;
  readonly activeSetId: string | undefined;
  readonly activeReferenceId: string | undefined;
  readonly redaction: JsonObject;
}

export interface ChatPaletteReferenceFocus extends JsonObject {
  readonly kind: "palette.reference.focus";
  readonly ok: boolean;
  readonly selector: string;
  readonly referenceSetId: string | undefined;
  readonly referenceId: string | undefined;
  readonly targetId: string | undefined;
  readonly targetKind: string | undefined;
  readonly label: string | undefined;
  readonly redaction: JsonObject;
}

export interface ChatPaletteReferenceMutation extends JsonObject {
  readonly kind: "palette.reference.mutation";
  readonly ok: boolean;
  readonly action: "remove" | "clear" | "replace";
  readonly selector: string | undefined;
  readonly removedReferenceId: string | undefined;
  readonly activeReferenceId: string | undefined;
  readonly referenceCount: number;
  readonly redaction: JsonObject;
}

export interface ChatPaletteFileSearchSummary extends JsonObject {
  readonly kind: "palette.files";
  readonly pattern: string;
  readonly resultListId: string;
  readonly matchedCount: number;
  readonly renderedCount: number;
  readonly activeItemId: string | undefined;
  readonly redaction: JsonObject;
}

export interface ChatPaletteTextSearchSummary extends JsonObject {
  readonly kind: "palette.grep";
  readonly pattern: string;
  readonly resultListId: string;
  readonly matchedCount: number;
  readonly renderedCount: number;
  readonly activeItemId: string | undefined;
  readonly redaction: JsonObject;
}

const CHAT_RESULT_LIMIT = 100;
const CHAT_SEARCH_PREVIEW_LIMIT = 160;

export function createChatPaletteState(): ChatPaletteState {
  const projection = createCliPaletteProjection();
  return { projection, snapshot: createPaletteCompositionSnapshot(projection) };
}

export function ensureChatPaletteState(state: ChatPaletteState | undefined): ChatPaletteState {
  return state ?? createChatPaletteState();
}

export function resolveChatPaletteNavigation(
  state: ChatPaletteState,
  action: Extract<CliActionKind, "next" | "previous" | "first" | "last">
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult } {
  const result = resolveCliAction({
    action,
    mode: "result-list",
    target: activeResultListTarget(state.snapshot),
    dryRun: true
  }, state.snapshot);
  return applyActionResult(state, result);
}

export function resolveChatPaletteJumpTraversal(
  state: ChatPaletteState,
  action: Extract<CliActionKind, "back" | "forward">
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult } {
  const result = resolveCliAction({
    action,
    mode: "result-list",
    target: activeResultListTarget(state.snapshot),
    dryRun: true
  }, state.snapshot);
  return applyActionResult(state, result);
}

export function resolveChatPaletteReferenceAdd(
  state: ChatPaletteState,
  targetId: string | undefined
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult } {
  const target = targetId && targetId !== "current"
    ? resultListItemTargetById(state.snapshot, targetId)
    : activeResultListItemTarget(state.snapshot);
  const result = target
    ? resolveCliAction({
      action: "add-to-reference-set",
      mode: "result-list",
      target,
      dryRun: true
    }, state.snapshot)
    : missingTargetResult("add-to-reference-set", targetId ?? "current", state.snapshot);
  return applyActionResult(state, result);
}

export function resolveChatPaletteFileReferenceAdd(
  state: ChatPaletteState,
  path: string
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult } {
  const normalized = path.trim();
  const snapshot = addFileReferenceToSnapshot(state.snapshot, normalized);
  return {
    state: { ...state, snapshot },
    result: {
      schemaVersion: "1.0.0",
      ok: true,
      action: "add-to-reference-set",
      mode: "result-list",
      target: { kind: "file", id: `file:${normalized}`, label: normalized, path: normalized },
      snapshot,
      update: {
        kind: "reference-set-updated",
        referenceSetId: snapshot.referenceSets[0]?.id ?? "refset:active",
        referenceCount: snapshot.referenceSets[0]?.items.length ?? 0
      },
      diagnostics: [],
      redaction: { class: "internal", fields: ["target.path"] }
    }
  };
}

export function resolveChatPaletteReferenceRemove(
  state: ChatPaletteState,
  selector: string | undefined
): { readonly state: ChatPaletteState; readonly mutation: ChatPaletteReferenceMutation } {
  const normalized = selector?.trim() || "current";
  const selected = selectReferenceItem(state.snapshot.referenceSets, normalized);
  if (!selected) {
    return {
      state,
      mutation: referenceMutation("remove", false, normalized, undefined, state.snapshot)
    };
  }
  const snapshot = removeReferenceFromSnapshot(state.snapshot, selected.set.id, selected.item.id);
  return {
    state: { ...state, snapshot },
    mutation: referenceMutation("remove", true, normalized, selected.item.id, snapshot)
  };
}

export function resolveChatPaletteReferenceClear(
  state: ChatPaletteState
): { readonly state: ChatPaletteState; readonly mutation: ChatPaletteReferenceMutation } {
  const snapshot: CliCompositionSnapshot = {
    ...state.snapshot,
    referenceSets: []
  };
  return {
    state: { ...state, snapshot },
    mutation: referenceMutation("clear", true, undefined, undefined, snapshot)
  };
}

export function resolveChatPaletteReferenceReplaceCurrent(
  state: ChatPaletteState
): { readonly state: ChatPaletteState; readonly mutation: ChatPaletteReferenceMutation } {
  const target = activeResultListItemTarget(state.snapshot);
  if (!target) {
    return {
      state,
      mutation: referenceMutation("replace", false, "current", undefined, state.snapshot)
    };
  }
  const cleared: ChatPaletteState = { ...state, snapshot: { ...state.snapshot, referenceSets: [] } };
  const added = resolveChatPaletteReferenceAdd(cleared, "current");
  const ok = added.result.ok;
  return {
    state: ok ? added.state : state,
    mutation: referenceMutation("replace", ok, "current", undefined, ok ? added.state.snapshot : state.snapshot)
  };
}

export async function resolveChatPaletteFileSearch(
  state: ChatPaletteState,
  platform: PlatformRuntime,
  workspaceRoot: string,
  pattern: string
): Promise<{ readonly state: ChatPaletteState; readonly summary: ChatPaletteFileSearchSummary; readonly resultList: CliResultList }> {
  const normalizedPattern = pattern.trim();
  const matches = [...await platform.findFiles(normalizedPattern, workspaceRoot)].sort(comparePath);
  const selected = matches.slice(0, CHAT_RESULT_LIMIT);
  const resultList: CliResultList = {
    id: "result-list:files",
    kind: "search",
    sourceCommand: "palette.files",
    label: `Files matching ${normalizedPattern}`,
    items: selected.map((file, index) => fileResultListItem(platform, workspaceRoot, file, index)),
    ...(selected.length > 0 ? { activeItemId: fileResultListItemId(fileTargetPath(platform, workspaceRoot, selected[0] ?? "")) } : {}),
    metadata: {
      pattern: normalizedPattern,
      matchedCount: matches.length,
      renderedCount: selected.length
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
      kind: "palette.files",
      pattern: normalizedPattern,
      resultListId: resultList.id,
      matchedCount: matches.length,
      renderedCount: selected.length,
      activeItemId: resultList.activeItemId,
      redaction: { class: "internal", fields: ["pattern"] }
    },
    resultList
  };
}

export async function resolveChatPaletteTextSearch(
  state: ChatPaletteState,
  platform: PlatformRuntime,
  workspaceRoot: string,
  pattern: string
): Promise<{ readonly state: ChatPaletteState; readonly summary: ChatPaletteTextSearchSummary; readonly resultList: CliResultList }> {
  const normalizedPattern = pattern.trim();
  const matches = [...await platform.searchText(normalizedPattern, workspaceRoot)].sort(compareSearchResult);
  const selected = matches.slice(0, CHAT_RESULT_LIMIT);
  const resultList: CliResultList = {
    id: "result-list:grep",
    kind: "search",
    sourceCommand: "palette.grep",
    label: `Text matching ${normalizedPattern}`,
    items: selected.map((match, index) => textSearchResultListItem(platform, workspaceRoot, normalizedPattern, match, index)),
    ...(selected.length > 0 ? { activeItemId: textSearchResultListItemId(fileTargetPath(platform, workspaceRoot, selected[0]?.path ?? ""), selected[0]?.line ?? 0, previewText(selected[0]?.text ?? "")) } : {}),
    metadata: {
      pattern: normalizedPattern,
      matchedCount: matches.length,
      renderedCount: selected.length
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
      kind: "palette.grep",
      pattern: normalizedPattern,
      resultListId: resultList.id,
      matchedCount: matches.length,
      renderedCount: selected.length,
      activeItemId: resultList.activeItemId,
      redaction: { class: "internal", fields: ["pattern"] }
    },
    resultList
  };
}

export function resolveChatPaletteReferenceFocus(
  state: ChatPaletteState,
  selector: string | undefined
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult; readonly focus: ChatPaletteReferenceFocus } {
  const normalized = selector?.trim() || "current";
  const selected = selectReferenceItem(state.snapshot.referenceSets, normalized);
  const result = selected
    ? resolveCliAction({
      action: "focus-reference",
      mode: "result-list",
      target: referenceItemTarget(selected.item),
      dryRun: true
    }, state.snapshot)
    : missingTargetResult("focus-reference", normalized, state.snapshot);
  const updated = applyActionResult(state, result);
  return {
    ...updated,
    focus: {
      kind: "palette.reference.focus",
      ok: result.ok,
      selector: normalized,
      referenceSetId: selected?.set.id,
      referenceId: selected?.item.id,
      targetId: selected?.item.target.id,
      targetKind: selected?.item.target.kind,
      label: selected?.item.label,
      redaction: { class: "internal", fields: ["targetId", "label"] }
    }
  };
}

export function summarizeChatPaletteState(state: ChatPaletteState): ChatPaletteStateSummary {
  const list = activeResultList(state.snapshot);
  return {
    kind: "palette.state",
    mode: state.snapshot.mode,
    activeTargetId: state.snapshot.activeTarget?.id,
    activeTargetKind: state.snapshot.activeTarget?.kind,
    resultListId: list?.id,
    activeItemId: list?.activeItemId,
    jumpCount: state.snapshot.jumpHistory.entries.length,
    jumpCursor: state.snapshot.jumpHistory.cursor,
    referenceSetCount: state.snapshot.referenceSets.length,
    referenceCount: state.snapshot.referenceSets.reduce((total, set) => total + set.items.length, 0)
  };
}

export function summarizeChatPaletteReferences(state: ChatPaletteState): ChatPaletteReferenceSummary {
  const active = activeReference(state.snapshot.referenceSets);
  return {
    kind: "palette.references",
    referenceSetCount: state.snapshot.referenceSets.length,
    referenceCount: state.snapshot.referenceSets.reduce((total, set) => total + set.items.length, 0),
    activeSetId: active?.set.id,
    activeReferenceId: active?.item.id,
    redaction: { class: "internal", fields: ["activeReferenceId"] }
  };
}

export function agentLoopReferenceContextFromPaletteState(state: ChatPaletteState | undefined): AgentLoopReferenceContext | undefined {
  if (!state || state.snapshot.referenceSets.length === 0) return undefined;
  const active = activeReference(state.snapshot.referenceSets);
  const itemCount = state.snapshot.referenceSets.reduce((total, set) => total + set.items.length, 0);
  if (itemCount === 0) return undefined;
  return {
    schemaVersion: "1.0.0",
    source: "cli.palette.references",
    ...(active?.set.id ? { activeSetId: active.set.id } : {}),
    ...(active?.item.id ? { activeItemId: active.item.id } : {}),
    setCount: state.snapshot.referenceSets.length,
    itemCount,
    sets: state.snapshot.referenceSets.map((set) => ({
      id: set.id,
      label: set.label,
      ...(set.activeItemId ? { activeItemId: set.activeItemId } : {}),
      items: set.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        target: item.target,
        label: item.label,
        provenance: item.provenance,
        order: item.order,
        ...(item.budget ? { budget: item.budget } : {}),
        redaction: { class: "internal", fields: ["target", "label", "provenance"] }
      })),
      provenance: set.provenance,
      redaction: { class: "internal", fields: ["activeItemId", "items.target", "items.label", "provenance"] }
    })),
    redaction: { class: "internal", fields: ["sets.items.target", "sets.items.label", "sets.items.provenance"] }
  };
}

export function renderChatPaletteStateSummary(summary: ChatPaletteStateSummary, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json" || output === "jsonl") return [JSON.stringify(summary)];
  return [
    `palette state: mode=${summary.mode} active=${summary.activeTargetId ?? "none"} item=${summary.activeItemId ?? "none"} jumps=${summary.jumpCount} refs=${summary.referenceCount}`
  ];
}

export function renderChatPaletteReferences(state: ChatPaletteState, output: AgentLoopOutputMode): readonly string[] {
  const summary = summarizeChatPaletteReferences(state);
  if (output === "json") {
    return [JSON.stringify({
      ...summary,
      referenceSets: state.snapshot.referenceSets
    })];
  }
  if (output === "jsonl") {
    return [
      JSON.stringify(summary),
      ...state.snapshot.referenceSets.map((set) => JSON.stringify({ kind: "palette.reference.set", set: referenceSetRecord(set) })),
      ...state.snapshot.referenceSets.flatMap((set) => set.items.map((item) => JSON.stringify({ kind: "palette.reference.item", referenceSetId: set.id, active: set.activeItemId === item.id, item })))
    ];
  }
  if (summary.referenceCount === 0) return ["palette references: empty"];
  return [
    `palette references: sets=${summary.referenceSetCount} refs=${summary.referenceCount} active=${summary.activeReferenceId ?? "none"}`,
    ...state.snapshot.referenceSets.flatMap((set) => [
      `  set ${set.id} ${set.label} active=${set.activeItemId ?? "none"}`,
      ...set.items.map((item) => `    ${set.activeItemId === item.id ? "*" : " "} ${item.order + 1} ${item.id} ${item.label} -> ${item.target.id}`)
    ])
  ];
}

export function renderChatPaletteFileSearch(
  summary: ChatPaletteFileSearchSummary,
  resultList: CliResultList,
  output: AgentLoopOutputMode
): readonly string[] {
  if (output === "json") return [JSON.stringify({ ...summary, resultList })];
  if (output === "jsonl") {
    return [
      JSON.stringify(summary),
      ...resultList.items.map((item) => JSON.stringify({ kind: "palette.file.item", resultListId: resultList.id, active: resultList.activeItemId === item.id, item }))
    ];
  }
  if (resultList.items.length === 0) return [`palette files: 0 matches for ${summary.pattern}`];
  return [
    `palette files: ${summary.renderedCount}/${summary.matchedCount} matches active=${summary.activeItemId ?? "none"}`,
    ...resultList.items.map((item) => `  ${resultList.activeItemId === item.id ? "*" : " "} ${item.order + 1} ${item.label}`)
  ];
}

export function renderChatPaletteTextSearch(
  summary: ChatPaletteTextSearchSummary,
  resultList: CliResultList,
  output: AgentLoopOutputMode
): readonly string[] {
  if (output === "json") return [JSON.stringify({ ...summary, resultList })];
  if (output === "jsonl") {
    return [
      JSON.stringify(summary),
      ...resultList.items.map((item) => JSON.stringify({ kind: "palette.grep.item", resultListId: resultList.id, active: resultList.activeItemId === item.id, item }))
    ];
  }
  if (resultList.items.length === 0) return [`palette grep: 0 matches for ${summary.pattern}`];
  return [
    `palette grep: ${summary.renderedCount}/${summary.matchedCount} matches active=${summary.activeItemId ?? "none"}`,
    ...resultList.items.map((item) => `  ${resultList.activeItemId === item.id ? "*" : " "} ${item.order + 1} ${item.label}`)
  ];
}

export function renderChatPaletteReferenceFocus(
  focus: ChatPaletteReferenceFocus,
  state: ChatPaletteState,
  output: AgentLoopOutputMode
): readonly string[] {
  const stateLines = renderChatPaletteStateSummary(summarizeChatPaletteState(state), output);
  if (output === "json" || output === "jsonl") return [JSON.stringify(focus), ...stateLines];
  return [
    focus.ok
      ? `palette reference focus: ${focus.referenceId ?? "none"} target=${focus.targetId ?? "none"}`
      : `palette reference focus: failed selector=${focus.selector}`,
    ...stateLines
  ];
}

export function renderChatPaletteReferenceMutation(
  mutation: ChatPaletteReferenceMutation,
  state: ChatPaletteState,
  output: AgentLoopOutputMode
): readonly string[] {
  const stateLines = renderChatPaletteStateSummary(summarizeChatPaletteState(state), output);
  if (output === "json" || output === "jsonl") return [JSON.stringify(mutation), ...stateLines];
  return [
    mutation.ok
      ? `palette reference ${mutation.action}: ok refs=${mutation.referenceCount} active=${mutation.activeReferenceId ?? "none"}`
      : `palette reference ${mutation.action}: failed selector=${mutation.selector ?? "none"}`,
    ...stateLines
  ];
}

export function renderChatPaletteActionWithState(
  result: CliActionResolutionResult,
  state: ChatPaletteState,
  output: AgentLoopOutputMode
): readonly string[] {
  const actionLines = renderPaletteActionResult(result, output);
  return [...actionLines, ...renderChatPaletteStateSummary(summarizeChatPaletteState(state), output)];
}

function applyActionResult(
  state: ChatPaletteState,
  result: CliActionResolutionResult
): { readonly state: ChatPaletteState; readonly result: CliActionResolutionResult } {
  if (!result.ok) return { state, result };
  return { state: { ...state, snapshot: result.snapshot }, result };
}

function activeResultList(snapshot: CliCompositionSnapshot): CliResultList | undefined {
  return snapshot.resultLists[0];
}

function activeReference(sets: readonly CliReferenceSet[]): { readonly set: CliReferenceSet; readonly item: CliReferenceItem } | undefined {
  for (const set of sets) {
    const item = set.items.find((candidate) => candidate.id === set.activeItemId) ?? set.items[0];
    if (item) return { set, item };
  }
  return undefined;
}

function addFileReferenceToSnapshot(snapshot: CliCompositionSnapshot, path: string): CliCompositionSnapshot {
  const set = snapshot.referenceSets[0] ?? {
    id: "refset:active",
    label: "Active references",
    items: [],
    provenance: { source: "cli.palette.refs.add-file" },
    createdAt: "1970-01-01T00:00:00.000Z"
  };
  const itemId = `ref:file:${stableReferenceId(path)}`;
  const existing = set.items.find((item) => item.id === itemId || item.target.path === path);
  const item: CliReferenceItem = existing ?? {
    id: itemId,
    kind: "file",
    target: { kind: "file", id: `file:${path}`, label: path, path },
    label: path,
    provenance: { source: "cli.palette.refs.add-file" },
    order: set.items.length,
    budget: { estimatedTokens: 256 }
  };
  const nextSet: CliReferenceSet = {
    ...set,
    items: existing ? set.items : [...set.items, item],
    activeItemId: item.id
  };
  return {
    ...snapshot,
    activeTarget: item.target,
    referenceSets: snapshot.referenceSets.length > 0
      ? [nextSet, ...snapshot.referenceSets.slice(1)]
      : [nextSet]
  };
}

function removeReferenceFromSnapshot(snapshot: CliCompositionSnapshot, setId: string, itemId: string): CliCompositionSnapshot {
  const referenceSets: CliReferenceSet[] = [];
  for (const set of snapshot.referenceSets) {
    if (set.id !== setId) {
      referenceSets.push(set);
      continue;
    }
    const removedIndex = set.items.findIndex((item) => item.id === itemId);
    if (removedIndex < 0) {
      referenceSets.push(set);
      continue;
    }
    const items = set.items
      .filter((item) => item.id !== itemId)
      .map((item, order) => ({ ...item, order }));
    if (items.length === 0) continue;
    const activeIndex = Math.min(removedIndex, items.length - 1);
    const activeItem = items[activeIndex];
    if (!activeItem) continue;
    referenceSets.push({ ...set, items, activeItemId: activeItem.id });
  }
  const active = activeReference(referenceSets);
  return {
    ...snapshot,
    ...(active ? { activeTarget: active.item.target } : {}),
    referenceSets
  };
}

function referenceMutation(
  action: ChatPaletteReferenceMutation["action"],
  ok: boolean,
  selector: string | undefined,
  removedReferenceId: string | undefined,
  snapshot: CliCompositionSnapshot
): ChatPaletteReferenceMutation {
  const active = activeReference(snapshot.referenceSets);
  return {
    kind: "palette.reference.mutation",
    ok,
    action,
    selector,
    removedReferenceId,
    activeReferenceId: active?.item.id,
    referenceCount: snapshot.referenceSets.reduce((total, set) => total + set.items.length, 0),
    redaction: { class: "internal", fields: ["selector", "removedReferenceId", "activeReferenceId"] }
  };
}

function selectReferenceItem(
  sets: readonly CliReferenceSet[],
  selector: string
): { readonly set: CliReferenceSet; readonly item: CliReferenceItem } | undefined {
  if (selector === "current") return activeReference(sets);
  const index = Number(selector);
  const flattened = sets.flatMap((set) => set.items.map((item) => ({ set, item })));
  if (Number.isInteger(index) && index > 0) return flattened[index - 1];
  return flattened.find(({ item }) => item.id === selector || item.target.id === selector);
}

function activeResultListTarget(snapshot: CliCompositionSnapshot): CliTargetRef {
  const list = activeResultList(snapshot);
  return {
    kind: "result-list",
    id: list?.id ?? "result-list:missing",
    label: list?.label ?? "Missing result list"
  };
}

function referenceItemTarget(item: CliReferenceItem): CliTargetRef {
  return {
    kind: item.target.kind,
    id: item.id,
    label: item.label,
    metadata: {
      targetId: item.target.id
    }
  };
}

function referenceSetRecord(set: CliReferenceSet): JsonObject {
  return {
    id: set.id,
    label: set.label,
    activeItemId: set.activeItemId,
    itemCount: set.items.length,
    provenance: set.provenance,
    redaction: { class: "internal", fields: ["activeItemId"] }
  };
}

function activeResultListItemTarget(snapshot: CliCompositionSnapshot): CliTargetRef | undefined {
  const list = activeResultList(snapshot);
  if (!list) return undefined;
  const activeItem = list.items.find((item) => item.id === list.activeItemId) ?? list.items[0];
  return activeItem ? resultListItemTarget(activeItem) : undefined;
}

function resultListItemTargetById(snapshot: CliCompositionSnapshot, targetId: string): CliTargetRef | undefined {
  for (const list of snapshot.resultLists) {
    const item = list.items.find((candidate) => candidate.id === targetId || candidate.target.id === targetId);
    if (item) return resultListItemTarget(item);
  }
  return undefined;
}

function resultListItemTarget(item: CliResultListItem): CliTargetRef {
  if (item.target.kind === "file" || item.target.kind === "turn") return item.target;
  return { kind: "result-list-item", id: item.id, label: item.label };
}

function missingTargetResult(action: CliActionKind, targetId: string, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  return resolveCliAction({
    action,
    mode: "result-list",
    target: { kind: "result-list-item", id: targetId, label: targetId },
    dryRun: true
  }, snapshot);
}

function stableReferenceId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function fileResultListItem(platform: PlatformRuntime, workspaceRoot: string, file: string, order: number): CliResultListItem {
  const path = fileTargetPath(platform, workspaceRoot, file);
  return {
    id: fileResultListItemId(path),
    target: {
      kind: "file",
      id: `file:${stableReferenceId(path)}`,
      label: path,
      path,
      metadata: {
        sourcePath: normalizeDisplayPath(file)
      }
    },
    label: path,
    order,
    metadata: {
      sourceCommand: "palette.files"
    }
  };
}

function textSearchResultListItem(platform: PlatformRuntime, workspaceRoot: string, pattern: string, match: SearchResult, order: number): CliResultListItem {
  const path = fileTargetPath(platform, workspaceRoot, match.path);
  const preview = previewText(match.text);
  const id = textSearchResultListItemId(path, match.line, preview);
  return {
    id,
    target: {
      kind: "file",
      id: `file:${stableReferenceId(path)}`,
      label: `${path}:${match.line}`,
      path,
      metadata: {
        sourcePath: normalizeDisplayPath(match.path),
        line: match.line,
        searchText: pattern,
        preview,
        engine: match.engine,
        ...(match.metadata ? {
          providerStatus: match.metadata.status,
          selectedProvider: match.metadata.selectedProvider,
          fallbackReason: match.metadata.fallbackReason
        } : {})
      }
    },
    label: `${path}:${match.line}: ${preview}`,
    order,
    metadata: {
      sourceCommand: "palette.grep",
      line: match.line,
      searchText: pattern,
      preview,
      engine: match.engine
    }
  };
}

function fileTargetPath(platform: PlatformRuntime, workspaceRoot: string, file: string): string {
  const resolved = platform.resolveWorkspacePath(workspaceRoot, file);
  if (resolved.ok && resolved.value?.relativePath) return normalizeDisplayPath(resolved.value.relativePath);
  return normalizeDisplayPath(file);
}

function fileResultListItemId(path: string): string {
  return `file-result:${stableReferenceId(path)}`;
}

function textSearchResultListItemId(path: string, line: number, preview: string): string {
  return `grep-result:${stableReferenceId(`${path}:${line}:${preview}`)}`;
}

function comparePath(a: string, b: string): number {
  return normalizeDisplayPath(a).localeCompare(normalizeDisplayPath(b));
}

function compareSearchResult(a: SearchResult, b: SearchResult): number {
  const byPath = comparePath(a.path, b.path);
  if (byPath !== 0) return byPath;
  if (a.line !== b.line) return a.line - b.line;
  return a.text.localeCompare(b.text);
}

function normalizeDisplayPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function previewText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > CHAT_SEARCH_PREVIEW_LIMIT
    ? `${normalized.slice(0, CHAT_SEARCH_PREVIEW_LIMIT - 3)}...`
    : normalized;
}
