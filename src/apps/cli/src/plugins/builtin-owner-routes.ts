import type {
  CliInteractionContribution,
  JsonObject,
  CodeIntelligenceService,
  LosslessContextManager,
  PlatformRuntime,
  PluginManifest,
  RedactedError,
  ValidationResult
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { PluginCommandContribution } from "@deepseek/plugin-api";
import { firstPartyTuiContributions, listFirstPartyDevPluginManifests } from "@deepseek/first-party-dev-plugins";
import { runContextCompactorCommand, type ContextCompactorAction, type ContextCompactorResult } from "../commands/context.js";
import { resolveDevCheck, type DevCheckAction, type DevCheckResult } from "../commands/dev-check.js";
import { resolveFileManager, type FileManagerAction, type FileManagerResult } from "../commands/file-manager.js";
import { resolveGitReview, type GitReviewAction, type GitReviewResult } from "../commands/git-review.js";
import { resolveJumpNavigator, type JumpNavigatorAction, type JumpNavigatorResult } from "../commands/jump-navigator.js";
import { resolveRepoNavigator, type RepoNavigatorAction, type RepoNavigatorResult } from "../commands/repo.js";

export type BuiltInPluginOwnerRouteStatus = "implemented" | "deferred" | "unsupported";
export type BuiltInPluginOwnerRouteFamily = "context" | "checks" | "file" | "repo" | "git" | "jump" | "unknown";
export type BuiltInPluginOwnerRouteDispatchStatus = "completed" | "failed" | "denied" | "deferred" | "skipped" | "unavailable" | "unsupported";
export type BuiltInPluginOwnerRouteResult = ContextCompactorResult | DevCheckResult | FileManagerResult | GitReviewResult | JumpNavigatorResult | RepoNavigatorResult;

export interface BuiltInPluginOwnerRouteDescriptor extends JsonObject {
  readonly schemaVersion: string;
  readonly routeId: string;
  readonly pluginId: string;
  readonly contributionId: string;
  readonly commandId: string;
  readonly ownerSubsystem: string;
  readonly status: BuiltInPluginOwnerRouteStatus;
  readonly family: BuiltInPluginOwnerRouteFamily;
  readonly action: string;
  readonly label: string;
  readonly dispatchAvailable: boolean;
  readonly aliases: readonly string[];
  readonly permissions: readonly string[];
  readonly sideEffects: readonly string[];
  readonly fallbackCommand?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: JsonObject;
}

export interface BuiltInPluginOwnerRouteSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly pluginId: string;
  readonly total: number;
  readonly implemented: number;
  readonly deferred: number;
  readonly unsupported: number;
  readonly dispatchable: number;
  readonly commandIds: readonly string[];
  readonly deferredCommandIds: readonly string[];
  readonly unsupportedCommandIds: readonly string[];
}

export interface BuiltInPluginOwnerRouteDispatchInput {
  readonly commandId: string;
  readonly platform: PlatformRuntime;
  readonly workspaceRoot: string;
  readonly args?: readonly string[];
  readonly query?: string;
  readonly target?: string;
  readonly losslessContext?: LosslessContextManager;
  readonly codeIntelligence?: CodeIntelligenceService;
}

export interface BuiltInPluginOwnerRouteDispatchResult extends JsonObject {
  readonly schemaVersion: string;
  readonly commandId: string;
  readonly status: BuiltInPluginOwnerRouteDispatchStatus;
  readonly route: BuiltInPluginOwnerRouteDescriptor;
  readonly result?: JsonObject;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: JsonObject;
}

interface RouteDefinition {
  readonly status: BuiltInPluginOwnerRouteStatus;
  readonly family: BuiltInPluginOwnerRouteFamily;
  readonly action: string;
  readonly label: string;
  readonly fallbackCommand?: string;
  readonly diagnostics?: readonly RedactedError[];
}

