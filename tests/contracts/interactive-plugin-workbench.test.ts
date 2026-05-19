import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JsonObject, ProcessResult, ProcessRunOptions } from "@deepseek/platform-contracts";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { createChatTuiState, executeChatTuiPluginRoute, renderChatTuiStatus } from "../../src/apps/cli/src/commands/chat-tui.js";
import { createCliPaletteProjection, executePalettePluginRoute, resolvePaletteAction } from "../../src/apps/cli/src/commands/palette.js";
import type { CliTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";
import { executeBuiltInPluginWorkbenchRoute } from "../../src/apps/cli/src/plugins/plugin-workbench-execution.js";

describe("interactive plugin workbench", () => {
  it("records implemented repo executions with result lists and replay metadata", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    await platform.writeFile("/workspace/README.md", "needle docs\n");

    const execution = await executeBuiltInPluginWorkbenchRoute({
      commandId: "repo.navigator.grep",
      source: "test",
      platform,
      workspaceRoot: "/workspace",
      query: "needle",
      durationMs: 12
    });

    assert.equal(execution.kind, "plugin.workbench.execution");
    assert.equal(execution.commandId, "repo.navigator.grep");
    assert.equal(execution.routeStatus, "implemented");
    assert.equal(execution.dispatchStatus, "completed");
    assert.equal(execution.dispatchAvailable, true);
    assert.equal(execution.dryRun, false);
    assert.equal(execution.resultKind, "repo.navigator");
    assert.equal(execution.resultList?.id, "result-list:repo.grep");
    assert.equal(execution.resultList?.items.length, 2);
    assert.equal(execution.activeTarget?.kind, "file");
    assert.equal(execution.referenceTargets.length, 2);
    assert.equal(execution.durationBucket, "instant");
    assert.equal(execution.replayFingerprint.includes("builtin-plugin-owner-route:repo.navigator.grep"), true);
  });

  it("records file manager preview executions with file targets and redaction metadata", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");

    const execution = await executeBuiltInPluginWorkbenchRoute({
      commandId: "file.manager.preview",
      source: "palette",
      platform,
      workspaceRoot: "/workspace",
      target: "/workspace/src/index.ts",
      durationMs: 18
    });

    assert.equal(execution.kind, "plugin.workbench.execution");
    assert.equal(execution.commandId, "file.manager.preview");
    assert.equal(execution.pluginId, "@deepseek/plugin-file-manager");
    assert.equal(execution.routeStatus, "implemented");
    assert.equal(execution.dispatchStatus, "completed");
    assert.equal(execution.resultKind, "file.manager");
    assert.equal(execution.resultList?.id, "result-list:file-manager.preview");
    assert.equal(execution.activeTarget?.kind, "file");
    assert.equal(execution.referenceTargets[0]?.path, "/workspace/src/index.ts");
    assert.equal(jsonObject(execution.route).family, "file");
    assert.equal(Array.isArray(execution.redaction.fields), true);
    assert.equal(JSON.stringify(execution).includes("handler"), false);
  });

  it("records deferred repo routes with fallback guidance and no process execution", async () => {
    const platform = new RecordingPlatform();

    const execution = await executeBuiltInPluginWorkbenchRoute({
      commandId: "repo.navigator.recall",
      source: "test",
      platform,
      workspaceRoot: "/workspace",
      query: "old decision"
    });

    assert.equal(execution.routeStatus, "deferred");
    assert.equal(execution.dispatchStatus, "deferred");
    assert.equal(execution.dispatchAvailable, false);
    assert.equal(execution.fallbackCommand, "deepseek chat -> /palette recall <query>");
    assert.equal(execution.activeTarget?.kind, "diagnostic");
    assert.equal(execution.diagnosticCodes.includes("BUILTIN_PLUGIN_OWNER_ROUTE_DEFERRED"), true);
    assert.equal(execution.diagnosticCodes.includes("REPO_NAVIGATOR_DEFERRED"), true);
    assert.equal(execution.suggestedActions.some((action) => action.includes("palette recall")), true);
    assert.equal(platform.runs.length, 0);
    assert.equal(JSON.stringify(execution).includes("handler"), false);
    assert.equal(JSON.stringify(execution).includes("callback"), false);
    assert.equal(JSON.stringify(execution).includes("execute"), false);
  });

  it("executes palette plugin routes explicitly while generic palette actions stay dry-run", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    const projection = createCliPaletteProjection();
    const repoGrep = projection.entries.find((entry) => stringField(jsonObjectMaybe(entry.metadata.recordMetadata)?.commandId) === "repo.navigator.grep");
    assert.ok(repoGrep);

    const dryRun = resolvePaletteAction({ paletteActionName: "inspect", paletteTargetId: repoGrep.entry.id }, projection);
    const execution = await executePalettePluginRoute({
      projection,
      targetId: repoGrep.entry.id,
      platform,
      workspaceRoot: "/workspace",
      query: "needle"
    });

    assert.equal(dryRun.ok, true);
    assert.equal(jsonObject(dryRun.update?.commandDescriptor).dryRun, true);
    assert.equal(platform.runs.length, 0);
    assert.equal(execution.source, "palette");
    assert.equal(execution.commandId, "repo.navigator.grep");
    assert.equal(execution.dispatchStatus, "completed");
    assert.equal(execution.resultList?.items.length, 1);
  });

  it("attaches plugin execution result lists and recent activity to TUI workbench state", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });

    const executed = await executeChatTuiPluginRoute(state, {
      commandId: "repo.navigator.files",
      platform,
      workspaceRoot: "/workspace",
      query: "src"
    });
    const lines = renderChatTuiStatus(executed.state);
    const repoShelfItem = executed.state.workbench.pluginShelf.items.find((item) => item.pluginId === "@deepseek/plugin-repo-navigator");

    assert.equal(executed.execution.source, "tui");
    assert.equal(executed.state.pluginExecutions[0]?.recordId, executed.execution.recordId);
    assert.equal(executed.state.mode, "result-list");
    assert.equal(executed.state.composition.resultLists[0]?.id, "result-list:repo.files");
    assert.equal(executed.state.composition.activeTarget?.kind, "file");
    assert.equal(executed.state.workbench.focus.activePanel, "result-list");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.kind, "plugin-execution");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.status, "ready");
    assert.equal(repoShelfItem?.lastExecutionStatus, "completed");
    assert.equal(repoShelfItem?.lastExecutionCommandId, "repo.navigator.files");
    assert.equal(repoShelfItem?.resultListCount, 1);
    assert.equal(lines.some((line) => line.includes("plugin-execution:ready") || line.includes("last=completed")), true);
  });

  it("attaches jump navigator text results as the active TUI result list", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    await platform.writeFile("/workspace/docs/usage.md", "needle docs\n");
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });

    const executed = await executeChatTuiPluginRoute(state, {
      commandId: "jump.navigator.text",
      platform,
      workspaceRoot: "/workspace",
      query: "needle"
    });
    const jumpShelfItem = executed.state.workbench.pluginShelf.items.find((item) => item.pluginId === "@deepseek/plugin-jump-navigator");

    assert.equal(executed.execution.source, "tui");
    assert.equal(executed.execution.resultKind, "jump.navigator");
    assert.equal(executed.execution.dispatchStatus, "completed");
    assert.equal(executed.execution.resultList?.id, "result-list:jump.text");
    assert.equal(executed.execution.resultList?.items.length, 2);
    assert.equal(executed.state.mode, "result-list");
    assert.equal(executed.state.composition.resultLists[0]?.id, "result-list:jump.text");
    assert.equal(executed.state.composition.activeTarget?.kind, "file");
    assert.equal(executed.state.workbench.focus.activePanel, "result-list");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.kind, "plugin-execution");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.status, "ready");
    assert.equal(jumpShelfItem?.lastExecutionStatus, "completed");
    assert.equal(jumpShelfItem?.lastExecutionCommandId, "jump.navigator.text");
    assert.equal(jumpShelfItem?.resultListCount, 1);
  });

  it("keeps deferred TUI plugin executions visible without result-list mutation", async () => {
    const platform = new RecordingPlatform();
    const state = createChatTuiState({ enabled: true, terminalProfile: interactiveProfile() });

    const executed = await executeChatTuiPluginRoute(state, {
      commandId: "repo.navigator.project-index",
      platform,
      workspaceRoot: "/workspace",
      query: "symbol"
    });
    const repoShelfItem = executed.state.workbench.pluginShelf.items.find((item) => item.pluginId === "@deepseek/plugin-repo-navigator");

    assert.equal(executed.execution.dispatchStatus, "deferred");
    assert.equal(executed.execution.resultList?.id, "result-list:repo.project-index");
    assert.equal(executed.state.pluginExecutions[0]?.dispatchStatus, "deferred");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.kind, "plugin-execution");
    assert.equal(executed.state.workbench.activityFeed.records[0]?.status, "warning");
    assert.equal(repoShelfItem?.status, "diagnostic");
    assert.equal(repoShelfItem?.lastExecutionStatus, "deferred");
  });
});

class RecordingPlatform extends FakePlatformRuntime {
  readonly runs: { readonly command: string; readonly args: readonly string[]; readonly options: ProcessRunOptions }[] = [];

  constructor() {
    super("fake", "/workspace");
  }

  override async runProcess(command: string, args: readonly string[], options: ProcessRunOptions = {}): Promise<ProcessResult> {
    this.runs.push({ command, args, options });
    return { exitCode: 0, stdout: "ok\n", stderr: "" };
  }
}

function interactiveProfile(columns = 120): CliTerminalCapabilityProfile {
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

function jsonObject(value: unknown): JsonObject {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as JsonObject;
}

function jsonObjectMaybe(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
