import type {
  CliActionKind,
  CliInteractionMode,
  CliTargetKind,
  CommandCompositionSideEffect,
  ExtensionCredentialRequirement,
  JsonObject,
  PluginActivationCondition,
  PluginApiAvailability,
  PluginApiCompatibilityMetadata,
  PluginApiLevel,
  PluginApiLevelUsage,
  PluginContributionDescriptor,
  PluginContributionKind,
  PluginContributionProjection,
  PluginContributionSideEffect,
  PluginManifest,
  PluginProjectionHost
} from "@deepseek/platform-contracts";
import { COMMAND_COMPOSITION_SCHEMA_VERSION, PLUGIN_PLATFORM_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

export const PLUGIN_AUTHOR_API_VERSION = "0.1.0";

const DEFAULT_PLUGIN_ID = "@deepseek/unbound-plugin-descriptor";
const DEFAULT_SCHEMA: JsonObject = { type: "object" };
const DEFAULT_PROJECTION_HOSTS: readonly PluginProjectionHost[] = ["cli", "cli-tui", "json", "jsonl", "diagnostics"];

export interface PluginCommandContribution extends JsonObject {
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

export interface PluginCommandInput {
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

export interface PluginPaletteEntry extends JsonObject {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly targetKind: string;
}

export interface PluginResultListProvider extends JsonObject {
  readonly id: string;
  readonly targetKinds: readonly string[];
}

export interface PluginKeymapContribution extends JsonObject {
  readonly id: string;
  readonly mode: CliInteractionMode;
  readonly key: string;
  readonly action: CliActionKind;
  readonly targetKind: CliTargetKind;
  readonly namespace: string;
  readonly sequence?: readonly string[];
  readonly helpText?: string;
  readonly previewText?: string;
}

export interface PluginRendererHint extends JsonObject {
  readonly id: string;
  readonly host: string;
  readonly placement: string;
}

export interface PluginReasoningContribution extends JsonObject {
  readonly id: string;
  readonly stepKind: string;
  readonly detailLevel: string;
  readonly evidenceKinds: readonly string[];
}

export interface PluginCatalogContributionInput {
  readonly id: string;
  readonly kind: PluginContributionKind;
  readonly ownerSubsystem: string;
  readonly name?: string;
  readonly description?: string;
  readonly apiLevel?: PluginApiLevel;
  readonly status?: PluginApiAvailability;
  readonly sideEffect?: PluginContributionSideEffect | CommandCompositionSideEffect;
  readonly permissions?: readonly string[];
  readonly inputSchema?: JsonObject;
  readonly outputSchema?: JsonObject;
  readonly activation?: Partial<PluginActivationCondition>;
  readonly projection?: Partial<PluginContributionProjection>;
  readonly compatibility?: Partial<PluginApiCompatibilityMetadata>;
  readonly metadata?: JsonObject;
}

export type PluginCatalogContributionBuilderInput =
  Omit<PluginCatalogContributionInput, "kind" | "ownerSubsystem"> & { readonly ownerSubsystem?: string };

export interface DefinePluginInput {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly credentialRequirements?: readonly ExtensionCredentialRequirement[];
  readonly packId?: string;
  readonly apiLevels?: readonly PluginApiLevelUsage[];
  readonly compatibility?: PluginApiCompatibilityMetadata;
  readonly commands?: readonly PluginCommandContribution[];
  readonly actions?: readonly PluginContributionDescriptor[];
  readonly targetResolvers?: readonly PluginContributionDescriptor[];
  readonly paletteEntries?: readonly PluginPaletteEntry[];
  readonly resultListProviders?: readonly PluginResultListProvider[];
  readonly keymaps?: readonly PluginKeymapContribution[];
  readonly rendererHints?: readonly PluginRendererHint[];
  readonly hooks?: readonly PluginContributionDescriptor[];
  readonly skills?: readonly PluginContributionDescriptor[];
  readonly tools?: readonly PluginContributionDescriptor[];
  readonly mcpConnectors?: readonly PluginContributionDescriptor[];
  readonly agents?: readonly PluginContributionDescriptor[];
  readonly contextProviders?: readonly PluginContributionDescriptor[];
  readonly memoryProviders?: readonly PluginContributionDescriptor[];
  readonly cacheProviders?: readonly PluginContributionDescriptor[];
  readonly workflowTemplates?: readonly PluginContributionDescriptor[];
  readonly modelProfiles?: readonly PluginContributionDescriptor[];
  readonly configFragments?: readonly PluginContributionDescriptor[];
  readonly diagnosticsProviders?: readonly PluginContributionDescriptor[];
  readonly resourceBundles?: readonly PluginContributionDescriptor[];
  readonly contributionDescriptors?: readonly PluginContributionDescriptor[];
  readonly reasoningContributions?: readonly PluginReasoningContribution[];
  readonly metadata?: JsonObject;
}

export type DefineBuiltinPluginInput = Omit<DefinePluginInput, "source">;

export function definePlugin(input: DefinePluginInput): PluginManifest {
  const apiLevels = input.apiLevels ?? defaultApiLevels(input.source);
  const descriptors = normalizeContributionDescriptors(input);
  return {
    id: asId<"plugin">(input.id),
    name: input.name,
    version: input.version,
    source: input.source,
    integrity: input.integrity,
    permissions: input.permissions,
    ...(input.credentialRequirements ? { credentialRequirements: input.credentialRequirements } : {}),
    apiLevels,
    compatibility: input.compatibility ?? activeCompatibility("manifest", "plugin-system"),
    contributions: {
      schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
      pluginPlatformSchemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
      pluginApiVersion: PLUGIN_AUTHOR_API_VERSION,
      apiLevels,
      ...(input.packId ? { packId: input.packId } : {}),
      commands: input.commands ?? [],
      actions: input.actions ?? [],
      targetResolvers: input.targetResolvers ?? [],
      paletteEntries: input.paletteEntries ?? [],
      resultListProviders: input.resultListProviders ?? [],
      keymaps: input.keymaps ?? [],
      rendererHints: input.rendererHints ?? [],
      hooks: input.hooks ?? [],
      skills: input.skills ?? [],
      tools: input.tools ?? [],
      mcpConnectors: input.mcpConnectors ?? [],
      agents: input.agents ?? [],
      contextProviders: input.contextProviders ?? [],
      memoryProviders: input.memoryProviders ?? [],
      cacheProviders: input.cacheProviders ?? [],
      workflowTemplates: input.workflowTemplates ?? [],
      modelProfiles: input.modelProfiles ?? [],
      configFragments: input.configFragments ?? [],
      diagnosticsProviders: input.diagnosticsProviders ?? [],
      resourceBundles: input.resourceBundles ?? [],
      contributionDescriptors: descriptors,
      reasoningContributions: input.reasoningContributions ?? [],
      metadata: input.metadata ?? {}
    }
  };
}

export function defineBuiltinPlugin(input: DefineBuiltinPluginInput): PluginManifest {
  return definePlugin({ ...input, source: "built-in" });
}

export function command(input: PluginCommandInput): PluginCommandContribution {
  return {
    id: input.id,
    name: input.name,
    aliases: input.aliases,
    description: input.description,
    ownerSubsystem: input.ownerSubsystem,
    commandId: input.commandId,
    sideEffect: input.sideEffect,
    permissions: input.permissions,
    group: input.group,
    order: input.order,
    inputSchema: input.inputSchema,
    outputSchema: input.outputSchema,
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}

export function contributionDescriptor(input: PluginCatalogContributionInput): PluginContributionDescriptor {
  return createContributionDescriptor(input, DEFAULT_PLUGIN_ID, "0.0.0", "author-api");
}

export function action(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "action", ownerSubsystem: input.ownerSubsystem ?? "command-system" });
}

export function targetResolver(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "target-resolver", ownerSubsystem: input.ownerSubsystem ?? "workspace-state" });
}

