import type {
  CliResultList,
  CliTargetRef,
  JsonObject,
  LosslessContextManager,
  PlatformRuntime,
  RedactedError
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import {
  dispatchBuiltInPluginOwnerRoute,
  type BuiltInPluginOwnerRouteDispatchResult,
  type BuiltInPluginOwnerRouteDispatchStatus,
  type BuiltInPluginOwnerRouteStatus
} from "./builtin-owner-routes.js";

export type PluginWorkbenchExecutionSource = "tui" | "palette" | "cli" | "test";
export type PluginWorkbenchExecutionDurationBucket = "instant" | "short" | "long" | "not-measured";

export interface PluginWorkbenchExecutionInput {
  readonly commandId: string;
  readonly source: PluginWorkbenchExecutionSource;
  readonly platform: PlatformRuntime;
  readonly workspaceRoot: string;
  readonly query?: string;
  readonly target?: string;
  readonly args?: readonly string[];
  readonly losslessContext?: LosslessContextManager;
  readonly executionId?: string;
  readonly createdAt?: string;
  readonly durationMs?: number;
}

export interface PluginWorkbenchExecutionRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "plugin.workbench.execution";
  readonly recordId: string;
  readonly source: PluginWorkbenchExecutionSource;
  readonly createdAt: string;
  readonly commandId: string;
  readonly routeId: string;
  readonly pluginId: string;
  readonly contributionId: string;
  readonly ownerSubsystem: string;
  readonly routeStatus: BuiltInPluginOwnerRouteStatus;
  readonly dispatchStatus: BuiltInPluginOwnerRouteDispatchStatus;
  readonly dispatchAvailable: boolean;
  readonly dryRun: false;
  readonly inputPreview: JsonObject;
  readonly resultKind?: string;
  readonly resultSummary: string;
  readonly resultList?: CliResultList;
  readonly activeTarget?: CliTargetRef;
  readonly referenceTargets: readonly CliTargetRef[];
  readonly diagnosticCodes: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly suggestedActions: readonly string[];
  readonly fallbackCommand?: string;
  readonly durationBucket: PluginWorkbenchExecutionDurationBucket;
  readonly route: JsonObject;
  readonly replayFingerprint: string;
  readonly redaction: JsonObject;
}

export async function executeBuiltInPluginWorkbenchRoute(input: PluginWorkbenchExecutionInput): Promise<PluginWorkbenchExecutionRecord> {
  const normalizedArgs = normalizeArgs(input.args);
  const startedAt = Date.now();
  const dispatch = await dispatchBuiltInPluginOwnerRoute({
    commandId: input.commandId,
    platform: input.platform,
    workspaceRoot: input.workspaceRoot,
    ...(normalizedArgs.length > 0 ? { args: normalizedArgs } : {}),
    ...(input.query ? { query: input.query } : {}),
    ...(input.target ? { target: input.target } : {}),
    ...(input.losslessContext ? { losslessContext: input.losslessContext } : {})
  });
  return executionRecord(input, dispatch, durationMs(input.durationMs, startedAt));
}

function executionRecord(
  input: PluginWorkbenchExecutionInput,
  dispatch: BuiltInPluginOwnerRouteDispatchResult,
  measuredDurationMs: number | undefined
): PluginWorkbenchExecutionRecord {
  const result = jsonObject(dispatch.result);
  const resultList = cliResultList(result?.resultList);
  const activeTarget = resultList ? activeResultListTarget(resultList) : diagnosticTarget(dispatch);
  const referenceTargets = cliTargetRefs(result?.referenceTargets);
  const suggestedActions = stringArray(result?.suggestedActions);
  const inputPreview = {
    query: preview(input.query ?? ""),
    target: preview(input.target ?? ""),
    args: normalizeArgs(input.args),
    workspaceRoot: preview(input.workspaceRoot),
    redaction: { class: "internal", fields: ["query", "target", "workspaceRoot"] }
  };
  const recordId = input.executionId ?? `plugin-workbench-execution:${dispatch.commandId}:${stableId(JSON.stringify({
    source: input.source,
    inputPreview,
    status: dispatch.status
  }))}`;
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    kind: "plugin.workbench.execution",
    recordId,
    source: input.source,
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    commandId: dispatch.commandId,
    routeId: dispatch.route.routeId,
    pluginId: dispatch.route.pluginId,
    contributionId: dispatch.route.contributionId,
    ownerSubsystem: dispatch.route.ownerSubsystem,
    routeStatus: dispatch.route.status,
    dispatchStatus: dispatch.status,
    dispatchAvailable: dispatch.route.dispatchAvailable,
    dryRun: false,
    inputPreview,
    ...(typeof result?.kind === "string" ? { resultKind: result.kind } : {}),
    resultSummary: resultSummary(result, dispatch),
    ...(resultList ? { resultList } : {}),
    ...(activeTarget ? { activeTarget } : {}),
    referenceTargets,
    diagnosticCodes: dispatch.diagnostics.map((entry) => entry.code),
    diagnostics: dispatch.diagnostics,
    suggestedActions: [...new Set([...suggestedActions, ...(dispatch.route.fallbackCommand ? [dispatch.route.fallbackCommand] : [])])],
    ...(dispatch.route.fallbackCommand ? { fallbackCommand: dispatch.route.fallbackCommand } : {}),
    durationBucket: durationBucket(measuredDurationMs),
    route: routeSummary(dispatch),
    replayFingerprint: `${dispatch.route.routeId}:${dispatch.status}:${stableId(JSON.stringify(inputPreview))}`,
    redaction: {
      class: "internal",
      fields: ["inputPreview", "diagnostics", "route", "resultList.items.metadata", "referenceTargets.metadata"]
    }
  };
}