const routeDefinitions: Readonly<Record<string, RouteDefinition>> = {
  "context:lcm.status": route("implemented", "context", "status", "Context status", "deepseek context status"),
  "context:lcm.grep": route("implemented", "context", "grep", "Context grep", "deepseek context grep <query>"),
  "context:lcm.describe": route("implemented", "context", "describe", "Context describe", "deepseek context describe <node-id>"),
  "context:lcm.summarize": route("implemented", "context", "summarize", "Context summarize", "deepseek context summarize --session <session-id>"),
  "context:lcm.expand": route("implemented", "context", "expand", "Context expand", "deepseek context expand <node-id|query>"),
  "context:lcm.budget": route("implemented", "context", "budget", "Context budget", "deepseek context budget"),
  "context:lcm.pin": route("implemented", "context", "pin", "Context pin", "deepseek context pin <node-id|target-id>"),
  "checks.openspec.validate": route("implemented", "checks", "openspec", "OpenSpec validation", "deepseek checks openspec"),
  "checks.typecheck": route("implemented", "checks", "typecheck", "Typecheck", "deepseek checks typecheck"),
  "checks.lint": route("implemented", "checks", "lint", "Lint", "deepseek checks lint"),
  "checks.test": route("implemented", "checks", "test", "Test", "deepseek checks test"),
  "checks.boundaries": route("implemented", "checks", "boundaries", "Boundary checks", "deepseek checks boundaries"),
  "checks.build-cli": route("implemented", "checks", "build-cli", "Build CLI", "deepseek checks build-cli"),
  "file.manager.list": route("implemented", "file", "list", "File manager list", "deepseek file list <query>"),
  "file.manager.preview": route("implemented", "file", "preview", "File manager preview", "deepseek file preview <path|query>"),
  "file.manager.references": route("implemented", "file", "references", "File manager references", "deepseek file refs <query>"),
  "repo.navigator.files": route("implemented", "repo", "files", "Repo files", "deepseek repo files <query>"),
  "repo.navigator.grep": route("implemented", "repo", "grep", "Repo grep", "deepseek repo grep <query>"),
  "repo.navigator.recall": route("deferred", "repo", "recall", "Repo recall", "deepseek chat -> /palette recall <query>", [
    diagnostic("BUILTIN_PLUGIN_OWNER_ROUTE_DEFERRED", "Repo recall is recognized but deferred to the chat PageIndex recall surface.")
  ]),
  "repo.navigator.project-index": route("deferred", "repo", "project-index", "Repo project index", "deepseek index-provider status", [
    diagnostic("BUILTIN_PLUGIN_OWNER_ROUTE_DEFERRED", "Repo project-index is recognized but deferred to index-provider/code-intelligence readiness.")
  ]),
  "git.review.status": route("implemented", "git", "status", "Git status", "deepseek git status"),
  "git.review.diff": route("implemented", "git", "diff", "Git diff", "deepseek git diff"),
  "git.review.summary": route("implemented", "git", "review", "Git review", "deepseek git review"),
  "jump.navigator.file": route("implemented", "jump", "file", "Jump file", "deepseek jump file <query>"),
  "jump.navigator.text": route("implemented", "jump", "text", "Jump text", "deepseek jump text <query>"),
  "jump.navigator.symbol": route("implemented", "jump", "symbol", "Jump symbol", "deepseek jump symbol <query>")
};

export function listBuiltInPluginOwnerRoutes(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): readonly BuiltInPluginOwnerRouteDescriptor[] {
  return manifests.flatMap((manifest) => pluginCommands(manifest).map((command) => ownerRouteForCommand(manifest, command)))
    .sort((a, b) => a.commandId.localeCompare(b.commandId, "en") || a.pluginId.localeCompare(b.pluginId, "en"));
}

export function validateBuiltInPluginOwnerRoutes(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): ValidationResult {
  const errors: RedactedError[] = [];
  const commandIds = new Set<string>();
  for (const route of listBuiltInPluginOwnerRoutes(manifests)) {
    if (commandIds.has(route.commandId)) {
      errors.push(diagnostic("BUILTIN_PLUGIN_OWNER_ROUTE_DUPLICATE", `Duplicate built-in plugin command route: ${route.commandId}`));
    }
    commandIds.add(route.commandId);
    if (route.status === "unsupported") {
      errors.push(diagnostic("BUILTIN_PLUGIN_OWNER_ROUTE_MISSING", `Missing built-in plugin owner route for ${route.commandId}`));
    }
  }
  return { ok: errors.length === 0, errors };
}

export function ownerRouteReadinessByCommandId(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): ReadonlyMap<string, BuiltInPluginOwnerRouteDescriptor> {
  return new Map(listBuiltInPluginOwnerRoutes(manifests).map((route) => [route.commandId, route]));
}

