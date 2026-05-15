import type {
  CapabilityExecutionContext,
  CapabilityExecutor,
  CapabilityExecutorBinding,
  CapabilityId,
  CapabilityManifest,
  CapabilityRegistry,
  JsonObject,
  SerializableResult,
  ToolFamilyConnectorTrust,
  ToolFamilyProjectionFilter,
  ToolFamilyProviderSupportStatus
} from "@deepseek/platform-contracts";
import {
  TOOL_FAMILY_DOMAIN_IDS,
  TOOL_FAMILY_IDS,
  TOOL_FAMILY_RISK_CLASSES
} from "@deepseek/platform-contracts";

function cloneJson<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}

function cloneManifest(manifest: CapabilityManifest): CapabilityManifest {
  return deepFreeze(cloneJson(manifest));
}

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly manifests = new Map<string, CapabilityManifest>();
  private readonly executors = new Map<string, CapabilityExecutor>();

  async register(manifest: CapabilityManifest, executor?: CapabilityExecutor): Promise<void> {
    const existing = this.manifests.get(manifest.id);
    if (existing && existing.version !== manifest.version) {
      throw new Error(`CAPABILITY_DUPLICATE_INCOMPATIBLE_VERSION: ${manifest.id}`);
    }
    if (existing) throw new Error(`CAPABILITY_DUPLICATE: ${manifest.id}`);
    if (executor && manifest.projection?.modelVisible === true) {
      const diagnostic = validateModelVisibleToolFamily(manifest);
      if (diagnostic) throw new Error(diagnostic);
    }
    this.manifests.set(manifest.id, cloneManifest(manifest));
    if (executor) this.executors.set(manifest.id, executor);
  }

  async get(id: CapabilityId): Promise<CapabilityManifest | undefined> {
    const manifest = this.manifests.get(id);
    return manifest ? cloneManifest(manifest) : undefined;
  }

  async listHostVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()]
      .filter((manifest) => manifest.enabled)
      .map(cloneManifest);
  }

  async listModelVisible(filter?: ToolFamilyProjectionFilter): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()]
      .filter((manifest) => manifest.enabled && manifest.trust !== "untrusted")
      .filter((manifest) => matchesProjectionFilter(manifest, filter))
      .map(cloneManifest);
  }

  async resolveExecutable(id: CapabilityId): Promise<CapabilityExecutorBinding | undefined> {
    const manifest = this.manifests.get(id);
    const executor = this.executors.get(id);
    if (!manifest || !executor) return undefined;
    return { manifest: cloneManifest(manifest), execute: executor };
  }

  async execute(id: CapabilityId, input: JsonObject, context?: CapabilityExecutionContext): Promise<SerializableResult> {
    const binding = await this.resolveExecutable(id);
    const executor = binding?.execute;
    if (!executor) {
      return { ok: false, error: { code: "CAPABILITY_NOT_EXECUTABLE", message: String(id), retryable: false, redaction: { class: "public" } } };
    }
    if (!context) {
      return {
        ok: false,
        error: {
          code: "CAPABILITY_CONTEXT_REQUIRED",
          message: String(id),
          retryable: false,
          redaction: { class: "public" }
        }
      };
    }
    return executor(input, context);
  }
}

function validateModelVisibleToolFamily(manifest: CapabilityManifest): string | undefined {
  const metadata = manifest.toolFamily;
  if (!metadata) return `CAPABILITY_MODEL_PROJECTION_MISSING_TOOL_FAMILY: ${manifest.id}`;
  if (!TOOL_FAMILY_DOMAIN_IDS.includes(metadata.domainId)) {
    return `CAPABILITY_MODEL_PROJECTION_INVALID_TOOL_DOMAIN: ${manifest.id}:${metadata.domainId}`;
  }
  if (!TOOL_FAMILY_IDS.includes(metadata.familyId)) {
    return `CAPABILITY_MODEL_PROJECTION_INVALID_TOOL_FAMILY: ${manifest.id}:${metadata.familyId}`;
  }
  if (metadata.implementationState !== "implemented") {
    return `CAPABILITY_MODEL_PROJECTION_UNIMPLEMENTED_TOOL_FAMILY: ${manifest.id}:${metadata.implementationState}`;
  }
  if (!metadata.toolId.trim()) return `CAPABILITY_MODEL_PROJECTION_MISSING_TOOL_ID: ${manifest.id}`;
  if (!TOOL_FAMILY_RISK_CLASSES.includes(metadata.riskClass)) {
    return `CAPABILITY_MODEL_PROJECTION_MISSING_RISK_METADATA: ${manifest.id}`;
  }
  if (metadata.operationProfiles.length < 1) return `CAPABILITY_MODEL_PROJECTION_MISSING_OPERATION_PROFILE: ${manifest.id}`;
  if (metadata.hostRequirements.length < 1) return `CAPABILITY_MODEL_PROJECTION_MISSING_HOST_REQUIREMENT: ${manifest.id}`;
  if (!metadata.scorecardRubricId.trim()) return `CAPABILITY_MODEL_PROJECTION_MISSING_RUBRIC: ${manifest.id}`;
  if (!Number.isFinite(manifest.timeoutMs) || (manifest.timeoutMs ?? 0) <= 0) {
    return `CAPABILITY_MODEL_PROJECTION_MISSING_TIMEOUT: ${manifest.id}`;
  }
  if (!hasOutputBounds(manifest)) return `CAPABILITY_MODEL_PROJECTION_MISSING_OUTPUT_BOUND: ${manifest.id}`;
  if (!hasRequiredSecurityFields(manifest)) return `CAPABILITY_MODEL_PROJECTION_MISSING_SECURITY: ${manifest.id}`;
  return undefined;
}