function routeSummary(dispatch: BuiltInPluginOwnerRouteDispatchResult): JsonObject {
  return {
    routeId: dispatch.route.routeId,
    pluginId: dispatch.route.pluginId,
    contributionId: dispatch.route.contributionId,
    commandId: dispatch.route.commandId,
    status: dispatch.route.status,
    family: dispatch.route.family,
    action: dispatch.route.action,
    label: dispatch.route.label,
    dispatchAvailable: dispatch.route.dispatchAvailable,
    fallbackCommand: dispatch.route.fallbackCommand
  };
}

function resultSummary(result: JsonObject | undefined, dispatch: BuiltInPluginOwnerRouteDispatchResult): string {
  if (typeof result?.summary === "string") return preview(result.summary, 240);
  if (dispatch.status === "unsupported") return `unsupported route ${dispatch.commandId}`;
  if (dispatch.status === "deferred") return `deferred route ${dispatch.commandId}`;
  return `${dispatch.commandId} ${dispatch.status}`;
}

function durationMs(explicit: number | undefined, startedAt: number): number | undefined {
  if (explicit !== undefined) return Math.max(0, Math.floor(explicit));
  if (typeof performance === "undefined") return undefined;
  const elapsed = Date.now() - startedAt;
  return Number.isFinite(elapsed) ? Math.max(0, elapsed) : undefined;
}

function durationBucket(duration: number | undefined): PluginWorkbenchExecutionDurationBucket {
  if (duration === undefined) return "not-measured";
  if (duration < 50) return "instant";
  if (duration < 1_000) return "short";
  return "long";
}

function diagnosticTarget(dispatch: BuiltInPluginOwnerRouteDispatchResult): CliTargetRef | undefined {
  const diagnostic = dispatch.diagnostics[0];
  if (!diagnostic) return undefined;
  return {
    kind: "diagnostic",
    id: `plugin-execution-diagnostic:${dispatch.commandId}:${diagnostic.code}`,
    label: `${diagnostic.code}: ${diagnostic.message}`,
    metadata: {
      source: "plugin.workbench.execution",
      commandId: dispatch.commandId,
      status: dispatch.status,
      routeStatus: dispatch.route.status
    }
  };
}

function activeResultListTarget(resultList: CliResultList): CliTargetRef | undefined {
  const item = resultList.items.find((candidate) => candidate.id === resultList.activeItemId) ?? resultList.items[0];
  return item?.target;
}

function cliResultList(value: unknown): CliResultList | undefined {
  const object = jsonObject(value);
  if (!object || typeof object.id !== "string" || typeof object.label !== "string" || !Array.isArray(object.items)) return undefined;
  return object as unknown as CliResultList;
}

function cliTargetRefs(value: unknown): readonly CliTargetRef[] {
  return Array.isArray(value)
    ? value.filter((item): item is CliTargetRef => typeof item === "object" && item !== null && !Array.isArray(item) && typeof (item as { kind?: unknown }).kind === "string" && typeof (item as { id?: unknown }).id === "string")
    : [];
}

function jsonObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeArgs(args: readonly string[] | undefined): readonly string[] {
  return (args ?? []).map((arg) => preview(arg, 120)).slice(0, 16);
}

function preview(value: string, limit = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3))}...` : normalized;
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
