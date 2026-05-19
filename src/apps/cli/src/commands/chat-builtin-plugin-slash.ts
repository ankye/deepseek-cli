import type { CliResultList, JsonObject } from "@deepseek/platform-contracts";
import type { CliOptions } from "../types.js";
import {
  dispatchBuiltInPluginOwnerRoute,
  listBuiltInPluginOwnerRoutes,
  type BuiltInPluginOwnerRouteDescriptor,
  type BuiltInPluginOwnerRouteDispatchResult,
  type BuiltInPluginOwnerRouteFamily
} from "../plugins/builtin-owner-routes.js";
import type { ChatSessionState } from "./chat-state.js";
import { writeChatLocalLines, writeLocalFailure } from "./chat-local-output.js";
import { renderContextCompactorResult } from "./context.js";
import type { ContextCompactorResult } from "./context.js";
import { renderDevCheckResult } from "./dev-check.js";
import type { DevCheckResult } from "./dev-check.js";
import { renderFileManagerResult } from "./file-manager.js";
import type { FileManagerResult } from "./file-manager.js";
import { renderGitReviewResult } from "./git-review.js";
import type { GitReviewResult } from "./git-review.js";
import { renderJumpNavigatorResult } from "./jump-navigator.js";
import type { JumpNavigatorResult } from "./jump-navigator.js";
import { attachChatPaletteResultList } from "./palette-result-list.js";
import { ensureChatPaletteState } from "./palette-state.js";
import { renderRepoNavigatorResult } from "./repo.js";
import type { RepoNavigatorResult } from "./repo.js";

export interface InjectedChatPluginSlashCommand {
  readonly alias: string;
  readonly route: BuiltInPluginOwnerRouteDescriptor;
  readonly args: readonly string[];
  readonly rawRest: string;
}

export function resolveInjectedChatPluginSlashCommand(
  raw: string,
  routes: readonly BuiltInPluginOwnerRouteDescriptor[] = listBuiltInPluginOwnerRoutes()
): InjectedChatPluginSlashCommand | undefined {
  const rawTokens = raw.split(/\s+/).filter(Boolean);
  const candidates = routes
    .flatMap((route) => route.aliases
      .filter((alias) => alias.startsWith("/"))
      .map((alias) => ({ alias, route, tokens: slashAliasTokens(alias) })))
    .filter((candidate) => candidate.tokens.length > 0 && candidate.tokens.length <= rawTokens.length)
    .filter((candidate) => candidate.tokens.every((token, index) => rawTokens[index] === token))
    .sort((a, b) => b.tokens.length - a.tokens.length || a.alias.localeCompare(b.alias, "en"));
  const selected = candidates[0];
  if (!selected) return undefined;
  const args = rawTokens.slice(selected.tokens.length);
  return {
    alias: selected.alias,
    route: selected.route,
    args,
    rawRest: args.join(" ")
  };
}

export async function handleInjectedChatPluginSlashCommand(
  command: InjectedChatPluginSlashCommand,
  options: CliOptions,
  state: ChatSessionState,
  write: (line: string) => Promise<void>
): Promise<void> {
  if (!state.workspaceDeps) {
    await writeLocalFailure("plugin", "CLI_PLUGIN_COMMAND_PLATFORM_UNAVAILABLE", options, write);
    return;
  }
  const dispatch = await dispatchBuiltInPluginOwnerRoute({
    commandId: command.route.commandId,
    platform: state.workspaceDeps.platform,
    workspaceRoot: state.workspaceRoot,
    ...(state.workspaceDeps.losslessContext ? { losslessContext: state.workspaceDeps.losslessContext } : {}),
    ...dispatchInputFor(command)
  });
  const result = jsonObject(dispatch.result);
  const resultList = cliResultList(result?.resultList);
  if (resultList) {
    state.palette = attachChatPaletteResultList(ensureChatPaletteState(state.palette), resultList);
  }
  await writeChatLocalLines(`chat.command.${command.route.family}`, renderPluginRouteDispatch(dispatch, options.output), options, write);
}

function dispatchInputFor(command: InjectedChatPluginSlashCommand): {
  readonly args?: readonly string[];
  readonly query?: string;
  readonly target?: string;
} {
  if (command.route.family === "git" || command.route.family === "checks") {
    return command.args.length > 0 ? { args: command.args } : {};
  }
  if (command.route.family === "context") {
    if (command.route.action === "grep") return command.rawRest ? { query: command.rawRest } : {};
    if (command.route.action === "describe" || command.route.action === "expand" || command.route.action === "pin") return command.rawRest ? { target: command.rawRest } : {};
    return {};
  }
  if (command.route.family === "file" && command.route.action === "preview") return command.rawRest ? { target: command.rawRest } : {};
  return command.rawRest ? { query: command.rawRest } : {};
}

function renderPluginRouteDispatch(dispatch: BuiltInPluginOwnerRouteDispatchResult, output: CliOptions["output"]): readonly string[] {
  const result = jsonObject(dispatch.result);
  if (result) {
    const rendered = renderKnownPluginResult(dispatch.route.family, result, output);
    if (rendered) return rendered;
  }
  if (output === "json") return [JSON.stringify(dispatch)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "plugin.route.summary",
        commandId: dispatch.commandId,
        status: dispatch.status,
        route: dispatch.route,
        diagnosticCount: dispatch.diagnostics.length,
        redaction: dispatch.redaction
      }),
      ...dispatch.diagnostics.map((diagnostic) => JSON.stringify({ kind: "plugin.route.diagnostic", diagnostic }))
    ];
  }
  return [
    `plugin ${dispatch.route.family} ${dispatch.route.action}: ${dispatch.status} - ${dispatch.route.label}`,
    ...dispatch.diagnostics.map((diagnostic) => `  diagnostic ${diagnostic.code}: ${diagnostic.message}`),
    ...(dispatch.route.fallbackCommand ? [`  next: ${dispatch.route.fallbackCommand}`] : [])
  ];
}

function renderKnownPluginResult(
  family: BuiltInPluginOwnerRouteFamily,
  result: JsonObject,
  output: CliOptions["output"]
): readonly string[] | undefined {
  if (family === "context") return renderContextCompactorResult(result as unknown as ContextCompactorResult, output);
  if (family === "checks") return renderDevCheckResult(result as unknown as DevCheckResult, output);
  if (family === "file") return renderFileManagerResult(result as unknown as FileManagerResult, output);
  if (family === "git") return renderGitReviewResult(result as unknown as GitReviewResult, output);
  if (family === "jump") return renderJumpNavigatorResult(result as unknown as JumpNavigatorResult, output);
  if (family === "repo") return renderRepoNavigatorResult(result as unknown as RepoNavigatorResult, output);
  return undefined;
}

function slashAliasTokens(alias: string): readonly string[] {
  return alias.replace(/^\//, "").split(/\s+/).filter(Boolean);
}

function cliResultList(value: unknown): CliResultList | undefined {
  const object = jsonObject(value);
  if (!object || typeof object.id !== "string" || typeof object.label !== "string" || !Array.isArray(object.items)) return undefined;
  return object as unknown as CliResultList;
}

function jsonObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined;
}
