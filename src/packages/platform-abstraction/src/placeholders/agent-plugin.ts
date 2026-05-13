import {
  EXTENSION_AUTH_SCHEMA_VERSION,
  IntegrityMismatchError,
  type ExtensionAuthReadinessEvidence,
  type ExtensionCredentialAuthorizationResult,
  type ExtensionCredentialGrant,
  type ExtensionCredentialRequirement,
  type IntegrityVerdict,
  type PermissionDiff,
  type PluginContributionActivationRequest,
  type PluginContributionActivationResult,
  type PluginCredentialAuthorizer,
  type PluginCredentialAuthorizationRequest,
  type PluginId,
  type PluginInstallResult,
  type PluginLockfile,
  type PluginLockfileEntry,
  type PluginManager,
  type PluginManifest,
} from "@deepseek/platform-contracts";

function freezeEntry(entry: PluginLockfileEntry): PluginLockfileEntry {
  return Object.freeze({
    ...entry,
    permissions: Object.freeze([...entry.permissions]),
    ...(entry.credentialRequirements
      ? { credentialRequirements: Object.freeze([...entry.credentialRequirements]) as readonly ExtensionCredentialRequirement[] }
      : {}),
  });
}

function computeDiff(
  previous: PluginLockfileEntry | undefined,
  manifest: PluginManifest,
): PermissionDiff {
  const before = new Set(previous?.permissions ?? []);
  const after = new Set(manifest.permissions);
  const added: string[] = [];
  const removed: string[] = [];
  for (const permission of after) {
    if (!before.has(permission)) {
      added.push(permission);
    }
  }
  for (const permission of before) {
    if (!after.has(permission)) {
      removed.push(permission);
    }
  }
  return Object.freeze({
    added: Object.freeze(added) as readonly string[],
    removed: Object.freeze(removed) as readonly string[],
  });
}

function computeAuthDiff(
  previous: readonly ExtensionCredentialRequirement[] | undefined,
  next: readonly ExtensionCredentialRequirement[] | undefined,
) {
  const before = new Map((previous ?? []).map((requirement) => [requirementKey(requirement), requirement]));
  const after = new Map((next ?? []).map((requirement) => [requirementKey(requirement), requirement]));
  const added = [...after].filter(([key]) => !before.has(key)).map(([, requirement]) => requirement);
  const removed = [...before].filter(([key]) => !after.has(key)).map(([, requirement]) => requirement);
  const unchanged = [...after].filter(([key]) => before.has(key)).map(([, requirement]) => requirement);
  return Object.freeze({
    added: Object.freeze(added) as readonly ExtensionCredentialRequirement[],
    removed: Object.freeze(removed) as readonly ExtensionCredentialRequirement[],
    unchanged: Object.freeze(unchanged) as readonly ExtensionCredentialRequirement[],
    referencePitFixtureIds: Object.freeze(added.length > 0 || removed.length > 0 ? [
      "pit.extension-permission-expansion.permission-diff",
      "pit.extension-auth.credential-scope-denial",
    ] : []) as readonly string[],
    redaction: { class: "internal" as const, fields: ["*.credentialRef"] },
    replayFingerprint: `requirement-diff:${stableHash(stableStringify({
      added: added.map(requirementKey),
      removed: removed.map(requirementKey),
      unchanged: unchanged.map(requirementKey),
    }))}`,
  });
}

export class InMemoryPluginManager implements PluginManager {
  private readonly entries = new Map<PluginId, PluginLockfileEntry>();
  private readonly manifests = new Map<PluginId, PluginManifest>();
  private lastInstalledAtMs = 0;

  constructor(private readonly options: { readonly authorizeCredential?: PluginCredentialAuthorizer } = {}) {}

  private nextInstalledAt(): string {
    const nowMs = Math.max(Date.now(), this.lastInstalledAtMs + 1);
    this.lastInstalledAtMs = nowMs;
    return new Date(nowMs).toISOString();
  }

