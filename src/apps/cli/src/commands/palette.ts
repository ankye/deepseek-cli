import type {
  AgentLoopOutputMode,
  CliActionKind,
  CliActionResolutionResult,
  CliCompositionSnapshot,
  CliKeymapProfile,
  CliPaletteDiagnostic,
  CliPaletteProjectionEntry,
  CliPaletteProjectionResult,
  CliTargetRef,
  CommandCompositionRecord
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import {
  contributionToCompositionRecord,
  coreKeymapProfile,
  interactiveControlCompositionRecords,
  modeControlCompositionRecords,
  projectCommandPalette,
  readinessCompositionRecords,
  resolveCliAction,
  viMinimalKeymapProfile,
  viProfessionalKeymapProfile
} from "@deepseek/command-system";
import { firstPartyPluginCommandContributions } from "@deepseek/first-party-dev-plugins";
import type { CliOptions } from "../types.js";

const supportedActions = new Set<CliActionKind>([
  "open",
  "inspect",
  "copy",
  "explain",
  "next",
  "previous",
  "first",
  "last",
  "back",
  "forward",
  "add-to-reference-set",
  "revert",
  "scroll",
  "focus-panel",
  "preview",
  "plugin-action",
  "cancel",
  "search"
]);

export async function runPaletteCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  const action = options.paletteAction ?? "list";
  if (action === "keymap") {
    await writeLines(write, renderPaletteKeymapProfile(paletteKeymapProfile(options), options.output));
    return;
  }
  const projection = createCliPaletteProjection();
  if (action === "action") {
    await writeLines(write, renderPaletteActionResult(resolvePaletteAction(options, projection), options.output));
    return;
  }
  await writeLines(write, renderPaletteProjection(projection, options.output));
}

export function createCliPaletteProjection(records: readonly CommandCompositionRecord[] = defaultPaletteRecords()): CliPaletteProjectionResult {
  return projectCommandPalette(records);
}

function defaultPaletteRecords(): readonly CommandCompositionRecord[] {
  return [
    ...firstPartyPluginCommandContributions().map(contributionToCompositionRecord),
    ...readinessCompositionRecords(),
    ...interactiveControlCompositionRecords(),
    ...modeControlCompositionRecords()
  ];
}

export function paletteKeymapProfile(options: Pick<CliOptions, "paletteKeymapProfile">): CliKeymapProfile {
  if (options.paletteKeymapProfile === "core") return coreKeymapProfile();
  if (options.paletteKeymapProfile === "vi-professional") return viProfessionalKeymapProfile();
  return viMinimalKeymapProfile();
}

export function resolvePaletteAction(options: Pick<CliOptions, "paletteActionName" | "paletteTargetId">, projection: CliPaletteProjectionResult): CliActionResolutionResult {
  const action = toActionKind(options.paletteActionName);
  const snapshot = createPaletteCompositionSnapshot(projection);
  const target = action ? findTarget(projection, options.paletteTargetId, action) : undefined;
  if (!action) {
    return actionFailure("CLI_ACTION_UNSUPPORTED", `Unsupported action: ${options.paletteActionName ?? ""}`, options.paletteActionName ?? "", snapshot);
  }
  if (!target) {
    return actionFailure("CLI_ACTION_TARGET_NOT_FOUND", "Palette action target was not found.", options.paletteTargetId ?? "", snapshot, action);
  }
  return resolveCliAction({
    action,
    mode: actionMode(action),
    target,
    dryRun: true
  }, snapshot);
}

function toActionKind(value: string | undefined): CliActionKind | undefined {
  return value && supportedActions.has(value as CliActionKind) ? value as CliActionKind : undefined;
}

function actionMode(action: CliActionKind): "normal" | "result-list" {
  return action === "next" || action === "previous" || action === "first" || action === "last" || action === "back" || action === "forward" ? "result-list" : "normal";
}

function findTarget(projection: CliPaletteProjectionResult, targetId: string | undefined, action: CliActionKind): CliTargetRef | undefined {
  if (!targetId && (action === "back" || action === "forward")) {
    return { kind: "result-list", id: projection.resultList.id, label: projection.resultList.label };
  }
  if (!targetId) return undefined;
  if (targetId === projection.resultList.id) {
    return { kind: "result-list", id: projection.resultList.id, label: projection.resultList.label };
  }
  const item = projection.resultList.items.find((candidate) => candidate.id === targetId || candidate.target.id === targetId);
  if (item) {
    if (action === "add-to-reference-set") return { kind: "result-list-item", id: item.id, label: item.label };
    if (action === "next" || action === "previous" || action === "first" || action === "last") return { kind: "result-list-item", id: item.id, label: item.label };
    return item.target;
  }
  const entry = projection.entries.find((candidate) => candidate.entry.id === targetId);
  return entry?.target;
}

