import type {
  AgentLoopOutputMode,
  JsonObject,
  RedactedError,
  RuntimeDependencies,
  WorkspaceRequestRevertResult,
  WorkspaceRevertRequestTarget
} from "@deepseek/platform-contracts";
import type { CliOptions, CliRunOptions } from "../types.js";
import { resolveSessionDependencies } from "../host/runtime.js";

export interface CliRevertPreviewRecord extends JsonObject {
  readonly kind: "revert.preview";
  readonly ok: boolean;
  readonly dryRun: true;
  readonly status: WorkspaceRequestRevertResult["status"] | "invalid";
  readonly target: WorkspaceRevertRequestTarget;
  readonly result?: WorkspaceRequestRevertResult;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: JsonObject;
}

export interface CliRevertApplyRecord extends JsonObject {
  readonly kind: "revert.apply";
  readonly ok: boolean;
  readonly dryRun: false;
  readonly status: WorkspaceRequestRevertResult["status"] | "invalid";
  readonly target: WorkspaceRevertRequestTarget;
  readonly result?: WorkspaceRequestRevertResult;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: JsonObject;
}

export async function runRevertCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const deps = await resolveSessionDependencies(runOptions);
  if (options.revertAction === "apply") {
    await writeLines(write, renderRevertApply(await applyRevert(deps, options.revertTarget ?? {}, options.revertReason), options.output));
    return;
  }
  await writeLines(write, renderRevertPreview(await previewRevert(deps, options.revertTarget ?? {}, options.revertReason), options.output));
}

export async function previewRevert(
  deps: Pick<RuntimeDependencies, "workspaceState">,
  target: WorkspaceRevertRequestTarget,
  reason = "cli revert preview"
): Promise<CliRevertPreviewRecord> {
  if (!hasRevertTarget(target)) {
    return {
      kind: "revert.preview",
      ok: false,
      dryRun: true,
      status: "invalid",
      target,
      diagnostics: [diagnostic("CLI_REVERT_TARGET_REQUIRED", "revert preview requires --request, --turn, --session, or --path.")],
      redaction: { class: "internal" }
    };
  }
  const result = await deps.workspaceState.revertRequest({ target, dryRun: true, reason });
  return {
    kind: "revert.preview",
    ok: result.ok,
    dryRun: true,
    status: result.value?.status ?? "failed",
    target,
    ...(result.value ? { result: result.value } : {}),
    diagnostics: result.value?.diagnostics ?? (result.error ? [result.error as RedactedError] : []),
    redaction: { class: "internal", fields: ["result.checkpoints.path", "result.affectedPaths"] }
  };
}

export async function applyRevert(
  deps: Pick<RuntimeDependencies, "workspaceState">,
  target: WorkspaceRevertRequestTarget,
  reason = "cli revert apply"
): Promise<CliRevertApplyRecord> {
  if (!hasRevertTarget(target)) {
    return {
      kind: "revert.apply",
      ok: false,
      dryRun: false,
      status: "invalid",
      target,
      diagnostics: [diagnostic("CLI_REVERT_TARGET_REQUIRED", "revert apply requires --request, --turn, --session, or --path.")],
      redaction: { class: "internal" }
    };
  }
  const result = await deps.workspaceState.revertRequest({ target, dryRun: false, reason });
  return {
    kind: "revert.apply",
    ok: result.ok,
    dryRun: false,
    status: result.value?.status ?? "failed",
    target,
    ...(result.value ? { result: result.value } : {}),
    diagnostics: result.value?.diagnostics ?? (result.error ? [result.error as RedactedError] : []),
    redaction: { class: "internal", fields: ["result.checkpoints.path", "result.affectedPaths", "result.restoredPaths", "result.stalePaths", "result.nonRestorablePaths"] }
  };
}

