import type {
  CliContributionKind,
  CliInteractionContribution,
  CliPluginContributionExplanation
} from "@deepseek/platform-contracts";
import type { PluginWorkbenchExecutionRecord } from "../plugins/plugin-workbench-execution.js";
import type {
  ChatTuiActivityRecord,
  ChatTuiActivityStatus,
  ChatTuiPluginShelf,
  ChatTuiPluginShelfItem,
  ChatTuiWorkbenchLayoutKind
} from "./chat-tui-workbench.js";

type PluginProjectionSummary = {
  readonly conflicts: number;
  readonly byKind: Readonly<Partial<Record<CliContributionKind, number>>>;
};

type PluginProjectionDiagnostic = {
  readonly targetIds: readonly string[];
};

export function projectPluginExecutionActivities(
  executions: readonly PluginWorkbenchExecutionRecord[],
  layout: ChatTuiWorkbenchLayoutKind
): readonly ChatTuiActivityRecord[] {
  return executions.slice(0, layout === "compact" ? 2 : 3).map((execution): ChatTuiActivityRecord => ({
    id: `activity:plugin-execution:${execution.recordId}`,
    kind: "plugin-execution",
    label: `${execution.commandId} ${execution.dispatchStatus} ${execution.resultSummary}`,
    status: executionActivityStatus(execution),
    targetPanel: execution.resultList ? "result-list" : execution.diagnostics.length > 0 ? "inspector" : "plugins"
  }));
}

export function projectPluginShelf(
  contributions: readonly CliInteractionContribution[],
  summary: PluginProjectionSummary,
  diagnostics: readonly PluginProjectionDiagnostic[],
  readiness: ChatTuiPluginShelf["readiness"],
  explanations: readonly CliPluginContributionExplanation[],
  executions: readonly PluginWorkbenchExecutionRecord[],
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
    .map(([pluginId, pluginContributions]) => pluginShelfItem(pluginId, pluginContributions, explanations.filter((entry) => entry.pluginId === pluginId), executions.filter((entry) => entry.pluginId === pluginId), diagnosticTargets, summary.conflicts))
    .sort(comparePluginShelfItems);
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

function pluginShelfItem(
  pluginId: string,
  contributions: readonly CliInteractionContribution[],
  explanations: readonly CliPluginContributionExplanation[],
  executions: readonly PluginWorkbenchExecutionRecord[],
  diagnosticTargets: ReadonlySet<string>,
  conflictCount: number
): ChatTuiPluginShelfItem {
  const permissionPreview = [...new Set(explanations.flatMap((entry) => entry.permissions))].slice(0, 4);
  const hiddenContributionCount = explanations.filter((entry) => entry.hidden).length;
  const activeContributionCount = explanations.filter((entry) => entry.active).length || contributions.length - hiddenContributionCount;
  const lastExecution = executions[0];
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
    helpText: lastExecution ? `Last execution ${lastExecution.commandId}: ${lastExecution.dispatchStatus}` : explanations[0]?.helpText ?? "Plugin contribution metadata routes through governed descriptors.",
    status: lastExecution && lastExecution.dispatchStatus !== "completed" ? "diagnostic" : contributions.some((entry) => diagnosticTargets.has(entry.id)) ? "diagnostic" : conflictCount > 0 ? "conflict" : "ready",
    ...(lastExecution ? {
      lastExecutionStatus: lastExecution.dispatchStatus,
      lastExecutionCommandId: lastExecution.commandId,
      lastExecutionRecordId: lastExecution.recordId
    } : {}),
    resultListCount: executions.filter((entry) => entry.resultList).length
  };
}

function executionActivityStatus(execution: PluginWorkbenchExecutionRecord): ChatTuiActivityStatus {
  if (execution.dispatchStatus === "completed") return "ready";
  if (execution.dispatchStatus === "failed" || execution.dispatchStatus === "denied" || execution.dispatchStatus === "unsupported") return "blocked";
  return "warning";
}

function comparePluginShelfItems(a: ChatTuiPluginShelfItem, b: ChatTuiPluginShelfItem): number {
  const executionPriority = Number(Boolean(b.lastExecutionRecordId)) - Number(Boolean(a.lastExecutionRecordId));
  if (executionPriority !== 0) return executionPriority;
  return b.contributionCount - a.contributionCount || a.pluginId.localeCompare(b.pluginId, "en");
}

function pluginIdFromContributionId(id: string): string {
  const match = /^plugin:([^:]+):/.exec(id);
  return match?.[1] ?? "plugin:unknown";
}

function countKind(contributions: readonly CliInteractionContribution[], kind: CliContributionKind): number {
  return contributions.filter((entry) => entry.kind === kind).length;
}
