import type {
  CliActionKind,
  CliCompositionSnapshot,
  CliContributionKind,
  CliContributionSourceKind,
  CliInteractionContribution,
  CliInteractionMode,
  CliKeymapProfileName,
  CliKeymapEntry,
  CliPluginContributionExplanation,
  CliRawInputEvent,
  CliTargetRef,
  ContextStatuslineTelemetry,
  VisibleReasoningProjection
} from "@deepseek/platform-contracts";
import { explainCliPluginContribution, rawInputEventToKeyName, resolveCliAction, resolveViKeySequence, viMinimalKeymapProfile, viProfessionalKeymapProfile } from "@deepseek/command-system";
import type { CliOptions } from "../types.js";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";
import { firstPartyTuiContributionsWithOwnerRoutes } from "../plugins/builtin-owner-routes.js";
import type { PluginWorkbenchExecutionRecord } from "../plugins/plugin-workbench-execution.js";
import type { ChatSessionState } from "./chat-state.js";
import { commandBarAcceptanceDispatch, workbenchDiagnosticDispatch } from "./chat-tui-command-bar-dispatch.js";
import { boundedPluginExecutions } from "./chat-tui-plugin-execution.js";
import { reasoningPanelFromProjection, type ChatTuiReasoningPanel } from "./chat-tui-reasoning-panel.js";
import { createCliPaletteProjection, createPaletteCompositionSnapshot } from "./palette.js";
import { createChatTuiWorkbench, dispatchChatTuiWorkbenchKey } from "./chat-tui-workbench.js";
import { renderChatTuiFullscreenFrame, renderChatTuiWorkbench } from "./chat-tui-workbench-renderer.js";
import type { ChatTuiCommandBarState, ChatTuiFocusState, ChatTuiWorkbench } from "./chat-tui-workbench.js";

export { createChatTuiFullscreenLifecycle, createChatTuiInputFrame, renderChatTuiFullscreenFrame, renderChatTuiWorkbench } from "./chat-tui-workbench-renderer.js";
export { attachPluginWorkbenchExecutionToChatTuiState, executeChatTuiPluginRoute } from "./chat-tui-plugin-execution.js";
export type { ChatTuiActivityFeed, ChatTuiCommandBarState, ChatTuiCommandSuggestion, ChatTuiFocusState, ChatTuiInspectorState, ChatTuiPluginShelf, ChatTuiReasoningRail, ChatTuiWorkbench, ChatTuiWorkbenchPanelId } from "./chat-tui-workbench.js";

export const CHAT_TUI_FRAMEWORK_ID = "deepseek.production-tui";
export const CHAT_TUI_FRAMEWORK_VERSION = "1.0.0";

export type ChatTuiViewportProfile = "line" | "full-screen" | "disabled";
export type ChatTuiPluginReadiness = "governed-descriptors" | "metadata-only" | "disabled";
export type ChatTuiDiagnosticSeverity = "info" | "warning" | "error";

export interface ChatTuiDiagnostic {
  readonly code: string;
  readonly severity: ChatTuiDiagnosticSeverity;
  readonly message: string;
  readonly targetIds: readonly string[];
}

export interface ChatTuiContributionSummary {
  readonly total: number;
  readonly accepted: number;
  readonly conflicts: number;
  readonly diagnostics: number;
  readonly byKind: Readonly<Record<CliContributionKind, number>>;
  readonly bySource: Readonly<Record<CliContributionSourceKind, number>>;
}

export interface ChatTuiContributionRegistry {
  readonly accepted: readonly CliInteractionContribution[];
  readonly diagnostics: readonly ChatTuiDiagnostic[];
  readonly summary: ChatTuiContributionSummary;
  readonly keymapProfile: CliKeymapProfileName;
  readonly pluginExplanations: readonly CliPluginContributionExplanation[];
}

export interface ChatTuiStateSnapshot {
  readonly frameworkId: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly terminalProfile: CliTerminalCapabilityProfile;
  readonly mode: CliInteractionMode;
  readonly composition: CliCompositionSnapshot;
  readonly viewportProfile: ChatTuiViewportProfile;
  readonly rendererProfile: CliTerminalCapabilityProfile["rendererProfile"];
  readonly inputStrategy: CliTerminalCapabilityProfile["inputStrategy"];
  readonly keymapProfile: CliKeymapProfileName;
  readonly pluginReadiness: ChatTuiPluginReadiness;
  readonly pluginContributionExplanations: readonly CliPluginContributionExplanation[];
  readonly keySequence?: {
    readonly keys: readonly string[];
    readonly status: "pending" | "resolved" | "unbound" | "cancelled";
  };
  readonly reasoningPanel: ChatTuiReasoningPanel;
  readonly contributionSummary: ChatTuiContributionSummary;
  readonly diagnostics: readonly ChatTuiDiagnostic[];
  readonly promptReady: boolean;
  readonly turns: number;
  readonly workbench: ChatTuiWorkbench;
  readonly pluginExecutions: readonly PluginWorkbenchExecutionRecord[];
  readonly visibleReasoning?: VisibleReasoningProjection;
  readonly statusTelemetry?: ContextStatuslineTelemetry;
  readonly sessionId?: string;
}

