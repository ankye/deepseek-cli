import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CliCompositionSnapshot, CliInteractionContribution } from "@deepseek/platform-contracts";
import { asId, createVisibleReasoningRecord, projectVisibleReasoning } from "@deepseek/platform-contracts";
import {
  CHAT_TUI_FRAMEWORK_ID,
  createChatTuiContributionRegistry,
  createChatTuiState,
  dispatchChatTuiKey,
  renderChatTuiStartup,
  renderChatTuiStatus
} from "../../src/apps/cli/src/commands/chat-tui.js";
import type { CliTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";

describe("chat TUI framework", () => {
  it("registers plugin contributions as metadata and reports keymap conflicts deterministically", () => {
    const pluginConflict: CliInteractionContribution = {
      id: "plugin.navigation.j",
      kind: "keymap",
      source: "plugin",
      action: "inspect",
      targetKind: "result-list-item",
      keymap: {
        id: "plugin.navigation.j",
        mode: "result-list",
        key: "j",
        action: "inspect",
        targetKind: "result-list-item"
      }
    };
    const pluginRenderHint: CliInteractionContribution = {
      id: "plugin.render.diff",
      kind: "render-hint",
      source: "plugin",
      metadata: { targetKind: "diff", renderer: "side-by-side" }
    };

    const registry = createChatTuiContributionRegistry({ plugin: [pluginConflict, pluginRenderHint] });

    assert.equal(registry.summary.conflicts, 1);
    assert.equal(registry.diagnostics.some((diagnostic) => diagnostic.code === "CHAT_TUI_CONTRIBUTION_CONFLICT" && diagnostic.targetIds.includes("vi.next")), true);
    assert.equal(registry.accepted.some((entry) => entry.id === "plugin.navigation.j"), false);
    assert.equal(registry.accepted.some((entry) => entry.id === "plugin.render.diff"), true);
  });

  it("renders bounded startup and status lines for the production line viewport", () => {
    const state = createChatTuiState({
      enabled: true,
      terminalProfile: interactiveProfile(),
      sessionId: "session-tui-contract"
    });
    const startup = renderChatTuiStartup(state);
    const status = renderChatTuiStatus(state);

    assert.equal(state.frameworkId, CHAT_TUI_FRAMEWORK_ID);
    assert.equal(state.workbench.layout, "balanced");
    assert.equal(state.workbench.regions.some((region) => region.id === "command-bar" && region.visible), true);
    assert.equal(startup.some((line) => line.startsWith("DeepSeek Workbench") && line.includes("focus=transcript")), true);
    assert.equal(startup.some((line) => line.startsWith("Command |") && line.includes("/help")), true);
    assert.equal(startup.every((line) => line.length <= 100), true);
    assert.equal(status.some((line) => line.startsWith("Plugins |") && line.includes("metadata-only")), true);
  });

  it("records degraded diagnostics when terminal profile cannot host interactive TUI", () => {
    const state = createChatTuiState({
      enabled: false,
      terminalProfile: { ...interactiveProfile(), rendererProfile: "jsonl", inputStrategy: "scripted", stdinIsTTY: false, stdoutIsTTY: false, reasons: ["renderer:jsonl", "input:scripted"] }
    });

    assert.equal(state.viewportProfile, "disabled");
    assert.equal(state.pluginReadiness, "disabled");
    assert.equal(state.diagnostics.some((diagnostic) => diagnostic.code === "CHAT_TUI_DEGRADED"), true);
  });

  it("dispatches vi result-list keys through typed action resolution", () => {
    const base = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });
    const state = {
      ...base,
      mode: "result-list" as const,
      composition: { ...base.composition, mode: "result-list" as const }
    };
    const next = dispatchChatTuiKey(state, "j");
    const command = dispatchChatTuiKey({ ...state, mode: "normal" as const, composition: { ...state.composition, mode: "normal" as const } }, ":");

    assert.equal(next.ok, true);
    assert.equal(next.kind, "action");
    assert.equal(next.action, "next");
    assert.equal(command.ok, true);
    assert.equal(command.kind, "command");
    assert.equal(command.commandName, "command");
    assert.equal(command.state.workbench.focus.activePanel, "command-bar");
    assert.equal(command.state.workbench.commandBar.open, true);
  });

  it("moves workbench focus locally without model-visible actions", () => {
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });
    const resultList = dispatchChatTuiKey(state, "Tab");
    const reasoning = dispatchChatTuiKey(resultList.state, "r");
    const inspector = dispatchChatTuiKey(reasoning.state, "i");
    const commandBar = dispatchChatTuiKey(inspector.state, "/");
    const restored = dispatchChatTuiKey(commandBar.state, "Escape");

    assert.equal(resultList.ok, true);
    assert.equal(resultList.kind, "focus");
    assert.equal(resultList.focusPanel, "result-list");
    assert.equal(reasoning.ok, true);
    assert.equal(reasoning.kind, "focus");
    assert.equal(reasoning.focusPanel, "reasoning");
    assert.equal(inspector.state.workbench.focus.activePanel, "inspector");
    assert.equal(commandBar.state.workbench.commandBar.open, true);
    assert.equal(commandBar.state.mode, "command");
    assert.equal(restored.state.workbench.focus.activePanel, "inspector");
    assert.equal(restored.state.mode, "prompt");
  });

  it("ranks and bounds command bar suggestions across core, context, history, reasoning, and plugins", () => {
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });
    const suggestions = state.workbench.commandBar.suggestions;

    assert.equal(suggestions[0]?.title, "/help");
    assert.equal(suggestions.some((entry) => entry.kind === "context" && entry.title.includes("/context")), true);
    assert.equal(suggestions.some((entry) => entry.kind === "history"), true);
    assert.equal(suggestions.some((entry) => entry.kind === "reasoning-view"), true);
    assert.equal(state.workbench.commandBar.overflowCount > 0, true);
    assert.equal(state.workbench.commandBar.suggestions.length <= 8, true);
  });

  it("projects visible reasoning into a compact rail and inspector evidence targets", () => {
    const projection = reasoningProjection(6);
    const state = createChatTuiState({
      enabled: true,
      terminalProfile: interactiveProfile(),
      visibleReasoning: projection
    });
    const status = renderChatTuiStatus(state);

    assert.equal(state.reasoningPanel.enabled, true);
    assert.equal(state.reasoningPanel.recordCount, 6);
    assert.equal(state.reasoningPanel.inspectorTargets[0]?.id, "check:typecheck-6");
    assert.equal(state.workbench.reasoningRail.steps.length, 5);
    assert.equal(state.workbench.reasoningRail.steps.some((step) => step.active && step.recordId === projection.activeRecordId), true);
    assert.equal(state.workbench.reasoningRail.overflowCount, 1);
    assert.equal(state.workbench.inspector.items[0]?.target.id, "check:typecheck-6");
    assert.equal(status.some((line) => line.startsWith("Reasoning |") && line.includes("verification")), true);
  });

  it("uses the active result-list target as inspector fallback", () => {
    const base = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });
    const composition: CliCompositionSnapshot = {
      ...base.composition,
      mode: "result-list",
      resultLists: [{
        id: "results:files",
        kind: "search",
        label: "Files",
        activeItemId: "item-2",
        items: [
          { id: "item-1", label: "README", order: 1, target: { kind: "file", id: "README.md", path: "README.md", label: "README.md" } },
          { id: "item-2", label: "CLI", order: 2, target: { kind: "file", id: "src/apps/cli/README.md", path: "src/apps/cli/README.md", label: "CLI README" } }
        ]
      }]
    };
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile(), composition });

    assert.equal(state.workbench.focus.activePanel, "result-list");
    assert.equal(state.workbench.inspector.items[0]?.source, "result-list");
    assert.equal(state.workbench.inspector.items[0]?.target.id, "src/apps/cli/README.md");
  });

  it("summarizes plugin shelf readiness, contribution counts, conflicts, and diagnostics", () => {
    const pluginConflict: CliInteractionContribution = {
      id: "plugin.navigation.j",
      kind: "keymap",
      source: "plugin",
      action: "inspect",
      targetKind: "result-list-item",
      pluginId: asId<"plugin">("@deepseek/plugin-conflict-test"),
      keymap: {
        id: "plugin.navigation.j",
        mode: "result-list",
        key: "j",
        action: "inspect",
        targetKind: "result-list-item"
      }
    };
    const registry = createChatTuiContributionRegistry({ plugin: [pluginConflict] });
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile(), registry });

    assert.equal(state.workbench.pluginShelf.readiness, "metadata-only");
    assert.equal(state.workbench.pluginShelf.totalPlugins >= 4, true);
    assert.equal(state.workbench.pluginShelf.conflicts, 1);
    assert.equal(state.workbench.pluginShelf.items.length <= 4, true);
    assert.equal(state.workbench.activityFeed.records.some((record) => record.kind === "plugins" && record.status === "ready"), true);
  });

  it("falls back to a compact bounded workbench frame in narrow terminals", () => {
    const state = createChatTuiState({
      enabled: true,
      terminalProfile: { ...interactiveProfile(), columns: 72 }
    });
    const lines = renderChatTuiStartup(state);

    assert.equal(state.workbench.layout, "compact");
    assert.equal(lines.filter((line) => line.startsWith("DeepSeek Workbench")).length, 1);
    assert.equal(lines.length <= 7, true);
    assert.equal(lines.every((line) => line.length <= 100), true);
  });
});

