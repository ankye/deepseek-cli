import type { CodeIntelligenceService, LosslessContextManager, PlatformRuntime } from "@deepseek/platform-contracts";
import { executeBuiltInPluginWorkbenchRoute, type PluginWorkbenchExecutionRecord } from "../plugins/plugin-workbench-execution.js";
import { createChatTuiWorkbench, type ChatTuiCommandBarState, type ChatTuiFocusState } from "./chat-tui-workbench.js";
import type { ChatTuiStateSnapshot } from "./chat-tui.js";

export function boundedPluginExecutions(executions: readonly PluginWorkbenchExecutionRecord[]): readonly PluginWorkbenchExecutionRecord[] {
  return executions.slice(0, 12);
}

export function attachPluginWorkbenchExecutionToChatTuiState(
  state: ChatTuiStateSnapshot,
  execution: PluginWorkbenchExecutionRecord
): ChatTuiStateSnapshot {
  const { workbench: previousWorkbench, ...base } = state;
  const resultList = execution.resultList;
  const activeTarget = execution.activeTarget;
  const composition = resultList
    ? {
      ...state.composition,
      mode: "result-list" as const,
      ...(activeTarget ? { activeTarget } : {}),
      resultLists: [resultList, ...state.composition.resultLists.filter((list) => list.id !== resultList.id)]
    }
    : activeTarget
      ? { ...state.composition, activeTarget }
      : state.composition;
  return attachWorkbenchForPluginExecution(
    {
      ...base,
      mode: resultList ? "result-list" : state.mode,
      composition,
      pluginExecutions: boundedPluginExecutions([execution, ...state.pluginExecutions.filter((entry) => entry.recordId !== execution.recordId)])
    },
    resultList ? resultListFocus(previousWorkbench.focus) : previousWorkbench.focus,
    previousWorkbench.commandBar
  );
}

export async function executeChatTuiPluginRoute(
  state: ChatTuiStateSnapshot,
  input: {
    readonly commandId: string;
    readonly platform: PlatformRuntime;
    readonly workspaceRoot: string;
    readonly query?: string;
    readonly target?: string;
    readonly args?: readonly string[];
    readonly losslessContext?: LosslessContextManager;
    readonly codeIntelligence?: CodeIntelligenceService;
  }
): Promise<{ readonly execution: PluginWorkbenchExecutionRecord; readonly state: ChatTuiStateSnapshot }> {
  const execution = await executeBuiltInPluginWorkbenchRoute({
    commandId: input.commandId,
    source: "tui",
    platform: input.platform,
    workspaceRoot: input.workspaceRoot,
    ...(input.query ? { query: input.query } : {}),
    ...(input.target ? { target: input.target } : {}),
    ...(input.args ? { args: input.args } : {}),
    ...(input.losslessContext ? { losslessContext: input.losslessContext } : {}),
    ...(input.codeIntelligence ? { codeIntelligence: input.codeIntelligence } : {})
  });
  return {
    execution,
    state: attachPluginWorkbenchExecutionToChatTuiState(state, execution)
  };
}

function attachWorkbenchForPluginExecution(
  base: Omit<ChatTuiStateSnapshot, "workbench">,
  focus?: ChatTuiFocusState,
  commandBar?: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query" | "activeSuggestionId">>
): ChatTuiStateSnapshot {
  const workbench = createChatTuiWorkbench({
    enabled: base.enabled,
    frameworkId: base.frameworkId,
    mode: base.mode,
    terminalProfile: base.terminalProfile,
    composition: base.composition,
    contributionSummary: base.contributionSummary,
    diagnostics: base.diagnostics,
    pluginReadiness: base.pluginReadiness,
    pluginContributionExplanations: base.pluginContributionExplanations,
    pluginExecutions: base.pluginExecutions,
    reasoningPanel: base.reasoningPanel,
    promptReady: base.promptReady,
    turns: base.turns,
    ...(base.sessionId ? { sessionId: base.sessionId } : {}),
    ...(base.visibleReasoning ? { visibleReasoning: base.visibleReasoning } : {}),
    ...(base.statusTelemetry ? { statusTelemetry: base.statusTelemetry } : {}),
    ...(focus ? { focus } : {}),
    ...(commandBar ? { commandBar } : {})
  });
  return { ...base, workbench };
}

function resultListFocus(previous: ChatTuiFocusState): ChatTuiFocusState {
  return {
    ...previous,
    activePanel: "result-list",
    previousPanel: previous.activePanel,
    history: [...previous.history, "result-list" as const].slice(-8),
    reason: "projection"
  };
}
