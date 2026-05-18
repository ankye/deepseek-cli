import type {
  ExtensionCredentialScopeDiagnostic,
  ExtensionManagementActionHint,
  ExtensionManagementItem,
  ExtensionManagementRecord,
  ExtensionManagementStatus,
  ExtensionPermissionDiffRecord,
  JsonObject,
  McpServerManifest,
  PluginLockfile,
  PluginManifest,
  RedactedError,
  SkillManifest,
  SkillSummary,
  StoredCredentialReference
} from "@deepseek/platform-contracts";
import {
  EXTENSION_MANAGEMENT_SCHEMA_VERSION,
  MCP_SCHEMA_VERSION,
  SKILL_SCHEMA_VERSION,
  asId
} from "@deepseek/platform-contracts";
import { createDeepSeekCredentialAuthServiceFromEnv, deepSeekLiveCredentialProcessEnv } from "@deepseek/credential-auth-management";
import { listFirstPartyDevPluginManifests, snapshotFirstPartyDevPluginPack } from "@deepseek/first-party-dev-plugins";
import { InMemoryMcpGateway, createRealMcpAdapter } from "@deepseek/mcp-gateway";
import { InMemoryPluginManager, NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { InMemorySkillSystem } from "@deepseek/skill-system";
import type { CliOptions } from "../types.js";

const pitPermissionDiff = "pit.extension-permission-expansion.permission-diff";
const pitMcpPluginPrecedence = "pit.mcp-plugin-precedence.enterprise-deny";
const pitEnvSnapshot = "pit.env-snapshot.immutable-startup";
const pitDiagnosticRedaction = "pit.diagnostic-redaction.support-bundle";
const pitContributionBoundary = "pit.legacy-contribution-normalization.manifest-boundary";

export async function runExtensionCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  const record = await createExtensionManagementRecord(options);
  for (const line of renderExtensionRecord(record, options.output)) {
    await write(line);
  }
}

export async function createExtensionManagementRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const command = options.extensionCommand ?? "extension.list";
  try {
    if (command === "extension.plugin.install") return pluginInstallRecord(options);
    if (command === "extension.plugin.verify") return pluginVerifyRecord(options);
    if (command === "extension.plugin.snapshot") return pluginSnapshotRecord();
    if (command === "extension.plugin.apply-lockfile") return pluginApplyLockfileRecord(options);
    if (command === "extension.skill.list") return skillListRecord();
    if (command === "extension.skill.activate") return skillActivateRecord(options);
    if (command === "extension.auth.scopes") return authScopesRecord(options);
    if (command === "extension.mcp.test") return mcpTestRecord(options);
    return extensionListRecord();
  } catch (error) {
    return baseRecord(command, "failed", error instanceof Error ? error.message : "Extension command failed.", {
      diagnostics: [diagnostic("EXTENSION_COMMAND_FAILED", error instanceof Error ? error.message : String(error))]
    });
  }
}

