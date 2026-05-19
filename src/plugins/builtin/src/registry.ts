import type {
  CliInteractionContribution,
  CommandCompositionContribution,
  CommandCompositionSideEffect,
  JsonObject,
  PluginManifest,
  RedactedError,
  SessionId,
  TraceContext,
  TurnId,
  ValidationResult,
  VisibleReasoningEvidenceLink,
  VisibleReasoningRecord
} from "@deepseek/platform-contracts";
import {
  COMMAND_COMPOSITION_SCHEMA_VERSION,
  asId,
  createVisibleReasoningRecord,
  validatePluginVisibleReasoningContribution
} from "@deepseek/platform-contracts";
import type { PluginCommandContribution } from "@deepseek/plugin-api";
import { sortPluginManifestsById, validatePluginManifestMetadata } from "@deepseek/plugin-system";
import {
  FIRST_PARTY_DEV_PLUGIN_IDS,
  FIRST_PARTY_DEV_PLUGIN_PACK_ID,
  FIRST_PARTY_DEV_PLUGIN_PACK_VERSION,
  FIRST_PARTY_PLUGIN_MANIFEST_BOUNDARY_PIT,
  type FirstPartyDevPluginId
} from "./shared/constants.js";
import { contextCompactorPlugin } from "./plugins/context-compactor/index.js";
import { devChecksPlugin } from "./plugins/dev-checks/index.js";
import { fileManagerPlugin } from "./plugins/file-manager/index.js";
import { gitReviewPlugin } from "./plugins/git-review/index.js";
import { jumpNavigatorPlugin } from "./plugins/jump-navigator/index.js";
import { repoNavigatorPlugin } from "./plugins/repo-navigator/index.js";

export type { FirstPartyDevPluginId } from "./shared/constants.js";
export {
  FIRST_PARTY_DEV_PLUGIN_IDS,
  FIRST_PARTY_DEV_PLUGIN_PACK_ID,
  FIRST_PARTY_DEV_PLUGIN_PACK_VERSION,
  FIRST_PARTY_PLUGIN_MANIFEST_BOUNDARY_PIT,
  FIRST_PARTY_PLUGIN_PERMISSION_DIFF_PIT
} from "./shared/constants.js";

const pluginManifests = [
  contextCompactorPlugin,
  devChecksPlugin,
  fileManagerPlugin,
  gitReviewPlugin,
  jumpNavigatorPlugin,
  repoNavigatorPlugin
] as const satisfies readonly PluginManifest[];

export interface FirstPartyPluginPackSnapshot extends JsonObject {
  readonly schemaVersion: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly pluginCount: number;
  readonly commandCount: number;
  readonly paletteEntryCount: number;
  readonly resultListProviderCount: number;
  readonly keymapCount: number;
  readonly rendererHintCount: number;
  readonly reasoningContributionCount: number;
  readonly plugins: readonly FirstPartyPluginSnapshot[];
  readonly diagnostics: readonly RedactedError[];
}

export interface FirstPartyPluginSnapshot extends JsonObject {
  readonly pluginId: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly commandCount: number;
  readonly paletteEntryCount: number;
  readonly resultListProviderCount: number;
  readonly keymapCount: number;
  readonly rendererHintCount: number;
  readonly reasoningContributionCount: number;
}

export interface FirstPartyPluginReasoningInput extends JsonObject {
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly trace: TraceContext;
  readonly pluginId?: FirstPartyDevPluginId | string;
  readonly status?: "completed" | "failed" | "blocked" | "skipped" | "warning";
  readonly evidence?: readonly VisibleReasoningEvidenceLink[];
}

export function listBuiltInPluginManifests(): readonly PluginManifest[] {
  return sortPluginManifestsById(pluginManifests);
}

export function getBuiltInPluginManifest(id: FirstPartyDevPluginId | string): PluginManifest | undefined {
  return listBuiltInPluginManifests().find((manifest) => manifest.id === id);
}

export function listFirstPartyDevPluginManifests(): readonly PluginManifest[] {
  return listBuiltInPluginManifests();
}

export function getFirstPartyDevPluginManifest(id: FirstPartyDevPluginId | string): PluginManifest | undefined {
  return getBuiltInPluginManifest(id);
}

export function snapshotFirstPartyDevPluginPack(): FirstPartyPluginPackSnapshot {
  const plugins = listBuiltInPluginManifests().map(snapshotManifest);
  return {
    schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
    packId: FIRST_PARTY_DEV_PLUGIN_PACK_ID,
    packVersion: FIRST_PARTY_DEV_PLUGIN_PACK_VERSION,
    pluginCount: plugins.length,
    commandCount: sum(plugins, (plugin) => plugin.commandCount),
    paletteEntryCount: sum(plugins, (plugin) => plugin.paletteEntryCount),
    resultListProviderCount: sum(plugins, (plugin) => plugin.resultListProviderCount),
    keymapCount: sum(plugins, (plugin) => plugin.keymapCount),
    rendererHintCount: sum(plugins, (plugin) => plugin.rendererHintCount),
    reasoningContributionCount: sum(plugins, (plugin) => plugin.reasoningContributionCount),
    plugins,
    diagnostics: validateFirstPartyDevPluginPack().errors
  };
}

