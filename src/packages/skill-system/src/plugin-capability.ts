import type {
  CapabilityExecutorBinding,
  CapabilityManifest,
  JsonObject,
  PluginInstallResult,
  PluginLockfile,
  PluginManifest,
  PluginManager
} from "@deepseek/platform-contracts";
import { TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";

const catalogVersion = "v1";
const installedAt = "1970-01-01T00:00:00.000Z";

export function createPluginInstallVerifyFamilyCapabilities(manager: PluginManager = new FakePluginInstallVerifyManager()): readonly CapabilityExecutorBinding[] {
  return [{
    manifest: pluginInstallVerifyManifest(),
    execute: async (input) => {
      const manifest = normalizeManifest(isJsonObject(input.manifest) ? input.manifest : input);
      const action = typeof input.action === "string" ? input.action : "install";
      const verification = await manager.verify(manifest);
      if (action === "verify") {
        return { ok: true, value: { familyId: "plugin.install-verify", action, verification: toJson(verification), evidence: evidence(action) } };
      }
      if (!verification.ok) {
        return { ok: false, error: { code: "PLUGIN_INTEGRITY_INVALID", message: verification.reason, retryable: false, redaction: { class: "public" } } };
      }
      const install = await manager.install(manifest);
      const snapshot = await manager.snapshot();
      return { ok: true, value: { familyId: "plugin.install-verify", action: "install", verification: toJson(verification), install: toJson(install), lockfileDiff: lockfileDiff(snapshot, install), evidence: evidence("install") } };
    }
  }];
}

class FakePluginInstallVerifyManager implements PluginManager {
  private readonly entries = new Map<string, PluginInstallResult["lockEntry"]>();

  async install(manifest: PluginManifest): Promise<PluginInstallResult> {
    const previous = this.entries.get(manifest.id);
    const lockEntry = {
      pluginId: manifest.id,
      version: manifest.version,
      source: manifest.source,
      integrity: manifest.integrity,
      permissions: manifest.permissions,
      ...(manifest.credentialRequirements ? { credentialRequirements: manifest.credentialRequirements } : {}),
      installedAt
    };
    this.entries.set(manifest.id, lockEntry);
    return {
      diff: {
        added: manifest.permissions.filter((permission) => !(previous?.permissions ?? []).includes(permission)),
        removed: (previous?.permissions ?? []).filter((permission) => !manifest.permissions.includes(permission))
      },
      lockEntry
    };
  }

  async uninstall(id: PluginManifest["id"]): Promise<void> {
    this.entries.delete(id);
  }

  async list(): Promise<readonly PluginManifest[]> {
    return [...this.entries.values()].map((entry) => ({
      id: entry.pluginId,
      name: entry.pluginId,
      version: entry.version,
      source: entry.source,
      integrity: entry.integrity,
      permissions: entry.permissions,
      ...(entry.credentialRequirements ? { credentialRequirements: entry.credentialRequirements } : {}),
      contributions: {}
    }));
  }

  async verify(manifest: PluginManifest) {
    if (!manifest.integrity) return { ok: false as const, reason: "missing" as const, expected: "sha256:*", actual: "" };
    if (!manifest.integrity.startsWith("sha256:")) return { ok: false as const, reason: "mismatch" as const, expected: "sha256:*", actual: manifest.integrity };
    return { ok: true as const };
  }

  async snapshot(): Promise<PluginLockfile> {
    return { version: 1, entries: [...this.entries.values()].sort((left, right) => left.pluginId.localeCompare(right.pluginId)) };
  }

  async applyLockfile(lockfile: PluginLockfile): Promise<ReadonlyArray<PluginInstallResult>> {
    const results: PluginInstallResult[] = [];
    for (const entry of lockfile.entries) {
      results.push(await this.install({
        id: entry.pluginId,
        name: entry.pluginId,
        version: entry.version,
        source: entry.source,
        integrity: entry.integrity,
        permissions: entry.permissions,
        ...(entry.credentialRequirements ? { credentialRequirements: entry.credentialRequirements } : {}),
        contributions: {}
      }));
    }
    return results;
  }

  async authorizeContributionActivation() {
    return {
      pluginId: asId<"plugin">("plugin-fake"),
      contributionId: "fake",
      contributionKind: "other" as const,
      ownerSubsystem: "skill-system",
      status: "not-required" as const,
      authorizations: [],
      diagnostics: [],
      referencePitFixtureIds: [],
      audit: {},
      redaction: { class: "internal" as const },
      replayFingerprint: "plugin:fake"
    };
  }
}

function pluginInstallVerifyManifest(): CapabilityManifest {
  const resourceScope = analyzeResourceScope({}, "write");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "write", resourceScope, timeoutMs: 1_000, permissions: ["plugin:install", "plugin:verify"] });
  return {
    id: asId<"capability">("skill-system.plugin-install-verify"),
    name: "Install and verify plugin",
    description: "plugin.install-verify fake-first capability in nearest owner package; no plugin-system package exists.",
    source: "@deepseek/skill-system",
    version: "0.1.0",
    trust: "trusted",
    sideEffect: "write",
    permissions: ["plugin:install", "plugin:verify"],
    inputSchema: { type: "object", additionalProperties: true },
    outputSchema: { type: "object", additionalProperties: true },
    enabled: true,
    timeoutMs: 1_000,
    projection: { modelVisible: true, outputBounded: true, connectorTrust: "fake", providerSupport: "fake", policyTags: ["fake-first", "plugin-lockfile"], agentScopeIds: ["default"] },
    toolFamily: {
      schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
      catalogVersion,
      domainId: "extensions-local-commands",
      familyId: "plugin.install-verify",
      toolId: "plugin.install-verify",
      implementationState: "implemented",
      maturity: "baseline",
      riskClass: "write",
      operationProfiles: ["connector", "write"],
      hostRequirements: ["plugin-manager"],
      connectorProfile: "host",
      scorecardRubricId: "rubric.plugin.install-verify.baseline",
      redaction: { class: "public" }
    },
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    ["sandboxRequirements"]: sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "manifest",
      reasonCode: "manifest.plugin.install-verify",
      subject: "@deepseek/skill-system",
      resource: "skill-system.plugin-install-verify",
      ["sandboxProfile"]: sandboxRequirements.profile
    }),
    security: { modelVisible: true, outputRedaction: "internal", preflight: "plugin-integrity" }
  };
}

function normalizeManifest(value: JsonObject): PluginManifest {
  const id = typeof value.id === "string" ? value.id : "plugin-fake";
  return {
    id: asId<"plugin">(id),
    name: typeof value.name === "string" ? value.name : id,
    version: typeof value.version === "string" ? value.version : "1.0.0",
    source: typeof value.source === "string" ? value.source : "fake",
    integrity: typeof value.integrity === "string" ? value.integrity : `sha256:${stableHash(id)}`,
    permissions: Array.isArray(value.permissions) ? value.permissions.filter((item): item is string => typeof item === "string") : [],
    contributions: isJsonObject(value.contributions) ? value.contributions : {}
  };
}

function lockfileDiff(snapshot: PluginLockfile, install: PluginInstallResult): JsonObject {
  return { entryCount: snapshot.entries.length, changedPluginId: install.lockEntry.pluginId, permissionDiff: toJson(install.diff), lockEntry: toJson(install.lockEntry) };
}

function evidence(action: string): JsonObject {
  return { mode: "fake", providerNativeSupport: "not_applicable", capabilityId: "skill-system.plugin-install-verify", familyId: "plugin.install-verify", action, packageGap: "plugin-system package absent; nearest owner factory lives in skill-system", redaction: { class: "public" } };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJson(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