function renderExtensionRecord(record: ExtensionManagementRecord, output: CliOptions["output"]): readonly string[] {
  const safeRecord = redactRecord(record);
  if (output === "json") return [JSON.stringify(safeRecord)];
  if (output === "jsonl") {
    return [
      JSON.stringify({ kind: `${safeRecord.kind}.summary`, record: safeRecord }),
      ...safeRecord.items.map((item) => JSON.stringify({ kind: "extension.item", item })),
      ...safeRecord.permissionDiffs.map((diff) => JSON.stringify({ kind: "extension.permission-diff", diff })),
      ...(safeRecord.authDiffs ?? []).map((diff) => JSON.stringify({ kind: "extension.auth-diff", diff })),
      ...(safeRecord.authReadiness ?? []).map((auth) => JSON.stringify({ kind: "extension.auth-readiness", auth })),
      ...safeRecord.credentialScopes.map((scope) => JSON.stringify({ kind: "extension.credential-scope", scope })),
      ...safeRecord.lifecycle.map((step) => JSON.stringify({ kind: "extension.lifecycle", step }))
    ];
  }
  const lines = [`[${safeRecord.kind}] ${safeRecord.status}: ${safeRecord.summary}`];
  for (const item of safeRecord.items) {
    lines.push(`  - ${item.targetKind} ${item.targetId}: ${item.summary}`);
  }
  for (const diff of safeRecord.permissionDiffs) {
    lines.push(`  permission-diff ${diff.targetId}: +${diff.added.length} -${diff.removed.length}`);
    if (diff.added.length > 0) lines.push(`    added: ${diff.added.join(", ")}`);
    if (diff.removed.length > 0) lines.push(`    removed: ${diff.removed.join(", ")}`);
    if (diff.referencePitFixtureIds.length > 0) lines.push(`    pits: ${diff.referencePitFixtureIds.join(", ")}`);
  }
  for (const diff of safeRecord.authDiffs ?? []) {
    lines.push(`  auth-diff: +${diff.added.length} -${diff.removed.length}`);
    if (diff.referencePitFixtureIds.length > 0) lines.push(`    pits: ${diff.referencePitFixtureIds.join(", ")}`);
  }
  for (const auth of safeRecord.authReadiness ?? []) {
    lines.push(`  auth-readiness ${auth.owner.kind}:${auth.owner.id}: ${auth.status}`);
  }
  for (const scope of safeRecord.credentialScopes) {
    lines.push(`  credential ${scope.targetId}: ${scope.status} source=${scope.source} available=${String(scope.available)}`);
  }
  if (safeRecord.referencePitFixtureIds.length > 0) {
    lines.push(`  pits: ${safeRecord.referencePitFixtureIds.join(", ")}`);
  }
  for (const error of safeRecord.diagnostics) {
    lines.push(`  diagnostic ${error.code}: ${error.message}`);
  }
  return lines;
}

async function extensionListRecord(): Promise<ExtensionManagementRecord> {
  const skills = await (await defaultSkillSystem()).listSummaries();
  const credentialScopes = await credentialScopeDiagnostics(undefined);
  const firstPartyPlugins = listFirstPartyDevPluginManifests();
  const firstPartySnapshot = snapshotFirstPartyDevPluginPack();
  const items: ExtensionManagementItem[] = [
    ...firstPartyPlugins.map((manifest) => pluginItem(manifest)),
    ...skills.map((summary) => skillItem(summary)),
    ...credentialScopes.map(credentialItem),
    contributionItem("contribution:first-party-dev-plugins", "first-party-dev-plugins", ["commands", "palette", "tui", "context"]),
    contributionItem("contribution:plugin-system", "plugin-system", ["plugin", "lockfile", "permission-diff"]),
    contributionItem("contribution:mcp-gateway", "mcp-gateway", ["mcp", "tools", "resources"])
  ];
  return baseRecord("extension.list", "completed", `listed ${items.length} extension management items`, {
    items,
    credentialScopes,
    lifecycle: [lifecycle("first-party-dev-plugins.snapshot", "plugin-pack:deepseek.first-party-dev-plugins", "completed", firstPartySnapshot)],
    referencePitFixtureIds: [pitMcpPluginPrecedence, pitContributionBoundary, pitEnvSnapshot, pitDiagnosticRedaction]
  });
}

async function pluginInstallRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const manifest = await readJsonInput<PluginManifest>(inputPath(options), "PLUGIN_MANIFEST_PATH_REQUIRED");
  const manager = new InMemoryPluginManager();
  const result = await manager.install(manifest);
  const diff = permissionDiff(manifest.id, result.diff.added, result.diff.removed);
  return baseRecord("extension.plugin.install", "completed", `installed plugin ${manifest.id}`, {
    items: [pluginItem(manifest, result.lockEntry.installedAt)],
    permissionDiffs: [diff],
    authDiffs: result.authDiff ? [result.authDiff] : [],
    authReadiness: result.authReadiness ? [result.authReadiness] : [],
    lifecycle: [lifecycle("plugin.install", `plugin:${manifest.id}`, "completed", { lockEntry: toJsonObject(result.lockEntry), authDiff: result.authDiff ? toJsonObject(result.authDiff) : undefined })],
    referencePitFixtureIds: [...new Set([...pitIdsForDiff(diff), ...(result.authDiff?.referencePitFixtureIds ?? [])])]
  });
}

