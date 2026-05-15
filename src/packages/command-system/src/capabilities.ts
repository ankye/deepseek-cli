import type { CapabilityExecutorBinding, CapabilityManifest, CommandCompositionRecord, JsonObject } from "@deepseek/platform-contracts";
import { TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { projectCommandPalette } from "./palette.js";

const catalogVersion = "v1";

export function createCommandSystemFamilyCapabilities(records: readonly CommandCompositionRecord[]): readonly CapabilityExecutorBinding[] {
  return [{
    manifest: commandPaletteSlashManifest(),
    execute: async (input) => {
      const query = typeof input.query === "string" ? input.query.toLowerCase() : "";
      const palette = projectCommandPalette(records);
      const slashCommands = palette.entries
        .filter((entry) => !query || entry.searchText.includes(query) || `/${entry.entry.title}`.includes(query))
        .slice(0, 50)
        .map((entry) => ({
          id: entry.entry.id,
          title: entry.entry.title.startsWith("/") ? entry.entry.title : `/${entry.entry.title}`,
          aliases: entry.aliases.map((alias) => alias.startsWith("/") ? alias : `/${alias}`),
          action: entry.entry.action,
          target: entry.target,
          sideEffect: entry.sideEffect,
          permissions: entry.permissions,
          redaction: entry.redaction
        }));
      return {
        ok: true,
        value: {
          familyId: "command.palette-slash",
          palette,
          slashCommands,
          count: slashCommands.length,
          truncated: palette.entries.length > 50,
          evidence: evidence()
        }
      };
    }
  }];
}

function commandPaletteSlashManifest(): CapabilityManifest {
  return {
    id: asId<"capability">("command-system.palette-slash"),
    name: "Project command palette and slash commands",
    description: "command.palette-slash deterministic command projection capability",
    source: "@deepseek/command-system",
    version: "0.1.0",
    trust: "trusted",
    sideEffect: "read",
    permissions: ["command:read"],
    inputSchema: { type: "object", additionalProperties: true },
    outputSchema: { type: "object", additionalProperties: true },
    enabled: true,
    timeoutMs: 1_000,
    projection: { modelVisible: true, outputBounded: true, connectorTrust: "trusted", providerSupport: "not_applicable", policyTags: ["command-projection"], agentScopeIds: ["default"] },
    toolFamily: {
      schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
      catalogVersion,
      domainId: "extensions-local-commands",
      familyId: "command.palette-slash",
      toolId: "command.palette-slash",
      implementationState: "implemented",
      maturity: "baseline",
      riskClass: "read",
      operationProfiles: ["read"],
      hostRequirements: ["host-command-registry"],
      connectorProfile: "host",
      scorecardRubricId: "rubric.command.palette-slash.baseline",
      redaction: { class: "public" }
    },
    secretExposure: noSecretExposure(),
    resourceScope: resourceScope(),
    sandboxRequirements: sandbox(),
    audit: audit(),
    security: { modelVisible: true, outputRedaction: "internal", preflight: "command-projection" }
  };
}

function evidence(): JsonObject {
  return { mode: "fake", providerNativeSupport: "not_applicable", capabilityId: "command-system.palette-slash", familyId: "command.palette-slash", redaction: { class: "public" } };
}

function noSecretExposure() {
  return {
    schemaVersion: "1.0.0",
    action: "redact" as const,
    reasonCode: "COMMAND_METADATA_REDACTION",
    classification: { schemaVersion: "1.0.0", detected: false, kind: "none" as const, exposure: "none" as const, reasonCode: "COMMAND_METADATA_REDACTION", occurrences: 0, redactionClass: "public" as const, evidence: {} },
    redaction: { class: "public" as const }
  };
}

function resourceScope() {
  return { schemaVersion: "1.0.0", kind: "native" as const, paths: [], environment: "none" as const, networkHosts: [], nativeCapabilities: ["command-system"], rollbackAvailable: false, redaction: { class: "internal" as const } };
}

function sandbox() {
  return { schemaVersion: "1.0.0", profile: "command-system", capabilities: ["native-access"] as const, resourceScope: resourceScope(), timeoutMs: 1_000, environment: "none" as const, outputRedaction: { class: "internal" as const }, requireEnforcement: true };
}

function audit() {
  return { schemaVersion: "1.0.0", decision: "allow", reasonCode: "COMMAND_PROJECTION", subject: "command-system.palette-slash", resource: "command-system", redactedSubject: "command-system.palette-slash", redactedResource: "command-system", sandboxProfile: "command-system", metadata: {}, redaction: { class: "internal" as const } };
}