export interface ChatTuiDispatchResult {
  readonly ok: boolean;
  readonly kind: "action" | "command" | "diagnostic" | "focus" | "sequence";
  readonly key: string;
  readonly state: ChatTuiStateSnapshot;
  readonly action?: CliActionKind;
  readonly commandName?: string;
  readonly commandSuggestionId?: string;
  readonly commandSource?: string;
  readonly pluginId?: string;
  readonly focusPanel?: ChatTuiFocusState["activePanel"];
  readonly previewText?: string;
  readonly diagnostics: readonly ChatTuiDiagnostic[];
}

export interface ChatTui {
  readonly enabled: boolean;
  snapshot(): ChatTuiStateSnapshot;
  renderStartup(state: ChatSessionState): Promise<void>;
  renderPrompt(): Promise<void>;
  afterLocalCommand(commandName: string, state: ChatSessionState): Promise<void>;
  afterTurn(state: ChatSessionState): Promise<void>;
  dispatchKey(key: string): ChatTuiDispatchResult;
  dispatchInputEvent(event: CliRawInputEvent): ChatTuiDispatchResult;
}

export interface ChatTuiContributionInput {
  readonly keymapProfile?: CliKeymapProfileName;
  readonly core?: readonly CliInteractionContribution[];
  readonly user?: readonly CliInteractionContribution[];
  readonly plugin?: readonly CliInteractionContribution[];
}

export function createBasicChatTui(
  options: CliOptions,
  terminalProfile: CliTerminalCapabilityProfile,
  write: (line: string) => Promise<void>,
  writeInline: (chunk: string) => Promise<void>
): ChatTui {
  const enabled = isChatTuiEnabled(options, terminalProfile);
  const controller = createChatTuiController({
    enabled,
    terminalProfile,
    write,
    writeInline,
    contributions: {
      keymapProfile: terminalProfile.rendererProfile === "full-screen" ? "vi-professional" : "vi-minimal"
    }
  });
  return controller;
}

export function createChatTuiController(input: {
  readonly enabled: boolean;
  readonly terminalProfile: CliTerminalCapabilityProfile;
  readonly write: (line: string) => Promise<void>;
  readonly writeInline: (chunk: string) => Promise<void>;
  readonly contributions?: ChatTuiContributionInput;
}): ChatTui {
  const registry = createChatTuiContributionRegistry({
    keymapProfile: input.contributions?.keymapProfile ?? (input.terminalProfile.rendererProfile === "full-screen" ? "vi-professional" : "vi-minimal"),
    ...(input.contributions?.core ? { core: input.contributions.core } : {}),
    ...(input.contributions?.user ? { user: input.contributions.user } : {}),
    ...(input.contributions?.plugin ? { plugin: input.contributions.plugin } : {})
  });
  let state = createChatTuiState({
    enabled: input.enabled,
    terminalProfile: input.terminalProfile,
    registry,
    promptReady: input.enabled
  });

  return {
    get enabled() {
      return state.enabled;
    },
    snapshot: () => state,
    renderStartup: async (chatState) => {
      state = updateChatTuiFromSession(state, chatState, "prompt", true);
      if (!state.enabled) return;
      if (state.viewportProfile === "full-screen") {
        for (const chunk of renderChatTuiFullscreenFrame({ workbench: state.workbench, phase: "enter" }).chunks) await input.writeInline(chunk);
        return;
      }
      for (const line of renderChatTuiStartup(state)) await input.write(line);
    },
    renderPrompt: async () => {
      if (!state.enabled || !state.promptReady) return;
      if (state.viewportProfile === "full-screen") return;
      await input.writeInline("deepseek> ");
    },
    afterLocalCommand: async (commandName, chatState) => {
      state = updateChatTuiFromSession(state, chatState, modeAfterLocalCommand(commandName, chatState), true);
    },
    afterTurn: async (chatState) => {
      state = updateChatTuiFromSession(state, chatState, "prompt", true);
      if (state.enabled && state.viewportProfile === "full-screen") {
        for (const chunk of renderChatTuiFullscreenFrame({ workbench: state.workbench, phase: "repaint" }).chunks) await input.writeInline(chunk);
      }
    },
    dispatchKey: (key) => {
      const result = dispatchChatTuiKey(state, key);
      state = result.state;
      return result;
    },
    dispatchInputEvent: (event) => {
      const result = dispatchChatTuiInputEvent(state, event);
      state = result.state;
      return result;
    }
  };
}

