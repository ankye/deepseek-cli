import type {
  CliCompositionSnapshot,
  CliContributionKind,
  CliContributionSourceKind,
  CliInteractionContribution,
  CliInteractionMode,
  CliPanelScrollState,
  CliPluginContributionExplanation,
  CliTargetRef,
  VisibleReasoningDetailLevel,
  VisibleReasoningProjection
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";

export type ChatTuiWorkbenchLayoutKind = "wide" | "balanced" | "compact" | "disabled";
export type ChatTuiWorkbenchPanelId =
  | "status"
  | "transcript"
  | "result-list"
  | "reasoning"
  | "inspector"
  | "command-bar"
  | "activity"
  | "plugins";
export type ChatTuiCommandBarMode = "closed" | "slash" | "palette" | "search";
export type ChatTuiCommandSuggestionKind =
  | "control"
  | "palette"
  | "context"
  | "reference"
  | "history"
  | "reasoning-view"
  | "plugin-action";
export type ChatTuiActivityStatus = "ready" | "running" | "warning" | "blocked";
export type ChatTuiActivityKind = "turns" | "diagnostics" | "reasoning" | "focus" | "command-bar" | "plugins";

export interface ChatTuiWorkbenchRegion {
  readonly id: ChatTuiWorkbenchPanelId;
  readonly label: string;
  readonly visible: boolean;
  readonly priority: number;
  readonly lineBudget: number;
  readonly summary: string;
}

export interface ChatTuiFocusState {
  readonly activePanel: ChatTuiWorkbenchPanelId;
  readonly previousPanel?: ChatTuiWorkbenchPanelId;
  readonly history: readonly ChatTuiWorkbenchPanelId[];
  readonly reason: "initial" | "mode" | "keyboard" | "command" | "projection";
}

export interface ChatTuiCommandSuggestion {
  readonly id: string;
  readonly title: string;
  readonly kind: ChatTuiCommandSuggestionKind;
  readonly source: CliContributionSourceKind | "builtin";
  readonly commandName?: string;
  readonly targetKind?: string;
  readonly pluginId?: string;
  readonly rank: number;
}

export interface ChatTuiCommandBarState {
  readonly open: boolean;
  readonly mode: ChatTuiCommandBarMode;
  readonly query: string;
  readonly placeholder: string;
  readonly activeSuggestionId?: string;
  readonly suggestions: readonly ChatTuiCommandSuggestion[];
  readonly totalSuggestionCount: number;
  readonly overflowCount: number;
}

export interface ChatTuiReasoningStep {
  readonly recordId: string;
  readonly order: number;
  readonly stepKind: string;
  readonly status: string;
  readonly certainty: string;
  readonly evidenceCount: number;
  readonly active: boolean;
  readonly summary: string;
}

export interface ChatTuiReasoningRail {
  readonly enabled: boolean;
  readonly detailLevel: VisibleReasoningDetailLevel;
  readonly recordCount: number;
  readonly evidenceLinkCount: number;
  readonly activeRecordId?: string;
  readonly steps: readonly ChatTuiReasoningStep[];
  readonly overflowCount: number;
  readonly statusText: string;
}

export interface ChatTuiInspectorItem {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly source: "reasoning-evidence" | "result-list" | "active-target";
  readonly target: CliTargetRef;
}

export interface ChatTuiInspectorState {
  readonly active: boolean;
  readonly title: string;
  readonly items: readonly ChatTuiInspectorItem[];
  readonly overflowCount: number;
  readonly emptyReason: string;
}

export interface ChatTuiActivityRecord {
  readonly id: string;
  readonly kind: ChatTuiActivityKind;
  readonly label: string;
  readonly status: ChatTuiActivityStatus;
  readonly targetPanel?: ChatTuiWorkbenchPanelId;
}

export interface ChatTuiActivityFeed {
  readonly records: readonly ChatTuiActivityRecord[];
  readonly overflowCount: number;
}

export interface ChatTuiPluginShelfItem {
  readonly pluginId: string;
  readonly contributionCount: number;
  readonly activeContributionCount: number;
  readonly hiddenContributionCount: number;
  readonly commandCount: number;
  readonly paletteEntryCount: number;
  readonly resultListProviderCount: number;
  readonly keymapCount: number;
  readonly renderHintCount: number;
  readonly permissionPreview: readonly string[];
  readonly helpText: string;
  readonly status: "ready" | "conflict" | "diagnostic";
}

export interface ChatTuiPluginShelf {
  readonly readiness: "governed-descriptors" | "metadata-only" | "disabled";
  readonly totalPlugins: number;
  readonly totalContributions: number;
  readonly conflicts: number;
  readonly diagnostics: number;
  readonly byKind: Readonly<Partial<Record<CliContributionKind, number>>>;
  readonly items: readonly ChatTuiPluginShelfItem[];
  readonly explanations: readonly CliPluginContributionExplanation[];
  readonly overflowCount: number;
}

export interface ChatTuiKeyboardHint {
  readonly key: string;
  readonly label: string;
  readonly targetPanel?: ChatTuiWorkbenchPanelId;
}

export interface ChatTuiWorkbench {
  readonly layout: ChatTuiWorkbenchLayoutKind;
  readonly columns?: number;
  readonly regions: readonly ChatTuiWorkbenchRegion[];
  readonly focus: ChatTuiFocusState;
  readonly commandBar: ChatTuiCommandBarState;
  readonly reasoningRail: ChatTuiReasoningRail;
  readonly inspector: ChatTuiInspectorState;
  readonly activityFeed: ChatTuiActivityFeed;
  readonly pluginShelf: ChatTuiPluginShelf;
  readonly scrollStates: readonly CliPanelScrollState[];
  readonly keyboardHints: readonly ChatTuiKeyboardHint[];
  readonly frameLineBudget: number;
}

export interface ChatTuiWorkbenchInput {
  readonly enabled: boolean;
  readonly frameworkId: string;
  readonly mode: CliInteractionMode;
  readonly terminalProfile: CliTerminalCapabilityProfile;
  readonly composition: CliCompositionSnapshot;
  readonly contributionSummary: {
    readonly total: number;
    readonly accepted: number;
    readonly conflicts: number;
    readonly diagnostics: number;
    readonly byKind: Readonly<Partial<Record<CliContributionKind, number>>>;
    readonly bySource: Readonly<Partial<Record<CliContributionSourceKind, number>>>;
  };
  readonly diagnostics: readonly { readonly code: string; readonly severity: string; readonly targetIds: readonly string[] }[];
  readonly pluginReadiness: "governed-descriptors" | "metadata-only" | "disabled";
  readonly pluginContributionExplanations?: readonly CliPluginContributionExplanation[];
  readonly reasoningPanel: {
    readonly enabled: boolean;
    readonly detailLevel: VisibleReasoningDetailLevel;
    readonly recordCount: number;
    readonly evidenceLinkCount: number;
    readonly activeRecordId?: string;
    readonly inspectorTargets: readonly CliTargetRef[];
    readonly statusText: string;
  };
  readonly promptReady: boolean;
  readonly turns: number;
  readonly sessionId?: string;
  readonly visibleReasoning?: VisibleReasoningProjection;
  readonly focus?: ChatTuiFocusState;
  readonly commandBar?: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query" | "activeSuggestionId">>;
}

export interface ChatTuiWorkbenchKeyDispatch {
  readonly handled: boolean;
  readonly workbench: ChatTuiWorkbench;
  readonly activePanel?: ChatTuiWorkbenchPanelId;
  readonly commandBarOpened?: boolean;
}

const CORE_COMMANDS: readonly ChatTuiCommandSuggestion[] = [
  suggestion("control.help", "/help", "control", "builtin", 0, "/help"),
  suggestion("control.palette", "/palette", "palette", "builtin", 1, "/palette"),
  suggestion("control.context", "/context status", "context", "builtin", 2, "/context status"),
  suggestion("control.refs", "/palette refs list", "reference", "builtin", 3, "/palette refs list"),
  suggestion("view.reasoning", "Reasoning: focus rail", "reasoning-view", "builtin", 4, "reasoning.focus"),
  suggestion("view.inspector", "Inspector: active evidence", "reasoning-view", "builtin", 5, "inspector.focus"),
  suggestion("control.history", "/history", "history", "builtin", 6, "/history"),
  suggestion("control.revert", "/revert preview current", "history", "builtin", 7, "/revert preview current"),
  suggestion("control.mode", "/mode status", "control", "builtin", 8, "/mode status"),
  suggestion("control.model", "/model", "control", "builtin", 9, "/model"),
  suggestion("control.cost", "/cost", "control", "builtin", 10, "/cost"),
  suggestion("control.cancel", "/cancel", "control", "builtin", 11, "/cancel")
];

const PANEL_ORDER: readonly ChatTuiWorkbenchPanelId[] = [
  "transcript",
  "result-list",
  "reasoning",
  "inspector",
  "command-bar",
  "activity",
  "plugins"
];

export function createChatTuiWorkbench(input: ChatTuiWorkbenchInput): ChatTuiWorkbench {
  const layout = selectLayout(input.enabled, input.terminalProfile.columns);
  const focus = normalizeFocus(input.focus, input.mode, input.composition, layout);
  const commandBar = projectCommandBar(input.composition, layout, focus, input.commandBar);
  const reasoningRail = projectReasoningRail(input.reasoningPanel, input.visibleReasoning, layout);
  const inspector = projectInspector(input.composition, reasoningRail, input.reasoningPanel.inspectorTargets, focus, layout);
  const activityFeed = projectActivityFeed(input, focus, commandBar, reasoningRail, layout);
  const pluginShelf = projectPluginShelf(input.composition.contributions, input.contributionSummary, input.diagnostics, input.pluginReadiness, input.pluginContributionExplanations ?? [], layout);
  const regions = projectRegions(input, layout, focus, commandBar, reasoningRail, inspector, activityFeed, pluginShelf);
  const scrollStates = projectScrollStates(regions);
  return {
    layout,
    ...(input.terminalProfile.columns ? { columns: input.terminalProfile.columns } : {}),
    regions,
    focus,
    commandBar,
    reasoningRail,
    inspector,
    activityFeed,
    pluginShelf,
    scrollStates,
    keyboardHints: keyboardHints(layout),
    frameLineBudget: lineBudgetFor(layout)
  };
}

export function dispatchChatTuiWorkbenchKey(workbench: ChatTuiWorkbench, key: string): ChatTuiWorkbenchKeyDispatch {
  if (workbench.layout === "disabled") return { handled: false, workbench };
  if (key === "/") {
    return {
      handled: true,
      workbench: updateWorkbenchFocus(workbench, "command-bar", {
        open: true,
        mode: "search",
        query: ""
      }),
      activePanel: "command-bar",
      commandBarOpened: true
    };
  }
  if (key === "Escape" || key === "Esc") {
    const panel = workbench.focus.activePanel === "command-bar"
      ? (workbench.focus.previousPanel ?? "transcript")
      : "transcript";
    return {
      handled: true,
      workbench: updateWorkbenchFocus(workbench, panel, { open: false, mode: "closed", query: "" }),
      activePanel: panel
    };
  }
  const directPanel = directPanelForKey(key);
  if (directPanel) {
    return {
      handled: true,
      workbench: updateWorkbenchFocus(workbench, directPanel),
      activePanel: directPanel
    };
  }
  if (key === "Tab" || key === "Shift+Tab" || key === "BackTab" || key === "S-Tab") {
    const panel = cyclePanel(workbench, key === "Tab" ? 1 : -1);
    return {
      handled: true,
      workbench: updateWorkbenchFocus(workbench, panel),
      activePanel: panel
    };
  }
  return { handled: false, workbench };
}

function selectLayout(enabled: boolean, columns: number | undefined): ChatTuiWorkbenchLayoutKind {
  if (!enabled) return "disabled";
  if (!columns || columns < 90) return "compact";
  if (columns >= 132) return "wide";
  return "balanced";
}

function normalizeFocus(
  previous: ChatTuiFocusState | undefined,
  mode: CliInteractionMode,
  composition: CliCompositionSnapshot,
  layout: ChatTuiWorkbenchLayoutKind
): ChatTuiFocusState {
  if (layout === "disabled") return { activePanel: "status", history: ["status"], reason: "projection" };
  const activePanel = previous?.activePanel && panelAvailable(previous.activePanel, composition)
    ? previous.activePanel
    : defaultPanelForMode(mode, composition);
  const history = boundedHistory(previous?.history ?? [], activePanel);
  return {
    activePanel,
    ...(previous?.previousPanel ? { previousPanel: previous.previousPanel } : {}),
    history,
    reason: previous?.reason ?? (mode === "prompt" ? "initial" : "mode")
  };
}

function defaultPanelForMode(mode: CliInteractionMode, composition: CliCompositionSnapshot): ChatTuiWorkbenchPanelId {
  if (mode === "command") return "command-bar";
  if (mode === "result-list" && composition.resultLists.length > 0) return "result-list";
  if (mode === "selection") return "result-list";
  if (mode === "approval") return "inspector";
  return "transcript";
}

function projectCommandBar(
  composition: CliCompositionSnapshot,
  layout: ChatTuiWorkbenchLayoutKind,
  focus: ChatTuiFocusState,
  state: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query" | "activeSuggestionId">> | undefined
): ChatTuiCommandBarState {
  const open = state?.open ?? focus.activePanel === "command-bar";
  const mode = state?.mode ?? (open ? "slash" : "closed");
  const query = state?.query ?? "";
  const all = commandSuggestions(composition, query);
  const cap = layout === "compact" ? 5 : 8;
  const suggestions = all.slice(0, cap);
  return {
    open,
    mode,
    query,
    placeholder: mode === "search" ? "Search commands, context, history, references, reasoning, plugins" : "Type / for commands or Tab to move panels",
    ...(state?.activeSuggestionId ? { activeSuggestionId: state.activeSuggestionId } : suggestions[0] ? { activeSuggestionId: suggestions[0].id } : {}),
    suggestions,
    totalSuggestionCount: all.length,
    overflowCount: Math.max(0, all.length - suggestions.length)
  };
}

function commandSuggestions(composition: CliCompositionSnapshot, query: string): readonly ChatTuiCommandSuggestion[] {
  const pluginSuggestions = composition.contributions.flatMap((contribution) => contributionSuggestion(contribution));
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  return [...CORE_COMMANDS, ...pluginSuggestions]
    .filter((entry) => normalizedQuery.length === 0 || `${entry.title} ${entry.commandName ?? ""} ${entry.kind}`.toLocaleLowerCase("en").includes(normalizedQuery))
    .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en"));
}

function contributionSuggestion(contribution: CliInteractionContribution): readonly ChatTuiCommandSuggestion[] {
  const sourceRank = contribution.source === "core" ? 100 : contribution.source === "user" ? 200 : 300;
  if (contribution.kind === "command") {
    const commandName = contribution.commandName ?? contribution.id;
    return [suggestion(
      `contribution:${contribution.id}`,
      commandName,
      contribution.source === "plugin" ? "plugin-action" : "control",
      contribution.source,
      sourceRank + (100 - (contribution.priority ?? 0)),
      commandName,
      contribution.targetKind,
      contribution.pluginId
    )];
  }
  if (contribution.kind === "palette-entry" && contribution.paletteEntry) {
    return [suggestion(
      `palette:${contribution.id}`,
      contribution.paletteEntry.title,
      contribution.source === "plugin" ? "plugin-action" : "palette",
      contribution.source,
      sourceRank + 25,
      contribution.commandName,
      contribution.paletteEntry.targetKind,
      contribution.pluginId
    )];
  }
  if (contribution.kind === "result-list-provider" || contribution.kind === "render-hint") {
    return [suggestion(
      `metadata:${contribution.id}`,
      readableContributionTitle(contribution),
      contribution.source === "plugin" ? "plugin-action" : "palette",
      contribution.source,
      sourceRank + 75,
      contribution.commandName,
      contribution.targetKind,
      contribution.pluginId
    )];
  }
  return [];
}

function projectReasoningRail(
  panel: ChatTuiWorkbenchInput["reasoningPanel"],
  projection: VisibleReasoningProjection | undefined,
  layout: ChatTuiWorkbenchLayoutKind
): ChatTuiReasoningRail {
  if (!panel.enabled || !projection) {
    return {
      enabled: false,
      detailLevel: panel.detailLevel,
      recordCount: panel.recordCount,
      evidenceLinkCount: panel.evidenceLinkCount,
      steps: [],
      overflowCount: 0,
      statusText: panel.statusText
    };
  }
  const cap = layout === "compact" ? 3 : 5;
  const activeRecordId = panel.activeRecordId ?? projection.activeRecordId;
  const activeRecord = projection.records.find((record) => record.recordId === activeRecordId);
  const visibleRecords = activeRecord && !projection.records.slice(0, cap).some((record) => record.recordId === activeRecord.recordId)
    ? [...projection.records.slice(0, Math.max(0, cap - 1)), activeRecord]
    : projection.records.slice(0, cap);
  const steps = visibleRecords.map((record) => ({
    recordId: record.recordId,
    order: record.order.sequence,
    stepKind: record.stepKind,
    status: record.status,
    certainty: record.certainty,
    evidenceCount: record.evidence.length,
    active: record.recordId === activeRecordId,
    summary: record.summary
  }));
  return {
    enabled: true,
    detailLevel: panel.detailLevel,
    recordCount: panel.recordCount,
    evidenceLinkCount: panel.evidenceLinkCount,
    ...(activeRecordId ? { activeRecordId } : {}),
    steps,
    overflowCount: Math.max(0, projection.records.length - steps.length),
    statusText: panel.statusText
  };
}

function projectInspector(
  composition: CliCompositionSnapshot,
  rail: ChatTuiReasoningRail,
  reasoningTargets: readonly CliTargetRef[],
  focus: ChatTuiFocusState,
  layout: ChatTuiWorkbenchLayoutKind
): ChatTuiInspectorState {
  const cap = layout === "compact" ? 2 : 4;
  const resultTarget = activeResultListItemTarget(composition);
  const targets = reasoningTargets.length > 0
    ? reasoningTargets
    : resultTarget
      ? [resultTarget]
      : composition.activeTarget
        ? [composition.activeTarget]
        : [];
  const items = targets.slice(0, cap).map((target, index) => ({
    id: `inspector:${target.kind}:${target.id}:${index}`,
    kind: target.kind,
    label: target.label ?? target.id,
    source: reasoningTargets.length > 0 ? "reasoning-evidence" as const : resultTarget ? "result-list" as const : "active-target" as const,
    target
  }));
  return {
    active: focus.activePanel === "inspector" || items.length > 0,
    title: rail.activeRecordId ? `Evidence for ${rail.activeRecordId}` : "Active target",
    items,
    overflowCount: Math.max(0, targets.length - items.length),
    emptyReason: items.length > 0 ? "none" : "No active evidence or result target"
  };
}

function projectActivityFeed(
  input: ChatTuiWorkbenchInput,
  focus: ChatTuiFocusState,
  commandBar: ChatTuiCommandBarState,
  rail: ChatTuiReasoningRail,
  layout: ChatTuiWorkbenchLayoutKind
): ChatTuiActivityFeed {
  const records: ChatTuiActivityRecord[] = [
    {
      id: "activity:turns",
      kind: "turns",
      label: `turns=${input.turns} promptReady=${input.promptReady}`,
      status: input.promptReady ? "ready" : "running",
      targetPanel: "transcript"
    },
    {
      id: "activity:diagnostics",
      kind: "diagnostics",
      label: `diagnostics=${input.diagnostics.length}`,
      status: input.diagnostics.some((entry) => entry.severity === "error") ? "blocked" : input.diagnostics.length > 0 ? "warning" : "ready",
      targetPanel: "status"
    },
    {
      id: "activity:reasoning",
      kind: "reasoning",
      label: `reasoning records=${rail.recordCount} evidence=${rail.evidenceLinkCount}`,
      status: rail.enabled ? "ready" : "warning",
      targetPanel: "reasoning"
    },
    {
      id: "activity:focus",
      kind: "focus",
      label: `focus=${focus.activePanel} history=${focus.history.length}`,
      status: "ready",
      targetPanel: focus.activePanel
    },
    {
      id: "activity:command-bar",
      kind: "command-bar",
      label: `commandBar=${commandBar.open ? "open" : "ready"} suggestions=${commandBar.totalSuggestionCount}`,
      status: "ready",
      targetPanel: "command-bar"
    },
    {
      id: "activity:plugins",
      kind: "plugins",
      label: `plugins=${input.pluginReadiness} accepted=${input.contributionSummary.accepted}`,
      status: input.pluginReadiness === "disabled" ? "warning" : "ready",
      targetPanel: "plugins"
    }
  ];
  const cap = layout === "compact" ? 4 : 6;
  return {
    records: records.slice(0, cap),
    overflowCount: Math.max(0, records.length - cap)
  };
}

function projectPluginShelf(
  contributions: readonly CliInteractionContribution[],
  summary: ChatTuiWorkbenchInput["contributionSummary"],
  diagnostics: ChatTuiWorkbenchInput["diagnostics"],
  readiness: ChatTuiWorkbenchInput["pluginReadiness"],
  explanations: readonly CliPluginContributionExplanation[],
  layout: ChatTuiWorkbenchLayoutKind
): ChatTuiPluginShelf {
  const byPlugin = new Map<string, CliInteractionContribution[]>();
  for (const contribution of contributions) {
    if (contribution.source !== "plugin") continue;
    const pluginId = contribution.pluginId ?? pluginIdFromContributionId(contribution.id);
    byPlugin.set(pluginId, [...(byPlugin.get(pluginId) ?? []), contribution]);
  }
  const diagnosticTargets = new Set(diagnostics.flatMap((entry) => entry.targetIds));
  const items = [...byPlugin.entries()]
    .map(([pluginId, pluginContributions]) => pluginShelfItem(pluginId, pluginContributions, explanations.filter((entry) => entry.pluginId === pluginId), diagnosticTargets, summary.conflicts))
    .sort((a, b) => b.contributionCount - a.contributionCount || a.pluginId.localeCompare(b.pluginId, "en"));
  const cap = layout === "compact" ? 2 : 4;
  return {
    readiness,
    totalPlugins: items.length,
    totalContributions: contributions.filter((entry) => entry.source === "plugin").length,
    conflicts: summary.conflicts,
    diagnostics: diagnostics.length,
    byKind: summary.byKind,
    items: items.slice(0, cap),
    explanations: explanations.slice(0, layout === "compact" ? 4 : 8),
    overflowCount: Math.max(0, items.length - cap)
  };
}

function projectRegions(
  input: ChatTuiWorkbenchInput,
  layout: ChatTuiWorkbenchLayoutKind,
  focus: ChatTuiFocusState,
  commandBar: ChatTuiCommandBarState,
  rail: ChatTuiReasoningRail,
  inspector: ChatTuiInspectorState,
  activityFeed: ChatTuiActivityFeed,
  pluginShelf: ChatTuiPluginShelf
): readonly ChatTuiWorkbenchRegion[] {
  return [
    region("status", "Status", true, 0, 1, `framework=${input.frameworkId} mode=${input.mode} renderer=${input.terminalProfile.rendererProfile} input=${input.terminalProfile.inputStrategy} diagnostics=${input.diagnostics.length}`),
    region("transcript", "Transcript", true, 1, layout === "compact" ? 1 : 2, `turns=${input.turns} session=${input.sessionId ?? "new"} promptReady=${input.promptReady}`),
    region("result-list", "Results", input.composition.resultLists.length > 0, 2, 2, `lists=${input.composition.resultLists.length} active=${activeResultListItemTarget(input.composition)?.id ?? "none"}`),
    region("reasoning", "Reasoning", true, 3, layout === "compact" ? 1 : 2, `records=${rail.recordCount} evidence=${rail.evidenceLinkCount} active=${rail.activeRecordId ?? "none"}`),
    region("inspector", "Inspector", true, 4, layout === "compact" ? 1 : 2, `targets=${inspector.items.length} overflow=${inspector.overflowCount}`),
    region("command-bar", "Command", true, 5, 1, `open=${commandBar.open} suggestions=${commandBar.suggestions.length}/${commandBar.totalSuggestionCount}`),
    region("activity", "Activity", true, 6, 1, `records=${activityFeed.records.length} overflow=${activityFeed.overflowCount}`),
    region("plugins", "Plugins", true, 7, 1, `readiness=${pluginShelf.readiness} plugins=${pluginShelf.totalPlugins} conflicts=${pluginShelf.conflicts} focus=${focus.activePanel}`)
  ];
}

function projectScrollStates(regions: readonly ChatTuiWorkbenchRegion[]): readonly CliPanelScrollState[] {
  return regions
    .filter((regionItem) => regionItem.visible)
    .map((regionItem) => ({
      schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
      panelId: regionItem.id,
      offset: 0,
      visibleRows: Math.max(1, regionItem.lineBudget),
      totalRows: Math.max(regionItem.lineBudget, estimatedRegionRows(regionItem)),
      redaction: { class: "public" as const }
    }));
}

function estimatedRegionRows(regionItem: ChatTuiWorkbenchRegion): number {
  if (regionItem.id === "transcript") return 64;
  if (regionItem.id === "result-list") return 32;
  if (regionItem.id === "reasoning" || regionItem.id === "inspector") return 16;
  if (regionItem.id === "activity" || regionItem.id === "plugins") return 12;
  return regionItem.lineBudget;
}

function updateWorkbenchFocus(
  workbench: ChatTuiWorkbench,
  activePanel: ChatTuiWorkbenchPanelId,
  commandBar?: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query">>
): ChatTuiWorkbench {
  const previousPanel = workbench.focus.activePanel === activePanel ? workbench.focus.previousPanel : workbench.focus.activePanel;
  const nextFocus: ChatTuiFocusState = {
    activePanel,
    ...(previousPanel ? { previousPanel } : {}),
    history: boundedHistory(workbench.focus.history, activePanel),
    reason: activePanel === "command-bar" ? "command" : "keyboard"
  };
  const nextCommandBar = {
    ...workbench.commandBar,
    open: commandBar?.open ?? (activePanel === "command-bar" ? true : workbench.commandBar.open),
    mode: commandBar?.mode ?? (activePanel === "command-bar" ? workbench.commandBar.mode === "closed" ? "slash" : workbench.commandBar.mode : workbench.commandBar.mode),
    query: commandBar?.query ?? workbench.commandBar.query
  };
  if (activePanel !== "command-bar" && commandBar?.open === undefined) {
    return { ...workbench, focus: nextFocus };
  }
  return { ...workbench, focus: nextFocus, commandBar: nextCommandBar };
}

function cyclePanel(workbench: ChatTuiWorkbench, direction: 1 | -1): ChatTuiWorkbenchPanelId {
  const panels = PANEL_ORDER.filter((panel) => panelAvailable(panel, {
    resultLists: workbench.regions.find((regionItem) => regionItem.id === "result-list" && regionItem.visible) ? [{ id: "available", kind: "generic", label: "available", items: [] }] : [],
  }));
  const currentIndex = Math.max(0, panels.indexOf(workbench.focus.activePanel));
  return panels[(currentIndex + direction + panels.length) % panels.length] ?? "transcript";
}

function directPanelForKey(key: string): ChatTuiWorkbenchPanelId | undefined {
  if (key === "r") return "reasoning";
  if (key === "i") return "inspector";
  if (key === "a") return "activity";
  if (key === "p") return "plugins";
  return undefined;
}

function panelAvailable(panel: ChatTuiWorkbenchPanelId, composition: Pick<CliCompositionSnapshot, "resultLists">): boolean {
  return panel !== "result-list" || composition.resultLists.length > 0;
}

function activeResultListItemTarget(composition: CliCompositionSnapshot): CliTargetRef | undefined {
  const list = composition.resultLists[0];
  if (!list) return undefined;
  const item = list.items.find((candidate) => candidate.id === list.activeItemId) ?? list.items[0];
  return item?.target;
}

function keyboardHints(layout: ChatTuiWorkbenchLayoutKind): readonly ChatTuiKeyboardHint[] {
  const base: ChatTuiKeyboardHint[] = [
    { key: "Tab", label: "next", targetPanel: "transcript" },
    { key: "Shift+Tab", label: "previous", targetPanel: "transcript" },
    { key: "/", label: "command", targetPanel: "command-bar" },
    { key: "r", label: "reasoning", targetPanel: "reasoning" },
    { key: "i", label: "inspect", targetPanel: "inspector" }
  ];
  if (layout !== "compact") {
    base.push({ key: "a", label: "activity", targetPanel: "activity" }, { key: "p", label: "plugins", targetPanel: "plugins" });
  }
  return base;
}

function lineBudgetFor(layout: ChatTuiWorkbenchLayoutKind): number {
  if (layout === "wide") return 8;
  if (layout === "balanced") return 8;
  if (layout === "compact") return 6;
  return 0;
}

function region(
  id: ChatTuiWorkbenchPanelId,
  label: string,
  visible: boolean,
  priority: number,
  lineBudget: number,
  summary: string
): ChatTuiWorkbenchRegion {
  return { id, label, visible, priority, lineBudget, summary };
}

function boundedHistory(history: readonly ChatTuiWorkbenchPanelId[], activePanel: ChatTuiWorkbenchPanelId): readonly ChatTuiWorkbenchPanelId[] {
  const next = history.at(-1) === activePanel ? [...history] : [...history, activePanel];
  return next.slice(-8);
}

function readableContributionTitle(contribution: CliInteractionContribution): string {
  const placement = typeof contribution.metadata?.placement === "string" ? contribution.metadata.placement : contribution.kind;
  return `${contribution.pluginId ?? contribution.source}: ${placement}`;
}

function pluginShelfItem(
  pluginId: string,
  contributions: readonly CliInteractionContribution[],
  explanations: readonly CliPluginContributionExplanation[],
  diagnosticTargets: ReadonlySet<string>,
  conflictCount: number
): ChatTuiPluginShelfItem {
  const permissionPreview = [...new Set(explanations.flatMap((entry) => entry.permissions))].slice(0, 4);
  const hiddenContributionCount = explanations.filter((entry) => entry.hidden).length;
  const activeContributionCount = explanations.filter((entry) => entry.active).length || contributions.length - hiddenContributionCount;
  return {
    pluginId,
    contributionCount: contributions.length,
    activeContributionCount,
    hiddenContributionCount,
    commandCount: countKind(contributions, "command"),
    paletteEntryCount: countKind(contributions, "palette-entry"),
    resultListProviderCount: countKind(contributions, "result-list-provider"),
    keymapCount: countKind(contributions, "keymap"),
    renderHintCount: countKind(contributions, "render-hint"),
    permissionPreview,
    helpText: explanations[0]?.helpText ?? "Plugin contribution metadata routes through governed descriptors.",
    status: contributions.some((entry) => diagnosticTargets.has(entry.id)) ? "diagnostic" : conflictCount > 0 ? "conflict" : "ready"
  };
}

function pluginIdFromContributionId(id: string): string {
  const match = /^plugin:([^:]+):/.exec(id);
  return match?.[1] ?? "plugin:unknown";
}

function countKind(contributions: readonly CliInteractionContribution[], kind: CliContributionKind): number {
  return contributions.filter((entry) => entry.kind === kind).length;
}

function suggestion(
  id: string,
  title: string,
  kind: ChatTuiCommandSuggestionKind,
  source: ChatTuiCommandSuggestion["source"],
  rank: number,
  commandName?: string,
  targetKind?: string,
  pluginId?: string
): ChatTuiCommandSuggestion {
  return {
    id,
    title,
    kind,
    source,
    ...(commandName ? { commandName } : {}),
    ...(targetKind ? { targetKind } : {}),
    ...(pluginId ? { pluginId } : {}),
    rank
  };
}
