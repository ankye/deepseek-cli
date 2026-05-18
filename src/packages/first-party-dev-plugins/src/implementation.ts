import type {
  CommandCompositionContribution,
  CommandCompositionSideEffect,
  CliInteractionContribution,
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
import { COMMAND_COMPOSITION_SCHEMA_VERSION, asId, createVisibleReasoningRecord, validatePluginVisibleReasoningContribution } from "@deepseek/platform-contracts";

export const FIRST_PARTY_DEV_PLUGIN_PACK_ID = "deepseek.first-party-dev-plugins";
export const FIRST_PARTY_DEV_PLUGIN_PACK_VERSION = "1.0.0";
export const FIRST_PARTY_PLUGIN_MANIFEST_BOUNDARY_PIT = "pit.legacy-contribution-normalization.manifest-boundary";
export const FIRST_PARTY_PLUGIN_PERMISSION_DIFF_PIT = "pit.extension-permission-expansion.permission-diff";

export const FIRST_PARTY_DEV_PLUGIN_IDS = [
  "@deepseek/plugin-context-compactor",
  "@deepseek/plugin-dev-checks",
  "@deepseek/plugin-git-review",
  "@deepseek/plugin-repo-navigator"
] as const;

export type FirstPartyDevPluginId = (typeof FIRST_PARTY_DEV_PLUGIN_IDS)[number];

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

interface FirstPartyCommand extends JsonObject {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description: string;
  readonly ownerSubsystem: string;
  readonly commandId: string;
  readonly sideEffect: CommandCompositionSideEffect;
  readonly permissions: readonly string[];
  readonly group: string;
  readonly order: number;
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly metadata?: JsonObject;
}

interface FirstPartyPluginDefinition {
  readonly id: FirstPartyDevPluginId;
  readonly name: string;
  readonly version: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly commands: readonly FirstPartyCommand[];
  readonly paletteEntries: readonly JsonObject[];
  readonly resultListProviders: readonly JsonObject[];
  readonly keymaps: readonly JsonObject[];
  readonly rendererHints: readonly JsonObject[];
  readonly reasoningContributions: readonly JsonObject[];
  readonly metadata: JsonObject;
}

const outputSchema = {
  type: "object",
  required: ["schemaVersion", "status", "diagnostics", "redaction"],
  properties: {
    schemaVersion: { const: COMMAND_COMPOSITION_SCHEMA_VERSION },
    status: { type: "string" },
    diagnostics: { type: "array" },
    redaction: { type: "object" }
  }
} as const satisfies JsonObject;

const emptyInputSchema = { type: "object", additionalProperties: false } as const satisfies JsonObject;

const queryInputSchema = {
  type: "object",
  properties: { query: { type: "string", minLength: 1 }, limit: { type: "number" } },
  required: ["query"],
  additionalProperties: false
} as const satisfies JsonObject;

const contextTargetInputSchema = {
  type: "object",
  properties: { target: { type: "string", minLength: 1 }, limit: { type: "number" } },
  required: ["target"],
  additionalProperties: false
} as const satisfies JsonObject;

const pluginDefinitions: readonly FirstPartyPluginDefinition[] = [
  {
    id: "@deepseek/plugin-context-compactor",
    name: "Context Compactor",
    version: "0.1.0",
    integrity: "sha256:242ce336ab9b6e831ffaf5f7a3c8c55a6f7a932ba2f47a5887b27fce85b36d88",
    permissions: ["context:lcm:read", "context:lcm:write", "context:summary", "palette:references:write"],
    commands: [
      command("context.status", "Context: Status", ["/context status"], "Report bounded lossless context state.", "runtime", "context:lcm.status", "read", ["context:lcm:read"], "context", 10, emptyInputSchema),
      command("context.grep", "Context: Grep", ["/context grep"], "Search durable redacted lossless context.", "runtime", "context:lcm.grep", "read", ["context:lcm:read"], "context", 20, queryInputSchema),
      command("context.describe", "Context: Describe", ["/context describe"], "Describe one lossless context node and its DAG edges.", "runtime", "context:lcm.describe", "read", ["context:lcm:read"], "context", 30, contextTargetInputSchema),
      command("context.summarize", "Context: Summarize", ["/context summarize"], "Create a reversible summary node with coverage metadata.", "runtime", "context:lcm.summarize", "write", ["context:lcm:read", "context:lcm:write", "context:summary"], "context", 40, emptyInputSchema),
      command("context.expand", "Context: Expand", ["/context expand"], "Expand summaries or queries back to redacted original nodes.", "runtime", "context:lcm.expand", "read", ["context:lcm:read"], "context", 50, contextTargetInputSchema),
      command("context.budget", "Context: Budget", ["/context budget"], "Report compact pressure and context projection budget state.", "runtime", "context:lcm.budget", "read", ["context:lcm:read"], "context", 60, emptyInputSchema),
      command("context.pin", "Context: Pin", ["/context pin"], "Pin a context target into the active reference workflow.", "command-system", "context:lcm.pin", "session-control", ["context:lcm:read", "palette:references:write"], "context", 70, contextTargetInputSchema)
    ],
    paletteEntries: [{ id: "context", title: "Context Compactor", category: "context", targetKind: "plugin-command" }],
    resultListProviders: [{ id: "context-results", targetKinds: ["lossless-node", "summary-node", "context-budget", "context-pin"] }],
    keymaps: [{ id: "context.expand", mode: "result-list", key: "x", action: "expand", targetKind: "result-list-item" }],
    rendererHints: [{ id: "context.status-line", host: "cli-tui", placement: "status" }],
    reasoningContributions: [{ id: "context.reasoning", stepKind: "context-selection", detailLevel: "full", evidenceKinds: ["context-node", "tool-evidence"] }],
    metadata: { releaseScope: "R1", compactMode: "lossless", automaticPermanentMemoryWrites: false }
  },
  {
    id: "@deepseek/plugin-dev-checks",
    name: "Dev Checks",
    version: "0.1.0",
    integrity: "sha256:75db8c9ad03d3430d7e97a7458c178a55de2697c3f340fd974537f57de49cc12",
    permissions: ["process:predeclared", "workspace:read", "diagnostics:write"],
    commands: [
      command("dev-checks.openspec", "Checks: OpenSpec Validate", ["/checks openspec"], "Run strict OpenSpec validation for the active change.", "command-system", "checks.openspec.validate", "process", ["process:predeclared", "workspace:read"], "checks", 10, emptyInputSchema),
      command("dev-checks.typecheck", "Checks: Typecheck", ["/checks typecheck"], "Run TypeScript type checking.", "command-system", "checks.typecheck", "process", ["process:predeclared", "workspace:read"], "checks", 20, emptyInputSchema),
      command("dev-checks.lint", "Checks: Lint", ["/checks lint"], "Run architecture and source lint checks.", "command-system", "checks.lint", "process", ["process:predeclared", "workspace:read"], "checks", 30, emptyInputSchema),
      command("dev-checks.test", "Checks: Test", ["/checks test"], "Run the repository test suite.", "command-system", "checks.test", "process", ["process:predeclared", "workspace:read"], "checks", 40, emptyInputSchema),
      command("dev-checks.boundaries", "Checks: Boundaries", ["/checks boundaries"], "Run package boundary checks.", "command-system", "checks.boundaries", "process", ["process:predeclared", "workspace:read"], "checks", 50, emptyInputSchema),
      command("dev-checks.build-cli", "Checks: Build CLI", ["/checks build-cli"], "Build the publishable CLI package.", "command-system", "checks.build-cli", "process", ["process:predeclared", "workspace:read"], "checks", 60, emptyInputSchema)
    ],
    paletteEntries: [{ id: "checks", title: "Dev Checks", category: "checks", targetKind: "plugin-command" }],
    resultListProviders: [{ id: "check-results", targetKinds: ["check-command", "check-diagnostic"] }],
    keymaps: [],
    rendererHints: [{ id: "checks.summary", host: "cli-tui", placement: "diagnostics" }],
    reasoningContributions: [{ id: "checks.reasoning", stepKind: "verification", detailLevel: "compact", evidenceKinds: ["check", "diagnostic"] }],
    metadata: { releaseScope: "R1", acceptsFreeFormShell: false }
  },
  {
    id: "@deepseek/plugin-git-review",
    name: "Git Review",
    version: "0.1.0",
    integrity: "sha256:42d1653f2ce7b9680d15a2038c3ca944611a7b1c9cf0b8b1d7e3491e9f9f437e",
    permissions: ["git:read", "workspace:read"],
    commands: [
      command("git.status", "Git: Status", ["/git status"], "Show read-only git status projection.", "command-system", "git.review.status", "read", ["git:read", "workspace:read"], "git", 10, emptyInputSchema),
      command("git.diff", "Git: Diff", ["/git diff"], "Show read-only git diff projection.", "command-system", "git.review.diff", "read", ["git:read", "workspace:read"], "git", 20, emptyInputSchema),
      command("git.review", "Git: Review", ["/git review"], "Project review targets from status and diff evidence.", "command-system", "git.review.summary", "read", ["git:read", "workspace:read"], "git", 30, emptyInputSchema)
    ],
    paletteEntries: [{ id: "git-review", title: "Git Review", category: "git", targetKind: "plugin-command" }],
    resultListProviders: [{ id: "git-review-results", targetKinds: ["git-file", "git-hunk", "git-diagnostic"] }],
    keymaps: [],
    rendererHints: [{ id: "git.review.summary", host: "cli-tui", placement: "status" }],
    reasoningContributions: [{ id: "git.reasoning", stepKind: "verification", detailLevel: "compact", evidenceKinds: ["diff", "diagnostic"] }],
    metadata: { releaseScope: "R1", destructiveOperations: false }
  },
  {
    id: "@deepseek/plugin-repo-navigator",
    name: "Repo Navigator",
    version: "0.1.0",
    integrity: "sha256:b125b76eed918bb45007892a8828f364fb75ca9bc8ef15e12d920d822533681c",
    permissions: ["workspace:read", "index:read", "pageindex:read"],
    commands: [
      command("repo.files", "Repo: Files", ["/repo files"], "Search workspace files through existing host/index boundaries.", "command-system", "repo.navigator.files", "read", ["workspace:read"], "repo", 10, queryInputSchema),
      command("repo.grep", "Repo: Grep", ["/repo grep"], "Search file content through existing grep result boundaries.", "command-system", "repo.navigator.grep", "read", ["workspace:read"], "repo", 20, queryInputSchema),
      command("repo.recall", "Repo: Recall", ["/repo recall"], "Search PageIndex recall for completed chat turns.", "command-system", "repo.navigator.recall", "read", ["pageindex:read"], "repo", 30, queryInputSchema),
      command("repo.project-index", "Repo: Project Index", ["/repo index"], "Project indexed code references when available.", "context-engine", "repo.navigator.project-index", "read", ["index:read", "workspace:read"], "repo", 40, queryInputSchema)
    ],
    paletteEntries: [{ id: "repo-navigator", title: "Repo Navigator", category: "repo", targetKind: "plugin-command" }],
    resultListProviders: [{ id: "repo-results", targetKinds: ["workspace-file", "grep-match", "pageindex-turn", "project-index-ref"] }],
    keymaps: [{ id: "repo.search", mode: "normal", key: "/", action: "search", targetKind: "command" }],
    rendererHints: [{ id: "repo.result-list", host: "cli-tui", placement: "palette" }],
    reasoningContributions: [{ id: "repo.reasoning", stepKind: "context-selection", detailLevel: "compact", evidenceKinds: ["result-list-item", "context-node"] }],
    metadata: { releaseScope: "R1", usesExistingSearchBoundaries: true }
  }
] as const;

export function listFirstPartyDevPluginManifests(): readonly PluginManifest[] {
  return pluginDefinitions.map(toManifest).sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function getFirstPartyDevPluginManifest(id: FirstPartyDevPluginId | string): PluginManifest | undefined {
  return listFirstPartyDevPluginManifests().find((manifest) => manifest.id === id);
}

export function snapshotFirstPartyDevPluginPack(): FirstPartyPluginPackSnapshot {
  const plugins = pluginDefinitions.map(snapshotDefinition).sort((a, b) => a.pluginId.localeCompare(b.pluginId, "en"));
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

export function validateFirstPartyDevPluginPack(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): ValidationResult {
  const errors: RedactedError[] = [];
  const seen = new Set<string>();
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) errors.push(error("FIRST_PARTY_PLUGIN_DUPLICATE_ID", `Duplicate first-party plugin id: ${manifest.id}`, { pluginId: manifest.id }));
    seen.add(manifest.id);
    if (manifest.source !== "built-in") errors.push(error("FIRST_PARTY_PLUGIN_SOURCE_INVALID", `First-party plugin ${manifest.id} must use built-in source.`, { pluginId: manifest.id, source: manifest.source }));
    if (!manifest.integrity.startsWith("sha256:")) errors.push(error("FIRST_PARTY_PLUGIN_INTEGRITY_INVALID", `First-party plugin ${manifest.id} must declare sha256 integrity.`, { pluginId: manifest.id }));
    const commands = commandsOf(manifest);
    if (commands.length === 0) errors.push(error("FIRST_PARTY_PLUGIN_COMMANDS_EMPTY", `First-party plugin ${manifest.id} must declare commands.`, { pluginId: manifest.id }));
  }
  return { ok: errors.length === 0, errors };
}

export function firstPartyPluginCommandContributions(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): readonly CommandCompositionContribution[] {
  return manifests.flatMap((manifest) => commandsOf(manifest).map((command) => toCompositionContribution(manifest, command)));
}

export function firstPartyTuiContributions(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): readonly CliInteractionContribution[] {
  return manifests.flatMap((manifest) => [
    ...commandsOf(manifest).map((commandDef) => tuiCommandContribution(manifest, commandDef)),
    ...jsonArray(manifest.contributions.paletteEntries).map((entry) => tuiPaletteContribution(manifest, entry)),
    ...jsonArray(manifest.contributions.resultListProviders).map((provider) => tuiMetadataContribution(manifest, provider, "result-list-provider")),
    ...jsonArray(manifest.contributions.keymaps).map((keymap) => tuiKeymapContribution(manifest, keymap)),
    ...jsonArray(manifest.contributions.rendererHints).map((hint) => tuiMetadataContribution(manifest, hint, "render-hint"))
  ]).sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function firstPartyPluginContributionSummary(manifests: readonly PluginManifest[] = listFirstPartyDevPluginManifests()): JsonObject {
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

export interface FirstPartyPluginReasoningInput extends JsonObject {
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly trace: TraceContext;
  readonly pluginId?: FirstPartyDevPluginId | string;
  readonly status?: "completed" | "failed" | "blocked" | "skipped" | "warning";
  readonly evidence?: readonly VisibleReasoningEvidenceLink[];
}

export function firstPartyPluginReasoningContributions(input: FirstPartyPluginReasoningInput): readonly VisibleReasoningRecord[] {
  const selected = input.pluginId
    ? pluginDefinitions.filter((definition) => definition.id === input.pluginId)
    : pluginDefinitions;
  return selected.flatMap((definition, index) => reasoningRecordsForDefinition(definition, input, (index + 1) * 10));
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

function toManifest(definition: FirstPartyPluginDefinition): PluginManifest {
  return {
    id: asId<"plugin">(definition.id),
    name: definition.name,
    version: definition.version,
    source: "built-in",
    integrity: definition.integrity,
    permissions: definition.permissions,
    contributions: {
      schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
      packId: FIRST_PARTY_DEV_PLUGIN_PACK_ID,
      commands: definition.commands,
      paletteEntries: definition.paletteEntries,
      resultListProviders: definition.resultListProviders,
      keymaps: definition.keymaps,
      rendererHints: definition.rendererHints,
      reasoningContributions: definition.reasoningContributions,
      metadata: definition.metadata
    }
  };
}

function reasoningRecordsForDefinition(
  definition: FirstPartyPluginDefinition,
  input: FirstPartyPluginReasoningInput,
  sequence: number
): readonly VisibleReasoningRecord[] {
  return definition.reasoningContributions.map((contribution, offset) => createVisibleReasoningRecord({
    sessionId: input.sessionId,
    ...(input.turnId ? { turnId: input.turnId } : {}),
    trace: input.trace,
    createdAt: "1970-01-01T00:00:00.000Z",
    actor: "plugin",
    pluginId: asId<"plugin">(definition.id),
    stepKind: stepKindField(contribution.stepKind),
    status: input.status ?? "completed",
    certainty: "verified",
    summary: `${definition.name} contributes native visible reasoning for ${definition.commands.length} commands and ${definition.resultListProviders.length} result-list providers.`,
    detail: `Contribution ${stringField(contribution.id, "reasoning")} uses shared evidence links and is rendered inside the DeepSeek reasoning panel rather than a custom plugin panel.`,
    evidence: input.evidence ?? [],
    sequence: sequence + offset,
    phase: "plugin",
    metadata: {
      pluginId: definition.id,
      contribution,
      commandCount: definition.commands.length,
      permissions: definition.permissions
    },
    privacyClass: "internal",
    redaction: { class: "internal", fields: ["detail", "metadata.permissions"] }
  }));
}

function stepKindField(value: unknown): Parameters<typeof createVisibleReasoningRecord>[0]["stepKind"] {
  if (value === "intent" || value === "assumption" || value === "context-selection" || value === "tool-intent" || value === "edit-decision" || value === "verification" || value === "risk" || value === "outcome" || value === "prompt-assembly" || value === "plugin" || value === "diagnostic") return value;
  return "plugin";
}

function toCompositionContribution(manifest: PluginManifest, commandDef: FirstPartyCommand): CommandCompositionContribution {
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

function tuiCommandContribution(manifest: PluginManifest, commandDef: FirstPartyCommand): CliInteractionContribution {
  return {
    id: `plugin:${manifest.id}:command:${commandDef.id}`,
    kind: "command",
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
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
  return {
    id: `plugin:${manifest.id}:keymap:${id}`,
    kind: "keymap",
    source: "plugin",
    pluginId: manifest.id,
    priority: 50,
    action,
    targetKind,
    keymap: {
      id: `plugin-keymap:${manifest.id}:${id}`,
      mode,
      key,
      action,
      targetKind
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
    metadata: { pluginId: manifest.id, ...metadata }
  };
}

function command(
  id: string,
  name: string,
  aliases: readonly string[],
  description: string,
  ownerSubsystem: string,
  commandId: string,
  sideEffect: CommandCompositionSideEffect,
  permissions: readonly string[],
  group: string,
  order: number,
  inputSchema: JsonObject,
  metadata: JsonObject = {}
): FirstPartyCommand {
  return { id, name, aliases, description, ownerSubsystem, commandId, sideEffect, permissions, group, order, inputSchema, outputSchema, metadata };
}

function commandsOf(manifest: PluginManifest): readonly FirstPartyCommand[] {
  const commands = manifest.contributions.commands;
  return Array.isArray(commands) ? commands.filter(isFirstPartyCommand) : [];
}

function snapshotDefinition(definition: FirstPartyPluginDefinition): FirstPartyPluginSnapshot {
  return {
    pluginId: definition.id,
    version: definition.version,
    source: "built-in",
    integrity: definition.integrity,
    permissions: definition.permissions,
    commandCount: definition.commands.length,
    paletteEntryCount: definition.paletteEntries.length,
    resultListProviderCount: definition.resultListProviders.length,
    keymapCount: definition.keymaps.length,
    rendererHintCount: definition.rendererHints.length,
    reasoningContributionCount: definition.reasoningContributions.length
  };
}

function sum<T>(items: readonly T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function isFirstPartyCommand(value: unknown): value is FirstPartyCommand {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as { readonly id?: unknown }).id === "string";
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
