import type {
  PluginApiLevel,
  PluginForbiddenApiDiagnostic,
  PluginForbiddenApiKind,
  PluginManifest,
  RedactedError,
  ValidationResult
} from "@deepseek/platform-contracts";
import {
  FORBIDDEN_IMPORT_KINDS,
  FORBIDDEN_KEY_KINDS,
  PLUGIN_CONTRIBUTION_KINDS,
  PUBLIC_REDACTION,
  getContributionDescriptors,
  hasCommandContributions,
  isJsonObject,
  pluginValidationError
} from "./shared.js";
import type { PluginManifestValidationOptions } from "./shared.js";

export function validatePluginManifestMetadata(
  manifests: readonly PluginManifest[],
  options: PluginManifestValidationOptions = {}
): ValidationResult {
  const errors: RedactedError[] = [];
  const seen = new Set<string>();
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) {
      errors.push(pluginValidationError("PLUGIN_DUPLICATE_ID", `Duplicate plugin id: ${manifest.id}`, { pluginId: manifest.id }));
    }
    seen.add(manifest.id);
    if (options.requiredSource && manifest.source !== options.requiredSource) {
      errors.push(
        pluginValidationError("PLUGIN_SOURCE_INVALID", `Plugin ${manifest.id} must use ${options.requiredSource} source.`, {
          pluginId: manifest.id,
          source: manifest.source
        })
      );
    }
    if (options.requireSha256Integrity && !manifest.integrity.startsWith("sha256:")) {
      errors.push(pluginValidationError("PLUGIN_INTEGRITY_INVALID", `Plugin ${manifest.id} must declare sha256 integrity.`, { pluginId: manifest.id }));
    }
    if (options.requireCommands && !hasCommandContributions(manifest)) {
      errors.push(pluginValidationError("PLUGIN_COMMANDS_EMPTY", `Plugin ${manifest.id} must declare commands.`, { pluginId: manifest.id }));
    }
    const forbiddenDiagnostics = findForbiddenApiDiagnostics(manifest.contributions, options.allowedApiLevels);
    for (const diagnostic of forbiddenDiagnostics) {
      errors.push(diagnostic);
    }
    if (forbiddenDiagnostics.length > 0) {
      errors.push(
        pluginValidationError("PLUGIN_EXECUTABLE_METADATA_REJECTED", `Plugin ${manifest.id} contributions must stay declarative.`, {
          pluginId: manifest.id,
          forbiddenDiagnosticCount: forbiddenDiagnostics.length
        })
      );
    }
    for (const descriptor of getContributionDescriptors(manifest)) {
      if (!PLUGIN_CONTRIBUTION_KINDS.includes(descriptor.kind)) {
        errors.push(
          pluginValidationError("PLUGIN_CONTRIBUTION_KIND_UNKNOWN", `Plugin ${manifest.id} declares an unknown contribution kind.`, {
            pluginId: manifest.id,
            contributionId: descriptor.id,
            kind: descriptor.kind
          })
        );
      }
      if (!descriptor.ownerSubsystem) {
        errors.push(
          pluginValidationError("PLUGIN_OWNER_ROUTE_UNDECLARED", `Plugin ${manifest.id} contribution ${descriptor.id} is missing owner subsystem.`, {
            pluginId: manifest.id,
            contributionId: descriptor.id,
            guidance: "Declare ownerSubsystem and route executable work through that owner."
          })
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function findForbiddenApiDiagnostics(
  value: unknown,
  allowedApiLevels: readonly PluginApiLevel[] | undefined,
  path = "contributions"
): readonly PluginForbiddenApiDiagnostic[] {
  const matches: PluginForbiddenApiDiagnostic[] = [];
  if (typeof value === "function") {
    matches.push(forbiddenApiDiagnostic("private-execution", path, "Use a declarative contribution descriptor and route execution through the owner subsystem."));
    return matches;
  }
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => findForbiddenApiDiagnostics(child, allowedApiLevels, `${path}[${index}]`));
  }
  if (!isJsonObject(value)) return matches;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    const forbiddenByKey = FORBIDDEN_KEY_KINDS[key];
    if (forbiddenByKey) {
      matches.push(forbiddenApiDiagnostic(forbiddenByKey, childPath, guidanceForForbiddenApi(forbiddenByKey)));
    }
    if ((key === "imports" || key === "requires" || key === "runtimeImports") && Array.isArray(child)) {
      for (const item of child) {
        if (typeof item === "string" && FORBIDDEN_IMPORT_KINDS[item]) {
          matches.push(forbiddenApiDiagnostic(FORBIDDEN_IMPORT_KINDS[item], `${childPath}[]`, guidanceForForbiddenApi(FORBIDDEN_IMPORT_KINDS[item])));
        }
      }
    }
    if (key === "apiLevel" && typeof child === "string" && allowedApiLevels && !allowedApiLevels.includes(child as PluginApiLevel)) {
      matches.push(
        forbiddenApiDiagnostic(
          "private-execution",
          childPath,
          `API level ${child} is not allowed by the current plugin validation policy.`
        )
      );
    }
    matches.push(...findForbiddenApiDiagnostics(child, allowedApiLevels, childPath));
  }
  return matches;
}

function forbiddenApiDiagnostic(kind: PluginForbiddenApiKind, path: string, guidance: string): PluginForbiddenApiDiagnostic {
  return {
    code: "PLUGIN_FORBIDDEN_API_REJECTED",
    message: `Forbidden plugin API at ${path}: ${kind}.`,
    retryable: false,
    redaction: PUBLIC_REDACTION,
    details: { path, forbiddenApiKind: kind },
    apiLevel: "declarative-author",
    status: "unsupported",
    allowed: false,
    forbiddenApiKind: kind,
    path,
    guidance
  };
}

function guidanceForForbiddenApi(kind: PluginForbiddenApiKind): string {
  switch (kind) {
    case "lifecycle-callback":
      return "Declare a hook contribution that normalizes to hook-system lifecycle points.";
    case "host-callback":
    case "host-layout-mutation":
      return "Declare host projection descriptors; host adapters own layout and interaction.";
    case "runtime-handle":
    case "private-execution":
    case "undeclared-owner-route":
      return "Route executable work through a governed owner subsystem.";
    case "raw-credential-access":
      return "Declare credential requirements and use governed credential grants.";
    case "filesystem-primitive":
    case "process-primitive":
    case "network-primitive":
    case "model-provider-client":
    case "runtime-internal-import":
    case "cli-internal-import":
      return "Use the governed runtime API after activation; direct imports are not part of the plugin API.";
  }
}
