import type { CliFullscreenRendererLifecycle } from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type {
  ChatTuiActivityFeed,
  ChatTuiCommandBarState,
  ChatTuiInspectorState,
  ChatTuiPluginShelf,
  ChatTuiReasoningRail,
  ChatTuiWorkbench,
  ChatTuiWorkbenchPanelId
} from "./chat-tui-workbench.js";

export const CHAT_TUI_ALT_SCREEN_ENTER = "\x1b[?1049h\x1b[?25l";
export const CHAT_TUI_ALT_SCREEN_EXIT = "\x1b[?25h\x1b[?1049l";
export const CHAT_TUI_REPAINT_HOME = "\x1b[H\x1b[2J";

export function renderChatTuiWorkbench(workbench: ChatTuiWorkbench): readonly string[] {
  if (workbench.layout === "disabled") return [];
  const maxWidth = Math.max(72, Math.min(workbench.columns ?? 100, 160));
  const lines = workbench.layout === "compact"
    ? renderCompactWorkbench(workbench)
    : renderExpandedWorkbench(workbench);
  return lines.slice(0, workbench.frameLineBudget).map((line) => boundLine(line, maxWidth));
}

export function createChatTuiFullscreenLifecycle(input: {
  readonly phase: CliFullscreenRendererLifecycle["phase"];
  readonly columns: number;
  readonly rows: number;
  readonly reason?: string;
}): CliFullscreenRendererLifecycle {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    phase: input.phase,
    alternateScreen: input.phase !== "teardown",
    cursorVisible: input.phase === "teardown",
    repaintBounds: {
      columns: input.columns,
      rows: input.rows
    },
    ...(input.reason ? { reason: input.reason } : {}),
    redaction: { class: "public" }
  };
}

export function renderChatTuiFullscreenFrame(input: {
  readonly workbench: ChatTuiWorkbench;
  readonly rows?: number;
  readonly phase?: CliFullscreenRendererLifecycle["phase"];
}): { readonly lifecycle: CliFullscreenRendererLifecycle; readonly chunks: readonly string[] } {
  const columns = Math.max(80, Math.min(input.workbench.columns ?? 100, 200));
  const rows = Math.max(12, Math.min(input.rows ?? 32, 80));
  const phase = input.phase ?? "repaint";
  const padded = renderFullscreenWorkbench(input.workbench, columns, rows);
  const lifecycle = createChatTuiFullscreenLifecycle({ phase, columns, rows });
  const chunks = [
    ...(phase === "enter" ? [CHAT_TUI_ALT_SCREEN_ENTER] : []),
    ...(phase === "teardown" ? [CHAT_TUI_ALT_SCREEN_EXIT] : [CHAT_TUI_REPAINT_HOME, padded.join("\n")])
  ];
  return { lifecycle, chunks };
}

function renderFullscreenWorkbench(workbench: ChatTuiWorkbench, columns: number, rows: number): readonly string[] {
  if (workbench.layout === "disabled") return padFrame(["DeepSeek Workbench disabled"], columns, rows);
  const header = headerLines(workbench, columns, rows);
  const commandRows = rows >= 18 ? 4 : 3;
  const footerRows = 2;
  const mainRows = Math.max(3, rows - header.length - commandRows - footerRows);
  const body = renderMainArea(workbench, columns, mainRows);
  const command = renderCommandArea(workbench, columns, commandRows);
  return padFrame([
    ...header,
    ...body,
    ...command,
    keyLine(workbench, columns),
    statusLine(workbench)
  ], columns, rows);
}

function headerLines(workbench: ChatTuiWorkbench, columns: number, rows: number): readonly string[] {
  const title = fitColumns(
    ` DeepSeek Workbench  ${workbench.layout}  focus:${workbench.focus.activePanel}`,
    `raw/full-screen ${columns}x${rows}`,
    columns
  );
  if (rows < 16) return [borderLine(columns, "="), title];
  return [
    borderLine(columns, "="),
    title,
    fitColumns(
      ` ${regionSummary(workbench, "status")}`,
      `command ${commandBarStatus(workbench.commandBar)}`,
      columns
    )
  ];
}