export function hookContribution(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "hook", ownerSubsystem: input.ownerSubsystem ?? "hook-system" });
}

export function skillContribution(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "skill", ownerSubsystem: input.ownerSubsystem ?? "skill-system" });
}

export function toolContribution(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "tool", ownerSubsystem: input.ownerSubsystem ?? "tool-system" });
}

export function mcpConnector(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "mcp-connector", ownerSubsystem: input.ownerSubsystem ?? "mcp-gateway" });
}

export function agentContribution(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "agent", ownerSubsystem: input.ownerSubsystem ?? "agent-management" });
}

export function contextProvider(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "context-provider", ownerSubsystem: input.ownerSubsystem ?? "context-engine" });
}

export function memoryProvider(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "memory-provider", ownerSubsystem: input.ownerSubsystem ?? "memory-cache" });
}

export function cacheProvider(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "cache-provider", ownerSubsystem: input.ownerSubsystem ?? "memory-cache" });
}

export function workflowTemplate(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "workflow-template", ownerSubsystem: input.ownerSubsystem ?? "workflow-orchestration" });
}

export function modelProfile(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "model-profile", ownerSubsystem: input.ownerSubsystem ?? "model-gateway" });
}

export function configFragment(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "config-fragment", ownerSubsystem: input.ownerSubsystem ?? "config-system" });
}

