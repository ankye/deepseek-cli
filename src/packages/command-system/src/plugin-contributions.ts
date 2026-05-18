import type {
  CliInteractionContribution,
  CliPluginActionDescriptor,
  CliPluginContributionExplanation,
  CliTargetRef
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export function explainCliPluginContribution(
  contribution: CliInteractionContribution,
  input: {
    readonly active?: boolean;
    readonly hidden?: boolean;
    readonly degraded?: boolean;
    readonly diagnostics?: readonly string[];
  } = {}
): CliPluginContributionExplanation {
  const namespace = contribution.namespace ?? contribution.pluginId ?? contribution.source;
  const label = contribution.label
    ?? contribution.paletteEntry?.title
    ?? contribution.commandName
    ?? contribution.keymap?.description
    ?? contribution.id;
  const modeScopes = contribution.modeScopes ?? (contribution.keymap ? [contribution.keymap.mode] : []);
  const keymapScopes = contribution.keymapScopes ?? (contribution.keymap ? [contribution.keymap.key] : []);
  const permissions = contribution.permissions ?? stringArray(contribution.metadata?.permissions);
  const sideEffects = contribution.sideEffects ?? stringArray(contribution.metadata?.sideEffect);
  const conflictGroup = contribution.conflictGroup ?? contribution.keymap?.conflictGroup ?? `${contribution.kind}:${namespace}:${label}`;
  const previewText = contribution.previewText ?? contribution.keymap?.preview ?? `${label} (${contribution.kind})`;
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    contributionId: contribution.id,
    ...(contribution.pluginId ? { pluginId: contribution.pluginId } : {}),
    namespace,
    label,
    kind: contribution.kind,
    active: input.active ?? true,
    hidden: input.hidden ?? false,
    degraded: input.degraded ?? false,
    conflictGroup,
    permissions,
    sideEffects,
    modeScopes,
    keymapScopes,
    previewText,
    helpText: contribution.helpText ?? previewText,
    governance: contribution.governance ?? {
      executable: contribution.kind === "command" || contribution.kind === "action",
      directHostAccess: false,
      routesThroughContracts: true
    },
    diagnostics: input.diagnostics ?? [],
    redaction: { class: "internal", fields: ["permissions", "governance"] }
  };
}

export function createCliPluginActionDescriptor(input: {
  readonly contribution: CliInteractionContribution;
  readonly target: CliTargetRef;
  readonly dryRun?: boolean;
}): CliPluginActionDescriptor {
  const explanation = explainCliPluginContribution(input.contribution);
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    kind: "cli.plugin-action",
    contributionId: input.contribution.id,
    ...(input.contribution.pluginId ? { pluginId: input.contribution.pluginId } : {}),
    target: input.target,
    action: input.contribution.action ?? "plugin-action",
    dryRun: input.dryRun ?? true,
    permissions: explanation.permissions,
    sideEffects: explanation.sideEffects,
    governance: {
      ...explanation.governance,
      directProcessExecution: false,
      directFilesystemExecution: false,
      directModelExecution: false,
      directMcpExecution: false,
      directHookExecution: false
    },
    redaction: { class: "internal", fields: ["permissions", "governance"] }
  };
}

function stringArray(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
}

