import type {
  CliActionRequest,
  CliActionResolutionResult,
  CliCompositionSnapshot,
  CliJumpEntry,
  CliPaletteDiagnostic,
  CliReferenceItem,
  CliReferenceKind,
  CliReferenceSet,
  CliResultList,
  CliResultListItem,
  CliTargetRef
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export function resolveCliAction(request: CliActionRequest, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  if (request.action === "next" || request.action === "previous" || request.action === "first" || request.action === "last") {
    return resolveNavigation(request, snapshot);
  }
  if (request.action === "back" || request.action === "forward") {
    return resolveJumpTraversal(request, snapshot);
  }
  if (request.action === "add-to-reference-set") {
    return resolveAddToReferenceSet(request, snapshot);
  }
  if (request.action === "focus-reference") {
    return resolveFocusReference(request, snapshot);
  }
  if (request.action === "revert") {
    return success(request, snapshot, {
      activeTarget: request.target,
      commandDescriptor: {
        kind: "cli.revert.preview",
        dryRun: true,
        target: request.target,
        requestId: request.target.kind === "request" ? request.target.id : undefined,
        turnId: request.target.turnId ?? (request.target.kind === "turn" ? request.target.id : undefined),
        sessionId: request.target.sessionId
      }
    });
  }
  if (request.action === "scroll" || request.action === "focus-panel" || request.action === "preview" || request.action === "plugin-action" || request.action === "cancel" || request.action === "search") {
    return success(request, snapshot, {
      activeTarget: request.target,
      commandDescriptor: {
        kind: request.action === "plugin-action" ? "cli.plugin-action" : `cli.${request.action}`,
        dryRun: request.dryRun !== false,
        target: request.target,
        arguments: request.arguments ?? {},
        governed: true,
        modelVisible: false
      }
    });
  }
  if (request.action === "open" || request.action === "inspect" || request.action === "copy" || request.action === "explain") {
    return success(request, snapshot, {
      activeTarget: request.target,
      commandDescriptor: {
        kind: `cli.${request.action}`,
        dryRun: request.dryRun !== false,
        target: request.target,
        arguments: request.arguments ?? {}
      }
    });
  }
  return failure(request, snapshot, "CLI_ACTION_UNSUPPORTED", `Unsupported action: ${request.action}`, [request.target.id]);
}

function resolveNavigation(request: CliActionRequest, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  const list = findResultList(snapshot, request.target);
  if (!list) return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", "Result list target was not found.", [request.target.id]);
  const currentIndex = activeIndex(list);
  const nextIndex = boundedIndex(request.action, currentIndex, list.items.length, request.count ?? 1);
  const item = list.items[nextIndex];
  if (!item) return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", "Result list item was not found.", [request.target.id]);

  const updatedList: CliResultList = { ...list, activeItemId: item.id };
  const resultLists = snapshot.resultLists.map((candidate) => (candidate.id === list.id ? updatedList : candidate));
  const jumpEntry = list.activeItemId === item.id ? undefined : createJump(snapshot.activeTarget, item.target, request.action);
  return success(request, { ...snapshot, resultLists, activeTarget: item.target, jumpHistory: appendJump(snapshot.jumpHistory, jumpEntry) }, {
    activeTarget: item.target,
    resultLists,
    ...(jumpEntry ? { jumpEntry } : {})
  });
}

function resolveJumpTraversal(request: CliActionRequest, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  const nextCursor = request.action === "back" ? snapshot.jumpHistory.cursor : snapshot.jumpHistory.cursor + 1;
  const entry = snapshot.jumpHistory.entries[nextCursor];
  if (!entry) {
    return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", `No jump history destination for ${request.action}.`, [request.target.id]);
  }
  const destination = request.action === "back" ? entry.source : entry.destination;
  if (!destination) {
    return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", `No jump history destination for ${request.action}.`, [request.target.id]);
  }
  const cursor = request.action === "back" ? nextCursor - 1 : nextCursor;
  const resultLists = focusResultLists(snapshot.resultLists, destination);
  return success(request, {
    ...snapshot,
    activeTarget: destination,
    resultLists,
    jumpHistory: { ...snapshot.jumpHistory, cursor }
  }, {
    activeTarget: destination,
    resultLists
  });
}

function resolveAddToReferenceSet(request: CliActionRequest, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  const item = findResultListItem(snapshot, request.target);
  if (!item) return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", "Result list item target was not found.", [request.target.id]);
  const referenceSets = addReference(snapshot.referenceSets, item);
  return success(request, { ...snapshot, referenceSets, activeTarget: item.target }, {
    activeTarget: item.target,
    referenceSets
  });
}

function resolveFocusReference(request: CliActionRequest, snapshot: CliCompositionSnapshot): CliActionResolutionResult {
  const match = findReferenceItem(snapshot, request.target);
  if (!match) return failure(request, snapshot, "CLI_ACTION_TARGET_NOT_FOUND", "Reference item target was not found.", [request.target.id]);
  const referenceSets = snapshot.referenceSets.map((set) => (
    set.id === match.set.id ? { ...set, activeItemId: match.item.id } : set
  ));
  return success(request, { ...snapshot, referenceSets, activeTarget: match.item.target }, {
    activeTarget: match.item.target,
    referenceSets
  });
}

function success(
  request: CliActionRequest,
  snapshot: CliCompositionSnapshot,
  update: NonNullable<CliActionResolutionResult["update"]>
): CliActionResolutionResult {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    ok: true,
    action: request.action,
    mode: request.mode,
    target: request.target,
    snapshot,
    update,
    diagnostics: [],
    redaction: { class: "internal" }
  };
}

