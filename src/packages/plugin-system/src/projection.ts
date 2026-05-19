import type { JsonObject, PluginConflictRecord, PluginHealthRecord, PluginInspectorProjection, PluginLifecycleState, PluginManifest, RedactedError } from "@deepseek/platform-contracts";
import { PLUGIN_PLATFORM_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PluginDiagnosticSurfaceProjection } from "./shared.js";
import {
  DEFAULT_PROJECTION,
  PUBLIC_REDACTION,
  dependenciesFor,
  getContributionDescriptors,
  replayFingerprint
} from "./shared.js";

export function projectPluginInspector(
  manifest: PluginManifest,
  options: {
    readonly lifecycleState?: PluginLifecycleState;
    readonly conflicts?: readonly PluginConflictRecord[];
    readonly health?: PluginHealthRecord;
    readonly diagnostics?: readonly RedactedError[];
  } = {}
): PluginInspectorProjection {
  const descriptors = getContributionDescriptors(manifest);
  const diagnostics = options.diagnostics ?? [];
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    pluginId: manifest.id,
    name: manifest.name,
    version: manifest.version,
    source: manifest.source,
    integrity: manifest.integrity,
    lifecycleState: options.lifecycleState ?? "validated",
    apiLevels: manifest.apiLevels ?? [],
    permissions: manifest.permissions,
    credentialRequirements: manifest.credentialRequirements ?? [],
    dependencies: dependenciesFor(manifest),
    conflicts: options.conflicts ?? [],
    ...(options.health ? { health: options.health } : {}),
    auditLinks: [],
    contributions: descriptors,
    ownerExecutionRoutes: descriptors.map((descriptor) => `${descriptor.ownerSubsystem}:${descriptor.kind}:${descriptor.id}`).sort(),
    diagnostics,
    projection: DEFAULT_PROJECTION,
    redaction: PUBLIC_REDACTION,
    replayFingerprint: replayFingerprint({
      kind: "plugin-inspector",
      pluginId: manifest.id,
      lifecycleState: options.lifecycleState ?? "validated",
      descriptors: descriptors.map((descriptor) => [descriptor.kind, descriptor.id])
    })
  };
}

export function projectPluginDiagnosticSurfaces(projections: readonly PluginInspectorProjection[]): PluginDiagnosticSurfaceProjection {
  const sorted = [...projections].sort((left, right) => left.pluginId.localeCompare(right.pluginId, "en"));
  const json = {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    plugins: sorted.map((projection) => ({
      pluginId: projection.pluginId,
      name: projection.name,
      version: projection.version,
      source: projection.source,
      lifecycleState: projection.lifecycleState,
      apiLevels: projection.apiLevels.map((level) => ({
        level: level.level,
        status: level.status,
        allowed: level.allowed
      })),
      contributionCount: projection.contributions.length,
      conflictCount: projection.conflicts.length,
      health: projection.health?.status ?? "unknown",
      ownerExecutionRoutes: projection.ownerExecutionRoutes
    }))
  } satisfies JsonObject;
  const jsonl = sorted.map((projection) => JSON.stringify({
    pluginId: projection.pluginId,
    lifecycleState: projection.lifecycleState,
    apiLevels: projection.apiLevels.map((level) => level.level),
    contributionCount: projection.contributions.length,
    conflictCount: projection.conflicts.length,
    health: projection.health?.status ?? "unknown"
  })).join("\n");
  const cliText = sorted
    .map((projection) => `${projection.pluginId} ${projection.version} ${projection.lifecycleState} contributions=${projection.contributions.length} conflicts=${projection.conflicts.length}`)
    .join("\n");
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    cliText,
    json,
    jsonl,
    diagnostics: sorted.flatMap((projection) => projection.diagnostics),
    replayFingerprint: replayFingerprint({ kind: "plugin-diagnostic-surfaces", json })
  };
}