export function firstPartyTuiContributionsWithOwnerRoutes(): readonly CliInteractionContribution[] {
  const routes = listBuiltInPluginOwnerRoutes();
  const routesByCommandId = new Map(routes.map((route) => [route.commandId, route]));
  const summariesByPluginId = ownerRouteSummariesByPluginId(routes);
  return firstPartyTuiContributions().map((contribution) => {
    const commandId = typeof contribution.metadata?.commandId === "string" ? contribution.metadata.commandId : undefined;
    const routeDescriptor = commandId ? routesByCommandId.get(commandId) : undefined;
    const routeSummary = contribution.pluginId ? summariesByPluginId.get(contribution.pluginId) : undefined;
    if (!routeDescriptor && !routeSummary) return contribution;
    const routeMetadata = routeDescriptor ? ownerRouteMetadata(routeDescriptor) : undefined;
    return {
      ...contribution,
      ...(routeDescriptor ? { previewText: `${contribution.previewText ?? contribution.label ?? contribution.id} [route=${routeDescriptor.status}]` } : {}),
      governance: {
        ...(contribution.governance ?? {}),
        ...(routeDescriptor ? {
          ownerRouteStatus: routeDescriptor.status,
          dispatchAvailable: routeDescriptor.dispatchAvailable,
          ownerRouteId: routeDescriptor.routeId
        } : {}),
        ...(routeSummary ? {
          ownerRouteSummary: routeSummary,
          ownerRouteImplemented: routeSummary.implemented,
          ownerRouteDeferred: routeSummary.deferred,
          ownerRouteUnsupported: routeSummary.unsupported
        } : {})
      },
      metadata: {
        ...(contribution.metadata ?? {}),
        ...(routeMetadata ? {
          ownerRoute: routeMetadata,
          ownerRouteStatus: routeDescriptor?.status,
          dispatchAvailable: routeDescriptor?.dispatchAvailable
        } : {}),
        ...(routeSummary ? { ownerRouteSummary: routeSummary } : {})
      }
    };
  });
}