export function isChatTuiEnabled(options: Pick<CliOptions, "output">, terminalProfile: CliTerminalCapabilityProfile): boolean {
  return options.output === "text" &&
    terminalProfile.stdinIsTTY &&
    terminalProfile.stdoutIsTTY &&
    (terminalProfile.inputStrategy === "line" || terminalProfile.inputStrategy === "raw") &&
    (terminalProfile.rendererProfile === "interactive" || terminalProfile.rendererProfile === "full-screen");
}

export function createChatTuiContributionRegistry(input: ChatTuiContributionInput = {}): ChatTuiContributionRegistry {
  const keymapProfile = input.keymapProfile ?? "vi-professional";
  const contributions = [
    ...defaultCoreTuiContributions(keymapProfile),
    ...firstPartyTuiContributionsWithOwnerRoutes(),
    ...(input.core ?? []),
    ...(input.user ?? []),
    ...(input.plugin ?? [])
  ];
  const byConflictKey = new Map<string, CliInteractionContribution>();
  const conflicts: ChatTuiDiagnostic[] = [];
  const malformed: ChatTuiDiagnostic[] = [];
  const hiddenContributionIds = new Set<string>();
  const rejectedContributionIds = new Set<string>();

  for (const contribution of contributions) {
    const shapeDiagnostics = validateContributionShape(contribution);
    if (shapeDiagnostics.length > 0) {
      malformed.push(...shapeDiagnostics);
      rejectedContributionIds.add(contribution.id);
      continue;
    }
    const key = contributionConflictKey(contribution);
    const existing = byConflictKey.get(key);
    if (!existing) {
      byConflictKey.set(key, contribution);
      continue;
    }
    const winner = chooseContributionWinner(existing, contribution);
    const loser = winner.id === existing.id ? contribution : existing;
    hiddenContributionIds.add(loser.id);
    byConflictKey.set(key, winner);
    conflicts.push({
      code: "CHAT_TUI_CONTRIBUTION_CONFLICT",
      severity: "warning",
      message: `duplicate ${contribution.kind} contribution for ${key}; winner=${winner.id}`,
      targetIds: [winner.id, loser.id]
    });
  }

  const accepted = [...byConflictKey.values()].sort(compareContribution);
  const diagnostics = [...conflicts, ...malformed];
  const acceptedIds = new Set(accepted.map((entry) => entry.id));
  const diagnosticsById = new Map<string, string[]>();
  for (const diagnostic of diagnostics) {
    for (const id of diagnostic.targetIds) {
      diagnosticsById.set(id, [...(diagnosticsById.get(id) ?? []), diagnostic.message]);
    }
  }
  const pluginExplanations = contributions
    .filter((contribution) => contribution.source === "plugin")
    .map((contribution) => explainCliPluginContribution(contribution, {
      active: acceptedIds.has(contribution.id),
      hidden: hiddenContributionIds.has(contribution.id),
      degraded: rejectedContributionIds.has(contribution.id) || (diagnosticsById.get(contribution.id) ?? []).length > 0,
      diagnostics: diagnosticsById.get(contribution.id) ?? []
    }))
    .sort((a, b) => a.contributionId.localeCompare(b.contributionId, "en"));
  return {
    accepted,
    diagnostics,
    summary: summarizeContributions(contributions.length, accepted, diagnostics, conflicts.length),
    keymapProfile,
    pluginExplanations
  };
}