export function validateFirstPartyDevPluginPack(manifests: readonly PluginManifest[] = listBuiltInPluginManifests()): ValidationResult {
  const errors: RedactedError[] = [];
  const seen = new Set<string>();
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) errors.push(error("FIRST_PARTY_PLUGIN_DUPLICATE_ID", `Duplicate first-party plugin id: ${manifest.id}`, { pluginId: manifest.id }));
    seen.add(manifest.id);
    if (manifest.source !== "built-in") errors.push(error("FIRST_PARTY_PLUGIN_SOURCE_INVALID", `First-party plugin ${manifest.id} must use built-in source.`, { pluginId: manifest.id, source: manifest.source }));
    if (!manifest.integrity.startsWith("sha256:")) errors.push(error("FIRST_PARTY_PLUGIN_INTEGRITY_INVALID", `First-party plugin ${manifest.id} must declare sha256 integrity.`, { pluginId: manifest.id }));
    if (commandsOf(manifest).length === 0) errors.push(error("FIRST_PARTY_PLUGIN_COMMANDS_EMPTY", `First-party plugin ${manifest.id} must declare commands.`, { pluginId: manifest.id }));
  }
  errors.push(...validatePluginManifestMetadata(manifests, { requiredSource: "built-in", requireSha256Integrity: true, requireCommands: true }).errors.filter((diagnostic) => diagnostic.code === "PLUGIN_EXECUTABLE_METADATA_REJECTED"));
  return { ok: errors.length === 0, errors };
}

export function firstPartyPluginCommandContributions(manifests: readonly PluginManifest[] = listBuiltInPluginManifests()): readonly CommandCompositionContribution[] {
  return manifests.flatMap((manifest) => commandsOf(manifest).map((commandDef) => toCompositionContribution(manifest, commandDef)));
}

