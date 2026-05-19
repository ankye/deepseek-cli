import type { AgentLoopOutputMode, CliResultList, CliResultListItem, CliTargetRef, JsonObject, PlatformRuntime, RedactedError, SearchResult } from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { CliOptions, CliRunOptions } from "../types.js";
import { createCliAgentRuntime } from "../host/runtime.js";

export type JumpNavigatorAction = "file" | "text" | "symbol";

export interface JumpNavigatorResult extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "jump.navigator";
  readonly action: JumpNavigatorAction;
  readonly status: "completed" | "failed" | "deferred";
  readonly query: string;
  readonly summary: string;
  readonly data: JsonObject;
  readonly resultList?: CliResultList;
  readonly activeTarget?: CliTargetRef;
  readonly referenceTargets: readonly CliTargetRef[];
  readonly diagnostics: readonly RedactedError[];
  readonly suggestedActions: readonly string[];
  readonly redaction: JsonObject;
}

export async function runJumpNavigatorCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const runtime = await createCliAgentRuntime({ live: options.live, workspaceRoot: process.cwd() }, runOptions);
  try {
    const input = jumpInput(options);
    const result = await resolveJumpNavigator(runtime.deps.platform, process.cwd(), input.action, input.query);
    for (const line of renderJumpNavigatorResult(result, options.output)) await write(line);
  } finally {
    await runtime.kernel.shutdown("cli-jump-navigator-completed");
  }
}

export async function resolveJumpNavigator(platform: PlatformRuntime, workspaceRoot: string, action: JumpNavigatorAction, query: string): Promise<JumpNavigatorResult> {
  const normalized = query.trim();
  if (!normalized) {
    return jumpResult(action, "failed", "", "jump navigator requires a query", { provider: "none", itemCount: 0 }, undefined, undefined, [diagnostic("JUMP_NAVIGATOR_QUERY_REQUIRED", "Provide a file, text, or symbol query.")], ["Run /jump file <query> or /jump text <query>."]);
  }
  if (action === "file") {
    const files = [...await platform.findFiles(normalized, workspaceRoot)].sort(compareString).slice(0, 50);
    const resultList = fileJumpResultList(files);
    return jumpResult(action, "completed", normalized, `files=${files.length}`, { provider: "platform.findFiles", itemCount: files.length, workspaceBoundary: "workspace-root" }, resultList, activeTarget(resultList));
  }
  if (action === "text") {
    const matches = [...await platform.searchText(normalized, workspaceRoot)].sort(compareSearchResult).slice(0, 50);
    const resultList = textJumpResultList(matches);
    return jumpResult(action, "completed", normalized, `matches=${matches.length}`, { provider: "platform.searchText", itemCount: matches.length, workspaceBoundary: "workspace-root" }, resultList, activeTarget(resultList));
  }
  const resultList = deferredSymbolResultList(normalized);
  return jumpResult(action, "deferred", normalized, "symbol jump is deferred to code-intelligence owner routes", { provider: "code-intelligence", deferred: true, workspaceBoundary: "workspace-root" }, resultList, activeTarget(resultList), [diagnostic("JUMP_NAVIGATOR_SYMBOL_DEFERRED", "Symbol jump is recognized but deferred until code-intelligence execution is wired.")], ["Use /repo grep <symbol> or enable code intelligence index routes."]);
}

function jumpInput(options: CliOptions): { readonly action: JumpNavigatorAction; readonly query: string } {
  const action = options.jumpAction ?? "file";
  const query = typeof options.jumpInput?.query === "string" ? options.jumpInput.query : "";
  return { action, query };
}

export function renderJumpNavigatorResult(result: JumpNavigatorResult, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(result)];
  if (output === "jsonl") {
    return [
      JSON.stringify({ kind: "jump.navigator.summary", result: summaryRecord(result) }),
      ...(result.resultList ? result.resultList.items.map((item) => JSON.stringify({ kind: "jump.navigator.item", item })) : []),
      ...result.diagnostics.map((entry) => JSON.stringify({ kind: "jump.navigator.diagnostic", diagnostic: entry }))
    ];
  }
  const lines = [`jump ${result.action}: ${result.status} - ${result.summary}`];
  for (const item of result.resultList?.items.slice(0, 20) ?? []) lines.push(`  ${item.order + 1} ${item.label}`);
  for (const entry of result.diagnostics) lines.push(`  diagnostic ${entry.code}: ${entry.message}`);
  for (const action of result.suggestedActions) lines.push(`  next: ${action}`);
  return lines;
}