export async function dispatchBuiltInPluginOwnerRoute(input: BuiltInPluginOwnerRouteDispatchInput): Promise<BuiltInPluginOwnerRouteDispatchResult> {
  const routeDescriptor = ownerRouteReadinessByCommandId().get(input.commandId) ?? unsupportedRoute(input.commandId);
  if (routeDescriptor.status === "unsupported") return dispatchResult(routeDescriptor, "unsupported", undefined, routeDescriptor.diagnostics);
  if (routeDescriptor.family === "repo") {
    const result = await resolveRepoNavigator(input.platform, input.workspaceRoot, routeDescriptor.action as RepoNavigatorAction, input.query ?? input.args?.join(" ") ?? "");
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  if (routeDescriptor.family === "file") {
    const result = await resolveFileManager(input.platform, input.workspaceRoot, routeDescriptor.action as FileManagerAction, input.target ?? input.query ?? input.args?.join(" ") ?? "");
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  if (routeDescriptor.family === "jump") {
    const result = await resolveJumpNavigator(input.platform, input.workspaceRoot, routeDescriptor.action as JumpNavigatorAction, input.query ?? input.target ?? input.args?.join(" ") ?? "", input.codeIntelligence);
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  if (routeDescriptor.family === "git") {
    const result = await resolveGitReview(input.platform, input.workspaceRoot, routeDescriptor.action as GitReviewAction, input.args ?? []);
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  if (routeDescriptor.family === "checks") {
    const result = await resolveDevCheck(input.platform, input.workspaceRoot, routeDescriptor.action as DevCheckAction, input.args ?? []);
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  if (routeDescriptor.family === "context") {
    const result = await runContextCompactorCommand(input.losslessContext, {
      action: routeDescriptor.action as ContextCompactorAction,
      ...(input.query ? { query: input.query } : {}),
      ...(input.target ? { target: input.target } : {})
    });
    return dispatchResult(routeDescriptor, result.status, result, routeDescriptor.diagnostics);
  }
  return dispatchResult(routeDescriptor, "unsupported", undefined, routeDescriptor.diagnostics);
}

function ownerRouteForCommand(manifest: PluginManifest, command: PluginCommandContribution): BuiltInPluginOwnerRouteDescriptor {
  const definition = routeDefinitions[command.commandId] ?? route("unsupported", "unknown", "unknown", "Unsupported route", undefined, [
    diagnostic("BUILTIN_PLUGIN_OWNER_ROUTE_MISSING", `No owner route is registered for ${command.commandId}.`)
  ]);
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    routeId: `builtin-plugin-owner-route:${command.commandId}`,
    pluginId: manifest.id,
    contributionId: command.id,
    commandId: command.commandId,
    ownerSubsystem: command.ownerSubsystem,
    status: definition.status,
    family: definition.family,
    action: definition.action,
    label: definition.label,
    dispatchAvailable: definition.status === "implemented",
    aliases: command.aliases,
    permissions: command.permissions,
    sideEffects: [command.sideEffect],
    ...(definition.fallbackCommand ? { fallbackCommand: definition.fallbackCommand } : {}),
    diagnostics: definition.diagnostics ?? [],
    redaction: { class: "internal", fields: ["diagnostics"] }
  };
}

function route(
  status: BuiltInPluginOwnerRouteStatus,
  family: BuiltInPluginOwnerRouteFamily,
  action: string,
  label: string,
  fallbackCommand?: string,
  diagnostics: readonly RedactedError[] = []
): RouteDefinition {
  return {
    status,
    family,
    action,
    label,
    ...(fallbackCommand ? { fallbackCommand } : {}),
    ...(diagnostics.length > 0 ? { diagnostics } : {})
  };
}

function dispatchResult(
  routeDescriptor: BuiltInPluginOwnerRouteDescriptor,
  status: BuiltInPluginOwnerRouteDispatchStatus,
  result: BuiltInPluginOwnerRouteResult | undefined,
  diagnostics: readonly RedactedError[]
): BuiltInPluginOwnerRouteDispatchResult {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    commandId: routeDescriptor.commandId,
    status,
    route: routeDescriptor,
    ...(result ? { result: toJsonObject(result) } : {}),
    diagnostics: [...diagnostics, ...(result?.diagnostics ?? [])],
    redaction: { class: "internal", fields: ["result", "route.diagnostics", "diagnostics"] }
  };
}

function unsupportedRoute(commandId: string): BuiltInPluginOwnerRouteDescriptor {
  const command: PluginCommandContribution = {
    id: commandId,
    name: commandId,
    commandId,
    description: "Unsupported built-in plugin owner route.",
    ownerSubsystem: "unknown",
    aliases: [],
    permissions: [],
    sideEffect: "none",
    group: "unknown",
    order: 0,
    inputSchema: { type: "object" },
    outputSchema: { type: "object" }
  };
  return ownerRouteForCommand({
    id: asId<"plugin">("@deepseek/plugin-unknown"),
    name: "Unknown",
    version: "0.0.0",
    source: "built-in",
    integrity: "sha256:unknown",
    permissions: [],
    contributions: {}
  } as PluginManifest, command);
}

function pluginCommands(manifest: PluginManifest): readonly PluginCommandContribution[] {
  const commands = manifest.contributions.commands;
  return Array.isArray(commands) ? commands.filter(isPluginCommandContribution) : [];
}

function isPluginCommandContribution(value: unknown): value is PluginCommandContribution {
  return isJsonObject(value) && typeof value.id === "string" && typeof value.commandId === "string" && Array.isArray(value.aliases);
}

function ownerRouteMetadata(routeDescriptor: BuiltInPluginOwnerRouteDescriptor): JsonObject {
  return {
    routeId: routeDescriptor.routeId,
    commandId: routeDescriptor.commandId,
    status: routeDescriptor.status,
    family: routeDescriptor.family,
    action: routeDescriptor.action,
    label: routeDescriptor.label,
    dispatchAvailable: routeDescriptor.dispatchAvailable,
    fallbackCommand: routeDescriptor.fallbackCommand,
    diagnosticCodes: routeDescriptor.diagnostics.map((entry) => entry.code)
  };
}

function ownerRouteSummariesByPluginId(routes: readonly BuiltInPluginOwnerRouteDescriptor[]): ReadonlyMap<string, BuiltInPluginOwnerRouteSummary> {
  const grouped = new Map<string, BuiltInPluginOwnerRouteDescriptor[]>();
  for (const routeDescriptor of routes) grouped.set(routeDescriptor.pluginId, [...(grouped.get(routeDescriptor.pluginId) ?? []), routeDescriptor]);
  return new Map([...grouped].map(([pluginId, pluginRoutes]) => {
    const sorted = [...pluginRoutes].sort((a, b) => a.commandId.localeCompare(b.commandId, "en"));
    const summary: BuiltInPluginOwnerRouteSummary = {
      schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
      pluginId,
      total: sorted.length,
      implemented: sorted.filter((entry) => entry.status === "implemented").length,
      deferred: sorted.filter((entry) => entry.status === "deferred").length,
      unsupported: sorted.filter((entry) => entry.status === "unsupported").length,
      dispatchable: sorted.filter((entry) => entry.dispatchAvailable).length,
      commandIds: sorted.map((entry) => entry.commandId),
      deferredCommandIds: sorted.filter((entry) => entry.status === "deferred").map((entry) => entry.commandId),
      unsupportedCommandIds: sorted.filter((entry) => entry.status === "unsupported").map((entry) => entry.commandId)
    };
    return [pluginId, summary];
  }));
}

function diagnostic(code: string, message: string): RedactedError {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

function toJsonObject(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