  async install(manifest: PluginManifest): Promise<PluginInstallResult> {
    const verdict = await this.verify(manifest);
    if (!verdict.ok && verdict.reason === "mismatch") {
      throw new IntegrityMismatchError(verdict.expected, verdict.actual);
    }
    const previous = this.entries.get(manifest.id);
    const diff = computeDiff(previous, manifest);
    const authDiff = computeAuthDiff(previous?.credentialRequirements, manifest.credentialRequirements);
    const lockEntry = freezeEntry({
      pluginId: manifest.id,
      version: manifest.version,
      source: manifest.source,
      integrity: manifest.integrity,
      permissions: [...manifest.permissions],
      ...(manifest.credentialRequirements ? { credentialRequirements: [...manifest.credentialRequirements] } : {}),
      installedAt: previous?.installedAt ?? this.nextInstalledAt(),
    });
    this.entries.set(manifest.id, lockEntry);
    this.manifests.set(manifest.id, manifest);
    return Object.freeze({ diff, authDiff, lockEntry });
  }

  async uninstall(id: PluginId): Promise<void> {
    this.entries.delete(id);
    this.manifests.delete(id);
  }

  async list(): Promise<readonly PluginManifest[]> {
    const ids = [...this.manifests.keys()].sort();
    const manifests = ids.map((id) => this.manifests.get(id) as PluginManifest);
    return Object.freeze(manifests);
  }

  async verify(manifest: PluginManifest): Promise<IntegrityVerdict> {
    const existing = this.entries.get(manifest.id);
    if (!existing) {
      return { ok: true };
    }
    if (existing.integrity !== manifest.integrity) {
      return {
        ok: false,
        reason: "mismatch",
        expected: existing.integrity,
        actual: manifest.integrity,
      };
    }
    return { ok: true };
  }

  async snapshot(): Promise<PluginLockfile> {
    const sorted = [...this.entries.values()].sort((a, b) =>
      a.pluginId < b.pluginId ? -1 : a.pluginId > b.pluginId ? 1 : 0,
    );
    return Object.freeze({
      version: 1 as const,
      entries: Object.freeze(sorted) as readonly PluginLockfileEntry[],
    });
  }

  async applyLockfile(
    lockfile: PluginLockfile,
  ): Promise<ReadonlyArray<PluginInstallResult>> {
    const results: PluginInstallResult[] = [];
    for (const entry of lockfile.entries) {
      const existing = this.entries.get(entry.pluginId);
      if (existing && existing.integrity !== entry.integrity) {
        throw new IntegrityMismatchError(existing.integrity, entry.integrity);
      }
      if (existing && existing.integrity === entry.integrity) {
        results.push(
          Object.freeze({
            diff: Object.freeze({
              added: Object.freeze([]) as readonly string[],
              removed: Object.freeze([]) as readonly string[],
            }),
            lockEntry: existing,
          }),
        );
        continue;
      }
      const manifest: PluginManifest = Object.freeze({
        id: entry.pluginId,
        name: entry.pluginId,
        version: entry.version,
        source: entry.source,
        integrity: entry.integrity,
        permissions: Object.freeze([...entry.permissions]) as readonly string[],
        ...(entry.credentialRequirements
          ? { credentialRequirements: Object.freeze([...entry.credentialRequirements]) as readonly ExtensionCredentialRequirement[] }
          : {}),
        contributions: Object.freeze({}),
      });
      const diff = computeDiff(undefined, manifest);
      const authDiff = computeAuthDiff([], manifest.credentialRequirements);
      const lockEntry = freezeEntry({
        pluginId: entry.pluginId,
        version: entry.version,
        source: entry.source,
        integrity: entry.integrity,
        permissions: [...entry.permissions],
        ...(entry.credentialRequirements ? { credentialRequirements: [...entry.credentialRequirements] } : {}),
        installedAt: entry.installedAt,
      });
      this.entries.set(entry.pluginId, lockEntry);
      this.manifests.set(entry.pluginId, manifest);
      results.push(Object.freeze({ diff, authDiff, lockEntry }));
    }
    return Object.freeze(results);
  }