export function parseRevertPreviewArgs(raw: string): { readonly target: WorkspaceRevertRequestTarget; readonly reason?: string } {
  const args = raw.split(/\s+/).filter(Boolean);
  const target: Record<string, unknown> = {};
  const requestId = readFlag(args, "--request");
  const turnId = readFlag(args, "--turn");
  const sessionId = readFlag(args, "--session");
  const path = readFlag(args, "--path");
  const reason = readFlag(args, "--reason");
  if (requestId) target.requestId = requestId;
  if (turnId) target.turnId = turnId;
  if (sessionId) target.sessionId = sessionId;
  if (path) target.path = path;
  return {
    target: target as WorkspaceRevertRequestTarget,
    ...(reason ? { reason } : {})
  };
}

export const parseRevertApplyArgs = parseRevertPreviewArgs;

export function renderRevertPreview(record: CliRevertPreviewRecord, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(record)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "revert.preview.summary",
        ok: record.ok,
        dryRun: record.dryRun,
        status: record.status,
        target: record.target,
        affectedCheckpointCount: record.result?.affectedCheckpointIds.length ?? 0,
        affectedPathCount: record.result?.affectedPaths.length ?? 0,
        diagnosticCount: record.diagnostics.length
      }),
      ...record.diagnostics.map((entry) => JSON.stringify({ kind: "revert.preview.diagnostic", diagnostic: entry }))
    ];
  }
  const target = Object.entries(record.target).map(([key, value]) => `${key}=${String(value)}`).join(" ") || "none";
  const lines = [
    `revert preview: ${record.ok ? "ok" : "failed"} status=${record.status} dryRun=true target=${target}`,
    `  affected_checkpoints=${record.result?.affectedCheckpointIds.length ?? 0} affected_paths=${record.result?.affectedPaths.length ?? 0}`
  ];
  return record.diagnostics.length > 0
    ? [...lines, ...record.diagnostics.map((entry) => `  diagnostic ${entry.code}: ${entry.message}`)]
    : lines;
}

export function renderRevertApply(record: CliRevertApplyRecord, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(record)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "revert.apply.summary",
        ok: record.ok,
        dryRun: record.dryRun,
        status: record.status,
        target: record.target,
        affectedCheckpointCount: record.result?.affectedCheckpointIds.length ?? 0,
        affectedPathCount: record.result?.affectedPaths.length ?? 0,
        restoredPathCount: record.result?.restoredPaths.length ?? 0,
        stalePathCount: record.result?.stalePaths.length ?? 0,
        nonRestorablePathCount: record.result?.nonRestorablePaths.length ?? 0,
        diagnosticCount: record.diagnostics.length
      }),
      ...record.diagnostics.map((entry) => JSON.stringify({ kind: "revert.apply.diagnostic", diagnostic: entry }))
    ];
  }
  const target = renderTarget(record.target);
  const lines = [
    `revert apply: ${record.ok ? "ok" : "failed"} status=${record.status} dryRun=false target=${target}`,
    `  affected_checkpoints=${record.result?.affectedCheckpointIds.length ?? 0} affected_paths=${record.result?.affectedPaths.length ?? 0} restored_paths=${record.result?.restoredPaths.length ?? 0} stale_paths=${record.result?.stalePaths.length ?? 0} non_restorable_paths=${record.result?.nonRestorablePaths.length ?? 0}`
  ];
  return record.diagnostics.length > 0
    ? [...lines, ...record.diagnostics.map((entry) => `  diagnostic ${entry.code}: ${entry.message}`)]
    : lines;
}

function hasRevertTarget(target: WorkspaceRevertRequestTarget): boolean {
  return Boolean(target.requestId || target.turnId || target.sessionId || target.path);
}

function renderTarget(target: WorkspaceRevertRequestTarget): string {
  return Object.entries(target).map(([key, value]) => `${key}=${String(value)}`).join(" ") || "none";
}

function readFlag(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "public" }
  };
}

async function writeLines(write: (line: string) => Promise<void>, lines: readonly string[]): Promise<void> {
  for (const line of lines) await write(line);
}