function hasOutputBounds(manifest: CapabilityManifest): boolean {
  return manifest.projection?.outputBounded === true
    && typeof manifest.outputSchema === "object"
    && manifest.outputSchema !== null
    && typeof manifest.outputSchema.type === "string";
}

function hasRequiredSecurityFields(manifest: CapabilityManifest): boolean {
  const sandboxRequirements = manifest["sandboxRequirements"];
  return manifest.secretExposure !== undefined
    && manifest.resourceScope !== undefined
    && sandboxRequirements !== undefined
    && manifest.audit !== undefined
    && typeof manifest.security === "object"
    && manifest.security !== null
    && manifest.security.modelVisible === true
    && typeof manifest.security.outputRedaction === "string";
}

function matchesProjectionFilter(manifest: CapabilityManifest, filter?: ToolFamilyProjectionFilter): boolean {
  if (!filter) return true;
  const metadata = manifest.toolFamily;
  if (!metadata) return matchesNonFamilyProjectionFilter(manifest, filter);

  if (!matchesAllowedDenied(metadata.familyId, filter.allowedFamilyIds, filter.deniedFamilyIds)) return false;
  if (!matchesAllowedDenied(metadata.domainId, filter.allowedDomainIds, filter.deniedDomainIds)) return false;
  if (!matchesAllowedDenied(metadata.riskClass, filter.allowedRiskClasses, filter.deniedRiskClasses)) return false;
  if (!matchesRequiredDeniedSet(metadata.hostRequirements, filter.requiredHostRequirements, filter.deniedHostRequirements)) return false;

  const connectorTrust = projectionString(manifest.projection, "connectorTrust") as ToolFamilyConnectorTrust | undefined;
  if (!matchesOptionalAllowedDenied(connectorTrust, filter.allowedConnectorTrust, filter.deniedConnectorTrust)) return false;

  const providerSupport = projectionString(manifest.projection, "providerSupport") as ToolFamilyProviderSupportStatus | undefined;
  if (!matchesOptionalAllowedDenied(providerSupport, filter.allowedProviderSupport, filter.deniedProviderSupport)) return false;

  const policyTags = projectionStringArray(manifest.projection, "policyTags");
  if (!matchesRequiredDeniedSet(policyTags, filter.allowedPolicyTags, filter.deniedPolicyTags)) return false;

  const agentScopeIds = projectionStringArray(manifest.projection, "agentScopeIds");
  return matchesRequiredDeniedSet(agentScopeIds, filter.allowedAgentScopeIds, filter.deniedAgentScopeIds);
}

function matchesNonFamilyProjectionFilter(manifest: CapabilityManifest, filter: ToolFamilyProjectionFilter): boolean {
  if (hasFamilySpecificAllowFilter(filter)) return false;
  const policyTags = projectionStringArray(manifest.projection, "policyTags");
  const agentScopeIds = projectionStringArray(manifest.projection, "agentScopeIds");
  return matchesRequiredDeniedSet(policyTags, filter.allowedPolicyTags, filter.deniedPolicyTags)
    && matchesRequiredDeniedSet(agentScopeIds, filter.allowedAgentScopeIds, filter.deniedAgentScopeIds);
}

function hasFamilySpecificAllowFilter(filter: ToolFamilyProjectionFilter): boolean {
  return hasItems(filter.allowedFamilyIds)
    || hasItems(filter.allowedDomainIds)
    || hasItems(filter.allowedRiskClasses)
    || hasItems(filter.requiredHostRequirements)
    || hasItems(filter.allowedConnectorTrust)
    || hasItems(filter.allowedProviderSupport);
}

function matchesAllowedDenied<T extends string>(
  value: T,
  allowed: readonly T[] | undefined,
  denied: readonly T[] | undefined
): boolean {
  if (hasItems(allowed) && !allowed.includes(value)) return false;
  if (hasItems(denied) && denied.includes(value)) return false;
  return true;
}

function matchesOptionalAllowedDenied<T extends string>(
  value: T | undefined,
  allowed: readonly T[] | undefined,
  denied: readonly T[] | undefined
): boolean {
  if (hasItems(allowed) && (value === undefined || !allowed.includes(value))) return false;
  if (value !== undefined && hasItems(denied) && denied.includes(value)) return false;
  return true;
}

function matchesRequiredDeniedSet(
  values: readonly string[],
  required: readonly string[] | undefined,
  denied: readonly string[] | undefined
): boolean {
  if (hasItems(required) && !required.every((item) => values.includes(item))) return false;
  if (hasItems(denied) && denied.some((item) => values.includes(item))) return false;
  return true;
}

function hasItems<T>(values: readonly T[] | undefined): values is readonly T[] {
  return Array.isArray(values) && values.length > 0;
}

function projectionString(projection: JsonObject | undefined, key: string): string | undefined {
  const value = projection?.[key];
  return typeof value === "string" ? value : undefined;
}

function projectionStringArray(projection: JsonObject | undefined, key: string): readonly string[] {
  const value = projection?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