async function pluginVerifyRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const manifest = await readJsonInput<PluginManifest>(inputPath(options), "PLUGIN_MANIFEST_PATH_REQUIRED");
  const manager = new InMemoryPluginManager();
  const verdict = await manager.verify(manifest);
  return baseRecord("extension.plugin.verify", verdict.ok ? "completed" : "failed", verdict.ok ? `verified plugin ${manifest.id}` : `plugin ${manifest.id} failed integrity verification`, {
    items: [pluginItem(manifest)],
    lifecycle: [lifecycle("plugin.verify", `plugin:${manifest.id}`, verdict.ok ? "completed" : "failed", { verdict })],
    diagnostics: verdict.ok ? [] : [diagnostic("PLUGIN_INTEGRITY_MISMATCH", "Plugin integrity verification failed.")]
  });
}

async function pluginSnapshotRecord(): Promise<ExtensionManagementRecord> {
  const manager = new InMemoryPluginManager();
  const snapshot = await manager.snapshot();
  return baseRecord("extension.plugin.snapshot", "completed", `snapshot contains ${snapshot.entries.length} plugin entries`, {
    items: snapshot.entries.map((entry) => lockEntryItem(entry.pluginId, entry.version, entry.permissions)),
    lifecycle: [lifecycle("plugin.snapshot", "plugin-lockfile:v1", "completed", { lockfile: toJsonObject(snapshot) })]
  });
}

async function pluginApplyLockfileRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const lockfile = await readJsonInput<PluginLockfile>(inputPath(options), "PLUGIN_LOCKFILE_PATH_REQUIRED");
  const manager = new InMemoryPluginManager();
  const results = await manager.applyLockfile(lockfile);
  const diffs = results.map((result) => permissionDiff(result.lockEntry.pluginId, result.diff.added, result.diff.removed));
  const authDiffs = results.flatMap((result) => result.authDiff ? [result.authDiff] : []);
  return baseRecord("extension.plugin.apply-lockfile", "completed", `applied ${results.length} plugin lockfile entries`, {
    items: results.map((result) => lockEntryItem(result.lockEntry.pluginId, result.lockEntry.version, result.lockEntry.permissions)),
    permissionDiffs: diffs,
    authDiffs,
    lifecycle: results.map((result) => lifecycle("plugin.apply-lockfile", `plugin-lock-entry:${result.lockEntry.pluginId}`, "completed", { lockEntry: toJsonObject(result.lockEntry), authDiff: result.authDiff ? toJsonObject(result.authDiff) : undefined })),
    referencePitFixtureIds: [...new Set([...diffs.flatMap(pitIdsForDiff), ...authDiffs.flatMap((diff) => diff.referencePitFixtureIds)])]
  });
}

async function skillListRecord(): Promise<ExtensionManagementRecord> {
  const summaries = await (await defaultSkillSystem()).listSummaries();
  return baseRecord("extension.skill.list", "completed", `listed ${summaries.length} skills`, {
    items: summaries.map((summary) => skillItem(summary)),
    referencePitFixtureIds: [pitContributionBoundary]
  });
}

