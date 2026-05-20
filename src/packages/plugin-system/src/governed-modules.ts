import type {
  GovernedModuleContractPath,
  GovernedModuleContractPathKind,
  GovernedModuleContributionDescriptor,
  GovernedModuleDiagnostic,
  GovernedModuleGovernanceFixture,
  GovernedModuleKind,
  GovernedModuleLifecycleRecord,
  GovernedModuleLifecycleState,
  GovernedModuleLifecycleTrigger,
  GovernedModuleManifest,
  GovernedModulePermission,
  GovernedModulePermissionRisk,
  GovernedModulePolicyEvaluation,
  JsonObject,
  PluginContributionDescriptor,
  PluginContributionKind,
  PluginContributionSideEffect,
  PluginManifest,
  PolicyRequest,
  RedactedError,
  RiskyOperationFamily
} from "@deepseek/platform-contracts";
import { GOVERNED_MODULE_SCHEMA_VERSION, PLUGIN_PLATFORM_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import {
  DEFAULT_PROJECTION,
  PUBLIC_REDACTION,
  defaultSideEffectForKind,
  getContributionDescriptors,
  isJsonObject,
  replayFingerprint
} from "./shared.js";
import { validatePluginManifestMetadata } from "./validation.js";

export const GOVERNED_MODULE_REQUIRED_SCENARIOS: readonly GovernedModuleGovernanceFixture["scenario"][] = [
  "valid-module",
  "missing-permission",
  "private-object-access",
  "disabled-module",
  "unloaded-module"
];

export const GOVERNED_MODULE_CONTRACT_PATHS: readonly GovernedModuleContractPath[] = [
  contractPath("module.command", "command", "command-system", "@deepseek/platform-contracts/command", ["command.register", "command.invoke"], ["handler", "execute", "runtimeHandle"], "plugin"),
  contractPath("module.hook", "hook", "hook-system", "@deepseek/platform-contracts/hook", ["hook.register", "hook.invoke"], ["lifecycleCallbacks", "onActivate", "onDisable"], "plugin"),
  contractPath("module.tool", "tool", "tool-system", "@deepseek/platform-contracts/capability", ["tool.describe", "tool.invoke"], ["modelClient", "fs", "process"], "plugin"),
  contractPath("module.mcp-bridge", "mcp-bridge", "mcp-gateway", "@deepseek/platform-contracts/mcp", ["mcp.connector.register", "mcp.tool.call"], ["network", "fetch", "runtimeImports"], "mcp"),
  contractPath("module.ui", "ui", "host-projection", "@deepseek/platform-contracts/cli-tui", ["projection.describe", "surface.render"], ["hostCallback", "mutateLayout"], "plugin"),
  contractPath("module.capability-api", "capability-api", "capability-registry", "@deepseek/platform-contracts/capability", ["capability.register", "capability.invoke"], ["runtimeHandle", "ownerRoute"], "plugin"),
  contractPath("module.diagnostics", "diagnostics", "diagnostics", "@deepseek/platform-contracts/readiness", ["diagnostics.project", "readiness.check"], ["rawCredential", "credentialResolver"], "plugin"),
  contractPath("module.lifecycle", "lifecycle", "plugin-system", "@deepseek/platform-contracts/plugin", ["module.enable", "module.disable", "module.unload"], ["onInstall", "onUninstall"], "plugin"),
  contractPath("module.policy", "policy", "policy-sandbox", "@deepseek/platform-contracts/policy", ["policy.evaluate", "audit.record"], ["permissionMode:bypass"], "plugin")
];

const lifecycleStates: readonly GovernedModuleLifecycleState[] = [
  "declared",
  "validated",
  "enabled",
  "activated",
  "disabled",
  "unloaded",
  "cleanup-completed",
  "failed",
  "rejected",
  "quarantined"
];

export function createGovernedModuleManifestFromPlugin(
  manifest: PluginManifest,
  moduleKind: GovernedModuleKind = "plugin"
): GovernedModuleManifest {
  const descriptors = getContributionDescriptors(manifest);
  const modulePermissions = normalizeModulePermissions(manifest.permissions, descriptors);
  const contributions = descriptors.map((descriptor) => governedContribution(descriptor));
  const diagnostics = convertPluginDiagnostics(manifest, validatePluginManifestMetadata([manifest], { requireSha256Integrity: true }).errors);
  const moduleBase = {
    moduleId: manifest.id,
    moduleKind,
    displayName: manifest.name,
    version: manifest.version,
    source: manifest.source,
    integrity: manifest.integrity,
    permissions: modulePermissions,
    contributions,
    contractPaths: GOVERNED_MODULE_CONTRACT_PATHS,
    compatibility: {
      schemaVersion: GOVERNED_MODULE_SCHEMA_VERSION,
      moduleApiVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
      minPlatformVersion: "0.1.0",
      failClosedReaderRequired: true
    },
    lifecycle: {
      initialState: "declared" as const,
      allowedStates: lifecycleStates,
      disableSupported: true,
      unloadSupported: true,
      cleanupRequired: true,
      cleanupTimeoutMs: 5_000
    },
    diagnostics
  };
  return {
    schemaVersion: GOVERNED_MODULE_SCHEMA_VERSION,
    ...moduleBase,
    redaction: PUBLIC_REDACTION,
    replayFingerprint: replayFingerprint({ kind: "governed-module-manifest", ...moduleBase })
  };
}

export function validateGovernedModuleManifest(module: GovernedModuleManifest): readonly GovernedModuleDiagnostic[] {
  const diagnostics: GovernedModuleDiagnostic[] = [...module.diagnostics];
  if (!module.moduleId) diagnostics.push(diagnostic(module, "GOVERNED_MODULE_ID_MISSING", "release-blocking", "manifest", "Governed module is missing moduleId."));
  if (!module.version) diagnostics.push(diagnostic(module, "GOVERNED_MODULE_VERSION_MISSING", "release-blocking", "manifest", "Governed module is missing version."));
  if (module.permissions.length === 0 && module.contributions.some((contribution) => contribution.requiredPermissions.length > 0)) {
    diagnostics.push(diagnostic(module, "GOVERNED_MODULE_PERMISSIONS_EMPTY", "release-blocking", "permission", "Module has risk-bearing contributions but no declared module permissions."));
  }
  if (module.contractPaths.length === 0) {
    diagnostics.push(diagnostic(module, "GOVERNED_MODULE_CONTRACT_PATHS_MISSING", "release-blocking", "contract-path", "Module has no public contract paths."));
  }
  if (!module.lifecycle.disableSupported || !module.lifecycle.unloadSupported || !module.lifecycle.cleanupRequired) {
    diagnostics.push(diagnostic(module, "GOVERNED_MODULE_LIFECYCLE_INCOMPLETE", "release-blocking", "lifecycle", "Module lifecycle must support disable, unload, and cleanup."));
  }

  const contractPathIds = new Set(module.contractPaths.map((path) => path.pathId));
  for (const contribution of module.contributions) {
    if (!contractPathIds.has(contribution.contractPathId)) {
      diagnostics.push(diagnostic(module, "GOVERNED_MODULE_CONTRACT_PATH_UNKNOWN", "release-blocking", "contract-path", `Contribution ${contribution.contributionId} uses an unknown contract path.`, contribution.contributionId));
    }
    if (!contribution.ownerSubsystem) {
      diagnostics.push(diagnostic(module, "GOVERNED_MODULE_OWNER_MISSING", "release-blocking", "manifest", `Contribution ${contribution.contributionId} is missing ownerSubsystem.`, contribution.contributionId));
    }
    if (!contribution.publicContractOnly) {
      diagnostics.push(diagnostic(module, "GOVERNED_MODULE_PRIVATE_OBJECT_ACCESS", "release-blocking", "private-access", `Contribution ${contribution.contributionId} attempts private runtime object access.`, contribution.contributionId));
    }
    for (const missingPermission of missingPermissions(module, contribution)) {
      diagnostics.push(diagnostic(module, "GOVERNED_MODULE_PERMISSION_MISSING", "release-blocking", "permission", `Contribution ${contribution.contributionId} is missing permission ${missingPermission}.`, contribution.contributionId, { missingPermission }));
    }
  }

  return diagnostics;
}

export function evaluateGovernedModulePolicies(module: GovernedModuleManifest): readonly GovernedModulePolicyEvaluation[] {
  return module.contributions
    .filter((contribution) => contribution.policyRequired || contribution.requiredPermissions.length > 0)
    .map((contribution) => evaluateGovernedModulePolicy(module, contribution));
}

export function evaluateGovernedModulePolicy(
  module: GovernedModuleManifest,
  contribution: GovernedModuleContributionDescriptor
): GovernedModulePolicyEvaluation {
  const missing = missingPermissions(module, contribution);
  const policyFamily = policyFamilyForContribution(contribution);
  const request = createGovernedModulePolicyRequest(module, contribution, missing);
  const diagnostics = missing.map((permission) =>
    diagnostic(module, "GOVERNED_MODULE_POLICY_PERMISSION_MISSING", "release-blocking", "policy", `Policy handoff denied module contribution because permission ${permission} is missing.`, contribution.contributionId, { missingPermission: permission })
  );
  const decision: GovernedModulePolicyEvaluation["decision"] = missing.length > 0
    ? "deny"
    : contribution.sideEffect === "process"
      ? "require-sandbox"
      : contribution.sideEffect === "write" || contribution.sideEffect === "network" || contribution.sideEffect === "mixed" || contribution.sideEffect === "credential" || contribution.sideEffect === "model"
        ? "prompt"
        : "allow";
  const base = {
    moduleId: module.moduleId,
    moduleKind: module.moduleKind,
    contributionId: contribution.contributionId,
    contributionKind: contribution.kind,
    sideEffect: contribution.sideEffect,
    policyFamily,
    policyRequired: contribution.policyRequired,
    declaredPermissions: declaredPermissions(module, contribution),
    requiredPermissions: contribution.requiredPermissions,
    missingPermissions: missing,
    decision,
    reason: missing.length > 0
      ? `Missing module permission(s): ${missing.join(", ")}.`
      : `Module contribution ${contribution.contributionId} is routed through policy-sandbox as ${policyFamily}.`,
    policyRequest: request,
    diagnostics
  };
  return {
    schemaVersion: GOVERNED_MODULE_SCHEMA_VERSION,
    ...base,
    redaction: { class: "internal", fields: ["policyRequest.resource", "policyRequest.metadata", "diagnostics.message"] },
    replayFingerprint: replayFingerprint({ kind: "governed-module-policy", ...base })
  };
}

export function createGovernedModulePolicyRequest(
  module: GovernedModuleManifest,
  contribution: GovernedModuleContributionDescriptor,
  missing: readonly string[] = missingPermissions(module, contribution)
): PolicyRequest {
  const sideEffect = sideEffectForPolicy(contribution.sideEffect);
  const policyFamily = policyFamilyForContribution(contribution);
  return {
    subject: `module:${module.moduleId}`,
    action: `module.${contribution.kind}.invoke`,
    resource: `module:${module.moduleId}:contribution:${contribution.contributionId}`,
    metadata: {
      sideEffect,
      riskyOperationFamily: policyFamily,
      permissions: contribution.permissions,
      declaredPermissions: declaredPermissions(module, contribution),
      requiredPermissions: contribution.requiredPermissions,
      missingPermissions: missing,
      moduleId: module.moduleId,
      moduleKind: module.moduleKind,
      contributionId: contribution.contributionId,
      contributionKind: contribution.kind,
      contractPathId: contribution.contractPathId,
      policyRequired: contribution.policyRequired,
      timeoutMs: 30_000
    }
  };
}

export function createGovernedModuleLifecycleRecord(input: {
  readonly module: GovernedModuleManifest;
  readonly previousState?: GovernedModuleLifecycleState;
  readonly nextState: GovernedModuleLifecycleState;
  readonly trigger: GovernedModuleLifecycleTrigger;
  readonly cleanupCompleted?: boolean;
  readonly disableReason?: string;
  readonly diagnostics?: readonly GovernedModuleDiagnostic[];
}): GovernedModuleLifecycleRecord {
  const cleanupRequired = input.trigger === "unload" || input.trigger === "cleanup" || input.module.lifecycle.cleanupRequired;
  const base = {
    moduleId: input.module.moduleId,
    moduleKind: input.module.moduleKind,
    ...(input.previousState ? { previousState: input.previousState } : {}),
    nextState: input.nextState,
    trigger: input.trigger,
    cleanupRequired,
    cleanupCompleted: input.cleanupCompleted ?? input.nextState === "cleanup-completed",
    ...(input.disableReason ? { disableReason: input.disableReason } : {}),
    diagnostics: input.diagnostics ?? []
  };
  return {
    schemaVersion: GOVERNED_MODULE_SCHEMA_VERSION,
    ...base,
    redaction: { class: "internal", fields: ["disableReason", "diagnostics.message"] },
    replayFingerprint: replayFingerprint({ kind: "governed-module-lifecycle", ...base })
  };
}

export function createGovernedModuleFixtures(): readonly GovernedModuleGovernanceFixture[] {
  const validPlugin = pluginFixture("@deepseek/governed-valid", "Valid governed plugin", ["workspace:read", "network:read"], [
    descriptorFixture("valid.open", "command", "command-system", "read", ["workspace:read"]),
    descriptorFixture("valid.mcp", "mcp-connector", "mcp-gateway", "network", ["network:read"])
  ]);
  const missingPermissionPlugin = pluginFixture("@deepseek/governed-missing-permission", "Missing permission governed plugin", ["workspace:read"], [
    descriptorFixture("missing.mcp", "mcp-connector", "mcp-gateway", "network", [])
  ]);
  const privatePlugin = {
    ...validPlugin,
    id: asId<"plugin">("@deepseek/governed-private-access"),
    name: "Private access governed plugin",
    contributions: {
      ...validPlugin.contributions,
      commands: [{ id: "bad-private", runtimeHandle: "private" }]
    }
  } as PluginManifest;

  return [
    fixture("governed-module.valid", "valid-module", validPlugin),
    fixture("governed-module.missing-permission", "missing-permission", missingPermissionPlugin),
    fixture("governed-module.private-object-access", "private-object-access", privatePlugin),
    fixture("governed-module.disabled", "disabled-module", validPlugin, [
      ["activated", "disabled", "disable", true, "User disabled module."]
    ]),
    fixture("governed-module.unloaded", "unloaded-module", validPlugin, [
      ["disabled", "unloaded", "unload", false, "Module unload requested."],
      ["unloaded", "cleanup-completed", "cleanup", true, "Cleanup finished."]
    ])
  ];
}

function fixture(
  fixtureId: string,
  scenario: GovernedModuleGovernanceFixture["scenario"],
  plugin: PluginManifest,
  lifecycleInputs: readonly (readonly [GovernedModuleLifecycleState, GovernedModuleLifecycleState, GovernedModuleLifecycleTrigger, boolean, string])[] = []
): GovernedModuleGovernanceFixture {
  const module = createGovernedModuleManifestFromPlugin(plugin);
  const diagnostics = validateGovernedModuleManifest(module);
  const policyEvaluations = evaluateGovernedModulePolicies(module);
  const lifecycleRecords = lifecycleInputs.map(([previousState, nextState, trigger, cleanupCompleted, reason]) =>
    createGovernedModuleLifecycleRecord({
      module,
      previousState,
      nextState,
      trigger,
      cleanupCompleted,
      disableReason: reason
    })
  );
  const allDiagnostics = [...diagnostics, ...policyEvaluations.flatMap((evaluation) => evaluation.diagnostics), ...lifecycleRecords.flatMap((record) => record.diagnostics)];
  return {
    fixtureId,
    scenario,
    module,
    diagnostics,
    policyEvaluations,
    lifecycleRecords,
    expectedStatus: allDiagnostics.some((item) => item.releaseBlocking) ? "fail" : "pass",
    redaction: { class: "internal", fields: ["module.integrity", "diagnostics.message", "policyEvaluations.policyRequest"] }
  };
}

function pluginFixture(
  id: string,
  name: string,
  permissions: readonly string[],
  descriptors: readonly PluginContributionDescriptor[]
): PluginManifest {
  return {
    id: asId<"plugin">(id),
    name,
    version: "0.1.0",
    source: "built-in",
    integrity: `sha256:${id.replace(/[^a-z0-9]/gi, "-")}`,
    permissions,
    compatibility: {
      schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
      status: "active",
      apiLevel: "manifest",
      ownerSubsystem: "plugin-system",
      activationAllowed: true
    },
    contributions: {
      contributionDescriptors: descriptors
    }
  };
}

function descriptorFixture(
  id: string,
  kind: PluginContributionKind,
  ownerSubsystem: string,
  sideEffect: PluginContributionSideEffect,
  permissions: readonly string[]
): PluginContributionDescriptor {
  return {
    id,
    kind,
    apiLevel: "declarative-author",
    ownerSubsystem,
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    permissions,
    sideEffect,
    source: "built-in",
    provenance: {
      pluginId: asId<"plugin">("@deepseek/governed-fixture"),
      pluginVersion: "0.1.0",
      source: "built-in"
    },
    compatibility: {
      schemaVersion: PLUGIN_PLATFORM_SCHEMA_VERSION,
      status: "active",
      apiLevel: "declarative-author",
      ownerSubsystem,
      activationAllowed: true
    },
    activation: { lifecycleState: "activated" },
    projection: DEFAULT_PROJECTION,
    diagnostics: [],
    replayFingerprint: `governed:${kind}:${id}`
  };
}

function governedContribution(descriptor: PluginContributionDescriptor): GovernedModuleContributionDescriptor {
  const sideEffect = descriptor.sideEffect ?? defaultSideEffectForKind(descriptor.kind);
  const metadata = isJsonObject(descriptor.metadata) ? descriptor.metadata : {};
  return {
    contributionId: descriptor.id,
    kind: descriptor.kind,
    ownerSubsystem: descriptor.ownerSubsystem,
    contractPathId: contractPathIdForKind(descriptor.kind),
    apiLevel: descriptor.apiLevel,
    permissions: descriptor.permissions,
    requiredPermissions: requiredPermissionsForSideEffect(sideEffect),
    sideEffect,
    policyRequired: sideEffect !== "none" && sideEffect !== "host-render",
    publicContractOnly: metadata.privateRuntimeAccess !== true && metadata.runtimeHandle !== "private",
    projectionHosts: descriptor.projection?.hosts ?? [],
    diagnostics: descriptor.diagnostics
  };
}

function normalizeModulePermissions(
  manifestPermissions: readonly string[],
  descriptors: readonly PluginContributionDescriptor[]
): readonly GovernedModulePermission[] {
  const permissions = new Set<string>([
    ...manifestPermissions,
    ...descriptors.flatMap((descriptor) => descriptor.permissions)
  ]);
  return [...permissions].sort().map((permission) => ({
    id: permission,
    risk: permissionRisk(permission),
    required: descriptors.some((descriptor) => requiredPermissionsForSideEffect(descriptor.sideEffect).includes(permission)),
    reason: `Declared module permission: ${permission}.`,
    policyFamily: permission.includes("network") ? "mcp" : permission.includes("credential") || permission.includes("secret") ? "credential" : "plugin"
  }));
}

function requiredPermissionsForSideEffect(sideEffect: PluginContributionSideEffect): readonly string[] {
  switch (sideEffect) {
    case "read":
      return ["workspace:read"];
    case "write":
      return ["workspace:write"];
    case "network":
      return ["network:read"];
    case "process":
      return ["process:execute"];
    case "model":
      return ["model:use"];
    case "credential":
      return ["credential:read"];
    case "mixed":
      return ["policy:approval"];
    case "none":
    case "host-render":
      return [];
  }
}

function missingPermissions(module: GovernedModuleManifest, contribution: GovernedModuleContributionDescriptor): readonly string[] {
  const declared = new Set(declaredPermissions(module, contribution));
  return contribution.requiredPermissions.filter((permission) => !declared.has(permission));
}

function declaredPermissions(module: GovernedModuleManifest, contribution: GovernedModuleContributionDescriptor): readonly string[] {
  return [...new Set([...module.permissions.map((permission) => permission.id), ...contribution.permissions])].sort();
}

function sideEffectForPolicy(sideEffect: PluginContributionSideEffect): "none" | "read" | "write" | "network" | "process" {
  if (sideEffect === "write" || sideEffect === "network" || sideEffect === "process" || sideEffect === "read") return sideEffect;
  if (sideEffect === "mixed" || sideEffect === "model" || sideEffect === "credential") return "process";
  return "none";
}

function policyFamilyForContribution(contribution: GovernedModuleContributionDescriptor): RiskyOperationFamily {
  if (contribution.kind === "mcp-connector" || contribution.contractPathId === "module.mcp-bridge") return "mcp";
  if (contribution.sideEffect === "credential") return "credential";
  return "plugin";
}

function permissionRisk(permission: string): GovernedModulePermissionRisk {
  if (permission.includes("private-runtime")) return "private-runtime";
  if (permission.includes("write")) return "write";
  if (permission.includes("network")) return "network";
  if (permission.includes("process") || permission.includes("shell")) return "process";
  if (permission.includes("model")) return "model";
  if (permission.includes("credential") || permission.includes("secret")) return "credential";
  if (permission.includes("render")) return "host-render";
  if (permission.includes("mixed") || permission.includes("approval")) return "mixed";
  if (permission.includes("read")) return "read";
  return "none";
}

function contractPathIdForKind(kind: PluginContributionKind): string {
  return `module.${contractPathKindForContribution(kind)}`;
}

function contractPathKindForContribution(kind: PluginContributionKind): GovernedModuleContractPathKind {
  switch (kind) {
    case "command":
    case "action":
      return "command";
    case "hook":
      return "hook";
    case "tool":
      return "tool";
    case "mcp-connector":
      return "mcp-bridge";
    case "keymap":
    case "palette-entry":
    case "render-hint":
    case "result-list-provider":
      return "ui";
    case "diagnostics-provider":
      return "diagnostics";
    default:
      return "capability-api";
  }
}

function convertPluginDiagnostics(
  manifest: PluginManifest,
  errors: readonly RedactedError[]
): readonly GovernedModuleDiagnostic[] {
  return errors.map((error) => {
    const category = error.code === "PLUGIN_FORBIDDEN_API_REJECTED" || error.code === "PLUGIN_EXECUTABLE_METADATA_REJECTED"
      ? "private-access"
      : error.code.includes("PERMISSION")
        ? "permission"
        : error.code.includes("OWNER") || error.code.includes("CONTRIBUTION")
          ? "contract-path"
          : "manifest";
    const contributionId = typeof error.details?.contributionId === "string" ? error.details.contributionId : undefined;
    return {
      ...error,
      severity: "release-blocking",
      moduleId: manifest.id,
      moduleKind: "plugin",
      ...(contributionId ? { contributionId } : {}),
      category,
      releaseBlocking: true
    };
  });
}

function diagnostic(
  module: GovernedModuleManifest,
  code: string,
  severity: GovernedModuleDiagnostic["severity"],
  category: GovernedModuleDiagnostic["category"],
  message: string,
  contributionId?: string,
  details: JsonObject = {}
): GovernedModuleDiagnostic {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal", fields: ["message", "details"] },
    details,
    severity,
    moduleId: module.moduleId,
    moduleKind: module.moduleKind,
    ...(contributionId ? { contributionId } : {}),
    category,
    releaseBlocking: severity === "release-blocking"
  };
}

function contractPath(
  pathId: string,
  kind: GovernedModuleContractPathKind,
  ownerPackage: string,
  publicApi: string,
  allowedEntrypoints: readonly string[],
  forbiddenEntrypoints: readonly string[],
  policyFamily: RiskyOperationFamily
): GovernedModuleContractPath {
  return {
    pathId,
    kind,
    ownerPackage,
    publicApi,
    allowedEntrypoints,
    forbiddenEntrypoints,
    lifecycleStates: ["declared", "validated", "enabled", "activated", "disabled", "unloaded", "cleanup-completed"],
    policyFamily,
    diagnostics: []
  };
}