  async authorizeContributionActivation(request: PluginContributionActivationRequest): Promise<PluginContributionActivationResult> {
    const requirements = request.credentialRequirements ?? [];
    const grants = request.grants ?? [];
    const operation = request.operation ?? "activate-contribution";
    const owner = request.owner ?? {
      kind: "plugin-contribution" as const,
      id: `plugin:${request.pluginId}:contribution:${request.contributionId}`,
      pluginId: request.pluginId,
      contributionId: request.contributionId,
    };
    if (requirements.length === 0) {
      return pluginContributionActivationResult({
        request,
        status: "not-required",
        authorizations: [],
        diagnostics: [],
        referencePitFixtureIds: [],
      });
    }

    const authorizations: ExtensionCredentialAuthorizationResult[] = [];
    for (const requirement of requirements) {
      if (!requirement.operations.includes(operation)) continue;
      const authRequest: PluginCredentialAuthorizationRequest = {
        pluginId: request.pluginId,
        contributionId: request.contributionId,
        contributionKind: request.contributionKind,
        ownerSubsystem: request.ownerSubsystem,
        owner,
        requirement,
        operation,
        grants,
        ...(request.trust ? { trust: request.trust } : {}),
        ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
        ...(request.sessionId ? { sessionId: request.sessionId } : {}),
      };
      authorizations.push(await (this.options.authorizeCredential?.(authRequest) ?? denyPluginContributionCredential(authRequest, "missing")));
    }

    const denied = authorizations.filter((authorization) => authorization.status === "denied");
    const readiness = pluginActivationReadiness(owner, requirements, grants, authorizations, denied.length === 0 ? "ready" : denied.some((authorization) => authorization.reason === "missing") ? "missing-grant" : "denied");
    return pluginContributionActivationResult({
      request,
      status: denied.length === 0 ? "activated" : "denied",
      authorizations,
      authReadiness: readiness,
      diagnostics: denied.flatMap((authorization) => authorization.diagnostics),
      referencePitFixtureIds: [
        ...requirements.flatMap((requirement) => requirement.referencePitFixtureIds ?? []),
        ...authorizations.flatMap((authorization) => authorization.referencePitFixtureIds),
        ...(denied.length > 0 ? ["pit.extension-auth.credential-scope-denial"] : []),
      ],
    });
  }
}

