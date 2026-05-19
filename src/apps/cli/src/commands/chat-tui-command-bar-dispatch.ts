import type { ChatTuiCommandBarAcceptance, ChatTuiCommandBarState, ChatTuiFocusState, ChatTuiWorkbench } from "./chat-tui-workbench.js";
import type { ChatTuiDiagnostic, ChatTuiDispatchResult, ChatTuiStateSnapshot } from "./chat-tui.js";

type AttachWorkbench = (
  base: Omit<ChatTuiStateSnapshot, "workbench">,
  focus?: ChatTuiFocusState,
  commandBar?: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query" | "activeSuggestionId" | "acceptedSuggestionId" | "acceptedCommandName" | "acceptedPreviewText">>
) => ChatTuiStateSnapshot;

export function commandBarAcceptanceDispatch(input: {
  readonly state: ChatTuiStateSnapshot;
  readonly key: string;
  readonly workbench: ChatTuiWorkbench;
  readonly acceptance: ChatTuiCommandBarAcceptance;
  readonly attachWorkbench: AttachWorkbench;
}): ChatTuiDispatchResult {
  const { workbench: _previousWorkbench, ...base } = input.state;
  const nextState = input.attachWorkbench(
    { ...base, mode: "command", composition: { ...input.state.composition, mode: "command" } },
    input.workbench.focus,
    input.workbench.commandBar
  );
  return {
    ok: true,
    kind: "command",
    key: input.key,
    state: nextState,
    commandName: input.acceptance.commandName,
    commandSuggestionId: input.acceptance.suggestionId,
    commandSource: input.acceptance.source,
    ...(input.acceptance.pluginId ? { pluginId: input.acceptance.pluginId } : {}),
    previewText: input.acceptance.previewText,
    diagnostics: []
  };
}

export function workbenchDiagnosticDispatch(input: {
  readonly state: ChatTuiStateSnapshot;
  readonly key: string;
  readonly workbench: ChatTuiWorkbench;
  readonly diagnostic: { readonly code: string; readonly message: string; readonly targetIds: readonly string[] };
  readonly attachWorkbench: AttachWorkbench;
}): ChatTuiDispatchResult {
  const diagnostic: ChatTuiDiagnostic = {
    code: input.diagnostic.code,
    severity: "warning",
    message: input.diagnostic.message,
    targetIds: input.diagnostic.targetIds
  };
  const { workbench: _previousWorkbench, ...base } = input.state;
  return {
    ok: false,
    kind: "diagnostic",
    key: input.key,
    state: input.attachWorkbench(
      { ...base, diagnostics: [...input.state.diagnostics, diagnostic] },
      input.workbench.focus,
      input.workbench.commandBar
    ),
    diagnostics: [diagnostic]
  };
}
