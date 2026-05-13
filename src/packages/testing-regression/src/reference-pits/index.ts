export type ReferencePitRiskClass = "medium" | "high" | "critical";
export type ReferencePitStatus = "covered" | "partial" | "planned";

export type ReferencePitFamily =
  | "permission-bypass"
  | "headless-trust"
  | "shell-parser-fallback"
  | "path-canonicalization"
  | "mcp-plugin-precedence"
  | "extension-auth-scope"
  | "extension-permission-expansion"
  | "legacy-contribution-normalization"
  | "remote-identity-separation"
  | "env-snapshot"
  | "diagnostic-redaction";

export interface ReferencePitFixture {
  readonly id: string;
  readonly family: ReferencePitFamily;
  readonly title: string;
  readonly owners: readonly string[];
  readonly risk: ReferencePitRiskClass;
  readonly status: ReferencePitStatus;
  readonly requiredAssertion: string;
  readonly evidenceIds: readonly string[];
  readonly syntheticEvidence: readonly string[];
}

export const requiredReferencePitFamilies: readonly ReferencePitFamily[] = Object.freeze([
  "permission-bypass",
  "headless-trust",
  "shell-parser-fallback",
  "path-canonicalization",
  "mcp-plugin-precedence",
  "extension-auth-scope",
  "extension-permission-expansion",
  "legacy-contribution-normalization",
  "remote-identity-separation",
  "env-snapshot",
  "diagnostic-redaction"
]);

export const referencePitFixtures: readonly ReferencePitFixture[] = Object.freeze([
  {
    id: "pit.permission-bypass.hard-safety",
    family: "permission-bypass",
    title: "Bypass mode cannot disable hard safety checks",
    owners: ["policy-sandbox", "testing-regression"],
    risk: "critical",
    status: "covered",
    requiredAssertion: "Raw secret exposure, unsafe resource scopes, and unavailable capabilities remain non-allow decisions even when bypass metadata is present.",
    evidenceIds: ["policy:bypass-hard-safety"],
    syntheticEvidence: ["[REDACTED:api-key]", "filesystem.path-scope.rejected"]
  },
  {
    id: "pit.headless-trust.fail-closed",
    family: "headless-trust",
    title: "Headless approval denies by default",
    owners: ["policy-sandbox", "apps/cli"],
    risk: "high",
    status: "covered",
    requiredAssertion: "Headless approval requests fail closed unless an explicit approval decision is injected.",
    evidenceIds: ["policy:headless-fail-closed"],
    syntheticEvidence: ["Denied by headless default"]
  },
  {
    id: "pit.shell-parser.fallback-risk",
    family: "shell-parser-fallback",
    title: "Shell parser fallback is explicit",
    owners: ["policy-sandbox", "core-coding-tools"],
    risk: "critical",
    status: "partial",
    requiredAssertion: "Wrapped, compound, PowerShell, or parser-unavailable process requests are classified as sandbox-required, rejected, or manually reviewable.",
    evidenceIds: ["policy:shell-fallback-risk"],
    syntheticEvidence: ["shell.analysis.manually-reviewable"]
  },
  {
    id: "pit.path-canonicalization.unsafe-syntax",
    family: "path-canonicalization",
    title: "Unsafe path syntaxes are rejected",
    owners: ["platform-abstraction", "policy-sandbox"],
    risk: "critical",
    status: "covered",
    requiredAssertion: "Home expansion, null bytes, drive-relative paths, UNC paths, trailing dot or space variants, shell expansion, and glob write targets are rejected before mutation.",
    evidenceIds: ["platform:path-unsafe-syntax"],
    syntheticEvidence: ["PLATFORM_PATH_REJECTED"]
  },
  {
    id: "pit.mcp-plugin-precedence.enterprise-deny",
    family: "mcp-plugin-precedence",
    title: "Managed deny rules win after source merge",
    owners: ["config", "mcp-gateway", "plugin-system", "policy-sandbox"],
    risk: "high",
    status: "planned",
    requiredAssertion: "Enterprise or managed deny provenance remains effective after user, project, local, and CLI additions are merged.",
    evidenceIds: [],
    syntheticEvidence: ["managed-policy-deny"]
  },
  {
    id: "pit.extension-permission-expansion.permission-diff",
    family: "extension-permission-expansion",
    title: "Extension permission expansion is visible",
    owners: ["plugin-system", "extension-system"],
    risk: "high",
    status: "covered",
    requiredAssertion: "Plugin installs and lockfile replay expose precise added and removed permissions before acceptance.",
    evidenceIds: ["plugin:permission-expansion"],
    syntheticEvidence: ["permission.diff.added"]
  },
  {
    id: "pit.extension-auth.credential-scope-denial",
    family: "extension-auth-scope",
    title: "Extension credential scope denial is fail-closed",
    owners: ["credential-auth-management", "mcp-gateway", "plugin-system", "apps/cli"],
    risk: "critical",
    status: "covered",
    requiredAssertion: "MCP and plugin credential requests outside declared scoped grants return typed denial evidence before handlers, transports, or raw credential resolvers run.",
    evidenceIds: ["extension-auth:scope-denial", "mcp:auth-pre-dispatch-denial", "cli:extension-auth-diff"],
    syntheticEvidence: ["EXTENSION_CREDENTIAL_MISSING", "pit.extension-auth.credential-scope-denial", "[REDACTED:secret]"]
  },
  {
    id: "pit.legacy-contribution-normalization.manifest-boundary",
    family: "legacy-contribution-normalization",
    title: "Legacy contributions normalize to manifests",
    owners: ["command-system", "skill-system", "extension-system"],
    risk: "medium",
    status: "partial",
    requiredAssertion: "Command, skill, plugin, and extension contributions become versioned manifests before runtime consumption.",
    evidenceIds: ["composition:contribution-validation"],
    syntheticEvidence: ["manifest.schemaVersion"]
  },
  {
    id: "pit.remote-identity.separate-domains",
    family: "remote-identity-separation",
    title: "Remote identity domains remain separate",
    owners: ["remote-runtime-connectivity", "session-store"],
    risk: "high",
    status: "covered",
    requiredAssertion: "Remote binding id, session id, transport kind, display identity, and audit correlation are separately addressable.",
    evidenceIds: ["remote:identity-separation"],
    syntheticEvidence: ["remote-binding-id", "session-id", "audit-correlation-id"]
  },
  {
    id: "pit.env-snapshot.immutable-startup",
    family: "env-snapshot",
    title: "Environment input is snapshotted",
    owners: ["config", "apps/cli", "platform-abstraction"],
    risk: "high",
    status: "covered",
    requiredAssertion: "Config resolution consumes immutable startup snapshots rather than mutable environment or CLI objects.",
    evidenceIds: ["config:immutable-env-snapshot"],
    syntheticEvidence: ["source.environment.priority"]
  },
  {
    id: "pit.diagnostic-redaction.support-bundle",
    family: "diagnostic-redaction",
    title: "Diagnostic bundles redact support material",
    owners: ["observability", "credential-auth-management", "testing-regression"],
    risk: "critical",
    status: "covered",
    requiredAssertion: "Diagnostic records and bundles redact env, auth headers, MCP credential material, plugin metadata, paths, and trace payload secrets.",
    evidenceIds: ["observability:diagnostic-redaction"],
    syntheticEvidence: ["[REDACTED:secret]", "[REDACTED:token]"]
  }
]);