async function skillActivateRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const name = typeof options.extensionInput?.name === "string" ? options.extensionInput.name : "repo-summary";
  const system = await defaultSkillSystem();
  const result = await system.activateSkill({
    schemaVersion: SKILL_SCHEMA_VERSION,
    name,
    trigger: "explicit",
    context: {}
  });
  const summary = result.summary;
  return baseRecord("extension.skill.activate", result.status === "activated" ? "completed" : "failed", `skill ${name} ${result.status}`, {
    items: summary ? [skillItem(summary, { segmentCount: result.contextSegments.length, estimatedTokens: sumEstimatedTokens(result.contextSegments) })] : [],
    lifecycle: [lifecycle("skill.activate", `skill:${name}`, result.status === "activated" ? "completed" : "failed", {
      status: result.status,
      segmentCount: result.contextSegments.length,
      estimatedTokens: sumEstimatedTokens(result.contextSegments),
      replayFingerprint: result.replayFingerprint
    })],
    diagnostics: result.diagnostics,
    referencePitFixtureIds: [pitContributionBoundary]
  });
}

async function authScopesRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const manifest = typeof options.extensionInput?.manifestPath === "string"
    ? await readJsonInput<JsonObject>(options.extensionInput.manifestPath, "EXTENSION_AUTH_MANIFEST_READ_FAILED").catch(() => undefined)
    : undefined;
  const credentialScopes = await credentialScopeDiagnostics(manifest);
  return baseRecord("extension.auth.scopes", "completed", `diagnosed ${credentialScopes.length} credential scopes`, {
    items: credentialScopes.map(credentialItem),
    credentialScopes,
    referencePitFixtureIds: [pitEnvSnapshot, pitDiagnosticRedaction]
  });
}

async function mcpTestRecord(options: CliOptions): Promise<ExtensionManagementRecord> {
  const manifestPath = typeof options.extensionInput?.manifestPath === "string" ? options.extensionInput.manifestPath : "";
  const manifest = await readJsonInput<McpServerManifest>(manifestPath, "MCP_MANIFEST_PATH_REQUIRED");
  const platform = new NodePlatformRuntime();
  const gateway = new InMemoryMcpGateway();
  if ((options.extensionInput?.enableRealMcp === true || realTransportEnvEnabled()) && manifest.transport?.kind === "stdio") {
    gateway.registerRealTransport("stdio", async (m) => createRealMcpAdapter(m, (command, args) => platform.spawnMcpServer(command, args)));
  }
  try {
    const summary = await gateway.connectServer(manifest);
    const tools = await gateway.listTools({ schemaVersion: MCP_SCHEMA_VERSION, namespace: manifest.namespace, includeInert: true });
    const resources = await gateway.listResources({ schemaVersion: MCP_SCHEMA_VERSION, namespace: manifest.namespace, includeInert: true });
    const items = [
      mcpServerItem(summary.id, summary.name, summary.health, summary.permissions),
      ...tools.map((tool) => mcpToolItem(tool.qualifiedName, tool.permissions)),
      ...resources.map((resource) => mcpResourceItem(resource.uri, resource.permissions))
    ];
    return baseRecord("extension.mcp.test", summary.health === "connected" ? "completed" : "partial", `MCP server ${summary.id} health=${summary.health}`, {
      items,
      lifecycle: [lifecycle("mcp.test", `mcp:${summary.id}`, summary.health === "connected" ? "completed" : "partial", { summary, toolCount: tools.length, resourceCount: resources.length })],
      referencePitFixtureIds: [pitMcpPluginPrecedence, pitDiagnosticRedaction]
    });
  } finally {
    await gateway.disposeAll().catch(() => undefined);
  }
}