function jumpResult(
  action: JumpNavigatorAction,
  status: JumpNavigatorResult["status"],
  query: string,
  summary: string,
  data: JsonObject,
  resultList?: CliResultList,
  active?: CliTargetRef,
  diagnostics: readonly RedactedError[] = [],
  suggestedActions: readonly string[] = []
): JumpNavigatorResult {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    kind: "jump.navigator",
    action,
    status,
    query,
    summary,
    data,
    ...(resultList ? { resultList } : {}),
    ...(active ? { activeTarget: active } : {}),
    referenceTargets: resultList?.items.map((item) => item.target) ?? [],
    diagnostics,
    suggestedActions,
    redaction: { class: "internal", fields: ["query", "data", "resultList.items.metadata", "referenceTargets.metadata"] }
  };
}

function fileJumpResultList(files: readonly string[]): CliResultList {
  const items = files.map((path, order): CliResultListItem => ({
    id: `jump-file:${stableId(path)}`,
    target: { kind: "file", id: `file:${stableId(path)}`, label: normalizePath(path), path: normalizePath(path), metadata: { source: "jump.navigator.file" } },
    label: normalizePath(path),
    order,
    metadata: { source: "jump.navigator.file" }
  }));
  return { id: "result-list:jump.file", kind: "search", sourceCommand: "jump.file", label: "Jump files", items, ...(items[0] ? { activeItemId: items[0].id } : {}) };
}

function textJumpResultList(matches: readonly SearchResult[]): CliResultList {
  const items = matches.map((match, order): CliResultListItem => {
    const label = `${normalizePath(match.path)}:${match.line}: ${preview(match.text)}`;
    return {
      id: `jump-text:${stableId(label)}`,
      target: { kind: "file", id: `file:${stableId(match.path)}`, label, path: normalizePath(match.path), metadata: { line: match.line, preview: preview(match.text), engine: match.engine, source: "jump.navigator.text" } },
      label,
      order,
      metadata: { source: "jump.navigator.text", line: match.line, engine: match.engine }
    };
  });
  return { id: "result-list:jump.text", kind: "search", sourceCommand: "jump.text", label: "Jump text", items, ...(items[0] ? { activeItemId: items[0].id } : {}) };
}

function deferredSymbolResultList(query: string): CliResultList {
  const item: CliResultListItem = {
    id: "jump-symbol:deferred",
    target: {
      kind: "diagnostic",
      id: "jump:symbol:deferred",
      label: "symbol jump deferred",
      metadata: { source: "jump.navigator.symbol", query, deferred: true }
    },
    label: `symbol jump deferred for ${preview(query)}`,
    order: 0,
    severity: "warning",
    metadata: { source: "jump.navigator.symbol", query, deferred: true }
  };
  return { id: "result-list:jump.symbol", kind: "code-intelligence", sourceCommand: "jump.symbol", label: "Jump symbol", items: [item], activeItemId: item.id };
}

function activeTarget(resultList: CliResultList | undefined): CliTargetRef | undefined {
  const item = resultList?.items.find((candidate) => candidate.id === resultList.activeItemId) ?? resultList?.items[0];
  return item?.target;
}

function summaryRecord(result: JumpNavigatorResult): JsonObject {
  return {
    schemaVersion: result.schemaVersion,
    action: result.action,
    status: result.status,
    query: result.query,
    summary: result.summary,
    data: result.data,
    itemCount: result.resultList?.items.length ?? 0,
    suggestedActions: result.suggestedActions,
    redaction: result.redaction
  };
}

function diagnostic(code: string, message: string): RedactedError {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

function compareSearchResult(a: SearchResult, b: SearchResult): number {
  return compareString(a.path, b.path) || a.line - b.line || a.text.localeCompare(b.text, "en");
}

function compareString(a: string, b: string): number {
  return a.localeCompare(b, "en");
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function preview(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