function renderMainArea(workbench: ChatTuiWorkbench, columns: number, rows: number): readonly string[] {
  const sideWidth = sidePanelWidth(columns);
  if (sideWidth === 0) return renderBox("Transcript", transcriptLines(workbench), columns, rows, workbench.focus.activePanel === "transcript");
  const leftWidth = columns - sideWidth - 1;
  const left = renderBox("Transcript", transcriptLines(workbench), leftWidth, rows, workbench.focus.activePanel === "transcript");
  const rightPanels = [
    { title: "Reasoning", lines: reasoningLines(workbench.reasoningRail), active: workbench.focus.activePanel === "reasoning" },
    { title: "Inspector", lines: inspectorLines(workbench.inspector), active: workbench.focus.activePanel === "inspector" },
    { title: "Plugins", lines: pluginLines(workbench.pluginShelf), active: workbench.focus.activePanel === "plugins" }
  ].slice(0, Math.max(1, Math.min(3, Math.floor(rows / 3))));
  const heights = distributePanelHeights(rows, rightPanels.length);
  const right = rightPanels.flatMap((panel, index) => renderBox(panel.title, panel.lines, sideWidth, heights[index] ?? 3, panel.active));
  return Array.from({ length: rows }, (_, index) => `${left[index] ?? "".padEnd(leftWidth)} ${right[index] ?? "".padEnd(sideWidth)}`);
}

function renderCommandArea(workbench: ChatTuiWorkbench, columns: number, rows: number): readonly string[] {
  const prompt = workbench.commandBar.open
    ? `/${workbench.commandBar.query}`
    : workbench.commandBar.placeholder;
  const suggestions = workbench.commandBar.suggestions.slice(0, Math.max(1, rows - 3)).map((entry, index) => {
    const active = entry.id === workbench.commandBar.activeSuggestionId ? ">" : " ";
    return `${active} ${index + 1}. ${entry.title}  ${entry.kind}${entry.pluginId ? `  ${entry.pluginId}` : ""}`;
  });
  return renderBox("Command", [`> ${prompt}`, ...suggestions], columns, rows, workbench.focus.activePanel === "command-bar");
}

function transcriptLines(workbench: ChatTuiWorkbench): readonly string[] {
  return [
    regionSummary(workbench, "transcript"),
    `focus=${workbench.focus.activePanel} previous=${workbench.focus.previousPanel ?? "none"} history=${workbench.focus.history.join(" > ")}`,
    regionSummary(workbench, "result-list"),
    "",
    "Transcript stream",
    "  No assistant turn is streaming yet.",
    "  Use / to open commands, Tab to cycle panels, r/i/a/p to jump rails.",
    "  Full-screen renderer owns layout only; runtime state remains in the shared workbench projection.",
    "",
    `Activity: ${activityText(workbench.activityFeed)}`
  ];
}

function reasoningLines(rail: ChatTuiReasoningRail): readonly string[] {
  if (!rail.enabled) {
    return [
      rail.statusText,
      `records=${rail.recordCount} evidence=${rail.evidenceLinkCount}`,
      "No visible reasoning records for this frame."
    ];
  }
  const steps = rail.steps.map((step) => {
    const active = step.active ? "*" : " ";
    return `${active} ${step.order}. ${step.stepKind} ${step.status} ${step.certainty} e=${step.evidenceCount}`;
  });
  return [
    `records=${rail.recordCount} evidence=${rail.evidenceLinkCount} detail=${rail.detailLevel}`,
    ...steps,
    ...(rail.overflowCount > 0 ? [`+${rail.overflowCount} more records`] : [])
  ];
}

function inspectorLines(inspector: ChatTuiInspectorState): readonly string[] {
  if (inspector.items.length === 0) return [inspector.emptyReason, "Active target and evidence details appear here."];
  return [
    inspector.title,
    ...inspector.items.map((item) => `${item.source}: ${item.kind} ${item.label}`),
    ...(inspector.overflowCount > 0 ? [`+${inspector.overflowCount} more targets`] : [])
  ];
}

function pluginLines(shelf: ChatTuiPluginShelf): readonly string[] {
  return [
    `${shelf.readiness} plugins=${shelf.totalPlugins} contributions=${shelf.totalContributions}`,
    `conflicts=${shelf.conflicts} diagnostics=${shelf.diagnostics}`,
    ...shelf.items.map((item) => `${item.status} ${item.pluginId} ${item.activeContributionCount}/${item.contributionCount}${item.lastExecutionStatus ? ` last=${item.lastExecutionStatus}` : ""}`),
    ...(shelf.overflowCount > 0 ? [`+${shelf.overflowCount} more plugins`] : [])
  ];
}