function failure(
  request: CliActionRequest,
  snapshot: CliCompositionSnapshot,
  code: CliPaletteDiagnostic["code"],
  message: string,
  targetIds: readonly string[]
): CliActionResolutionResult {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    ok: false,
    action: request.action,
    mode: request.mode,
    target: request.target,
    snapshot,
    diagnostics: [{
      code,
      message,
      retryable: false,
      severity: "error",
      targetIds,
      redaction: { class: "public" },
      details: { targetIds }
    }],
    redaction: { class: "internal" }
  };
}

function findResultList(snapshot: CliCompositionSnapshot, target: CliTargetRef): CliResultList | undefined {
  if (target.kind === "result-list") return snapshot.resultLists.find((list) => list.id === target.id);
  if (target.kind === "result-list-item") {
    return snapshot.resultLists.find((list) => list.items.some((item) => item.id === target.id));
  }
  return undefined;
}

function findResultListItem(snapshot: CliCompositionSnapshot, target: CliTargetRef): CliResultListItem | undefined {
  if (target.kind === "result-list-item") {
    return snapshot.resultLists.flatMap((list) => list.items).find((item) => item.id === target.id);
  }
  return snapshot.resultLists.flatMap((list) => list.items).find((item) => item.target.id === target.id);
}

function findReferenceItem(snapshot: CliCompositionSnapshot, target: CliTargetRef): { readonly set: CliReferenceSet; readonly item: CliReferenceItem } | undefined {
  for (const set of snapshot.referenceSets) {
    const item = set.items.find((candidate) => (
      candidate.id === target.id
      || candidate.target.id === target.id
      || (target.kind === "result-list-item" && candidate.provenance.resultListItemId === target.id)
    ));
    if (item) return { set, item };
  }
  return undefined;
}

function activeIndex(list: CliResultList): number {
  const index = list.items.findIndex((item) => item.id === list.activeItemId);
  return index >= 0 ? index : 0;
}

function boundedIndex(action: CliActionRequest["action"], current: number, length: number, count: number): number {
  if (length <= 0) return 0;
  if (action === "first") return 0;
  if (action === "last") return length - 1;
  const delta = action === "previous" ? -count : count;
  return Math.max(0, Math.min(length - 1, current + delta));
}

function focusResultLists(lists: readonly CliResultList[], target: CliTargetRef): readonly CliResultList[] {
  return lists.map((list) => {
    const item = list.items.find((candidate) => candidate.target.id === target.id);
    return item ? { ...list, activeItemId: item.id } : list;
  });
}

function appendJump(history: CliCompositionSnapshot["jumpHistory"], entry: CliJumpEntry | undefined): CliCompositionSnapshot["jumpHistory"] {
  if (!entry) return history;
  const entries = [...history.entries.slice(0, history.cursor + 1), entry];
  return { entries, cursor: entries.length - 1 };
}

function createJump(source: CliTargetRef | undefined, destination: CliTargetRef, action: string): CliJumpEntry {
  return {
    id: `jump:${action}:${destination.id}`,
    ...(source ? { source } : {}),
    destination,
    timestamp: "1970-01-01T00:00:00.000Z",
    provenance: { action }
  };
}

function addReference(sets: readonly CliReferenceSet[], item: CliResultListItem): readonly CliReferenceSet[] {
  const existing = sets[0] ?? {
    id: "refs:active",
    label: "Active references",
    items: [],
    provenance: { source: "cli-action" }
  };
  const reference: CliReferenceItem = {
    id: `ref:${item.id}`,
    kind: referenceKind(item.target),
    target: item.target,
    label: item.label,
    provenance: { source: "result-list", resultListItemId: item.id },
    order: existing.items.length
  };
  const updated: CliReferenceSet = {
    ...existing,
    items: existing.items.some((candidate) => candidate.id === reference.id) ? existing.items : [...existing.items, reference],
    activeItemId: reference.id
  };
  return sets.length === 0 ? [updated] : [updated, ...sets.slice(1)];
}

function referenceKind(target: CliTargetRef): CliReferenceKind {
  if (target.kind === "file" || target.kind === "directory" || target.kind === "symbol" || target.kind === "diff" || target.kind === "diagnostic" || target.kind === "message" || target.kind === "turn" || target.kind === "tool-evidence") {
    return target.kind;
  }
  return "search-result";
}
