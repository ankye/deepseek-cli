import type {
  JsonObject,
  PluginApiLevel,
  PluginConflictRecord,
  PluginContributionDescriptor,
  PluginContributionKind,
  PluginContributionProjection,
  PluginContributionSideEffect,
  PluginDependencyDescriptor,
  PluginDependencyResolution,
  PluginForbiddenApiKind,
  PluginLifecycleState,
  PluginLifecycleTransition,
  PluginLifecycleTrigger,
  PluginManifest,
  PluginPolicyDecisionSummary,
  RedactedError,
  RedactionMetadata
} from "@deepseek/platform-contracts";

export interface PluginManifestValidationOptions {
  readonly requiredSource?: string;
  readonly requireSha256Integrity?: boolean;
  readonly requireCommands?: boolean;
  readonly allowedApiLevels?: readonly PluginApiLevel[];
}

export interface CreatePluginLifecycleTransitionInput {
  readonly manifest: PluginManifest;
  readonly previousState?: PluginLifecycleState | undefined;
  readonly nextState: PluginLifecycleState;
  readonly trigger: PluginLifecycleTrigger;
  readonly actor: string;
  readonly reason: string;
  readonly policyDecision?: PluginPolicyDecisionSummary;
  readonly dependencyDecision?: PluginDependencyResolution;
  readonly compatibilityDecision?: PluginLifecycleTransition["compatibilityDecision"];
  readonly hookDecisions?: PluginLifecycleTransition["hookDecisions"];
  readonly diagnostics?: readonly RedactedError[];
  readonly audit?: JsonObject;
}

export interface PluginLifecyclePathOptions {
  readonly includeUpdateAndRollback?: boolean;
  readonly includeHealthCheck?: boolean;
  readonly actor?: string;
}

export interface PluginDiagnosticSurfaceProjection extends JsonObject {
  readonly schemaVersion: string;
  readonly cliText: string;
  readonly json: JsonObject;
  readonly jsonl: string;
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
}

export const PLUGIN_LIFECYCLE_STATES: readonly PluginLifecycleState[] = [
  "discovered",
  "validated",
  "resolved",
  "installed",
  "enabled",
  "activated",
  "degraded",
  "disabled",
  "uninstalled",
  "quarantined",
  "update-staged",
  "updated",
  "rollback-ready",
  "rolled-back",
  "health-checked"
];

export const PLUGIN_CONTRIBUTION_KINDS: readonly PluginContributionKind[] = [
  "command",
  "action",
  "target-resolver",
  "result-list-provider",
  "keymap",
  "palette-entry",
  "render-hint",
  "hook",
  "skill",
  "tool",
  "mcp-connector",
  "agent",
  "context-provider",
  "memory-provider",
  "cache-provider",
  "workflow-template",
  "model-profile",
  "config-fragment",
  "diagnostics-provider",
  "resource-bundle",
  "other"
];

export const PLUGIN_API_LEVELS: readonly PluginApiLevel[] = [
  "manifest",
  "declarative-author",
  "governed-runtime",
  "host-projection",
  "test-harness"
];

export const CATALOG_OWNER_BY_KIND: Record<PluginContributionKind, string> = {
  command: "command-system",
  action: "command-system",
  "target-resolver": "workspace-state",
  "result-list-provider": "result-list-system",
  keymap: "cli-tui",
  "palette-entry": "cli-palette",
  "render-hint": "host-projection",
  hook: "hook-system",
  skill: "skill-system",
  tool: "tool-system",
  "mcp-connector": "mcp-gateway",
  agent: "agent-management",
  "context-provider": "context-engine",
  "memory-provider": "memory-cache",
  "cache-provider": "memory-cache",
  "workflow-template": "workflow-orchestration",
  "model-profile": "model-gateway",
  "config-fragment": "config-system",
  "diagnostics-provider": "diagnostics",
  "resource-bundle": "resource-system",
  other: "plugin-system"
};

export const INACTIVE_CATALOG_KINDS = new Set<PluginContributionKind>([
  "mcp-connector",
  "agent",
  "memory-provider",
  "cache-provider",
  "model-profile",
  "config-fragment",
  "resource-bundle",
  "other"
]);