function baseRecord(
  kind: ExtensionManagementRecord["kind"],
  status: ExtensionManagementStatus,
  summary: string,
  overrides: Partial<ExtensionManagementRecord> = {}
): ExtensionManagementRecord {
  const referencePitFixtureIds = uniqueStrings([
    ...(overrides.referencePitFixtureIds ?? []),
    ...((overrides.permissionDiffs ?? []).flatMap((diff) => diff.referencePitFixtureIds)),
    ...((overrides.credentialScopes ?? []).flatMap((scope) => scope.referencePitFixtureIds))
  ]);
  return {
    schemaVersion: EXTENSION_MANAGEMENT_SCHEMA_VERSION,
    kind,
    status,
    summary: redactSecretText(summary),
    items: overrides.items ?? [],
    permissionDiffs: overrides.permissionDiffs ?? [],
    authDiffs: overrides.authDiffs ?? [],
    authReadiness: overrides.authReadiness ?? [],
    credentialScopes: overrides.credentialScopes ?? [],
    lifecycle: overrides.lifecycle ?? [],
    diagnostics: overrides.diagnostics ?? [],
    audit: overrides.audit ?? { source: "cli-extension-management", kind },
    referencePitFixtureIds,
    redaction: overrides.redaction ?? { class: "internal", fields: ["items.provenance", "diagnostics", "audit"] }
  };
}

function inputPath(options: CliOptions): string {
  return typeof options.extensionInput?.path === "string" ? options.extensionInput.path : "";
}

async function readJsonInput<T>(path: string, missingCode: string): Promise<T> {
  if (!path) throw new Error(missingCode);
  const raw = await new NodePlatformRuntime().readFile(path);
  return JSON.parse(raw) as T;
}

async function defaultSkillSystem(): Promise<InMemorySkillSystem> {
  const system = new InMemorySkillSystem();
  await system.registerSkill(skillManifest("skill-repo-summary", "repo-summary", ["repo", "summary"], ["context:read"]));
  await system.registerSkill(skillManifest("skill-code-review", "code-review", ["review", "diff"], ["context:read", "workspace:read"]));
  return system;
}

function skillManifest(id: string, name: string, activation: readonly string[], permissions: readonly string[]): SkillManifest {
  return {
    schemaVersion: SKILL_SCHEMA_VERSION,
    id: asId<"skill">(id),
    name,
    version: "1.0.0",
    source: "built-in",
    trust: "trusted",
    activation,
    executionModes: ["context"],
    permissions,
    description: `${name} skill`,
    metadata: {
      instructions: [`Use ${name} guidance when explicitly activated.`],
      examples: [`${name} example output is summarized.`]
    }
  };
}

async function credentialScopeDiagnostics(manifest: JsonObject | undefined): Promise<readonly ExtensionCredentialScopeDiagnostic[]> {
  const platform = new NodePlatformRuntime();
  const service = await createDeepSeekCredentialAuthServiceFromEnv(await deepSeekLiveCredentialProcessEnv(platform));
  const records = await service.listDeepSeekCredentials();
  const status = await service.status();
  const diagnostics = records.length > 0
    ? records.map((record) => credentialScope(record))
    : [missingDeepSeekCredentialScope(status.status)];
  const connector = connectorCredentialScope(manifest);
  return connector ? [...diagnostics, connector] : diagnostics;
}

function credentialScope(record: StoredCredentialReference): ExtensionCredentialScopeDiagnostic {
  return {
    targetId: `credential:${record.ref}`,
    ref: record.ref,
    provider: record.scope.provider,
    profile: record.scope.profile,
    ...(record.scope.workspace ? { workspace: record.scope.workspace } : {}),
    source: record.source,
    available: record.available,
    status: record.available ? "available" : "missing",
    audit: record.audit,
    suggestedActions: record.available ? [] : ["Run deepseek auth or provide DEEPSEEK_API_KEY for this session."],
    referencePitFixtureIds: [pitEnvSnapshot, pitDiagnosticRedaction],
    redaction: { class: "secret", fields: ["ref"] }
  };
}

