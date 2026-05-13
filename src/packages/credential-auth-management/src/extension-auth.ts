import type {
  CredentialRef,
  ExtensionAuthReadinessEvidence,
  ExtensionCredentialAuthorizationResult,
  ExtensionCredentialDenialReason,
  ExtensionCredentialGrant,
  ExtensionCredentialGrantStatus,
  ExtensionCredentialOperation,
  ExtensionCredentialOwner,
  ExtensionCredentialRequirement,
  ExtensionCredentialRequirementDiff,
  RedactedError,
  SessionId,
  TrustStatus,
  WorkspaceId,
} from "@deepseek/platform-contracts";
import { EXTENSION_AUTH_SCHEMA_VERSION } from "@deepseek/platform-contracts";

const credentialScopePitFixtureId = "pit.extension-auth.credential-scope-denial";
const diagnosticRedactionPitFixtureId = "pit.diagnostic-redaction.support-bundle";
const permissionExpansionPitFixtureId = "pit.extension-permission-expansion.permission-diff";

export interface CreateExtensionCredentialRequirementInput {
  readonly requirementId: string;
  readonly owner: ExtensionCredentialOwner;
  readonly operations: readonly ExtensionCredentialOperation[];
  readonly credentialRef?: CredentialRef;
  readonly provider?: string;
  readonly profile?: string;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
  readonly trust?: TrustStatus;
  readonly required?: boolean;
  readonly reason?: string;
  readonly referencePitFixtureIds?: readonly string[];
}

export interface CreateExtensionCredentialGrantInput {
  readonly grantId: string;
  readonly credentialRef: CredentialRef;
  readonly owner: ExtensionCredentialOwner;
  readonly operations: readonly ExtensionCredentialOperation[];
  readonly trust?: TrustStatus;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
  readonly status?: ExtensionCredentialGrant["status"];
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly audit?: ExtensionCredentialGrant["audit"];
}

export interface AuthorizeExtensionCredentialInput {
  readonly requirement: ExtensionCredentialRequirement;
  readonly operation: ExtensionCredentialOperation;
  readonly grants: readonly ExtensionCredentialGrant[];
  readonly owner?: ExtensionCredentialOwner;
  readonly now?: string;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
  readonly trust?: TrustStatus;
  readonly referencePitFixtureIds?: readonly string[];
}

export interface CreateExtensionAuthReadinessInput {
  readonly owner: ExtensionCredentialOwner;
  readonly requirements: readonly ExtensionCredentialRequirement[];
  readonly grants: readonly ExtensionCredentialGrant[];
  readonly now?: string;
  readonly operations?: readonly ExtensionCredentialOperation[];
}

type ExtensionAuthReadinessStatus = ExtensionAuthReadinessEvidence["status"];

