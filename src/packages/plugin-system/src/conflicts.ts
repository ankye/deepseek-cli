import type {
  PluginConflictRecord,
  PluginContributionDescriptor,
  PluginContributionReference,
  PluginManifest,
  PluginProjectionHost
} from "@deepseek/platform-contracts";
import {
  contributionConflictKindForDescriptor,
  getContributionDescriptors,
  pluginValidationError,
  replayFingerprint,
  sortPluginManifestsById,
  stringJsonValue
} from "./shared.js";

export function detectPluginContributionConflicts(manifests: readonly PluginManifest[]): readonly PluginConflictRecord[] {
  const buckets = new Map<string, PluginContributionDescriptor[]>();
  for (const manifest of sortPluginManifestsById(manifests)) {
    for (const descriptor of getContributionDescriptors(manifest)) {
      const key = conflictKey(descriptor);
      if (!key) continue;
      const current = buckets.get(key) ?? [];
      current.push(descriptor);
      buckets.set(key, current);
    }
  }
  const conflicts: PluginConflictRecord[] = [];
  for (const [key, descriptors] of [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right, "en"))) {
    if (descriptors.length < 2) continue;
    const sorted = [...descriptors].sort((a, b) => a.provenance.pluginId.localeCompare(b.provenance.pluginId, "en"));
    const winner = sorted[0];
    if (!winner) continue;
    const losers = sorted.slice(1);
    for (const loser of losers) {
      conflicts.push({
        conflictId: replayFingerprint({ key, winner: winner.id, loser: loser.id }),
        conflictKind: contributionConflictKindForDescriptor(winner),
        winner: contributionReference(winner),
        loser: contributionReference(loser),
        precedenceSource: "plugin-id-lexicographic",
        affectedHosts: commonHosts(winner.projection.hosts, loser.projection.hosts),
        affectedModes: affectedModesForDescriptor(loser),
        suggestedOverrides: [`Override ${key} for ${loser.provenance.pluginId}`],
        outcome: "hidden",
        diagnostics: [
          pluginValidationError("PLUGIN_CONTRIBUTION_CONFLICT", `Contribution conflict on ${key}.`, {
            key,
            winner: winner.id,
            loser: loser.id
          })
        ]
      });
    }
  }
  return conflicts;
}

function contributionReference(descriptor: PluginContributionDescriptor): PluginContributionReference {
  return {
    pluginId: descriptor.provenance.pluginId,
    contributionId: descriptor.id,
    kind: descriptor.kind,
    ownerSubsystem: descriptor.ownerSubsystem
  };
}

function conflictKey(descriptor: PluginContributionDescriptor): string | undefined {
  switch (descriptor.kind) {
    case "command":
      return `command:${stringJsonValue(descriptor.metadata?.commandId) ?? descriptor.id}`;
    case "keymap":
      return `keymap:${stringJsonValue(descriptor.metadata?.mode) ?? "default"}:${stringJsonValue(descriptor.metadata?.key) ?? descriptor.id}`;
    case "palette-entry":
      return `palette:${stringJsonValue(descriptor.metadata?.title) ?? descriptor.id}`;
    case "target-resolver":
      return `target:${descriptor.id}`;
    case "render-hint":
      return `render:${descriptor.projection.hosts.join(",")}:${descriptor.projection.surface ?? descriptor.id}`;
    case "hook":
      return `hook:${stringJsonValue(descriptor.metadata?.point) ?? descriptor.id}`;
    case "context-provider":
    case "memory-provider":
    case "cache-provider":
    case "diagnostics-provider":
      return `provider:${descriptor.kind}:${descriptor.id}`;
    case "config-fragment":
      return `config:${descriptor.id}`;
    default:
      return undefined;
  }
}

function commonHosts(left: readonly PluginProjectionHost[], right: readonly PluginProjectionHost[]): readonly PluginProjectionHost[] {
  const rightSet = new Set(right);
  return left.filter((host) => rightSet.has(host)).sort();
}

function affectedModesForDescriptor(descriptor: PluginContributionDescriptor): readonly string[] {
  const mode = stringJsonValue(descriptor.metadata?.mode);
  return mode ? [mode] : [];
}