function missingDeepSeekCredentialScope(storageStatus: string): ExtensionCredentialScopeDiagnostic {
  return {
    targetId: "credential:deepseek:default",
    provider: "deepseek",
    profile: "default",
    source: "missing",
    available: false,
    status: storageStatus === "unavailable" ? "unavailable" : "missing",
    audit: { operation: "list", at: "1970-01-01T00:00:00.000Z", scope: { provider: "deepseek", profile: "default" } },
    suggestedActions: ["Run deepseek auth or provide DEEPSEEK_API_KEY for this session."],
    referencePitFixtureIds: [pitEnvSnapshot, pitDiagnosticRedaction],
    redaction: { class: "secret", fields: ["ref"] }
  };
}

function connectorCredentialScope(manifest: JsonObject | undefined): ExtensionCredentialScopeDiagnostic | undefined {
  const ref = typeof manifest?.credentialRef === "string" ? manifest.credentialRef : undefined;
  if (!ref) return undefined;
  const permissions = Array.isArray(manifest?.permissions) ? manifest.permissions.filter((item): item is string => typeof item === "string") : [];
  const allowed = permissions.includes("credential:read") || permissions.includes("credential:*") || permissions.includes(`credential:${ref}`);
  return {
    targetId: `credential:${ref}`,
    ref,
    provider: "deepseek",
    profile: "connector",
    source: "manifest",
    available: false,
    status: allowed ? "missing" : "denied",
    audit: { operation: "list", at: "1970-01-01T00:00:00.000Z", scope: { provider: "deepseek", profile: "connector" }, denied: !allowed },
    suggestedActions: allowed ? ["Store the connector credential before live use."] : ["Declare credential:read or a matching credential scope before use."],
    referencePitFixtureIds: [pitEnvSnapshot, pitDiagnosticRedaction],
    redaction: { class: "secret", fields: ["ref"] }
  };
}

function permissionDiff(targetId: string, added: readonly string[], removed: readonly string[]): ExtensionPermissionDiffRecord {
  return {
    targetId: `plugin:${targetId}`,
    added: [...added].sort(),
    removed: [...removed].sort(),
    referencePitFixtureIds: added.length > 0 || removed.length > 0 ? [pitPermissionDiff] : [],
    redaction: { class: "internal" }
  };
}

function pitIdsForDiff(diff: ExtensionPermissionDiffRecord): readonly string[] {
  return diff.referencePitFixtureIds;
}

function pluginItem(manifest: PluginManifest, installedAt?: string): ExtensionManagementItem {
  return {
    targetKind: "plugin",
    targetId: `plugin:${manifest.id}`,
    label: manifest.name,
    status: "enabled",
    summary: `${manifest.name}@${manifest.version} permissions=${manifest.permissions.length}`,
    provenance: { source: manifest.source, integrity: manifest.integrity, ...(installedAt ? { installedAt } : {}) },
    permissions: manifest.permissions,
    actionHints: actions("inspect", "verify", "snapshot"),
    redaction: { class: "internal", fields: ["provenance.integrity"] }
  };
}

function lockEntryItem(pluginId: string, version: string, permissions: readonly string[]): ExtensionManagementItem {
  return {
    targetKind: "plugin-lock-entry",
    targetId: `plugin-lock-entry:${pluginId}`,
    label: pluginId,
    status: "enabled",
    summary: `${pluginId}@${version} permissions=${permissions.length}`,
    provenance: { source: "plugin-lockfile", pluginId, version },
    permissions,
    actionHints: actions("inspect", "verify", "apply"),
    redaction: { class: "internal" }
  };
}

function skillItem(summary: SkillSummary, activation?: JsonObject): ExtensionManagementItem {
  return {
    targetKind: "skill",
    targetId: `skill:${summary.name}`,
    label: summary.name,
    status: summary.loadingState === "inert" ? "inert" : summary.enabled ? "enabled" : "disabled",
    summary: `${summary.name}@${summary.version} ${summary.loadingState}${activation ? ` segments=${String(activation.segmentCount ?? 0)}` : ""}`,
    provenance: { source: summary.source, trust: summary.trust, ...(activation ? { activation } : {}) },
    permissions: summary.permissions,
    actionHints: actions("inspect", "activate"),
    redaction: { class: "internal", fields: ["provenance"] }
  };
}