function interactiveProfile(columns = 100): CliTerminalCapabilityProfile {
  return {
    rendererProfile: "interactive",
    inputStrategy: "line",
    stdinIsTTY: true,
    stdoutIsTTY: true,
    isCI: false,
    platform: "win32",
    columns,
    colorDepth: "ansi256",
    unicode: "unicode",
    rawInput: true,
    inlineText: true,
    reasons: ["renderer:interactive", "input:line"]
  };
}

function reasoningProjection(count: number) {
  return projectVisibleReasoning(
    Array.from({ length: count }, (_, index) => createVisibleReasoningRecord({
      sessionId: asId<"session">("session-tui-reasoning"),
      turnId: asId<"turn">("turn-tui-reasoning"),
      trace: {
        traceId: asId<"trace">(`trace-tui-reasoning-${index + 1}`),
        spanId: asId<"span">(`span-tui-reasoning-${index + 1}`),
        correlationId: asId<"correlation">(`corr-tui-reasoning-${index + 1}`)
      },
      createdAt: "1970-01-01T00:00:00.000Z",
      actor: "runtime",
      stepKind: "verification",
      status: "completed",
      summary: `Verification step ${index + 1} passed with linked evidence.`,
      evidence: [{
        kind: "check",
        target: { kind: "tool-evidence", id: `check:typecheck-${index + 1}`, label: `typecheck-${index + 1}` },
        label: `typecheck-${index + 1}`,
        fingerprint: `check:typecheck-${index + 1}`,
        supports: true,
        redaction: { class: "internal" }
      }],
      sequence: index + 1
    })),
    { renderer: "tui", detailLevel: "full" }
  );
}