export function createChatTuiState(input: {
  readonly enabled: boolean;
  readonly terminalProfile: CliTerminalCapabilityProfile;
  readonly registry?: ChatTuiContributionRegistry;
  readonly composition?: CliCompositionSnapshot;
  readonly promptReady?: boolean;
  readonly turns?: number;
  readonly pluginExecutions?: readonly PluginWorkbenchExecutionRecord[];
  readonly sessionId?: string;
  readonly visibleReasoning?: VisibleReasoningProjection;
  readonly statusTelemetry?: ContextStatuslineTelemetry;
}): ChatTuiStateSnapshot {
  const registry = input.registry ?? createChatTuiContributionRegistry();
  const composition = input.composition ?? createDefaultTuiComposition(registry.accepted);
  const degraded = input.enabled ? [] : degradedDiagnostics(input.terminalProfile);
  const pluginReadiness = input.enabled ? "governed-descriptors" : "disabled";
  const reasoningPanel = reasoningPanelFromProjection(input.visibleReasoning, input.enabled);
  const base: Omit<ChatTuiStateSnapshot, "workbench"> = {
    frameworkId: CHAT_TUI_FRAMEWORK_ID,
    version: CHAT_TUI_FRAMEWORK_VERSION,
    enabled: input.enabled,
    terminalProfile: input.terminalProfile,
    mode: input.enabled ? composition.mode : "prompt",
    composition,
    viewportProfile: input.enabled ? viewportProfileFor(input.terminalProfile) : "disabled",
    rendererProfile: input.terminalProfile.rendererProfile,
    inputStrategy: input.terminalProfile.inputStrategy,
    keymapProfile: registry.keymapProfile,
    pluginReadiness,
    pluginContributionExplanations: registry.pluginExplanations,
    reasoningPanel,
    contributionSummary: registry.summary,
    diagnostics: [...registry.diagnostics, ...degraded],
    promptReady: input.promptReady ?? input.enabled,
    turns: input.turns ?? 0,
    pluginExecutions: boundedPluginExecutions(input.pluginExecutions ?? []),
    ...(input.visibleReasoning ? { visibleReasoning: input.visibleReasoning } : {}),
    ...(input.statusTelemetry ? { statusTelemetry: input.statusTelemetry } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {})
  };
  return attachWorkbench(base);
}

export function dispatchChatTuiKey(state: ChatTuiStateSnapshot, key: string): ChatTuiDispatchResult {
  if (!state.enabled) return diagnosticDispatch(state, key, "CHAT_TUI_DISABLED", "TUI key dispatch is disabled for this terminal profile.");
  const focus = dispatchChatTuiWorkbenchKey(state.workbench, key);
  if (focus.handled) {
    if (focus.commandBarAccepted) return commandBarAcceptanceDispatch({ state, key, workbench: focus.workbench, acceptance: focus.commandBarAccepted, attachWorkbench });
    if (focus.diagnostic) return workbenchDiagnosticDispatch({ state, key, workbench: focus.workbench, diagnostic: focus.diagnostic, attachWorkbench });
    return focusDispatch(state, key, focus.workbench, focus.activePanel);
  }
  const binding = findKeyBinding(state, key);
  if (!binding) return diagnosticDispatch(state, key, "CHAT_TUI_KEY_UNBOUND", `No key binding for ${key} in ${state.mode} mode.`);
  if (binding.targetKind === "command") {
    return commandDispatch(state, key, commandNameForBinding(binding));
  }
  const target = targetForBinding(state.composition, binding);
  if (!target) return diagnosticDispatch(state, key, "CHAT_TUI_TARGET_MISSING", `No active target for ${binding.action}.`);
  const result = resolveCliAction({
    action: binding.action,
    mode: actionMode(binding.action),
    target,
    dryRun: true
  }, state.composition);
  if (!result.ok) {
    const mappedDiagnostics = result.diagnostics.map(actionDiagnostic);
    const { workbench: previousWorkbench, ...base } = state;
    return {
      ok: false,
      kind: "diagnostic",
      key,
      state: attachWorkbench(
        { ...base, diagnostics: [...state.diagnostics, ...mappedDiagnostics] },
        previousWorkbench.focus,
        previousWorkbench.commandBar
      ),
      action: binding.action,
      diagnostics: mappedDiagnostics
    };
  }
  const { workbench: previousWorkbench, ...base } = state;
  const nextState = attachWorkbench(
    { ...base, mode: result.snapshot.mode, composition: result.snapshot, diagnostics: state.diagnostics },
    previousWorkbench.focus,
    previousWorkbench.commandBar
  );
  return { ok: true, kind: "action", key, state: nextState, action: binding.action, diagnostics: [] };
}

