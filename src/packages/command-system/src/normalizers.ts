import type {
  CommandCompositionContribution,
  CommandCompositionRecord,
  CommandManifest,
  HookSummary,
  JsonObject,
  McpPromptSummary,
  McpToolSummary,
  PluginManifest,
  SkillSummary
} from "@deepseek/platform-contracts";
import { COMMAND_COMPOSITION_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export function commandManifestToCompositionRecord(manifest: CommandManifest): CommandCompositionRecord {
  const source = manifest.source ?? { kind: "built-in", id: "command-system", trust: "trusted" };
  const projection = manifest.projection ?? {
    userVisible: true,
    hostVisible: manifest.modes.includes("host"),
    modelVisible: manifest.modes.includes("model"),
    resultListVisible: true,
    group: "commands"
  };
  const target = manifest.target ?? { kind: "command", id: `command:${manifest.id}` };
  const sideEffect = manifest.compositionSideEffect ?? manifest.sideEffect;

  return {
    schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
    id: `composition:${target.kind}:${target.id}`,
    kind: manifest.compositionKind ?? "command",
    ownerSubsystem: manifest.ownerSubsystem ?? "command-system",
    source,
    target,
    displayName: manifest.name,
    aliases: manifest.aliases,
    modes: manifest.modes,
    hostSupport: manifest.hostSupport,
    permissions: manifest.permissions ?? [],
    sideEffect,
    inputSchema: manifest.inputSchema,
    ...(manifest.outputSchema ? { outputSchema: manifest.outputSchema } : {}),
    projection,
    provenance: {
      manifestId: manifest.id,
      manifestName: manifest.name,
      sourceKind: source.kind,
      ownerSubsystem: manifest.ownerSubsystem ?? "command-system"
    },
    compatibility: compatibility(manifest.compatibility),
    redaction: redaction(manifest.redaction),
    referencePitFixtureIds: manifest.referencePitFixtureIds ?? [],
    ...(manifest.description ? { description: manifest.description } : {}),
    ...(manifest.metadata ? { metadata: manifest.metadata } : {})
  };
}

export function contributionToCompositionRecord(contribution: CommandCompositionContribution): CommandCompositionRecord {
  const target = contribution.target;
  return {
    schemaVersion: contribution.schemaVersion ?? COMMAND_COMPOSITION_SCHEMA_VERSION,
    id: contribution.id ?? `composition:${target.kind}:${target.id}`,
    kind: contribution.kind,
    ownerSubsystem: contribution.ownerSubsystem,
    source: contribution.source,
    target,
    displayName: contribution.displayName,
    aliases: contribution.aliases ?? [],
    ...(contribution.description ? { description: contribution.description } : {}),
    ...(contribution.modes ? { modes: contribution.modes } : {}),
    ...(contribution.hostSupport ? { hostSupport: contribution.hostSupport } : {}),
    permissions: contribution.permissions ?? [],
    sideEffect: contribution.sideEffect ?? "none",
    ...(contribution.inputSchema ? { inputSchema: contribution.inputSchema } : {}),
    ...(contribution.outputSchema ? { outputSchema: contribution.outputSchema } : {}),
    projection: {
      userVisible: true,
      hostVisible: true,
      modelVisible: false,
      resultListVisible: true,
      group: contribution.kind,
      ...contribution.projection
    },
    provenance: contribution.provenance ?? {
      sourceKind: contribution.source.kind,
      sourceId: contribution.source.id ?? contribution.source.name ?? contribution.source.kind,
      ownerSubsystem: contribution.ownerSubsystem
    },
    compatibility: compatibility(contribution.compatibility),
    redaction: redaction(contribution.redaction),
    referencePitFixtureIds: contribution.referencePitFixtureIds ?? [],
    ...(contribution.metadata ? { metadata: contribution.metadata } : {})
  };
}

export function skillSummaryToCompositionRecord(summary: SkillSummary): CommandCompositionRecord {
  const sideEffect = summary.executionModes.some((mode) => mode === "tool" || mode === "workflow" || mode === "sandboxed-executor") ? "process" : "none";
  return contributionToCompositionRecord({
    schemaVersion: summary.schemaVersion,
    kind: "skill",
    ownerSubsystem: "skill-system",
    source: { kind: summary.source, id: summary.id, trust: summary.trust },
    target: { kind: "skill", id: `skill:${summary.name}` },
    displayName: summary.name,
    aliases: summary.activation,
    description: summary.description,
    permissions: summary.permissions,
    sideEffect,
    projection: {
      userVisible: summary.enabled,
      hostVisible: summary.enabled,
      modelVisible: sideEffect === "none" && summary.trust === "trusted",
      resultListVisible: true,
      disabled: !summary.enabled,
      group: "skills",
      metadata: { loadingState: summary.loadingState, executionModes: [...summary.executionModes] }
    },
    provenance: { skillId: summary.id, loadingState: summary.loadingState, executionModes: [...summary.executionModes] },
    compatibility: summary.compatibility,
    redaction: summary.redaction,
    referencePitFixtureIds: ["pit.legacy-contribution-normalization.manifest-boundary"]
  });
}

export function hookSummaryToCompositionRecord(summary: HookSummary): CommandCompositionRecord {
  return contributionToCompositionRecord({
    schemaVersion: summary.schemaVersion,
    kind: "hook",
    ownerSubsystem: "hook-system",
    source: { kind: summary.source, id: summary.id, trust: summary.trust },
    target: { kind: "hook", id: `hook:${summary.id}` },
    displayName: summary.name,
    aliases: [summary.point],
    permissions: summary.permissions,
    sideEffect: "process",
    projection: {
      userVisible: true,
      hostVisible: true,
      modelVisible: false,
      resultListVisible: true,
      disabled: !summary.enabled,
      group: "hooks",
      order: summary.ordering.priority,
      metadata: { point: summary.point, failurePolicy: summary.failurePolicy, timeoutMs: summary.timeoutMs }
    },
    provenance: {
      hookId: summary.id,
      point: summary.point,
      orderingPriority: summary.ordering.priority,
      failurePolicy: summary.failurePolicy,
      timeoutMs: summary.timeoutMs
    },
    compatibility: summary.compatibility,
    redaction: summary.redaction,
    referencePitFixtureIds: ["pit.legacy-contribution-normalization.manifest-boundary"]
  });
}

export function mcpPromptSummaryToCompositionRecord(summary: McpPromptSummary): CommandCompositionRecord {
  return contributionToCompositionRecord({
    schemaVersion: summary.schemaVersion,
    kind: "mcp-prompt",
    ownerSubsystem: "mcp-gateway",
    source: { kind: "mcp", id: summary.serverId, name: summary.namespace, trust: summary.trust },
    target: { kind: "mcp-prompt", id: `mcp-prompt:${summary.qualifiedName}` },
    displayName: summary.qualifiedName,
    aliases: [summary.name],
    description: summary.description,
    sideEffect: "none",
    inputSchema: summary.argumentsSchema,
    projection: { userVisible: true, hostVisible: true, modelVisible: false, resultListVisible: true, group: "mcp" },
    provenance: { ...summary.provenance, serverId: summary.serverId, namespace: summary.namespace, qualifiedName: summary.qualifiedName },
    compatibility: summary.compatibility,
    redaction: summary.redaction,
    referencePitFixtureIds: ["pit.mcp-plugin-precedence.enterprise-deny"]
  });
}

export function mcpToolSummaryToCompositionRecord(summary: McpToolSummary): CommandCompositionRecord {
  return contributionToCompositionRecord({
    schemaVersion: summary.schemaVersion,
    kind: "mcp-tool",
    ownerSubsystem: "mcp-gateway",
    source: { kind: "mcp", id: summary.serverId, name: summary.namespace, trust: summary.trust },
    target: { kind: "mcp-tool", id: `mcp-tool:${summary.qualifiedName}` },
    displayName: summary.qualifiedName,
    aliases: [summary.name],
    description: summary.description,
    permissions: summary.permissions,
    sideEffect: "network",
    inputSchema: summary.inputSchema,
    outputSchema: summary.outputSchema,
    projection: { userVisible: true, hostVisible: true, modelVisible: false, resultListVisible: true, group: "mcp" },
    provenance: { ...summary.provenance, serverId: summary.serverId, namespace: summary.namespace, qualifiedName: summary.qualifiedName },
    compatibility: summary.compatibility,
    redaction: summary.redaction,
    referencePitFixtureIds: ["pit.mcp-plugin-precedence.enterprise-deny"]
  });
}

export function pluginCommandContributionToCompositionRecords(manifest: PluginManifest): readonly CommandCompositionRecord[] {
  const commands = Array.isArray(manifest.contributions.commands) ? manifest.contributions.commands : [];
  return commands.filter(isJsonObject).map((command, index) => {
    const id = stringField(command.id, `${manifest.id}.command.${index}`);
    const name = stringField(command.name, id);
    const permissions = stringArray(command.permissions, manifest.permissions);
    const baselinePermissions = stringArray(command.baselinePermissions, []);
    const referencePitFixtureIds = [...stringArray(command.referencePitFixtureIds, ["pit.legacy-contribution-normalization.manifest-boundary"])];
    if (permissions.some((permission) => !baselinePermissions.includes(permission)) && !referencePitFixtureIds.includes("pit.extension-permission-expansion.permission-diff")) {
      referencePitFixtureIds.push("pit.extension-permission-expansion.permission-diff");
    }
    return contributionToCompositionRecord({
      schemaVersion: stringField(command.schemaVersion, COMMAND_COMPOSITION_SCHEMA_VERSION),
      kind: "plugin-command",
      ownerSubsystem: "plugin-system",
      source: { kind: "plugin", id: manifest.id, name: manifest.name, version: manifest.version, trust: "workspace", integrity: manifest.integrity, pluginId: manifest.id },
      target: { kind: "plugin-command", id: `plugin-command:${manifest.id}:${id}` },
      displayName: name,
      aliases: stringArray(command.aliases, []),
      ...(typeof command.description === "string" ? { description: command.description } : {}),
      permissions,
      sideEffect: stringField(command.sideEffect, "process"),
      ...(isJsonObject(command.inputSchema) ? { inputSchema: command.inputSchema } : {}),
      ...(isJsonObject(command.outputSchema) ? { outputSchema: command.outputSchema } : {}),
      projection: {
        userVisible: command.userVisible !== false,
        hostVisible: command.hostVisible !== false,
        modelVisible: command.modelVisible === true,
        resultListVisible: command.resultListVisible !== false,
        group: "plugins"
      },
      provenance: { pluginId: manifest.id, version: manifest.version, source: manifest.source, integrity: manifest.integrity },
      compatibility: isJsonObject(command.compatibility) ? { ...command.compatibility, schemaVersion: stringField(command.compatibility.schemaVersion, COMMAND_COMPOSITION_SCHEMA_VERSION) } : { schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION },
      redaction: { class: "internal" },
      referencePitFixtureIds
    });
  });
}

export function extensionContributionToCompositionRecord(contribution: CommandCompositionContribution): CommandCompositionRecord {
  const pits = contribution.referencePitFixtureIds ?? ["pit.legacy-contribution-normalization.manifest-boundary"];
  return contributionToCompositionRecord({
    ...contribution,
    ownerSubsystem: contribution.ownerSubsystem || "extension-system",
    source: { ...contribution.source, kind: contribution.source.kind || "extension" },
    referencePitFixtureIds: pits.includes("pit.legacy-contribution-normalization.manifest-boundary") ? pits : [...pits, "pit.legacy-contribution-normalization.manifest-boundary"]
  });
}

export function workflowSuggestionToCompositionRecord(input: {
  readonly id: string;
  readonly displayName: string;
  readonly source?: CommandCompositionContribution["source"];
  readonly permissions?: readonly string[];
  readonly referencePitFixtureIds?: readonly string[];
}): CommandCompositionRecord {
  return contributionToCompositionRecord({
    kind: "workflow",
    ownerSubsystem: "workflow-orchestration",
    source: input.source ?? { kind: "built-in", id: "workflow-orchestration", trust: "trusted" },
    target: { kind: "workflow", id: `workflow:${input.id}` },
    displayName: input.displayName,
    permissions: input.permissions ?? [],
    sideEffect: "process",
    projection: { userVisible: true, hostVisible: true, modelVisible: false, resultListVisible: true, group: "workflows" },
    referencePitFixtureIds: input.referencePitFixtureIds ?? ["pit.legacy-contribution-normalization.manifest-boundary"]
  });
}

export function rendererHintToCompositionRecord(input: {
  readonly id: string;
  readonly displayName: string;
  readonly source?: CommandCompositionContribution["source"];
}): CommandCompositionRecord {
  return contributionToCompositionRecord({
    kind: "renderer-hint",
    ownerSubsystem: "extension-system",
    source: input.source ?? { kind: "extension", id: input.id, trust: "workspace" },
    target: { kind: "renderer-hint", id: `renderer-hint:${input.id}` },
    displayName: input.displayName,
    sideEffect: "host-render",
    projection: { userVisible: false, hostVisible: true, modelVisible: false, resultListVisible: false, hostOnly: true, group: "renderers" },
    referencePitFixtureIds: ["pit.legacy-contribution-normalization.manifest-boundary"]
  });
}

function compatibility(value: JsonObject | undefined): CommandCompositionRecord["compatibility"] {
  const schemaVersion = typeof value?.schemaVersion === "string" ? value.schemaVersion : COMMAND_COMPOSITION_SCHEMA_VERSION;
  return { ...value, schemaVersion };
}

function redaction(value: JsonObject | undefined): CommandCompositionRecord["redaction"] {
  const redactionClass = value?.class;
  if (redactionClass === "public" || redactionClass === "internal" || redactionClass === "sensitive" || redactionClass === "secret") {
    return value as CommandCompositionRecord["redaction"];
  }
  return { class: "internal" };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function stringArray(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string");
}
