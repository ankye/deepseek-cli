import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  JsonObject,
  LosslessContextDescribeRequest,
  LosslessContextDescribeResult,
  LosslessContextExpandRequest,
  LosslessContextExpandResult,
  LosslessContextGrepRequest,
  LosslessContextGrepResult,
  LosslessContextManager,
  LosslessContextNode,
  LosslessContextRecordInput,
  LosslessContextRecordResult,
  LosslessContextSummarizeRequest,
  LosslessContextSummarizeResult,
  PluginManifest,
  ProcessResult,
  ProcessRunOptions,
  SessionId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { firstPartyPluginCommandContributions, listFirstPartyDevPluginManifests } from "@deepseek/first-party-dev-plugins";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { createExtensionManagementRecord } from "../../src/apps/cli/src/commands/extension.js";
import { createChatTuiContributionRegistry } from "../../src/apps/cli/src/commands/chat-tui.js";
import { createCliPaletteProjection } from "../../src/apps/cli/src/commands/palette.js";
import {
  dispatchBuiltInPluginOwnerRoute,
  firstPartyTuiContributionsWithOwnerRoutes,
  listBuiltInPluginOwnerRoutes,
  validateBuiltInPluginOwnerRoutes
} from "../../src/apps/cli/src/plugins/builtin-owner-routes.js";

