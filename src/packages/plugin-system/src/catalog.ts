import type {
  PluginApiAvailability,
  PluginContributionCatalog,
  PluginContributionCatalogEntry,
  PluginContributionKind
} from "@deepseek/platform-contracts";
import { PLUGIN_PLATFORM_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import {
  CATALOG_OWNER_BY_KIND,
  DEFAULT_SCHEMA,
  INACTIVE_CATALOG_KINDS,
  PLUGIN_CONTRIBUTION_KINDS,
  defaultApiLevelForKind,
  defaultSideEffectForKind,
  replayFingerprint
} from "./shared.js";

export function pluginContributionCatalog(): PluginContributionCatalog {
  const entries = PLUGIN_CONTRIBUTION_KINDS.map(createCatalogEntry);
  return {
    schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
    apiVersion: "1.0.0",
    entries,
    diagnostics: [],
    replayFingerprint: replayFingerprint({ kind: "plugin-catalog", entries: entries.map((entry) => [entry.kind, entry.status]) })
  };
}

function createCatalogEntry(kind: PluginContributionKind): PluginContributionCatalogEntry {
  const status: PluginApiAvailability = INACTIVE_CATALOG_KINDS.has(kind) ? "inactive" : "active";
  const apiLevel = defaultApiLevelForKind(kind);
  const ownerSubsystem = CATALOG_OWNER_BY_KIND[kind];
  return {
    kind,
    ownerSubsystem,
    apiLevel,
    status,
    sideEffect: defaultSideEffectForKind(kind),
    permissions: [],
    inputSchema: DEFAULT_SCHEMA,
    outputSchema: DEFAULT_SCHEMA,
    defaultProjection: {
      visibility: status === "active" ? "visible" : "inactive",
      hosts: ["cli", "cli-tui", "json", "jsonl", "diagnostics"],
      hostOwnsLayout: true
    },
    compatibility: {
      schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
      apiLevel,
      ownerSubsystem,
      status,
      activationAllowed: status === "active",
      ...(status === "inactive" ? { inactiveReason: "Owner subsystem is declared but not active in this release." } : {})
    },
    activation: {
      lifecycleState: "activated"
    },
    diagnostics: []
  };
}