export function diagnosticsProvider(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "diagnostics-provider", ownerSubsystem: input.ownerSubsystem ?? "diagnostics" });
}

export function resourceBundle(input: PluginCatalogContributionBuilderInput): PluginContributionDescriptor {
  return contributionDescriptor({ ...input, kind: "resource-bundle", ownerSubsystem: input.ownerSubsystem ?? "resource-system" });
}

export function paletteEntry(input: PluginPaletteEntry): PluginPaletteEntry {
  return input;
}

export function resultListProvider(input: PluginResultListProvider): PluginResultListProvider {
  return input;
}

export function keymap(input: PluginKeymapContribution): PluginKeymapContribution {
  return input;
}

export function rendererHint(input: PluginRendererHint): PluginRendererHint {
  return input;
}

export function reasoningContribution(input: PluginReasoningContribution): PluginReasoningContribution {
  return input;
}

export function defaultApiLevels(source: string): readonly PluginApiLevelUsage[] {
  return [
    apiLevelUsage("manifest", source, "active", true),
    apiLevelUsage("declarative-author", source, "active", true)
  ];
}

function normalizeContributionDescriptors(input: DefinePluginInput): readonly PluginContributionDescriptor[] {
  const pluginId = input.id;
  const pluginVersion = input.version;
  const source = input.source;
  return [
    ...(input.contributionDescriptors ?? []).map((descriptor) => stampDescriptor(descriptor, pluginId, pluginVersion, source)),
    ...(input.commands ?? []).map((item) =>
      createContributionDescriptor(
        {
          id: item.id,
          kind: "command",
          ownerSubsystem: item.ownerSubsystem,
          sideEffect: item.sideEffect,
          permissions: item.permissions,
          inputSchema: item.inputSchema,
          outputSchema: item.outputSchema,
          metadata: { commandId: item.commandId, aliases: item.aliases, group: item.group, order: item.order }
        },
        pluginId,
        pluginVersion,
        source
      )
    ),
    ...(input.actions ?? []).map((descriptor) => stampDescriptor(descriptor, pluginId, pluginVersion, source)),
    ...(input.targetResolvers ?? []).map((descriptor) => stampDescriptor(descriptor, pluginId, pluginVersion, source)),
    ...(input.resultListProviders ?? []).map((item) =>
      createContributionDescriptor(
        {
          id: item.id,
          kind: "result-list-provider",
          ownerSubsystem: "result-list-system",
          sideEffect: "read",
          permissions: [],
          metadata: { targetKinds: item.targetKinds }
        },
        pluginId,
        pluginVersion,
        source
      )
    ),
    ...(input.keymaps ?? []).map((item) =>
      createContributionDescriptor(
        {
          id: item.id,
          kind: "keymap",
          ownerSubsystem: "cli-tui",
          sideEffect: "none",
          permissions: [],
          metadata: { mode: item.mode, key: item.key, action: item.action, targetKind: item.targetKind, namespace: item.namespace }
        },
        pluginId,
        pluginVersion,
        source
      )
    ),
    ...(input.paletteEntries ?? []).map((item) =>
      createContributionDescriptor(
        {
          id: item.id,
          kind: "palette-entry",
          ownerSubsystem: "cli-palette",
          sideEffect: "none",
          permissions: [],
          metadata: { title: item.title, category: item.category, targetKind: item.targetKind }
        },
        pluginId,
        pluginVersion,
        source
      )
    ),
    ...(input.rendererHints ?? []).map((item) =>
      createContributionDescriptor(
        {
          id: item.id,
          kind: "render-hint",
          ownerSubsystem: "host-projection",
          apiLevel: "host-projection",
          sideEffect: "host-render",
          permissions: [],
          projection: { hosts: [item.host], surface: item.placement, visibility: "visible" },
          metadata: { host: item.host, placement: item.placement }
        },
        pluginId,
        pluginVersion,
        source
      )
    ),
    ...descriptorList(input.hooks, pluginId, pluginVersion, source),
    ...descriptorList(input.skills, pluginId, pluginVersion, source),
    ...descriptorList(input.tools, pluginId, pluginVersion, source),
    ...descriptorList(input.mcpConnectors, pluginId, pluginVersion, source),
    ...descriptorList(input.agents, pluginId, pluginVersion, source),
    ...descriptorList(input.contextProviders, pluginId, pluginVersion, source),
    ...descriptorList(input.memoryProviders, pluginId, pluginVersion, source),
    ...descriptorList(input.cacheProviders, pluginId, pluginVersion, source),
    ...descriptorList(input.workflowTemplates, pluginId, pluginVersion, source),
    ...descriptorList(input.modelProfiles, pluginId, pluginVersion, source),
    ...descriptorList(input.configFragments, pluginId, pluginVersion, source),
    ...descriptorList(input.diagnosticsProviders, pluginId, pluginVersion, source),
    ...descriptorList(input.resourceBundles, pluginId, pluginVersion, source)
  ];
}