function requirementKey(requirement: ExtensionCredentialRequirement): string {
  return stableStringify({
    credentialRef: requirement.credentialRef,
    owner: requirement.owner,
    operations: requirement.operations,
    provider: requirement.provider,
    profile: requirement.profile,
    workspaceId: requirement.workspaceId,
    trust: requirement.trust,
    required: requirement.required,
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function denyPluginContributionCredential(
  request: PluginCredentialAuthorizationRequest,
  reason: Extract<ExtensionCredentialAuthorizationResult, { readonly status: "denied" }>["reason"],
): ExtensionCredentialAuthorizationResult {
  const evidence = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    status: "denied" as const,
    owner: request.owner,
    operation: request.operation,
    requirementId: request.requirement.requirementId,
    reason,
    diagnostics: Object.freeze([{
      code: `PLUGIN_CREDENTIAL_${reason.toUpperCase().replace(/-/g, "_")}`,
      message: `Plugin contribution credential authorization denied: ${reason}.`,
      retryable: reason === "missing" || reason === "expired",
      redaction: { class: "public" as const },
    }]) as ExtensionCredentialAuthorizationResult["diagnostics"],
    referencePitFixtureIds: Object.freeze([...new Set([...(request.requirement.referencePitFixtureIds ?? []), "pit.extension-auth.credential-scope-denial"])].sort()) as readonly string[],
    audit: {
      source: "plugin-system",
      operation: "authorize-contribution",
      pluginId: request.pluginId,
      contributionId: request.contributionId,
      ownerSubsystem: request.ownerSubsystem,
    },
    redaction: { class: "secret" as const, fields: ["credentialRef", "diagnostics"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  };
  return Object.freeze({
    ...evidence,
    replayFingerprint: `plugin-contribution-authorization:${stableHash(stableStringify(evidence))}`,
  });
}

function pluginActivationReadiness(
  owner: PluginCredentialAuthorizationRequest["owner"],
  requirements: readonly ExtensionCredentialRequirement[],
  grants: readonly ExtensionCredentialGrant[],
  authorizations: readonly ExtensionCredentialAuthorizationResult[],
  status: ExtensionAuthReadinessEvidence["status"],
): ExtensionAuthReadinessEvidence {
  const denied = authorizations.filter((authorization) => authorization.status === "denied");
  const evidence = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    owner,
    requirements: Object.freeze([...requirements]) as readonly ExtensionCredentialRequirement[],
    grants: Object.freeze([...grants]) as readonly ExtensionCredentialGrant[],
    authorizations: Object.freeze([...authorizations]) as readonly ExtensionCredentialAuthorizationResult[],
    status,
    diagnostics: Object.freeze(denied.flatMap((authorization) => authorization.diagnostics)) as ExtensionAuthReadinessEvidence["diagnostics"],
    referencePitFixtureIds: Object.freeze([...new Set([
      ...requirements.flatMap((requirement) => requirement.referencePitFixtureIds ?? []),
      ...authorizations.flatMap((authorization) => authorization.referencePitFixtureIds),
      ...(denied.length > 0 ? ["pit.extension-auth.credential-scope-denial", "pit.diagnostic-redaction.support-bundle"] : []),
    ])].sort()) as readonly string[],
    audit: { source: "plugin-system", operation: "diagnose-contribution-auth" },
    redaction: { class: "secret" as const, fields: ["grants.credentialRef", "authorizations.credentialRef"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  };
  return Object.freeze({
    ...evidence,
    replayFingerprint: `plugin-contribution-readiness:${stableHash(stableStringify(evidence))}`,
  });
}

function pluginContributionActivationResult(input: {
  readonly request: PluginContributionActivationRequest;
  readonly status: PluginContributionActivationResult["status"];
  readonly authorizations: readonly ExtensionCredentialAuthorizationResult[];
  readonly authReadiness?: ExtensionAuthReadinessEvidence;
  readonly diagnostics: PluginContributionActivationResult["diagnostics"];
  readonly referencePitFixtureIds: readonly string[];
}): PluginContributionActivationResult {
  const result = {
    pluginId: input.request.pluginId,
    contributionId: input.request.contributionId,
    contributionKind: input.request.contributionKind,
    ownerSubsystem: input.request.ownerSubsystem,
    status: input.status,
    authorizations: Object.freeze([...input.authorizations]) as readonly ExtensionCredentialAuthorizationResult[],
    ...(input.authReadiness ? { authReadiness: input.authReadiness } : {}),
    diagnostics: Object.freeze([...input.diagnostics]) as PluginContributionActivationResult["diagnostics"],
    referencePitFixtureIds: Object.freeze([...new Set(input.referencePitFixtureIds)].sort()) as readonly string[],
    audit: {
      source: "plugin-system",
      operation: "activate-contribution",
      pluginId: input.request.pluginId,
      contributionId: input.request.contributionId,
      ownerSubsystem: input.request.ownerSubsystem,
    },
    redaction: { class: "secret" as const, fields: ["authorizations.credentialRef", "authReadiness.grants.credentialRef"] },
  };
  return Object.freeze({
    ...result,
    replayFingerprint: `plugin-contribution-activation:${stableHash(stableStringify(result))}`,
  });
}