function credentialItem(scope: ExtensionCredentialScopeDiagnostic): ExtensionManagementItem {
  return {
    targetKind: "credential-scope",
    targetId: scope.targetId,
    label: `${scope.provider}:${scope.profile}`,
    status: scope.status === "available" ? "enabled" : "disabled",
    summary: `${scope.provider}/${scope.profile} ${scope.status} source=${scope.source}`,
    provenance: { source: scope.source, audit: scope.audit },
    actionHints: actions("inspect", "diagnose"),
    redaction: { class: "secret", fields: ["provenance.audit"] }
  };
}

function contributionItem(targetId: string, label: string, points: readonly string[]): ExtensionManagementItem {
  return {
    targetKind: "contribution",
    targetId,
    label,
    status: "enabled",
    summary: `${label} contribution points: ${points.join(", ")}`,
    provenance: { source: "built-in", points, pit: pitContributionBoundary },
    actionHints: actions("inspect"),
    redaction: { class: "internal" }
  };
}

function mcpServerItem(id: string, name: string, health: string, permissions: readonly string[]): ExtensionManagementItem {
  return {
    targetKind: "mcp-server",
    targetId: `mcp:${id}`,
    label: name,
    status: health === "connected" ? "connected" : "unavailable",
    summary: `${name} health=${health} permissions=${permissions.length}`,
    provenance: { source: "mcp-gateway", health },
    permissions,
    actionHints: actions("inspect", "test"),
    redaction: { class: "internal" }
  };
}

function mcpToolItem(qualifiedName: string, permissions: readonly string[]): ExtensionManagementItem {
  return {
    targetKind: "mcp-tool",
    targetId: `mcp-tool:${qualifiedName}`,
    label: qualifiedName,
    status: "enabled",
    summary: `${qualifiedName} permissions=${permissions.length}`,
    provenance: { source: "mcp-gateway" },
    permissions,
    actionHints: actions("inspect", "test"),
    redaction: { class: "internal" }
  };
}

function mcpResourceItem(uri: string, permissions: readonly string[]): ExtensionManagementItem {
  return {
    targetKind: "mcp-resource",
    targetId: `mcp-resource:${uri}`,
    label: uri,
    status: "enabled",
    summary: `${uri} permissions=${permissions.length}`,
    provenance: { source: "mcp-gateway" },
    permissions,
    actionHints: actions("inspect", "test"),
    redaction: { class: "internal", fields: ["targetId", "label", "summary"] }
  };
}

function lifecycle(step: string, targetId: string, status: ExtensionManagementStatus, metadata: JsonObject): ExtensionManagementRecord["lifecycle"][number] {
  return {
    step,
    targetId,
    status,
    diagnostics: [],
    metadata,
    redaction: { class: "internal", fields: ["metadata"] }
  };
}

function actions(...names: readonly ExtensionManagementActionHint["action"][]): readonly ExtensionManagementActionHint[] {
  return names.map((action) => ({ action }));
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message: redactSecretText(message),
    retryable: false,
    redaction: { class: "public" }
  };
}

function sumEstimatedTokens(segments: readonly { readonly estimatedTokens: number }[]): number {
  return segments.reduce((sum, segment) => sum + segment.estimatedTokens, 0);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort();
}

function toJsonObject(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function redactRecord(record: ExtensionManagementRecord): ExtensionManagementRecord {
  return JSON.parse(redactSecretText(JSON.stringify(record))) as ExtensionManagementRecord;
}

function redactSecretText(value: string): string {
  return value
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED:private-key]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED:secret]`;
    });
}

function realTransportEnvEnabled(): boolean {
  const proc = globalThis as unknown as { process?: { env?: { MCP_REAL_TRANSPORT?: string } } };
  return proc.process?.env?.MCP_REAL_TRANSPORT === "1";
}