export const FORBIDDEN_KEY_KINDS: Readonly<Record<string, PluginForbiddenApiKind>> = {
  callback: "host-callback",
  hostCallback: "host-callback",
  onRender: "host-callback",
  mutateLayout: "host-layout-mutation",
  lifecycleCallbacks: "lifecycle-callback",
  onInstall: "lifecycle-callback",
  onEnable: "lifecycle-callback",
  onActivate: "lifecycle-callback",
  onDisable: "lifecycle-callback",
  onUninstall: "lifecycle-callback",
  handler: "private-execution",
  execute: "private-execution",
  runtimeHandle: "runtime-handle",
  rawCredential: "raw-credential-access",
  rawCredentials: "raw-credential-access",
  credentialResolver: "raw-credential-access",
  fs: "filesystem-primitive",
  filesystem: "filesystem-primitive",
  process: "process-primitive",
  childProcess: "process-primitive",
  network: "network-primitive",
  fetch: "network-primitive",
  modelSdk: "model-provider-client",
  modelClient: "model-provider-client",
  ownerRoute: "undeclared-owner-route"
};

export const FORBIDDEN_IMPORT_KINDS: Readonly<Record<string, PluginForbiddenApiKind>> = {
  fs: "filesystem-primitive",
  "node:fs": "filesystem-primitive",
  "node:fs/promises": "filesystem-primitive",
  child_process: "process-primitive",
  "node:child_process": "process-primitive",
  process: "process-primitive",
  net: "network-primitive",
  "node:net": "network-primitive",
  http: "network-primitive",
  https: "network-primitive",
  "@deepseek/runtime": "runtime-internal-import",
  "@deepseek/apps-cli": "cli-internal-import",
  "@deepseek/cli": "cli-internal-import",
  openai: "model-provider-client",
  "@anthropic-ai/sdk": "model-provider-client"
};

export const PUBLIC_REDACTION: RedactionMetadata = { class: "public" };
export const DEFAULT_SCHEMA: JsonObject = { type: "object" };
export const DEFAULT_PROJECTION: PluginContributionProjection = {
  visibility: "visible",
  hosts: ["cli", "cli-tui", "json", "jsonl", "diagnostics"],
  hostOwnsLayout: true
};

export function sortPluginManifestsById(manifests: readonly PluginManifest[]): readonly PluginManifest[] {
  return [...manifests].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export function hasCommandContributions(manifest: PluginManifest): boolean {
  return Array.isArray(manifest.contributions.commands) && manifest.contributions.commands.length > 0;
}

export function dependenciesFor(manifest: PluginManifest): readonly PluginDependencyDescriptor[] {
  return [...(manifest.dependencies ?? []), ...(manifest.optionalDependencies ?? []).map((dependency) => ({ ...dependency, optional: true }))];
}

export function getContributionDescriptors(manifest: PluginManifest): readonly PluginContributionDescriptor[] {
  const descriptors = manifest.contributions.contributionDescriptors;
  if (!Array.isArray(descriptors)) return [];
  return descriptors.filter(isContributionDescriptor);
}

export function isContributionDescriptor(value: unknown): value is PluginContributionDescriptor {
  return isJsonObject(value) && typeof value.id === "string" && typeof value.kind === "string" && typeof value.ownerSubsystem === "string";
}

export function contributionConflictKindForDescriptor(descriptor: PluginContributionDescriptor): PluginConflictRecord["conflictKind"] {
  switch (descriptor.kind) {
    case "command":
      return "command-id";
    case "keymap":
      return "keymap";
    case "palette-entry":
      return "palette-title";
    case "target-resolver":
      return "target-resolver";
    case "render-hint":
      return "render-hint";
    case "hook":
      return "hook-ordering";
    case "config-fragment":
      return "config-fragment";
    case "context-provider":
    case "memory-provider":
    case "cache-provider":
    case "diagnostics-provider":
      return "provider-id";
    default:
      return "other";
  }
}

export function defaultApiLevelForKind(kind: PluginContributionKind): PluginApiLevel {
  if (kind === "render-hint" || kind === "resource-bundle") return "host-projection";
  return "declarative-author";
}

export function defaultSideEffectForKind(kind: PluginContributionKind): PluginContributionSideEffect {
  switch (kind) {
    case "render-hint":
      return "host-render";
    case "mcp-connector":
      return "network";
    case "model-profile":
      return "model";
    case "tool":
    case "agent":
      return "mixed";
    case "config-fragment":
    case "keymap":
    case "palette-entry":
    case "resource-bundle":
      return "none";
    default:
      return "read";
  }
}

export function stringMetadata(descriptor: PluginContributionDescriptor, key: string): string | undefined {
  return stringJsonValue(descriptor.metadata?.[key]);
}

export function numberMetadata(descriptor: PluginContributionDescriptor, key: string): number | undefined {
  const value = descriptor.metadata?.[key];
  return typeof value === "number" ? value : undefined;
}

export function stringJsonValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pluginValidationError(code: string, message: string, details: JsonObject): RedactedError {
  return { code, message, retryable: false, redaction: PUBLIC_REDACTION, details };
}

export function replayFingerprint(value: unknown): string {
  return stableStringify(value);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(",")}}`;
}