export function firstPartyTuiContributions(manifests: readonly PluginManifest[] = listBuiltInPluginManifests()): readonly CliInteractionContribution[] {
  return manifests.flatMap((manifest) => [
    ...commandsOf(manifest).map((commandDef) => tuiCommandContribution(manifest, commandDef)),
    ...jsonArray(manifest.contributions.paletteEntries).map((entry) => tuiPaletteContribution(manifest, entry)),
    ...jsonArray(manifest.contributions.resultListProviders).map((provider) => tuiMetadataContribution(manifest, provider, "result-list-provider")),
    ...jsonArray(manifest.contributions.keymaps).map((keymapDef) => tuiKeymapContribution(manifest, keymapDef)),
    ...jsonArray(manifest.contributions.rendererHints).map((hint) => tuiMetadataContribution(manifest, hint, "render-hint"))
  ]).sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function firstPartyPluginContributionSummary(manifests: readonly PluginManifest[] = listBuiltInPluginManifests()): JsonObject {
  const snapshot = snapshotFirstPartyDevPluginPack();
  return {
    schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
    packId: snapshot.packId,
    pluginCount: snapshot.pluginCount,
    commandCount: snapshot.commandCount,
    paletteEntryCount: snapshot.paletteEntryCount,
    resultListProviderCount: snapshot.resultListProviderCount,
    keymapCount: snapshot.keymapCount,
    rendererHintCount: snapshot.rendererHintCount,
    reasoningContributionCount: snapshot.reasoningContributionCount,
    manifestIds: manifests.map((manifest) => manifest.id).sort((a, b) => a.localeCompare(b, "en")),
    diagnostics: snapshot.diagnostics
  };
}

export function firstPartyPluginReasoningContributions(input: FirstPartyPluginReasoningInput): readonly VisibleReasoningRecord[] {
  const selected = input.pluginId
    ? listBuiltInPluginManifests().filter((manifest) => manifest.id === input.pluginId)
    : listBuiltInPluginManifests();
  return selected.flatMap((manifest, index) => reasoningRecordsForManifest(manifest, input, (index + 1) * 10));
}

export function validateFirstPartyPluginReasoningContributions(records: readonly VisibleReasoningRecord[]): ValidationResult {
  const errors: RedactedError[] = [];
  for (const record of records) {
    if (!record.pluginId) {
      errors.push(error("FIRST_PARTY_PLUGIN_REASONING_PLUGIN_ID_REQUIRED", "First-party plugin reasoning contribution must include plugin id.", { recordId: record.recordId }));
      continue;
    }
    errors.push(...validatePluginVisibleReasoningContribution(record.pluginId, [record]).errors);
  }
  return { ok: errors.length === 0, errors };
}

function reasoningRecordsForManifest(
  manifest: PluginManifest,
  input: FirstPartyPluginReasoningInput,
  sequence: number
): readonly VisibleReasoningRecord[] {
  const reasoningContributions = jsonArray(manifest.contributions.reasoningContributions);
  return reasoningContributions.map((contribution, offset) => createVisibleReasoningRecord({
    sessionId: input.sessionId,
    ...(input.turnId ? { turnId: input.turnId } : {}),
    trace: input.trace,
    createdAt: "1970-01-01T00:00:00.000Z",
    actor: "plugin",
    pluginId: asId<"plugin">(manifest.id),
    stepKind: stepKindField(contribution.stepKind),
    status: input.status ?? "completed",
    certainty: "verified",
    summary: `${manifest.name} contributes native visible reasoning for ${commandsOf(manifest).length} commands and ${jsonArray(manifest.contributions.resultListProviders).length} result-list providers.`,
    detail: `Contribution ${stringField(contribution.id, "reasoning")} uses shared evidence links and is rendered inside the DeepSeek reasoning panel rather than a custom plugin panel.`,
    evidence: input.evidence ?? [],
    sequence: sequence + offset,
    phase: "plugin",
    metadata: {
      pluginId: manifest.id,
      contribution,
      commandCount: commandsOf(manifest).length,
      permissions: manifest.permissions
    },
    privacyClass: "internal",
    redaction: { class: "internal", fields: ["detail", "metadata.permissions"] }
  }));
}

function stepKindField(value: unknown): Parameters<typeof createVisibleReasoningRecord>[0]["stepKind"] {
  if (value === "intent" || value === "assumption" || value === "context-selection" || value === "tool-intent" || value === "edit-decision" || value === "verification" || value === "risk" || value === "outcome" || value === "prompt-assembly" || value === "plugin" || value === "diagnostic") return value;
  return "plugin";
}

function toCompositionContribution(manifest: PluginManifest, commandDef: PluginCommandContribution): CommandCompositionContribution {
  return {
    schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
    id: `composition:plugin-command:${manifest.id}:${commandDef.id}`,
    kind: "plugin-command",
    ownerSubsystem: commandDef.ownerSubsystem,
    source: { kind: "plugin", id: manifest.id, name: manifest.name, version: manifest.version, trust: "trusted", integrity: manifest.integrity, pluginId: manifest.id },
    target: { kind: "plugin-command", id: `plugin-command:${manifest.id}:${commandDef.id}` },
    displayName: commandDef.name,
    aliases: commandDef.aliases,
    description: commandDef.description,
    hostSupport: ["cli", "chat", "json", "jsonl", "vscode"],
    permissions: commandDef.permissions,
    sideEffect: commandDef.sideEffect,
    inputSchema: commandDef.inputSchema,
    outputSchema: commandDef.outputSchema,
    projection: {
      userVisible: true,
      hostVisible: true,
      modelVisible: false,
      resultListVisible: true,
      group: "plugins",
      order: commandDef.order,
      metadata: { pluginId: manifest.id, commandId: commandDef.commandId, pluginGroup: commandDef.group }
    },
    provenance: { pluginId: manifest.id, version: manifest.version, source: manifest.source, integrity: manifest.integrity, commandId: commandDef.commandId },
    compatibility: { schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION, minReaderVersion: "0.1.0" },
    redaction: { class: "internal" },
    referencePitFixtureIds: [FIRST_PARTY_PLUGIN_MANIFEST_BOUNDARY_PIT],
    metadata: { ...commandDef.metadata, commandId: commandDef.commandId, builtIn: true }
  };
}

function tuiCommandContribution(manifest: PluginManifest, commandDef: PluginCommandContribution): CliInteractionContribution {
  return {
    id: `plugin:${manifest.id}:command:${commandDef.id}`,
    kind: "command",
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
    namespace: commandDef.group,
    label: commandDef.name,
    permissions: commandDef.permissions,
    sideEffects: [commandDef.sideEffect],
    conflictGroup: `command:${commandDef.aliases[0] ?? commandDef.id}`,
    helpText: commandDef.description,
    previewText: `${commandDef.name} -> ${commandDef.commandId}`,
    governance: { routesThroughContracts: true, directHostAccess: false, ownerSubsystem: commandDef.ownerSubsystem },
    commandName: commandDef.aliases[0] ?? commandDef.id,
    targetKind: "command",
    metadata: { pluginId: manifest.id, commandId: commandDef.commandId, permissions: commandDef.permissions, sideEffect: commandDef.sideEffect }
  };
}

function tuiPaletteContribution(manifest: PluginManifest, entry: JsonObject): CliInteractionContribution {
  const id = stringField(entry.id, "entry");
  const title = stringField(entry.title, id);
  return {
    id: `plugin:${manifest.id}:palette:${id}`,
    kind: "palette-entry",
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
    namespace: stringField(entry.category, "plugins"),
    label: title,
    conflictGroup: `palette-entry:${title}`,
    helpText: `Open ${title} contribution metadata.`,
    previewText: `Inspect ${title} contribution.`,
    governance: { routesThroughContracts: true, directHostAccess: false },
    action: "inspect",
    targetKind: "command",
    paletteEntry: {
      id: `plugin-palette:${manifest.id}:${id}`,
      title,
      action: "inspect",
      targetKind: "command",
      category: stringField(entry.category, "plugins")
    },
    metadata: { pluginId: manifest.id, entry }
  };
}

function tuiKeymapContribution(manifest: PluginManifest, keymap: JsonObject): CliInteractionContribution {
  const id = stringField(keymap.id, "keymap");
  const mode = stringField(keymap.mode, "normal") as NonNullable<CliInteractionContribution["keymap"]>["mode"];
  const key = stringField(keymap.key, id);
  const action = stringField(keymap.action, "inspect") as NonNullable<CliInteractionContribution["action"]>;
  const targetKind = stringField(keymap.targetKind, "command") as NonNullable<CliInteractionContribution["targetKind"]>;
  const namespace = stringField(keymap.namespace, manifest.name.toLocaleLowerCase("en").replace(/\s+/g, "-"));
  return {
    id: `plugin:${manifest.id}:keymap:${id}`,
    kind: "keymap",
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
    namespace,
    label: stringField(keymap.helpText, id),
    modeScopes: [mode],
    keymapScopes: [key],
    permissions: manifest.permissions,
    sideEffects: [],
    conflictGroup: `${mode}:${key}`,
    helpText: stringField(keymap.helpText, `Plugin keymap ${key}`),
    previewText: stringField(keymap.previewText, `Plugin key ${key} resolves to ${action}`),
    governance: { routesThroughContracts: true, directHostAccess: false, keymapOnly: true },
    action,
    targetKind,
    keymap: {
      id: `plugin-keymap:${manifest.id}:${id}`,
      mode,
      key,
      action,
      targetKind,
      ...(Array.isArray(keymap.sequence) ? { sequence: keymap.sequence.filter((value): value is string => typeof value === "string") } : {}),
      namespace,
      conflictGroup: `${mode}:${key}`,
      description: stringField(keymap.helpText, `Plugin keymap ${key}`),
      preview: stringField(keymap.previewText, `Plugin key ${key} resolves to ${action}`)
    },
    metadata: { pluginId: manifest.id, keymap }
  };
}

function tuiMetadataContribution(manifest: PluginManifest, metadata: JsonObject, kind: "result-list-provider" | "render-hint"): CliInteractionContribution {
  const id = stringField(metadata.id, kind);
  return {
    id: `plugin:${manifest.id}:${kind}:${id}`,
    kind,
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
    namespace: stringField(metadata.placement, kind),
    label: id,
    conflictGroup: `${kind}:${id}`,
    helpText: `${kind} ${id}`,
    previewText: `${kind} ${id}`,
    governance: { routesThroughContracts: true, directHostAccess: false },
    metadata: { pluginId: manifest.id, ...metadata }
  };
}

function commandsOf(manifest: PluginManifest): readonly PluginCommandContribution[] {
  const commands = manifest.contributions.commands;
  return Array.isArray(commands) ? commands.filter(isPluginCommandContribution) : [];
}

function snapshotManifest(manifest: PluginManifest): FirstPartyPluginSnapshot {
  return {
    pluginId: manifest.id,
    version: manifest.version,
    source: manifest.source,
    integrity: manifest.integrity,
    permissions: manifest.permissions,
    commandCount: commandsOf(manifest).length,
    paletteEntryCount: jsonArray(manifest.contributions.paletteEntries).length,
    resultListProviderCount: jsonArray(manifest.contributions.resultListProviders).length,
    keymapCount: jsonArray(manifest.contributions.keymaps).length,
    rendererHintCount: jsonArray(manifest.contributions.rendererHints).length,
    reasoningContributionCount: jsonArray(manifest.contributions.reasoningContributions).length
  };
}

function sum<T>(items: readonly T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function isPluginCommandContribution(value: unknown): value is PluginCommandContribution {
  return isJsonObject(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.commandId === "string";
}

function jsonArray(value: unknown): readonly JsonObject[] {
  return Array.isArray(value) ? value.filter(isJsonObject) : [];
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function error(code: string, message: string, details: JsonObject): RedactedError {
  return { code, message, retryable: false, redaction: { class: "public" }, details };
}