export function createPaletteCompositionSnapshot(projection: CliPaletteProjectionResult): CliCompositionSnapshot {
  const activeTarget = projection.resultList.items[0]?.target;
  return {
    mode: "normal",
    ...(activeTarget ? { activeTarget } : {}),
    referenceSets: [],
    resultLists: [projection.resultList],
    jumpHistory: { entries: [], cursor: -1 },
    contributions: projection.entries.map(entryContribution)
  };
}

function entryContribution(entry: CliPaletteProjectionEntry): CliCompositionSnapshot["contributions"][number] {
  return {
    id: `palette-contribution:${entry.entry.id}`,
    kind: "palette-entry",
    source: "core",
    action: entry.entry.action,
    paletteEntry: entry.entry,
    ...(entry.entry.targetKind ? { targetKind: entry.entry.targetKind } : {}),
    metadata: {
      target: entry.target,
      aliases: [...entry.aliases],
      source: entry.source,
      referencePitFixtureIds: [...entry.referencePitFixtureIds]
    }
  };
}

function actionFailure(
  code: CliPaletteDiagnostic["code"],
  message: string,
  targetId: string,
  snapshot: CliCompositionSnapshot,
  action: CliActionKind = "inspect"
): CliActionResolutionResult {
  const target: CliTargetRef = { kind: "command", id: targetId || "unknown", label: targetId || "unknown" };
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    ok: false,
    action,
    mode: "normal",
    target,
    snapshot,
    diagnostics: [{
      code,
      message,
      retryable: false,
      severity: "error",
      targetIds: targetId ? [targetId] : [],
      redaction: { class: "public" },
      details: { targetIds: targetId ? [targetId] : [] }
    }],
    redaction: { class: "internal" }
  };
}

export function renderPaletteProjection(projection: CliPaletteProjectionResult, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(projection)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "palette.summary",
        schemaVersion: projection.schemaVersion,
        entryCount: projection.entries.length,
        diagnosticCount: projection.diagnostics.length,
        resultListId: projection.resultList.id
      }),
      ...projection.entries.map((entry) => JSON.stringify({ kind: "palette.entry", entry })),
      ...projection.diagnostics.map((diagnostic) => JSON.stringify({ kind: "palette.diagnostic", diagnostic }))
    ];
  }
  return [
    `palette: ${projection.entries.length} entries (${projection.diagnostics.length} diagnostics)`,
    ...projection.entries.map((entry) => `  ${entry.entry.id} ${entry.entry.title} -> ${entry.target.id} [${entry.entry.category ?? "uncategorized"}]`)
  ];
}

export function renderPaletteKeymapProfile(profile: CliKeymapProfile, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(profile)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "palette.keymap.summary",
        schemaVersion: profile.schemaVersion,
        name: profile.name,
        contributionCount: profile.contributions.length,
        diagnosticCount: profile.diagnostics.length
      }),
      ...profile.contributions.map((contribution) => JSON.stringify({ kind: "palette.keymap.contribution", contribution })),
      ...profile.diagnostics.map((diagnostic) => JSON.stringify({ kind: "palette.keymap.diagnostic", diagnostic }))
    ];
  }
  return [
    `keymap: ${profile.name} (${profile.contributions.length} bindings, ${profile.diagnostics.length} diagnostics)`,
    ...profile.contributions.map((contribution) => `  ${contribution.keymap?.mode ?? "unknown"} ${contribution.keymap?.key ?? ""} -> ${contribution.action ?? ""}`)
  ];
}

export function renderPaletteActionResult(result: CliActionResolutionResult, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(result)];
  if (output === "jsonl") {
    return [
      JSON.stringify({
        kind: "palette.action.result",
        schemaVersion: result.schemaVersion,
        ok: result.ok,
        action: result.action,
        target: result.target,
        update: result.update,
        diagnosticCount: result.diagnostics.length
      }),
      ...result.diagnostics.map((diagnostic) => JSON.stringify({ kind: "palette.action.diagnostic", diagnostic }))
    ];
  }
  if (!result.ok) return [`palette action ${result.action}: failed`, ...result.diagnostics.map((diagnostic) => `  diagnostic ${diagnostic.code}: ${diagnostic.message}`)];
  return [`palette action ${result.action}: ok target=${result.target.id}`];
}

async function writeLines(write: (line: string) => Promise<void>, lines: readonly string[]): Promise<void> {
  for (const line of lines) await write(line);
}
