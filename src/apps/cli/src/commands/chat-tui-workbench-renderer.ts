import type {
  ChatTuiActivityFeed,
  ChatTuiCommandBarState,
  ChatTuiInspectorState,
  ChatTuiPluginShelf,
  ChatTuiReasoningRail,
  ChatTuiWorkbench,
  ChatTuiWorkbenchPanelId
} from "./chat-tui-workbench.js";

export function renderChatTuiWorkbench(workbench: ChatTuiWorkbench): readonly string[] {
  if (workbench.layout === "disabled") return [];
  const maxWidth = Math.max(72, Math.min(workbench.columns ?? 100, 160));
  const lines = workbench.layout === "compact"
    ? renderCompactWorkbench(workbench)
    : renderExpandedWorkbench(workbench);
  return lines.slice(0, workbench.frameLineBudget).map((line) => boundLine(line, maxWidth));
}

function renderExpandedWorkbench(workbench: ChatTuiWorkbench): readonly string[] {
  return [
    `DeepSeek Workbench | layout=${workbench.layout} | focus=${workbench.focus.activePanel} | command=${commandBarStatus(workbench.commandBar)}`,
    `Status | ${regionSummary(workbench, "status")} | ${regionSummary(workbench, "transcript")}`,
    `Command | ${suggestionText(workbench.commandBar)}`,
    `Reasoning | ${reasoningText(workbench.reasoningRail)}`,
    `Inspector | ${inspectorText(workbench.inspector)}`,
    `Activity | ${activityText(workbench.activityFeed)}`,
    `Plugins | ${pluginShelfText(workbench.pluginShelf)}`,
    `Keys | ${workbench.keyboardHints.map((hint) => `${hint.key} ${hint.label}`).join(" | ")}`
  ];
}

function renderCompactWorkbench(workbench: ChatTuiWorkbench): readonly string[] {
  return [
    `DeepSeek Workbench | compact | focus=${workbench.focus.activePanel}`,
    `Status | ${regionSummary(workbench, "status")}`,
    `Command | ${suggestionText(workbench.commandBar)}`,
    `Reasoning | ${reasoningText(workbench.reasoningRail)}`,
    `Inspector | ${inspectorText(workbench.inspector)}`,
    `Plugins | ${pluginShelfText(workbench.pluginShelf)}`
  ];
}

function regionSummary(workbench: ChatTuiWorkbench, id: ChatTuiWorkbenchPanelId): string {
  return workbench.regions.find((regionItem) => regionItem.id === id)?.summary ?? "unavailable";
}

function commandBarStatus(commandBar: ChatTuiCommandBarState): string {
  return `${commandBar.open ? "open" : "ready"}:${commandBar.mode} suggestions=${commandBar.suggestions.length}/${commandBar.totalSuggestionCount}`;
}

function suggestionText(commandBar: ChatTuiCommandBarState): string {
  const names = commandBar.suggestions.map((entry) => entry.title).join(", ");
  return `${commandBar.open ? "open" : "ready"} ${names || commandBar.placeholder}${commandBar.overflowCount > 0 ? ` (+${commandBar.overflowCount})` : ""}`;
}

function reasoningText(rail: ChatTuiReasoningRail): string {
  if (!rail.enabled) return `${rail.statusText} records=${rail.recordCount} evidence=${rail.evidenceLinkCount}`;
  const steps = rail.steps.map((step) => `${step.active ? "*" : ""}${step.order}:${step.stepKind}/${step.status}/${step.certainty}/e${step.evidenceCount}`).join(", ");
  return `${steps || "empty"}${rail.overflowCount > 0 ? ` (+${rail.overflowCount})` : ""}`;
}

function inspectorText(inspector: ChatTuiInspectorState): string {
  if (inspector.items.length === 0) return inspector.emptyReason;
  return `${inspector.title} -> ${inspector.items.map((item) => `${item.kind}:${item.label}`).join(", ")}${inspector.overflowCount > 0 ? ` (+${inspector.overflowCount})` : ""}`;
}

function activityText(feed: ChatTuiActivityFeed): string {
  return `${feed.records.map((entry) => `${entry.kind}:${entry.status}`).join(", ")}${feed.overflowCount > 0 ? ` (+${feed.overflowCount})` : ""}`;
}

function pluginShelfText(shelf: ChatTuiPluginShelf): string {
  const top = shelf.items.map((item) => `${item.pluginId}=${item.contributionCount}`).join(", ");
  return `${shelf.readiness} plugins=${shelf.totalPlugins} contributions=${shelf.totalContributions} conflicts=${shelf.conflicts} diagnostics=${shelf.diagnostics}${top ? ` top=${top}` : ""}${shelf.overflowCount > 0 ? ` (+${shelf.overflowCount})` : ""}`;
}

function boundLine(line: string, maxWidth: number): string {
  if (line.length <= maxWidth) return line;
  return `${line.slice(0, Math.max(0, maxWidth - 3))}...`;
}