export function dispatchChatTuiInputEvent(state: ChatTuiStateSnapshot, event: CliRawInputEvent): ChatTuiDispatchResult {
  const key = rawInputEventToKeyName(event);
  if (!key) return diagnosticDispatch(state, event.kind, "CHAT_TUI_INPUT_EVENT_IGNORED", `Ignored ${event.kind} input event.`);
  if (state.workbench.focus.activePanel === "command-bar" && state.workbench.commandBar.open) {
    return dispatchChatTuiKey(state, key);
  }
  const pendingKeys = state.keySequence?.status === "pending" ? state.keySequence.keys : [];
  const resolution = resolveViKeySequence({
    mode: state.mode,
    keys: [...pendingKeys, key],
    profile: state.keymapProfile === "vi-professional" ? viProfessionalKeymapProfile() : viMinimalKeymapProfile()
  });
  if (resolution.status === "pending") {
    const { workbench: previousWorkbench, ...base } = state;
    const nextState = attachWorkbench(
      {
        ...base,
        keySequence: {
          keys: resolution.state.keys,
          status: resolution.status
        }
      },
      previousWorkbench.focus,
      previousWorkbench.commandBar
    );
    return { ok: true, kind: "sequence", key, state: nextState, ...(resolution.previewText ? { previewText: resolution.previewText } : {}), diagnostics: [] };
  }
  if (resolution.status === "cancelled") {
    const next = dispatchChatTuiKey(clearKeySequence(state), "Escape");
    return { ...next, key };
  }
  if (resolution.status === "unbound" || !resolution.action) {
    const retry = pendingKeys.length > 0 ? resolveViKeySequence({
      mode: state.mode,
      keys: [key],
      profile: state.keymapProfile === "vi-professional" ? viProfessionalKeymapProfile() : viMinimalKeymapProfile()
    }) : resolution;
    if (retry.status === "pending") {
      const { workbench: previousWorkbench, ...base } = state;
      const nextState = attachWorkbench(
        {
          ...base,
          keySequence: {
            keys: retry.state.keys,
            status: retry.status
          }
        },
        previousWorkbench.focus,
        previousWorkbench.commandBar
      );
      return { ok: true, kind: "sequence", key, state: nextState, ...(retry.previewText ? { previewText: retry.previewText } : {}), diagnostics: [] };
    }
    if (retry.status === "resolved" && retry.action) {
      return dispatchResolvedViAction(clearKeySequence(state), key, retry);
    }
    return diagnosticDispatch(clearKeySequence(state), key, "CHAT_TUI_KEY_UNBOUND", retry.diagnostic?.message ?? `No key binding for ${key}.`);
  }
  return dispatchResolvedViAction(clearKeySequence(state), key, resolution);
}

export function renderChatTuiStartup(state: ChatTuiStateSnapshot): readonly string[] {
  return renderChatTuiWorkbench(state.workbench);
}

export function renderChatTuiStatus(state: ChatTuiStateSnapshot): readonly string[] {
  return renderChatTuiWorkbench(state.workbench);
}