export function listReferencePitFixtures(): readonly ReferencePitFixture[] {
  return referencePitFixtures;
}

export function getReferencePitFixture(id: string): ReferencePitFixture | undefined {
  return referencePitFixtures.find((fixture) => fixture.id === id);
}

export function referencePitFixturesByOwner(owner: string): readonly ReferencePitFixture[] {
  return referencePitFixtures.filter((fixture) => fixture.owners.includes(owner));
}

export function referencePitFixturesByRisk(risk: ReferencePitRiskClass): readonly ReferencePitFixture[] {
  return referencePitFixtures.filter((fixture) => fixture.risk === risk);
}

export function coveredReferencePitFixtureIds(): readonly string[] {
  return referencePitFixtures
    .filter((fixture) => fixture.status === "covered" || fixture.status === "partial")
    .map((fixture) => fixture.id)
    .sort();
}

export function missingReferencePitCoverage(coveredIds: Iterable<string>): readonly string[] {
  const covered = new Set(coveredIds);
  return coveredReferencePitFixtureIds().filter((id) => !covered.has(id));
}

export function assertReferencePitCoverage(coveredIds: Iterable<string>): void {
  const missing = missingReferencePitCoverage(coveredIds);
  if (missing.length > 0) {
    throw new Error(`REFERENCE_PIT_COVERAGE_MISSING: ${missing.join(", ")}`);
  }
}

export function serializeReferencePitCatalog(): readonly ReferencePitFixture[] {
  return JSON.parse(JSON.stringify(referencePitFixtures)) as readonly ReferencePitFixture[];
}