function descriptorList(
  descriptors: readonly PluginContributionDescriptor[] | undefined,
  pluginId: string,
  pluginVersion: string,
  source: string
): readonly PluginContributionDescriptor[] {
  return (descriptors ?? []).map((descriptor) => stampDescriptor(descriptor, pluginId, pluginVersion, source));
}

function createContributionDescriptor(
  input: PluginCatalogContributionInput,
  pluginId: string,
  pluginVersion: string,
  source: string
): PluginContributionDescriptor {
  const apiLevel = input.apiLevel ?? defaultApiLevelForKind(input.kind);
  const status = input.status ?? defaultStatusForKind(input.kind);
  const ownerSubsystem = input.ownerSubsystem;
  const sideEffect = normalizeSideEffect(input.sideEffect ?? "none");
  const compatibility = {
    ...activeCompatibility(apiLevel, ownerSubsystem, status),
    ...(input.compatibility ?? {})
  };
  return {
    id: input.id,
    kind: input.kind,
    apiLevel,
    ownerSubsystem,
    inputSchema: input.inputSchema ?? DEFAULT_SCHEMA,
    outputSchema: input.outputSchema ?? DEFAULT_SCHEMA,
    permissions: input.permissions ?? [],
    sideEffect,
    source,
    provenance: {
      pluginId: asId<"plugin">(pluginId),
      pluginVersion,
      source
    },
    compatibility,
    activation: {
      lifecycleState: "activated",
      ...(input.activation ?? {})
    },
    projection: {
      visibility: status === "active" ? "visible" : "inactive",
      hosts: DEFAULT_PROJECTION_HOSTS,
      hostOwnsLayout: true,
      ...(input.projection ?? {})
    },
    diagnostics: [],
    replayFingerprint: `${pluginId}:${pluginVersion}:${input.kind}:${input.id}:${status}`,
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}

function stampDescriptor(
  descriptor: PluginContributionDescriptor,
  pluginId: string,
  pluginVersion: string,
  source: string
): PluginContributionDescriptor {
  return {
    ...descriptor,
    source,
    provenance: {
      ...descriptor.provenance,
      pluginId: asId<"plugin">(pluginId),
      pluginVersion,
      source
    },
    replayFingerprint: `${pluginId}:${pluginVersion}:${descriptor.kind}:${descriptor.id}:${descriptor.compatibility.status}`
  };
}

function apiLevelUsage(
  level: PluginApiLevel,
  source: string,
  status: PluginApiAvailability,
  allowed: boolean
): PluginApiLevelUsage {
  return {
    level,
    version: PLUGIN_AUTHOR_API_VERSION,
    status,
    allowed,
    source,
    compatibility: activeCompatibility(level, "plugin-system", status),
    diagnostics: []
  };
}

function activeCompatibility(
  apiLevel: PluginApiLevel,
  ownerSubsystem: string,
  status: PluginApiAvailability = "active"
): PluginApiCompatibilityMetadata {
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    apiLevel,
    ownerSubsystem,
    status,
    activationAllowed: status === "active" || status === "deprecated" || status === "experimental",
    optInRequired: status === "experimental" || status === "host-gated"
  };
}

function defaultApiLevelForKind(kind: PluginContributionKind): PluginApiLevel {
  if (kind === "render-hint") return "host-projection";
  if (kind === "resource-bundle") return "host-projection";
  return "declarative-author";
}

function defaultStatusForKind(kind: PluginContributionKind): PluginApiAvailability {
  switch (kind) {
    case "command":
    case "action":
    case "target-resolver":
    case "result-list-provider":
    case "keymap":
    case "palette-entry":
    case "render-hint":
    case "hook":
    case "skill":
    case "tool":
    case "context-provider":
    case "workflow-template":
    case "diagnostics-provider":
      return "active";
    default:
      return "inactive";
  }
}

function normalizeSideEffect(sideEffect: CommandCompositionSideEffect | PluginContributionSideEffect): PluginContributionSideEffect {
  switch (sideEffect) {
    case "none":
    case "read":
    case "write":
    case "network":
    case "process":
    case "host-render":
      return sideEffect;
    case "workspace-metadata":
      return "read";
    default:
      return "mixed";
  }
}
