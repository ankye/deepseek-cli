import type { CliCompositionSnapshot, CliReferenceItem, CliReferenceSet, CliResultList } from "@deepseek/platform-contracts";
import type { ChatPaletteState } from "./palette-state.js";

export function attachChatPaletteResultList(
  state: ChatPaletteState,
  resultList: CliResultList,
  referenceItems: readonly CliReferenceItem[] = []
): ChatPaletteState {
  const activeItem = resultList.items.find((item) => item.id === resultList.activeItemId) ?? resultList.items[0];
  const activeTarget = activeItem?.target ?? state.snapshot.activeTarget;
  const snapshot: CliCompositionSnapshot = {
    ...state.snapshot,
    mode: "result-list",
    ...(activeTarget ? { activeTarget } : {}),
    resultLists: [
      resultList,
      ...state.snapshot.resultLists.filter((list) => list.id !== resultList.id)
    ],
    referenceSets: referenceItems.length > 0
      ? attachNavigationReferenceSet(state.snapshot.referenceSets, referenceItems)
      : state.snapshot.referenceSets
  };
  return { ...state, snapshot };
}

function attachNavigationReferenceSet(
  existingSets: readonly CliReferenceSet[],
  referenceItems: readonly CliReferenceItem[]
): readonly CliReferenceSet[] {
  const items = referenceItems.map((item, order) => ({ ...item, order }));
  const first = items[0];
  const set: CliReferenceSet = {
    id: "refset:navigation",
    label: "Navigation slash references",
    items,
    provenance: { source: "chat.navigation.slash" },
    createdAt: "1970-01-01T00:00:00.000Z",
    ...(first ? { activeItemId: first.id } : {})
  };
  return [set, ...existingSets.filter((entry) => entry.id !== set.id)];
}