function attachWorkbench(
  base: Omit<ChatTuiStateSnapshot, "workbench">,
  focus?: ChatTuiFocusState,
  commandBar?: Partial<Pick<ChatTuiCommandBarState, "open" | "mode" | "query" | "activeSuggestionId" | "acceptedSuggestionId" | "acceptedCommandName" | "acceptedPreviewText">>
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

function focusDispatch(
  state: ChatTuiStateSnapshot,
  key: string,
  workbench: ChatTuiWorkbench,
  focusPanel: ChatTuiFocusState["activePanel"] | undefined
): ChatTuiDispatchResult {
  const panel = focusPanel ?? workbench.focus.activePanel;
  const mode = modeForFocusedPanel(panel, state.mode);
  const { workbench: _previousWorkbench, ...base } = state;
  const nextState = attachWorkbench(
    { ...base, mode, composition: { ...state.composition, mode } },
    workbench.focus,
    workbench.commandBar
  );
  return { ok: true, kind: "focus", key, state: nextState, focusPanel: panel, diagnostics: [] };
}

function dispatchResolvedViAction(
  state: ChatTuiStateSnapshot,
  key: string,
  resolution: ReturnType<typeof resolveViKeySequence>
): ChatTuiDispatchResult {
  const action = resolution.action;
  if (!action) return diagnosticDispatch(state, key, "CHAT_TUI_KEY_UNBOUND", resolution.diagnostic?.message ?? `No action for ${key}.`);
  if (resolution.commandMode || resolution.action === "search") {
    return commandDispatch(state, key, resolution.commandMode === "search" ? "search" : resolution.commandMode === "help" ? "help" : "command");
  }
  if (action === "cancel" && resolution.targetKind !== "approval-request") {
    return dispatchChatTuiKey(state, "Escape");
  }
  const target = targetForResolvedAction(state, resolution.targetKind);
  if (!target) return diagnosticDispatch(state, key, "CHAT_TUI_TARGET_MISSING", `No active target for ${action}.`);
  const result = resolveCliAction({
    action,
    mode: resolution.targetKind === "approval-request" ? "approval" : actionMode(action),
    target,
    dryRun: true,
    ...(resolution.count !== undefined ? { count: resolution.count } : {}),
    arguments: {
      keySequence: resolution.state.keys,
      previewText: resolution.previewText ?? ""
    }
  }, state.composition);
  if (!result.ok) {
    const mappedDiagnostics = result.diagnostics.map(actionDiagnostic);
    const { workbench: previousWorkbench, ...base } = state;
    return {
      ok: false,
      kind: "diagnostic",
      key,
      state: attachWorkbench(
        { ...base, diagnostics: [...state.diagnostics, ...mappedDiagnostics] },
        previousWorkbench.focus,
        previousWorkbench.commandBar
      ),
      action,
      ...(resolution.previewText ? { previewText: resolution.previewText } : {}),
      diagnostics: mappedDiagnostics
    };
  }
  const { workbench: previousWorkbench, ...base } = state;
  const nextState = attachWorkbench(
    { ...base, mode: result.snapshot.mode, composition: result.snapshot, diagnostics: state.diagnostics },
    previousWorkbench.focus,
    previousWorkbench.commandBar
  );
  return { ok: true, kind: "action", key, state: nextState, action, ...(resolution.previewText ? { previewText: resolution.previewText } : {}), diagnostics: [] };
}

function clearKeySequence(state: ChatTuiStateSnapshot): ChatTuiStateSnapshot {
  if (!state.keySequence) return state;
  const { workbench: previousWorkbench, keySequence: _keySequence, ...base } = state;
  return attachWorkbench(base, previousWorkbench.focus, previousWorkbench.commandBar);
}

function targetForResolvedAction(state: ChatTuiStateSnapshot, targetKind: CliTargetRef["kind"] | undefined): CliTargetRef | undefined {
  if (targetKind === "result-list") return activeResultListTarget(state.composition);
  if (targetKind === "result-list-item") return activeResultListItemTarget(state.composition);
  if (targetKind === "panel") return { kind: "panel", id: state.workbench.focus.activePanel, label: state.workbench.focus.activePanel };
  if (targetKind === "approval-request") return state.composition.activeTarget?.kind === "approval-request"
    ? state.composition.activeTarget
    : state.composition.resultLists
      .find((list) => list.kind === "approvals")
      ?.items.find((item) => item.target.kind === "approval-request")?.target;
  if (targetKind === "plugin-contribution") {
    const explanation = state.pluginContributionExplanations.find((entry) => entry.active) ?? state.pluginContributionExplanations[0];
    return explanation ? {
      kind: "plugin-contribution",
      id: explanation.contributionId,
      label: explanation.label,
      ...(explanation.pluginId ? { pluginId: explanation.pluginId as NonNullable<CliTargetRef["pluginId"]> } : {})
    } : undefined;
  }
  if (targetKind === "command") return { kind: "command", id: "command-bar", label: "Command bar" };
  return state.composition.activeTarget;
}

function modeForFocusedPanel(panel: ChatTuiFocusState["activePanel"], current: CliInteractionMode): CliInteractionMode {
  if (panel === "command-bar") return "command";
  if (panel === "result-list") return "result-list";
  if (current === "command" || current === "result-list") return "prompt";
  return current;
}

function defaultCoreTuiContributions(profile: CliKeymapProfileName): readonly CliInteractionContribution[] {
  return profile === "vi-professional" ? viProfessionalKeymapProfile().contributions : viMinimalKeymapProfile().contributions;
}

function viewportProfileFor(terminalProfile: CliTerminalCapabilityProfile): ChatTuiViewportProfile {
  return terminalProfile.rendererProfile === "full-screen" ? "full-screen" : "line";
}

function createDefaultTuiComposition(contributions: readonly CliInteractionContribution[]): CliCompositionSnapshot {
  const projection = createCliPaletteProjection();
  const snapshot = createPaletteCompositionSnapshot(projection);
  return {
    ...snapshot,
    mode: "prompt",
    contributions: [...snapshot.contributions, ...contributions]
  };
}

function updateChatTuiFromSession(
  current: ChatTuiStateSnapshot,
  chatState: ChatSessionState,
  mode: CliInteractionMode,
  promptReady: boolean
): ChatTuiStateSnapshot {
  const paletteSnapshot = chatState.palette?.snapshot;
  const composition = paletteSnapshot
    ? { ...paletteSnapshot, contributions: mergeContributions(paletteSnapshot.contributions, current.composition.contributions) }
    : current.composition;
  const { workbench: previousWorkbench, ...base } = current;
  const nextBase: Omit<ChatTuiStateSnapshot, "workbench"> = {
    ...base,
    mode,
    composition: { ...composition, mode },
    promptReady,
    turns: chatState.turns,
    pluginExecutions: current.pluginExecutions,
    reasoningPanel: reasoningPanelFromProjection(chatState.visibleReasoning, current.enabled),
    ...(chatState.visibleReasoning ? { visibleReasoning: chatState.visibleReasoning } : {}),
    ...(chatState.statusTelemetry ? { statusTelemetry: chatState.statusTelemetry } : {}),
    ...(chatState.sessionId ? { sessionId: chatState.sessionId } : {})
  };
  return attachWorkbench(nextBase, previousWorkbench.focus, previousWorkbench.commandBar);
}

function mergeContributions(
  primary: readonly CliInteractionContribution[],
  fallback: readonly CliInteractionContribution[]
): readonly CliInteractionContribution[] {
  const byId = new Map<string, CliInteractionContribution>();
  for (const contribution of fallback) byId.set(contribution.id, contribution);
  for (const contribution of primary) byId.set(contribution.id, contribution);
  return [...byId.values()].sort(compareContribution);
}

function modeAfterLocalCommand(commandName: string, chatState: ChatSessionState): CliInteractionMode {
  if (commandName === "file" || commandName === "jump" || commandName === "repo" || commandName === "git" || commandName === "checks") return chatState.palette?.snapshot.mode === "result-list" ? "result-list" : "prompt";
  if (commandName === "palette" || chatState.palette?.snapshot.mode === "result-list") return "result-list";
  if (commandName === "approval") return "approval";
  if (commandName === "history" || commandName === "revert") return "selection";
  if (commandName === "help" || commandName === "keymap" || commandName === "mode") return "command";
  return "prompt";
}

function findKeyBinding(state: ChatTuiStateSnapshot, key: string): CliKeymapEntry | undefined {
  return state.composition.contributions
    .map((contribution) => contribution.keymap)
    .find((entry): entry is CliKeymapEntry => entry !== undefined && entry.mode === state.mode && entry.key === key);
}

function targetForBinding(composition: CliCompositionSnapshot, binding: CliKeymapEntry): CliTargetRef | undefined {
  if (binding.targetKind === "result-list") return activeResultListTarget(composition);
  if (binding.targetKind === "result-list-item") return activeResultListItemTarget(composition);
  return composition.activeTarget;
}

function activeResultListTarget(composition: CliCompositionSnapshot): CliTargetRef | undefined {
  const list = composition.resultLists[0];
  return list ? { kind: "result-list", id: list.id, label: list.label } : undefined;
}

function activeResultListItemTarget(composition: CliCompositionSnapshot): CliTargetRef | undefined {
  const list = composition.resultLists[0];
  if (!list) return undefined;
  const item = list.items.find((candidate) => candidate.id === list.activeItemId) ?? list.items[0];
  if (!item) return undefined;
  if (item.target.kind === "file" || item.target.kind === "turn") return item.target;
  return { kind: "result-list-item", id: item.id, label: item.label };
}

function actionMode(action: CliActionKind): CliInteractionMode {
  if (action === "next" || action === "previous" || action === "first" || action === "last" || action === "back" || action === "forward") return "result-list";
  if (action === "accept" || action === "deny") return "approval";
  return "normal";
}

function commandNameForBinding(binding: CliKeymapEntry): string {
  if (binding.key === "q") return "exit";
  if (binding.key === ":") return "command";
  return binding.action;
}

function commandDispatch(state: ChatTuiStateSnapshot, key: string, commandName: string): ChatTuiDispatchResult {
  const { workbench: previousWorkbench, ...base } = state;
  const focus: ChatTuiFocusState = {
    activePanel: "command-bar",
    previousPanel: previousWorkbench.focus.activePanel,
    history: [...previousWorkbench.focus.history, "command-bar" as const].slice(-8),
    reason: "command"
  };
  const nextState = attachWorkbench(
    { ...base, mode: "command", composition: { ...state.composition, mode: "command" } },
    focus,
    { open: true, mode: key === "/" ? "search" : "slash", query: "" }
  );
  return { ok: true, kind: "command", key, state: nextState, commandName, diagnostics: [] };
}

function diagnosticDispatch(state: ChatTuiStateSnapshot, key: string, code: string, message: string): ChatTuiDispatchResult {
  const diagnostic = { code, severity: "warning" as const, message, targetIds: [key] };
  const { workbench: previousWorkbench, ...base } = state;
  return {
    ok: false,
    kind: "diagnostic",
    key,
    state: attachWorkbench(
      { ...base, diagnostics: [...state.diagnostics, diagnostic] },
      previousWorkbench.focus,
      previousWorkbench.commandBar
    ),
    diagnostics: [diagnostic]
  };
}

function actionDiagnostic(input: { readonly code: string; readonly severity: "info" | "warning" | "error"; readonly message: string; readonly targetIds: readonly string[] }): ChatTuiDiagnostic {
  return {
    code: input.code,
    severity: input.severity,
    message: input.message,
    targetIds: input.targetIds
  };
}

function validateContributionShape(contribution: CliInteractionContribution): readonly ChatTuiDiagnostic[] {
  const diagnostics: ChatTuiDiagnostic[] = [];
  if (!contribution.id.trim()) {
    diagnostics.push({ code: "CHAT_TUI_CONTRIBUTION_INVALID", severity: "error", message: "contribution id is required", targetIds: [] });
  }
  if (contribution.kind === "keymap" && !contribution.keymap) {
    diagnostics.push({ code: "CHAT_TUI_CONTRIBUTION_INVALID", severity: "error", message: `keymap contribution ${contribution.id} is missing keymap`, targetIds: [contribution.id] });
  }
  if (contribution.kind === "palette-entry" && !contribution.paletteEntry) {
    diagnostics.push({ code: "CHAT_TUI_CONTRIBUTION_INVALID", severity: "error", message: `palette contribution ${contribution.id} is missing paletteEntry`, targetIds: [contribution.id] });
  }
  return diagnostics;
}

function contributionConflictKey(contribution: CliInteractionContribution): string {
  if (contribution.kind === "keymap" && contribution.keymap) return `keymap:${contribution.keymap.mode}:${contribution.keymap.key}`;
  if (contribution.kind === "palette-entry" && contribution.paletteEntry) return `palette-entry:${contribution.paletteEntry.title}`;
  if (contribution.kind === "command") return `command:${contribution.commandName ?? contribution.id}`;
  if (contribution.kind === "action") return `action:${contribution.action ?? contribution.id}:${contribution.targetKind ?? "*"}`;
  return `${contribution.kind}:${contribution.id}`;
}

function chooseContributionWinner(a: CliInteractionContribution, b: CliInteractionContribution): CliInteractionContribution {
  const priorityA = contributionPriority(a);
  const priorityB = contributionPriority(b);
  if (priorityA !== priorityB) return priorityA > priorityB ? a : b;
  return a.id <= b.id ? a : b;
}

function contributionPriority(contribution: CliInteractionContribution): number {
  if (typeof contribution.priority === "number") return contribution.priority;
  if (contribution.source === "core") return 100;
  if (contribution.source === "user") return 75;
  return 50;
}

function compareContribution(a: CliInteractionContribution, b: CliInteractionContribution): number {
  return a.id.localeCompare(b.id);
}

function summarizeContributions(
  total: number,
  accepted: readonly CliInteractionContribution[],
  diagnostics: readonly ChatTuiDiagnostic[],
  conflicts: number
): ChatTuiContributionSummary {
  return {
    total,
    accepted: accepted.length,
    conflicts,
    diagnostics: diagnostics.length,
    byKind: countBy(accepted, (entry) => entry.kind) as Readonly<Record<CliContributionKind, number>>,
    bySource: countBy(accepted, (entry) => entry.source) as Readonly<Record<CliContributionSourceKind, number>>
  };
}

function countBy<T extends string>(items: readonly CliInteractionContribution[], key: (item: CliInteractionContribution) => T): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const item of items) {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function degradedDiagnostics(profile: CliTerminalCapabilityProfile): readonly ChatTuiDiagnostic[] {
  return [{
    code: "CHAT_TUI_DEGRADED",
    severity: "info",
    message: `TUI disabled for renderer=${profile.rendererProfile} input=${profile.inputStrategy}`,
    targetIds: profile.reasons
  }];
}

function referenceCount(composition: CliCompositionSnapshot): number {
  return composition.referenceSets.reduce((total, set) => total + set.items.length, 0);
}