describe("built-in plugin owner routes", () => {
  it("covers every built-in plugin command with deterministic route readiness", () => {
    const commandIds = firstPartyPluginCommandContributions()
      .map((contribution) => stringField(contribution.metadata?.commandId))
      .filter((commandId): commandId is string => commandId !== undefined)
      .sort();
    const routes = listBuiltInPluginOwnerRoutes();
    const validation = validateBuiltInPluginOwnerRoutes();

    assert.equal(validation.ok, true);
    assert.equal(routes.length, 26);
    assert.deepEqual(routes.map((route) => route.commandId).sort(), commandIds);
    assert.equal(new Set(routes.map((route) => route.routeId)).size, routes.length);
    assert.equal(routes.filter((route) => route.status === "implemented").length, 23);
    assert.equal(routes.filter((route) => route.status === "deferred").length, 3);
    assert.equal(routes.filter((route) => route.status === "unsupported").length, 0);
    assert.equal(routes.every((route) => route.permissions.length > 0), true);
    assert.equal(routes.every((route) => route.sideEffects.length === 1), true);
    assert.equal(routes.some((route) => route.commandId === "file.manager.preview" && route.family === "file"), true);
    assert.equal(routes.some((route) => route.commandId === "jump.navigator.symbol" && route.ownerSubsystem === "code-intelligence"), true);
  });

  it("does not read plugin-private handler, callback, or execute metadata while projecting routes", () => {
    const manifest = listFirstPartyDevPluginManifests()[0]!;
    const command = { ...(manifest.contributions.commands as readonly JsonObject[])[0]! };
    for (const property of ["handler", "callback", "execute"]) {
      Object.defineProperty(command, property, {
        enumerable: true,
        get() {
          throw new Error(`private ${property} getter was read`);
        }
      });
    }
    const hostileManifest: PluginManifest = {
      ...manifest,
      contributions: {
        ...manifest.contributions,
        commands: [command]
      }
    };

    const routes = listBuiltInPluginOwnerRoutes([hostileManifest]);

    assert.equal(routes.length, 1);
    assert.equal(routes[0]?.commandId, "context:lcm.status");
    assert.equal(routes[0]?.dispatchAvailable, true);
  });

  it("dispatches repo navigator routes through the existing workspace adapter", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    await platform.writeFile("/workspace/README.md", "needle docs\n");

    const files = await dispatchBuiltInPluginOwnerRoute({
      commandId: "repo.navigator.files",
      platform,
      workspaceRoot: "/workspace",
      query: "src"
    });
    const grep = await dispatchBuiltInPluginOwnerRoute({
      commandId: "repo.navigator.grep",
      platform,
      workspaceRoot: "/workspace",
      query: "needle"
    });

    assert.equal(files.status, "completed");
    assert.equal(files.route.family, "repo");
    assert.equal(jsonObject(files.result).kind, "repo.navigator");
    assert.equal(jsonObject(files.result).action, "files");
    assert.equal(grep.status, "completed");
    assert.equal(jsonObject(grep.result).action, "grep");
    assert.equal(jsonObject(jsonObject(grep.result).data).itemCount, 2);
  });

  it("dispatches file manager routes through read-only workspace adapters", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    await platform.writeFile("/workspace/README.md", "needle docs\n");

    const list = await dispatchBuiltInPluginOwnerRoute({
      commandId: "file.manager.list",
      platform,
      workspaceRoot: "/workspace",
      query: "src"
    });
    const preview = await dispatchBuiltInPluginOwnerRoute({
      commandId: "file.manager.preview",
      platform,
      workspaceRoot: "/workspace",
      target: "/workspace/src/index.ts"
    });
    const references = await dispatchBuiltInPluginOwnerRoute({
      commandId: "file.manager.references",
      platform,
      workspaceRoot: "/workspace",
      query: ".ts"
    });

    assert.equal(list.status, "completed");
    assert.equal(list.route.family, "file");
    assert.equal(jsonObject(list.result).kind, "file.manager");
    assert.equal(jsonObject(list.result).action, "list");
    assert.equal(preview.status, "completed");
    assert.equal(jsonObject(preview.result).action, "preview");
    assert.equal(jsonObject(jsonObject(preview.result).data).path, "/workspace/src/index.ts");
    assert.equal(jsonObject(jsonObject(preview.result).resultList).id, "result-list:file-manager.preview");
    assert.equal(references.status, "completed");
    assert.equal(Array.isArray(jsonObject(references.result).referenceItems), true);
    assert.equal(jsonObject(references.result).referenceTargets instanceof Array, true);
  });

  it("dispatches jump navigator file/text routes and keeps symbol jump deferred", async () => {
    const platform = new RecordingPlatform();
    await platform.writeFile("/workspace/src/index.ts", "export const needle = true;\n");
    await platform.writeFile("/workspace/docs/usage.md", "needle docs\n");

    const file = await dispatchBuiltInPluginOwnerRoute({
      commandId: "jump.navigator.file",
      platform,
      workspaceRoot: "/workspace",
      query: "src"
    });
    const text = await dispatchBuiltInPluginOwnerRoute({
      commandId: "jump.navigator.text",
      platform,
      workspaceRoot: "/workspace",
      query: "needle"
    });
    const symbol = await dispatchBuiltInPluginOwnerRoute({
      commandId: "jump.navigator.symbol",
      platform,
      workspaceRoot: "/workspace",
      query: "needle"
    });

    assert.equal(file.status, "completed");
    assert.equal(file.route.family, "jump");
    assert.equal(jsonObject(file.result).kind, "jump.navigator");
    assert.equal(jsonObject(jsonObject(file.result).resultList).id, "result-list:jump.file");
    assert.equal(text.status, "completed");
    assert.equal(jsonObject(jsonObject(text.result).data).itemCount, 2);
    assert.equal(jsonObject(jsonObject(text.result).resultList).id, "result-list:jump.text");
    assert.equal(symbol.status, "deferred");
    assert.equal(symbol.route.status, "deferred");
    assert.equal(symbol.route.dispatchAvailable, false);
    assert.equal(jsonObject(symbol.result).status, "deferred");
    assert.equal(jsonObject(jsonObject(symbol.result).resultList).id, "result-list:jump.symbol");
    assert.equal(symbol.diagnostics.some((entry) => entry.code === "BUILTIN_PLUGIN_OWNER_ROUTE_DEFERRED"), true);
    assert.equal(symbol.diagnostics.some((entry) => entry.code === "JUMP_NAVIGATOR_SYMBOL_DEFERRED"), true);
    assert.equal(platform.runs.length, 0);
  });

  it("dispatches git and dev-check routes through fixed governed process adapters", async () => {
    const platform = new RecordingPlatform();

    const git = await dispatchBuiltInPluginOwnerRoute({
      commandId: "git.review.status",
      platform,
      workspaceRoot: "/workspace"
    });
    const lint = await dispatchBuiltInPluginOwnerRoute({
      commandId: "checks.lint",
      platform,
      workspaceRoot: "/workspace"
    });
    const denied = await dispatchBuiltInPluginOwnerRoute({
      commandId: "checks.typecheck",
      platform,
      workspaceRoot: "/workspace",
      args: ["--watch"]
    });

    assert.equal(git.status, "completed");
    assert.equal(lint.status, "completed");
    assert.equal(jsonObject(lint.result).kind, "dev.check");
    assert.equal(denied.status, "denied");
    assert.equal(platform.runs.length, 2);
    assert.deepEqual(platform.runs.map((run) => [run.command, run.args]), [
      ["git", ["status", "--short"]],
      ["npm", ["run", "lint"]]
    ]);
  });

  it("dispatches context routes through the injected lossless context manager", async () => {
    const platform = new RecordingPlatform();
    const context = new FakeLosslessContextManager();

    const status = await dispatchBuiltInPluginOwnerRoute({
      commandId: "context:lcm.status",
      platform,
      workspaceRoot: "/workspace",
      losslessContext: context
    });
    const grep = await dispatchBuiltInPluginOwnerRoute({
      commandId: "context:lcm.grep",
      platform,
      workspaceRoot: "/workspace",
      query: "needle",
      losslessContext: context
    });

    assert.equal(status.status, "completed");
    assert.equal(grep.status, "completed");
    assert.equal(context.grepRequests.length, 2);
    assert.equal(context.grepRequests[1]?.query, "needle");
    assert.equal(jsonObject(grep.result).kind, "context.compactor");
  });

  it("keeps deferred repo routes explicit and non-dispatchable", async () => {
    const platform = new RecordingPlatform();
    const recall = await dispatchBuiltInPluginOwnerRoute({
      commandId: "repo.navigator.recall",
      platform,
      workspaceRoot: "/workspace",
      query: "old decision"
    });
    const projectIndex = await dispatchBuiltInPluginOwnerRoute({
      commandId: "repo.navigator.project-index",
      platform,
      workspaceRoot: "/workspace",
      query: "symbol"
    });

    assert.equal(recall.status, "deferred");
    assert.equal(recall.route.dispatchAvailable, false);
    assert.equal(recall.diagnostics.some((entry) => entry.code === "BUILTIN_PLUGIN_OWNER_ROUTE_DEFERRED"), true);
    assert.equal(recall.diagnostics.some((entry) => entry.code === "REPO_NAVIGATOR_DEFERRED"), true);
    assert.equal(projectIndex.status, "deferred");
    assert.equal(platform.runs.length, 0);
  });

  it("projects owner route readiness into TUI, palette, and extension inspection surfaces", async () => {
    const tuiContributions = firstPartyTuiContributionsWithOwnerRoutes();
    const commandContributions = tuiContributions.filter((contribution) => contribution.kind === "command");
    const repoRecall = commandContributions.find((contribution) => contribution.metadata?.commandId === "repo.navigator.recall");
    const repoKeymap = tuiContributions.find((contribution) => contribution.id === "plugin:@deepseek/plugin-repo-navigator:keymap:repo.leader");
    const filePreview = commandContributions.find((contribution) => contribution.metadata?.commandId === "file.manager.preview");
    const fileKeymap = tuiContributions.find((contribution) => contribution.id === "plugin:@deepseek/plugin-file-manager:keymap:file.manager");
    const jumpSymbol = commandContributions.find((contribution) => contribution.metadata?.commandId === "jump.navigator.symbol");
    const jumpKeymap = tuiContributions.find((contribution) => contribution.id === "plugin:@deepseek/plugin-jump-navigator:keymap:jump.open");
    const registry = createChatTuiContributionRegistry();
    const explanation = registry.pluginExplanations.find((entry) => entry.contributionId === repoRecall?.id);
    const palette = createCliPaletteProjection();
    const paletteRecall = palette.entries.find((entry) => stringField(jsonObjectMaybe(entry.metadata.recordMetadata)?.commandId) === "repo.navigator.recall");
    const paletteJumpSymbol = palette.entries.find((entry) => stringField(jsonObjectMaybe(entry.metadata.recordMetadata)?.commandId) === "jump.navigator.symbol");
    const extension = await createExtensionManagementRecord({
      extensionCommand: "extension.plugin.contributions",
      output: "json"
    } as Parameters<typeof createExtensionManagementRecord>[0]);
    const extensionRecall = extension.items.find((item) => item.targetId === `plugin-contribution:${repoRecall?.id}`);
    const extensionJumpSymbol = extension.items.find((item) => item.targetId === `plugin-contribution:${jumpSymbol?.id}`);

    assert.equal(commandContributions.length, 26);
    assert.equal(commandContributions.every((contribution) => jsonObject(contribution.metadata?.ownerRoute).routeId !== undefined), true);
    assert.equal(repoRecall?.metadata?.ownerRouteStatus, "deferred");
    assert.equal(repoRecall?.metadata?.dispatchAvailable, false);
    assert.equal(jsonObject(repoKeymap?.metadata?.ownerRouteSummary).deferred, 2);
    assert.equal(filePreview?.metadata?.ownerRouteStatus, "implemented");
    assert.equal(filePreview?.metadata?.dispatchAvailable, true);
    assert.equal(jsonObject(fileKeymap?.metadata?.ownerRouteSummary).implemented, 3);
    assert.equal(jumpSymbol?.metadata?.ownerRouteStatus, "deferred");
    assert.equal(jumpSymbol?.metadata?.dispatchAvailable, false);
    assert.equal(jsonObject(jumpKeymap?.metadata?.ownerRouteSummary).deferred, 1);
    assert.equal(explanation?.governance.ownerRouteStatus, "deferred");
    assert.equal(explanation?.governance.dispatchAvailable, false);
    assert.equal(jsonObject(paletteRecall?.metadata.recordMetadata).ownerRouteStatus, "deferred");
    assert.equal(jsonObject(jsonObject(paletteRecall?.target.metadata).recordMetadata).dispatchAvailable, false);
    assert.equal(jsonObject(paletteJumpSymbol?.metadata.recordMetadata).ownerRouteStatus, "deferred");
    assert.equal(extensionRecall?.summary.includes("route=deferred"), true);
    assert.equal(jsonObject(extensionRecall?.provenance).ownerRouteStatus, "deferred");
    assert.equal(extensionJumpSymbol?.summary.includes("route=deferred"), true);
    assert.equal(jsonObject(extensionJumpSymbol?.provenance).ownerRouteStatus, "deferred");
    assert.equal(extension.lifecycle.some((entry) => entry.step === "builtin-plugin-owner-routes.project" && jsonObject(entry.metadata).routeCount === 26), true);
  });
});

