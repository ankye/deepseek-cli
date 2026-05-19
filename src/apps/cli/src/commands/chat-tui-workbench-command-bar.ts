import type {
  ChatTuiCommandBarAcceptance,
  ChatTuiCommandBarState,
  ChatTuiCommandBarUpdate,
  ChatTuiCommandSuggestion,
  ChatTuiWorkbench,
  ChatTuiWorkbenchKeyDispatch,
  ChatTuiWorkbenchPanelId
} from "./chat-tui-workbench.js";

type WorkbenchFocusUpdater = (
  workbench: ChatTuiWorkbench,
  activePanel: ChatTuiWorkbenchPanelId,
  commandBar?: ChatTuiCommandBarUpdate
) => ChatTuiWorkbench;

export function isCommandBarActive(workbench: ChatTuiWorkbench): boolean {
  return workbench.focus.activePanel === "command-bar" && workbench.commandBar.open;
}

export function dispatchCommandBarKey(
  workbench: ChatTuiWorkbench,
  key: string,
  updateWorkbenchFocus: WorkbenchFocusUpdater
): ChatTuiWorkbenchKeyDispatch | undefined {
  if (key === "Escape" || key === "Esc") return undefined;
  if (key === "Enter") return acceptCommandBarSuggestion(workbench, updateWorkbenchFocus);
  const direction = commandBarNavigationDirection(key);
  if (direction !== 0) {
    return {
      handled: true,
      workbench: updateCommandBarSelection(workbench, direction, updateWorkbenchFocus),
      activePanel: "command-bar"
    };
  }
  if (key === "Backspace") {
    return {
      handled: true,
      workbench: updateCommandBarQuery(workbench, workbench.commandBar.query.slice(0, -1), updateWorkbenchFocus),
      activePanel: "command-bar"
    };
  }
  const text = commandBarPrintableText(key);
  if (text !== undefined) {
    return {
      handled: true,
      workbench: updateCommandBarQuery(workbench, `${workbench.commandBar.query}${text}`, updateWorkbenchFocus),
      activePanel: "command-bar"
    };
  }
  return undefined;
}

function acceptCommandBarSuggestion(
  workbench: ChatTuiWorkbench,
  updateWorkbenchFocus: WorkbenchFocusUpdater
): ChatTuiWorkbenchKeyDispatch {
  const suggestionEntry = activeCommandBarSuggestion(workbench.commandBar);
  if (!suggestionEntry) {
    return {
      handled: true,
      workbench,
      activePanel: "command-bar",
      diagnostic: {
        code: "CHAT_TUI_COMMAND_BAR_EMPTY",
        message: `No command bar suggestions match "${workbench.commandBar.query}".`,
        targetIds: ["command-bar"]
      }
    };
  }
  const acceptance = commandBarAcceptance(suggestionEntry, workbench.commandBar.query);
  const nextWorkbench = updateWorkbenchFocus(workbench, "command-bar", {
    acceptedSuggestionId: suggestionEntry.id,
    acceptedCommandName: acceptance.commandName,
    acceptedPreviewText: acceptance.previewText,
    activeSuggestionId: suggestionEntry.id
  });
  return {
    handled: true,
    workbench: nextWorkbench,
    activePanel: "command-bar",
    commandBarAccepted: acceptance
  };
}

function commandBarAcceptance(
  suggestionEntry: ChatTuiCommandSuggestion,
  query: string
): ChatTuiCommandBarAcceptance {
  const commandName = suggestionEntry.commandName ?? suggestionEntry.title;
  const previewText = suggestionEntry.title.startsWith(commandName) ? suggestionEntry.title : commandName;
  return {
    suggestionId: suggestionEntry.id,
    commandName,
    previewText,
    query,
    source: suggestionEntry.source,
    ...(suggestionEntry.pluginId ? { pluginId: suggestionEntry.pluginId } : {})
  };
}

function updateCommandBarSelection(
  workbench: ChatTuiWorkbench,
  direction: 1 | -1,
  updateWorkbenchFocus: WorkbenchFocusUpdater
): ChatTuiWorkbench {
  const suggestions = workbench.commandBar.suggestions;
  if (suggestions.length === 0) return workbench;
  const currentIndex = Math.max(0, suggestions.findIndex((entry) => entry.id === workbench.commandBar.activeSuggestionId));
  const next = suggestions[(currentIndex + direction + suggestions.length) % suggestions.length] ?? suggestions[0];
  return next ? updateWorkbenchFocus(workbench, "command-bar", { activeSuggestionId: next.id }) : workbench;
}

function updateCommandBarQuery(
  workbench: ChatTuiWorkbench,
  query: string,
  updateWorkbenchFocus: WorkbenchFocusUpdater
): ChatTuiWorkbench {
  const nextQuery = query.slice(0, 120);
  return updateWorkbenchFocus(workbench, "command-bar", {
    query: nextQuery,
    resetActiveSuggestion: true,
    clearAccepted: true
  });
}

function activeCommandBarSuggestion(commandBar: ChatTuiCommandBarState): ChatTuiCommandSuggestion | undefined {
  return commandBar.suggestions.find((entry) => entry.id === commandBar.activeSuggestionId) ?? commandBar.suggestions[0];
}

function commandBarNavigationDirection(key: string): 1 | -1 | 0 {
  if (key === "ArrowDown" || key === "Ctrl+n" || key === "Ctrl+N" || key === "Tab") return 1;
  if (key === "ArrowUp" || key === "Ctrl+p" || key === "Ctrl+P" || key === "Shift+Tab" || key === "BackTab" || key === "S-Tab") return -1;
  return 0;
}

function commandBarPrintableText(key: string): string | undefined {
  if (key === "Space") return " ";
  return key.length === 1 && key >= " " && key !== "\x7f" ? key : undefined;
}