function renderBox(title: string, lines: readonly string[], width: number, height: number, active: boolean): readonly string[] {
  const safeWidth = Math.max(12, width);
  const safeHeight = Math.max(3, height);
  const label = active ? ` ${title} * ` : ` ${title} `;
  const top = `+${label}${"-".repeat(Math.max(0, safeWidth - label.length - 2))}+`;
  const bottom = `+${"-".repeat(Math.max(0, safeWidth - 2))}+`;
  const contentHeight = safeHeight - 2;
  const content = Array.from({ length: contentHeight }, (_, index) => {
    const line = lines[index] ?? "";
    return `| ${boundLine(line, safeWidth - 4).padEnd(safeWidth - 4)} |`;
  });
  return [boundLine(top, safeWidth), ...content, bottom];
}

function padFrame(lines: readonly string[], columns: number, rows: number): readonly string[] {
  return Array.from({ length: rows }, (_, index) => boundLine((lines[index] ?? "").padEnd(columns), columns));
}

function sidePanelWidth(columns: number): number {
  if (columns < 96) return 0;
  return Math.min(44, Math.max(34, Math.floor(columns * 0.34)));
}

function distributePanelHeights(totalRows: number, panelCount: number): readonly number[] {
  const base = Math.floor(totalRows / panelCount);
  let remainder = totalRows - base * panelCount;
  return Array.from({ length: panelCount }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return Math.max(3, base + extra);
  });
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
  const top = shelf.items.map((item) => `${item.pluginId}=${item.activeContributionCount}/${item.contributionCount} perms=${item.permissionPreview.length} results=${item.resultListCount}${item.lastExecutionStatus ? ` last=${item.lastExecutionStatus}` : ""}`).join(", ");
  return `${shelf.readiness} plugins=${shelf.totalPlugins} contributions=${shelf.totalContributions} explanations=${shelf.explanations.length} conflicts=${shelf.conflicts} diagnostics=${shelf.diagnostics}${top ? ` top=${top}` : ""}${shelf.overflowCount > 0 ? ` (+${shelf.overflowCount})` : ""}`;
}

function statusLine(workbench: ChatTuiWorkbench): string {
  const telemetry = workbench.statusTelemetry
    ? ` | model=${workbench.statusTelemetry.modelId} cache=${cacheText(workbench.statusTelemetry)} ctx=${workbench.statusTelemetry.context.selectedTokens}/${workbench.statusTelemetry.context.hardLimitTokens}`
    : "";
  return `DeepSeek | ${workbench.layout} | focus=${workbench.focus.activePanel} | ${workbench.commandBar.open ? "command" : "ready"} | plugins=${workbench.pluginShelf.readiness}${telemetry}`;
}

function cacheText(telemetry: NonNullable<ChatTuiWorkbench["statusTelemetry"]>): string {
  if (telemetry.cache.status === "available" && telemetry.cache.hitRate !== undefined) {
    return `${Math.round(telemetry.cache.hitRate * 100)}%`;
  }
  return telemetry.cache.status;
}

function keyLine(workbench: ChatTuiWorkbench, columns: number): string {
  const left = ` Keys ${workbench.keyboardHints.map((hint) => `${hint.key}:${hint.label}`).join("  ")}`;
  const right = `mode ${workbench.commandBar.mode}`;
  return fitColumns(left, right, columns);
}

function fitColumns(left: string, right: string, columns: number): string {
  const minimumGap = 2;
  if (left.length + right.length + minimumGap <= columns) {
    return `${left}${" ".repeat(columns - left.length - right.length)}${right}`;
  }
  const rightBudget = Math.min(right.length, Math.max(12, Math.floor(columns * 0.36)));
  const boundedRight = boundLine(right, rightBudget);
  const leftBudget = Math.max(1, columns - boundedRight.length - minimumGap);
  return `${boundLine(left, leftBudget)}${" ".repeat(minimumGap)}${boundedRight}`;
}

function borderLine(columns: number, char: string): string {
  return char.repeat(columns);
}

function boundLine(line: string, maxWidth: number): string {
  if (line.length <= maxWidth) return line;
  return `${line.slice(0, Math.max(0, maxWidth - 3))}...`;
}