class RecordingPlatform extends FakePlatformRuntime {
  readonly runs: { readonly command: string; readonly args: readonly string[]; readonly options: ProcessRunOptions }[] = [];

  constructor() {
    super("fake", "/workspace");
  }

  override async runProcess(command: string, args: readonly string[], options: ProcessRunOptions = {}): Promise<ProcessResult> {
    this.runs.push({ command, args, options });
    if (command === "git" && args[0] === "status") {
      return { exitCode: 0, stdout: " M src/index.ts\n", stderr: "" };
    }
    if (command === "git" && args[0] === "diff") {
      return { exitCode: 0, stdout: " src/index.ts | 2 +-\n", stderr: "" };
    }
    return { exitCode: 0, stdout: "ok\n", stderr: "" };
  }
}

class FakeLosslessContextManager implements LosslessContextManager {
  readonly sessionId = asId<"session">("session-owner-routes");
  readonly grepRequests: LosslessContextGrepRequest[] = [];

  async recordNode(input: LosslessContextRecordInput): Promise<LosslessContextRecordResult> {
    return {
      schemaVersion: "1.0.0",
      status: "recorded",
      nodeId: input.node.nodeId,
      sessionId: input.node.sessionId,
      edgeCount: input.edges?.length ?? 0,
      contentHash: input.node.contentHash,
      diagnostics: [],
      replayFingerprint: `record:${input.node.nodeId}`,
      redaction: { class: "internal" }
    };
  }