export function createExtensionCredentialRequirement(input: CreateExtensionCredentialRequirementInput): ExtensionCredentialRequirement {
  return deepFreeze({
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    requirementId: input.requirementId,
    ...(input.credentialRef ? { credentialRef: input.credentialRef } : {}),
    owner: deepFreezeOwner(input.owner),
    operations: freezeSorted(input.operations),
    ...(input.provider ? { provider: input.provider } : {}),
    ...(input.profile ? { profile: input.profile } : {}),
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.trust ? { trust: input.trust } : {}),
    required: input.required ?? true,
    ...(input.reason ? { reason: input.reason } : {}),
    referencePitFixtureIds: freezeSorted(input.referencePitFixtureIds ?? []),
    redaction: { class: "internal", fields: ["credentialRef"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  });
}

export function createExtensionCredentialGrant(input: CreateExtensionCredentialGrantInput): ExtensionCredentialGrant {
  const status: ExtensionCredentialGrantStatus = input.status ?? "active";
  const grantWithoutFingerprint = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    grantId: input.grantId,
    credentialRef: input.credentialRef,
    owner: deepFreezeOwner(input.owner),
    operations: freezeSorted(input.operations),
    ...(input.trust ? { trust: input.trust } : {}),
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    status,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    ...(input.revokedAt ? { revokedAt: input.revokedAt } : {}),
    audit: input.audit ?? { source: "credential-auth-management", operation: "grant" },
    redaction: { class: "secret" as const, fields: ["credentialRef"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  } satisfies Omit<ExtensionCredentialGrant, "replayFingerprint">;

  return deepFreeze({
    ...grantWithoutFingerprint,
    replayFingerprint: extensionAuthFingerprint("grant", grantWithoutFingerprint),
  });
}

export function revokeExtensionCredentialGrant(grant: ExtensionCredentialGrant, revokedAt = "1970-01-01T00:00:00.000Z"): ExtensionCredentialGrant {
  return createExtensionCredentialGrant({
    grantId: grant.grantId,
    credentialRef: grant.credentialRef,
    owner: grant.owner,
    operations: grant.operations,
    ...(grant.trust ? { trust: grant.trust } : {}),
    ...(grant.workspaceId ? { workspaceId: grant.workspaceId } : {}),
    ...(grant.sessionId ? { sessionId: grant.sessionId } : {}),
    status: "revoked",
    ...(grant.expiresAt ? { expiresAt: grant.expiresAt } : {}),
    revokedAt,
    audit: { ...grant.audit, operation: "revoke", revokedAt },
  });
}

export function authorizeExtensionCredential(input: AuthorizeExtensionCredentialInput): ExtensionCredentialAuthorizationResult {
  const owner = input.owner ?? input.requirement.owner;
  const referencePitFixtureIds = freezeSorted([
    ...(input.requirement.referencePitFixtureIds ?? []),
    ...(input.referencePitFixtureIds ?? []),
  ]);
  const matchingGrant = input.grants.find((grant) => grant.grantId === input.requirement.credentialRef || grant.credentialRef === input.requirement.credentialRef) ?? input.grants[0];
  const denialReason = extensionCredentialDenialReason(input, owner, matchingGrant);
  if (denialReason || !matchingGrant) {
    return authorizationResult({
      status: "denied",
      owner,
      operation: input.operation,
      requirementId: input.requirement.requirementId,
      reason: denialReason ?? "missing",
      diagnostics: [authorizationDiagnostic(denialReason ?? "missing")],
      referencePitFixtureIds: ensurePit(referencePitFixtureIds, credentialScopePitFixtureId),
    });
  }

  return authorizationResult({
    status: "allowed",
    owner,
    operation: input.operation,
    requirementId: input.requirement.requirementId,
    grantId: matchingGrant.grantId,
    credentialRef: matchingGrant.credentialRef,
    diagnostics: [],
    referencePitFixtureIds,
  });
}

export function createExtensionAuthReadinessEvidence(input: CreateExtensionAuthReadinessInput): ExtensionAuthReadinessEvidence {
  const operations = input.operations ?? uniqueOperations(input.requirements);
  const authorizations = input.requirements.flatMap((requirement) =>
    operations
      .filter((operation) => requirement.operations.includes(operation))
      .map((operation) => authorizeExtensionCredential({
        requirement,
        operation,
        grants: input.grants,
        owner: input.owner,
        ...(input.now ? { now: input.now } : {}),
      }))
  );
  const hasRequiredRequirements = input.requirements.some((requirement) => requirement.required);
  const denied = authorizations.filter((authorization) => authorization.status === "denied");
  const status: ExtensionAuthReadinessStatus = input.requirements.length === 0 || !hasRequiredRequirements
    ? "not-required"
    : denied.length === 0
      ? "ready"
      : denied.some((authorization) => authorization.reason === "missing")
        ? "missing-grant"
        : "denied";
  const evidenceWithoutFingerprint = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    owner: deepFreezeOwner(input.owner),
    requirements: deepFreeze([...input.requirements]),
    grants: deepFreeze([...input.grants]),
    authorizations: deepFreeze(authorizations),
    status,
    diagnostics: deepFreeze(denied.flatMap((authorization) => authorization.diagnostics)),
    referencePitFixtureIds: freezeSorted([...input.requirements.flatMap((requirement) => requirement.referencePitFixtureIds ?? []), ...(denied.length > 0 ? [credentialScopePitFixtureId, diagnosticRedactionPitFixtureId] : [])]),
    audit: { source: "credential-auth-management", operation: "diagnose" },
    redaction: { class: "secret" as const, fields: ["grants.credentialRef", "authorizations.credentialRef"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  } satisfies Omit<ExtensionAuthReadinessEvidence, "replayFingerprint">;

  return deepFreeze({
    ...evidenceWithoutFingerprint,
    replayFingerprint: extensionAuthFingerprint("readiness", evidenceWithoutFingerprint),
  });
}

export function diffExtensionCredentialRequirements(
  previous: readonly ExtensionCredentialRequirement[],
  next: readonly ExtensionCredentialRequirement[],
): ExtensionCredentialRequirementDiff {
  const previousKeys = new Map(previous.map((requirement) => [requirementKey(requirement), requirement]));
  const nextKeys = new Map(next.map((requirement) => [requirementKey(requirement), requirement]));
  const added = [...nextKeys].filter(([key]) => !previousKeys.has(key)).map(([, requirement]) => requirement);
  const removed = [...previousKeys].filter(([key]) => !nextKeys.has(key)).map(([, requirement]) => requirement);
  const unchanged = [...nextKeys].filter(([key]) => previousKeys.has(key)).map(([, requirement]) => requirement);
  const diffWithoutFingerprint = {
    added: deepFreeze(added),
    removed: deepFreeze(removed),
    unchanged: deepFreeze(unchanged),
    referencePitFixtureIds: added.length > 0 || removed.length > 0 ? [permissionExpansionPitFixtureId, credentialScopePitFixtureId] : [],
    redaction: { class: "internal" as const, fields: ["*.credentialRef"] },
  } satisfies Omit<ExtensionCredentialRequirementDiff, "replayFingerprint">;
  return deepFreeze({
    ...diffWithoutFingerprint,
    replayFingerprint: extensionAuthFingerprint("requirement-diff", diffWithoutFingerprint),
  });
}

function extensionCredentialDenialReason(
  input: AuthorizeExtensionCredentialInput,
  owner: ExtensionCredentialOwner,
  grant: ExtensionCredentialGrant | undefined,
): ExtensionCredentialDenialReason | undefined {
  if (!input.requirement.required) return undefined;
  if (!input.requirement.operations.includes(input.operation)) return "undeclared";
  if (!grant) return "missing";
  if (grant.status === "revoked") return "revoked";
  if (grant.status === "expired") return "expired";
  if (grant.expiresAt && Date.parse(grant.expiresAt) <= Date.parse(input.now ?? "1970-01-01T00:00:00.000Z")) return "expired";
  if (!sameOwner(grant.owner, owner) || !sameOwner(input.requirement.owner, owner)) return "owner-mismatch";
  if (!grant.operations.includes(input.operation)) return "operation-mismatch";
  if ((input.requirement.trust && grant.trust && input.requirement.trust !== grant.trust) || (input.trust && grant.trust && input.trust !== grant.trust)) return "trust-mismatch";
  if ((input.requirement.workspaceId && grant.workspaceId && input.requirement.workspaceId !== grant.workspaceId) || (input.workspaceId && grant.workspaceId && input.workspaceId !== grant.workspaceId)) return "workspace-mismatch";
  return undefined;
}

function authorizationResult(input:
  | {
      readonly status: "allowed";
      readonly owner: ExtensionCredentialOwner;
      readonly operation: ExtensionCredentialOperation;
      readonly requirementId: string;
      readonly grantId: string;
      readonly credentialRef: CredentialRef;
      readonly diagnostics: readonly RedactedError[];
      readonly referencePitFixtureIds: readonly string[];
    }
  | {
      readonly status: "denied";
      readonly owner: ExtensionCredentialOwner;
      readonly operation: ExtensionCredentialOperation;
      readonly requirementId: string;
      readonly reason: ExtensionCredentialDenialReason;
      readonly diagnostics: readonly RedactedError[];
      readonly referencePitFixtureIds: readonly string[];
    }
): ExtensionCredentialAuthorizationResult {
  const evidence = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    status: input.status,
    owner: deepFreezeOwner(input.owner),
    operation: input.operation,
    requirementId: input.requirementId,
    ...(input.status === "allowed" ? { grantId: input.grantId, credentialRef: input.credentialRef } : { reason: input.reason }),
    diagnostics: deepFreeze([...input.diagnostics]),
    referencePitFixtureIds: freezeSorted(input.referencePitFixtureIds),
    audit: { source: "credential-auth-management", operation: "authorize" },
    redaction: { class: "secret", fields: ["credentialRef", "diagnostics"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  };
  return deepFreeze({
    ...evidence,
    replayFingerprint: extensionAuthFingerprint("authorization", evidence),
  }) as ExtensionCredentialAuthorizationResult;
}

function authorizationDiagnostic(reason: ExtensionCredentialDenialReason): RedactedError {
  return {
    code: `EXTENSION_CREDENTIAL_${reason.toUpperCase().replace(/-/g, "_")}`,
    message: `Extension credential authorization denied: ${reason}.`,
    retryable: reason === "missing" || reason === "expired",
    redaction: { class: "public" },
  };
}

function sameOwner(left: ExtensionCredentialOwner, right: ExtensionCredentialOwner): boolean {
  return left.kind === right.kind && left.id === right.id && (left.pluginId ?? "") === (right.pluginId ?? "") && (left.mcpServerId ?? "") === (right.mcpServerId ?? "");
}

function uniqueOperations(requirements: readonly ExtensionCredentialRequirement[]): readonly ExtensionCredentialOperation[] {
  return freezeSorted([...new Set(requirements.flatMap((requirement) => requirement.operations))]);
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

function ensurePit(existing: readonly string[], pit: string): readonly string[] {
  return existing.includes(pit) ? existing : freezeSorted([...existing, pit]);
}

function deepFreezeOwner(owner: ExtensionCredentialOwner): ExtensionCredentialOwner {
  return deepFreeze({ ...owner, ...(owner.metadata ? { metadata: deepFreeze({ ...owner.metadata }) } : {}) });
}

function freezeSorted<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort()) as readonly T[];
}

function extensionAuthFingerprint(kind: string, value: unknown): string {
  return `${kind}:${stableHash(stableStringify(value))}`;
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

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}
