import type { HookManifest, PluginContributionDescriptor, PluginManifest } from "@deepseek/platform-contracts";
import {
  PLUGIN_LIFECYCLE_HOOK_DEFAULT_TIMEOUT_MS,
  PLUGIN_LIFECYCLE_HOOK_POINT_CATALOG,
  PLUGIN_LIFECYCLE_HOOK_POINTS,
  asId
} from "@deepseek/platform-contracts";
import { DEFAULT_SCHEMA, PUBLIC_REDACTION, numberMetadata, stringMetadata } from "./shared.js";

export function normalizePluginHookContribution(manifest: PluginManifest, descriptor: PluginContributionDescriptor): HookManifest {
  if (descriptor.kind !== "hook") {
    throw new Error(`Cannot normalize ${descriptor.kind} as a hook contribution.`);
  }
  const requestedPoint = stringMetadata(descriptor, "point") ?? "plugin.activation.after";
  const point = PLUGIN_LIFECYCLE_HOOK_POINTS.includes(requestedPoint as (typeof PLUGIN_LIFECYCLE_HOOK_POINTS)[number])
    ? requestedPoint
    : "plugin.activation.after";
  return {
    schemaVersion: "1.0.0",
    id: asId<"hook">(`${manifest.id}:${descriptor.id}`),
    name: stringMetadata(descriptor, "name") ?? descriptor.id,
    version: manifest.version,
    point,
    source: "plugin",
    trust: manifest.source === "built-in" ? "trusted" : "workspace",
    ordering: { priority: numberMetadata(descriptor, "priority") ?? 0 },
    timeoutMs: numberMetadata(descriptor, "timeoutMs") ?? PLUGIN_LIFECYCLE_HOOK_DEFAULT_TIMEOUT_MS,
    failurePolicy: point.endsWith(".before") ? "block" : "continue",
    isolation: "in-process-observe-only",
    permissions: descriptor.permissions,
    inputSchema: descriptor.inputSchema ?? DEFAULT_SCHEMA,
    outputSchema: descriptor.outputSchema ?? DEFAULT_SCHEMA,
    enabled: descriptor.compatibility.status === "active",
    compatibility: descriptor.compatibility,
    redaction: PUBLIC_REDACTION,
    metadata: {
      pluginId: manifest.id,
      contributionId: descriptor.id,
      replayFingerprint: descriptor.replayFingerprint,
      lifecycleHookCatalog: PLUGIN_LIFECYCLE_HOOK_POINT_CATALOG
    }
  };
}