  async grep(request: LosslessContextGrepRequest): Promise<LosslessContextGrepResult> {
    this.grepRequests.push(request);
    return {
      schemaVersion: "1.0.0",
      status: "completed",
      query: request.query,
      matchCount: 1,
      matches: [{
        nodeId: "lcm-node-1",
        sessionId: this.sessionId,
        kind: "message",
        role: "assistant",
        sourceClass: "assistant-output",
        score: 1,
        preview: `context ${request.query} needle`,
        contentHash: "hash-context-node",
        coveredNodeCount: 0,
        redaction: { class: "internal" }
      }],
      diagnostics: [],
      replayFingerprint: `grep:${request.query}`,
      redaction: { class: "internal" }
    };
  }

  async describe(_request: LosslessContextDescribeRequest): Promise<LosslessContextDescribeResult> {
    return {
      schemaVersion: "1.0.0",
      status: "completed",
      node: this.node(),
      inboundEdges: [],
      outboundEdges: [],
      diagnostics: [],
      replayFingerprint: "describe:lcm-node-1",
      redaction: { class: "internal" }
    };
  }

  async expand(request: LosslessContextExpandRequest): Promise<LosslessContextExpandResult> {
    return {
      schemaVersion: "1.0.0",
      status: "completed",
      sourceNodeIds: [request.nodeId ?? request.query ?? "lcm-node-1"],
      expandedNodes: [this.node()],
      diagnostics: [],
      replayFingerprint: "expand:lcm-node-1",
      redaction: { class: "internal" }
    };
  }

  async summarize(request: LosslessContextSummarizeRequest): Promise<LosslessContextSummarizeResult> {
    return {
      schemaVersion: "1.0.0",
      status: "recorded",
      sessionId: request.sessionId,
      summaryNodeId: "lcm-summary-1",
      coveredNodeCount: 1,
      freshTailCount: 1,
      diagnostics: [],
      replayFingerprint: "summarize:lcm-summary-1",
      redaction: { class: "internal" }
    };
  }

  private node(): LosslessContextNode {
    return {
      schemaVersion: "1.0.0",
      nodeId: "lcm-node-1",
      sessionId: this.sessionId,
      kind: "message",
      role: "assistant",
      sourceClass: "assistant-output",
      content: "needle context",
      contentHash: "hash-context-node",
      createdAt: "1970-01-01T00:00:00.000Z",
      coversNodeIds: [],
      metadata: {},
      redaction: { class: "internal" }
    };
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
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
