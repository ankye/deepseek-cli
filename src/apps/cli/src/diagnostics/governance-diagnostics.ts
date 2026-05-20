import type {
  GovernanceDiagnosticFinding,
  GovernanceDiagnosticsFilter,
  GovernanceDiagnosticsSection,
  GovernanceDiagnosticsSectionId,
  GovernanceDiagnosticsSummary,
  GovernanceFindingSeverity,
  GovernanceMaturityState,
  GovernanceProductReadyClaim,
  JsonObject,
  ReadinessCheck,
  ReadinessStatus,
  ReleaseVerificationEvidence
} from "@deepseek/platform-contracts";
import { DIAGNOSTICS_READINESS_SCHEMA_VERSION } from "@deepseek/platform-contracts";

interface SectionSpec {
  readonly sectionId: GovernanceDiagnosticsSectionId;
  readonly checkId?: string;
  readonly label: string;
  readonly ownerPackage: string;
  readonly capability: string;
  readonly maturityState: GovernanceMaturityState;
  readonly fallbackStatus: ReadinessStatus;
  readonly fallbackMessage: string;
  readonly evidenceIds: readonly string[];
  readonly nextAction: string;
}

interface CapabilityRiskSpec {
  readonly id: string;
  readonly sectionId: GovernanceDiagnosticsSectionId;
  readonly ownerPackage: string;
  readonly capability: string;
  readonly maturityState: GovernanceMaturityState;
  readonly status: ReadinessStatus;
  readonly severity: GovernanceFindingSeverity;
  readonly message: string;
  readonly evidenceIds: readonly string[];
  readonly nextAction: string;
}

export interface CollectGovernanceDiagnosticsInput {
  readonly checks: readonly ReadinessCheck[];
  readonly verification: ReleaseVerificationEvidence;
  readonly productReadyClaims?: readonly GovernanceProductReadyClaim[];
}

const SECTION_SPECS: readonly SectionSpec[] = [
  section("governance.kernel-boundary", "governance.runtime-kernel-boundary", "Kernel boundary", "runtime", "runtime-kernel", "implemented", "fail", "Runtime kernel governance check is missing.", ["openspec/changes/harden-runtime-kernel-boundary"], "Fix runtime kernel boundary diagnostics before promotion."),
  section("governance.uapi-compatibility", "governance.platform-contracts-uapi", "UAPI compatibility", "platform-contracts", "platform-contracts-uapi", "implemented", "fail", "UAPI governance check is missing.", ["openspec/changes/govern-platform-contracts-uapi"], "Fix platform-contracts UAPI compatibility evidence."),
  section("governance.context-cache-health", undefined, "Context and cache health", "context-engine", "context-prefix-cache", "partial", "pass", "Context/cache diagnostic projection is available through acceptance evidence.", ["docs/architecture/context-pipeline-cache.md", "tests/acceptance/latest/deepseek-provider-response-cache.json"], "Promote after context pipeline OpenSpec implementation evidence is complete."),
  section("governance.bus-pressure", "governance.runtime-pipes", "Runtime bus pressure", "runtime-message-bus", "bounded-runtime-pipes", "implemented", "fail", "Runtime pipe governance check is missing.", ["openspec/changes/define-bounded-runtime-pipes"], "Fix runtime pipe pressure and replay evidence."),
  section("governance.policy-gates", "governance.policy-sandbox-gates", "Policy gates", "policy-sandbox", "policy-sandbox-gates", "implemented", "fail", "Policy sandbox governance check is missing.", ["openspec/changes/enforce-policy-sandbox-gates"], "Fix release-blocking policy gate gaps."),
  section("governance.agent-scopes", "governance.agent-namespace-quotas", "Agent scopes", "agent-management", "agent-namespace-quotas", "rollout-gated", "fail", "Agent namespace governance check is missing.", ["openspec/changes/govern-agent-namespace-quotas"], "Keep write-capable multi-agent defaults gated until scope evidence is complete."),
  section("governance.module-status", "governance.plugin-module-boundaries", "Module status", "plugin-system", "plugin-module-boundaries", "rollout-gated", "fail", "Governed module boundary check is missing.", ["openspec/changes/govern-plugin-module-boundaries"], "Fix module manifest, policy, or lifecycle evidence before third-party execution."),
  section("governance.roadmap-drift", "governance.architecture-drift", "Roadmap drift", "platform-governance", "roadmap-drift", "implemented", "fail", "Architecture drift governance check is missing.", ["openspec/changes/enforce-architecture-guardrails-drift", "docs/architecture/package-map.md", "docs/product/product-roadmap.md"], "Fix ghost alias, roadmap, package-map, or placeholder metadata drift before closing the umbrella governance program."),
  section("governance.evidence-matrix", "governance.evidence-matrix", "Evidence matrix", "testing-regression", "governance-evidence-matrix", "implemented", "fail", "Evidence matrix check is missing.", ["openspec/changes/establish-governance-evidence-matrix", "tests/acceptance/latest/governance-evidence-matrix.json", "tests/acceptance/acceptance-index.md"], "Refresh evidence matrix output before promotion.")
];

const CAPABILITY_RISK_SPECS: readonly CapabilityRiskSpec[] = [
  risk(
    "remote-runtime-connectivity-placeholder",
    "governance.roadmap-drift",
    "platform-abstraction",
    "remote-runtime-connectivity",
    "placeholder",
    "warn",
    "warning",
    "Remote runtime connectivity is backed by NoopRemoteRuntimeConnectivity; it stores bindings in memory and performs no real network transport.",
    ["src/packages/platform-abstraction/src/placeholders/agent-remote.ts", "docs/product/product-roadmap.md", "openspec/changes/systematize-platform-governance"],
    "Keep remote/server claims downgraded until a real transport, identity mapping, policy gate, and acceptance evidence exist."
  ),
  risk(
    "distribution-update-management-placeholder",
    "governance.roadmap-drift",
    "platform-abstraction",
    "distribution-update-management",
    "placeholder",
    "warn",
    "warning",
    "Distribution update management is backed by StaticDistributionUpdateManager; it returns a static dev release and no update catalog.",
    ["src/packages/platform-abstraction/src/placeholders/agent-distribution.ts", "docs/product/product-roadmap.md", "openspec/changes/systematize-platform-governance"],
    "Keep update-channel claims downgraded until signed catalog, channel, rollback, and dry-run evidence exist."
  ),
  risk(
    "extension-system-placeholder",
    "governance.module-status",
    "platform-abstraction",
    "extension-system",
    "placeholder",
    "warn",
    "warning",
    "Extension management is backed by an in-memory placeholder and command contribution normalization; it is not a standalone product extension system.",
    ["src/packages/platform-abstraction/src/placeholders/agent-extension.ts", "src/packages/command-system/src/normalizers.ts", "docs/architecture/plugin-module-boundaries.md"],
    "Route extension claims through governed module manifests and CLI-accepted extension workflows before host promotion."
  ),
  risk(
    "evolution-engine-placeholder",
    "governance.roadmap-drift",
    "platform-abstraction",
    "evolution-engine",
    "placeholder",
    "warn",
    "warning",
    "Evolution engine behavior is an in-memory feature-gate and migration placeholder; no product evolution loop is implemented.",
    ["src/packages/platform-abstraction/src/placeholders/agent-evolution.ts", "docs/product/product-roadmap.md", "openspec/changes/systematize-platform-governance"],
    "Keep evolution and managed rollout claims deferred until persistent migration, rollback, and evaluation evidence exist."
  ),
  risk(
    "semantic-indexing-deferred",
    "governance.context-cache-health",
    "index-provider",
    "semantic-indexing",
    "deferred",
    "warn",
    "warning",
    "Semantic indexing is deferred: ZVec and code-index require missing implementation, embedding/vector-store, analyzer, and activation evidence while PageIndex remains the deterministic fallback.",
    ["src/packages/index-provider/src/diagnostics.ts", "docs/architecture/context-pipeline-cache.md", "tests/e2e/local-readiness-cli.test.ts"],
    "Provide semantic provider implementation, activation evidence, vector/code-index storage evidence, and cache impact tests before promotion."
  ),
  risk(
    "vscode-host-adapter-skeleton",
    "governance.module-status",
    "vscode-extension",
    "vscode-host-adapter",
    "partial",
    "warn",
    "warning",
    "VSCode host adapter is a protocol projection bridge with skeleton editor context and workspace edit behavior; full IDE product workflows remain gated.",
    ["src/apps/vscode-extension/src/index.ts", "tests/e2e/headless-cli-and-vscode.test.ts", "docs/architecture/future-host-landings.md"],
    "Promote VSCode only after CLI-proven workflows have IDE approval, diff, edit, policy, and smoke evidence."
  ),
  risk(
    "multi-agent-rollout-gated-defaults",
    "governance.agent-scopes",
    "agent-management",
    "multi-agent-write-defaults",
    "rollout-gated",
    "warn",
    "warning",
    "Coordinator, worker, and repair contracts have namespace/quota evidence, but default write-capable multi-agent execution remains rollout-gated.",
    ["src/packages/agent-management/src/index.ts", "docs/product/product-roadmap.md", "openspec/changes/govern-agent-namespace-quotas"],
    "Keep coordinator/worker/repair writes gated until scoped writes, conflict handling, verifier quality, and evaluation evidence are accepted."
  )
];

export function collectGovernanceDiagnostics(input: CollectGovernanceDiagnosticsInput): GovernanceDiagnosticsSummary {
  const sections = SECTION_SPECS.map((spec) => sectionFromSpec(spec, input));
  const sectionsWithClaims = applyProductReadyClaims(sections, input.productReadyClaims ?? []);
  const findings = sectionsWithClaims.flatMap((item) => item.findings);
  return {
    schemaVersion: DIAGNOSTICS_READINESS_SCHEMA_VERSION,
    status: statusFromFindings(findings),
    sections: sectionsWithClaims,
    findings,
    redaction: { class: "internal", fields: ["findings.message", "findings.nextAction"] }
  };
}

export function filterGovernanceDiagnostics(
  summary: GovernanceDiagnosticsSummary | undefined,
  filter: GovernanceDiagnosticsFilter | undefined
): GovernanceDiagnosticsSummary | undefined {
  if (!summary || !filter) return summary;
  const filteredSections: GovernanceDiagnosticsSection[] = [];
  for (const section of summary.sections) {
    const findings = section.findings.filter((finding) => findingMatchesFilter(finding, filter));
    if (findings.length > 0) {
      filteredSections.push({ ...section, findings, status: statusFromFindings(findings) });
    }
  }
  const findings = filteredSections.flatMap((section) => section.findings);
  return {
    ...summary,
    status: statusFromFindings(findings),
    sections: filteredSections,
    findings,
    filters: filter
  };
}

export function governanceProductReadyClaimCheck(summary: GovernanceDiagnosticsSummary): ReadinessCheck | undefined {
  const blockers = summary.findings.filter((finding) => finding.id.startsWith("governance.product-ready-claim.") && finding.releaseBlocking);
  if (blockers.length === 0) return undefined;
  return {
    id: "governance.product-ready-claims",
    label: "Product-ready claim gate",
    status: "fail",
    message: `${blockers.length} product-ready claim(s) conflict with governance evidence.`,
    suggestedActions: ["Remove or downgrade conflicting product-ready claims until the matching governance section is implemented and passing."],
    metadata: {
      blockerIds: blockers.map((finding) => finding.id),
      capabilities: blockers.map((finding) => finding.capability),
      evidenceIds: blockers.flatMap((finding) => finding.evidenceIds)
    },
    redaction: { class: "internal", fields: ["metadata"] }
  };
}

export function governanceFilterFromInput(input: JsonObject | undefined): GovernanceDiagnosticsFilter | undefined {
  const severities = arrayFrom(input?.severity ?? input?.severities).filter(isGovernanceFindingSeverity);
  const ownerPackages = arrayFrom(input?.package ?? input?.packages ?? input?.ownerPackage ?? input?.ownerPackages);
  const capabilities = arrayFrom(input?.capability ?? input?.capabilities);
  if (severities.length === 0 && ownerPackages.length === 0 && capabilities.length === 0) return undefined;
  return {
    ...(severities.length > 0 ? { severities } : {}),
    ...(ownerPackages.length > 0 ? { ownerPackages } : {}),
    ...(capabilities.length > 0 ? { capabilities } : {}),
    redaction: { class: "internal" }
  };
}

export function productReadyClaimsFromInput(input: JsonObject | undefined): readonly GovernanceProductReadyClaim[] {
  const raw = input?.productReadyClaims;
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item === "string") return [productReadyClaim(item)];
      if (isJsonObject(item) && typeof item.capability === "string") {
        return [productReadyClaim(item.capability, typeof item.ownerPackage === "string" ? item.ownerPackage : undefined, arrayFrom(item.evidenceIds))];
      }
      return [];
    });
  }
  return arrayFrom(input?.productReadyClaim ?? input?.productReady).map((capability) => productReadyClaim(capability));
}

function sectionFromSpec(spec: SectionSpec, input: CollectGovernanceDiagnosticsInput): GovernanceDiagnosticsSection {
  const check = spec.checkId ? input.checks.find((item) => item.id === spec.checkId) : undefined;
  const synthetic = syntheticSectionState(spec, input);
  const status = check?.status ?? synthetic.status ?? spec.fallbackStatus;
  const message = check?.message ?? synthetic.message ?? spec.fallbackMessage;
  const evidenceIds = unique([
    ...spec.evidenceIds,
    ...collectEvidenceIds(check?.metadata),
    ...synthetic.evidenceIds
  ]).slice(0, 30);
  const finding = findingFromSection(spec, status, message, evidenceIds, check);
  const findings = [finding, ...riskFindingsForSection(spec.sectionId)];
  const sectionStatus = statusFromFindings(findings);
  return {
    sectionId: spec.sectionId,
    label: spec.label,
    ownerPackage: spec.ownerPackage,
    capability: spec.capability,
    status: sectionStatus,
    maturityState: spec.maturityState,
    findings,
    summary: `${spec.label}: ${sectionStatus} (${spec.maturityState})`,
    redaction: { class: "internal", fields: ["findings.message", "findings.nextAction"] }
  };
}

function applyProductReadyClaims(
  sections: readonly GovernanceDiagnosticsSection[],
  claims: readonly GovernanceProductReadyClaim[]
): readonly GovernanceDiagnosticsSection[] {
  if (claims.length === 0) return sections;
  return sections.map((section) => {
    const matchingClaims = claims.filter((claim) => sectionMatchesClaim(section, claim.capability));
    if (matchingClaims.length === 0) return section;
    const claimFindings = matchingClaims.flatMap((claim) => productReadyClaimFindings(section, claim));
    const findings = [...section.findings, ...claimFindings];
    return {
      ...section,
      status: statusFromFindings(findings),
      findings,
      summary: `${section.label}: ${statusFromFindings(findings)} (${section.maturityState})`
    };
  });
}

function productReadyClaimFindings(
  section: GovernanceDiagnosticsSection,
  claim: GovernanceProductReadyClaim
): readonly GovernanceDiagnosticFinding[] {
  const matchedFinding = section.findings.find((item) => matchesFindingCapability(item, claim.capability));
  const target = matchedFinding ?? section;
  const targetStatus = target.status;
  const targetMaturityState = target.maturityState;
  const sectionScope = {
    sectionId: section.sectionId,
    ownerPackage: target.ownerPackage,
    capability: target.capability
  };
  const targetEvidenceIds = matchedFinding?.evidenceIds ?? section.findings.flatMap((item) => item.evidenceIds);
  const conflict = targetStatus !== "pass" || targetMaturityState !== "implemented";
  if (!conflict) {
    return [finding({
      id: `governance.product-ready-claim.${normalizeId(claim.capability)}.accepted`,
      section: sectionScope,
      severity: "info",
      status: "pass",
      maturityState: "product-ready",
      message: `Product-ready claim for ${claim.capability} is backed by implemented passing governance evidence.`,
      evidenceIds: unique([...(claim.evidenceIds ?? []), ...targetEvidenceIds]),
      nextAction: "Keep release evidence current before publishing."
    })];
  }
  return [finding({
    id: `governance.product-ready-claim.${normalizeId(claim.capability)}.conflict`,
    section: sectionScope,
    severity: "release-blocking",
    status: "fail",
    maturityState: targetMaturityState,
    message: `Product-ready claim for ${claim.capability} conflicts with ${section.sectionId}/${target.capability}: status=${targetStatus}, maturity=${targetMaturityState}.`,
    evidenceIds: unique([...(claim.evidenceIds ?? []), ...targetEvidenceIds]),
    nextAction: "Downgrade the product-ready claim or complete the required governance evidence first."
  })];
}

function riskFindingsForSection(sectionId: GovernanceDiagnosticsSectionId): readonly GovernanceDiagnosticFinding[] {
  return CAPABILITY_RISK_SPECS
    .filter((spec) => spec.sectionId === sectionId)
    .map((spec) => finding({
      id: `governance.finding.${normalizeId(spec.id)}`,
      section: {
        sectionId: spec.sectionId,
        ownerPackage: spec.ownerPackage,
        capability: spec.capability
      },
      severity: spec.severity,
      status: spec.status,
      maturityState: spec.maturityState,
      message: spec.message,
      evidenceIds: spec.evidenceIds,
      nextAction: spec.nextAction
    }));
}

function findingFromSection(
  spec: SectionSpec,
  status: ReadinessStatus,
  message: string,
  evidenceIds: readonly string[],
  check: ReadinessCheck | undefined
): GovernanceDiagnosticFinding {
  return finding({
    id: `governance.finding.${normalizeId(spec.sectionId)}`,
    section: {
      sectionId: spec.sectionId,
      ownerPackage: spec.ownerPackage,
      capability: spec.capability
    },
    severity: severityFromStatus(status),
    status,
    maturityState: spec.maturityState,
    message,
    evidenceIds,
    ...(check?.id ? { sourceCheckId: check.id } : {}),
    nextAction: check?.suggestedActions?.[0] ?? spec.nextAction
  });
}

function finding(input: {
  readonly id: string;
  readonly section: Pick<GovernanceDiagnosticsSection, "sectionId" | "ownerPackage" | "capability">;
  readonly severity: GovernanceFindingSeverity;
  readonly status: ReadinessStatus;
  readonly maturityState: GovernanceMaturityState;
  readonly message: string;
  readonly evidenceIds: readonly string[];
  readonly sourceCheckId?: string;
  readonly nextAction: string;
}): GovernanceDiagnosticFinding {
  return {
    id: input.id,
    sectionId: input.section.sectionId,
    capability: input.section.capability,
    ownerPackage: input.section.ownerPackage,
    affectedPackages: [input.section.ownerPackage],
    affectedCapabilities: [input.section.capability],
    severity: input.severity,
    maturityState: input.maturityState,
    status: input.status,
    message: input.message,
    evidenceIds: input.evidenceIds,
    ...(input.sourceCheckId ? { sourceCheckId: input.sourceCheckId } : {}),
    nextAction: input.nextAction,
    releaseBlocking: input.severity === "release-blocking",
    redaction: { class: "internal", fields: ["message", "nextAction"] }
  };
}

function syntheticSectionState(
  spec: SectionSpec,
  input: CollectGovernanceDiagnosticsInput
): { readonly status?: ReadinessStatus; readonly message?: string; readonly evidenceIds: readonly string[] } {
  if (spec.sectionId === "governance.context-cache-health") {
    const cacheEvidence = "tests/acceptance/latest/deepseek-provider-response-cache.json";
    const missing = input.verification.missingAcceptanceEvidencePaths?.includes(cacheEvidence) === true;
    return {
      status: missing ? "warn" : "pass",
      message: missing
        ? "Context/cache health evidence is missing from acceptance artifacts."
        : "Context/cache health is visible through prefix/cache architecture and provider cache acceptance evidence.",
      evidenceIds: [cacheEvidence, "docs/architecture/context-pipeline-cache.md"]
    };
  }
  return { evidenceIds: [] };
}

function findingMatchesFilter(finding: GovernanceDiagnosticFinding, filter: GovernanceDiagnosticsFilter): boolean {
  const severityMatches = !filter.severities || filter.severities.length === 0 || filter.severities.includes(finding.severity);
  const packageMatches = !filter.ownerPackages || filter.ownerPackages.length === 0 || filter.ownerPackages.some((item) => finding.affectedPackages.includes(item) || finding.ownerPackage === item);
  const capabilityMatches = !filter.capabilities || filter.capabilities.length === 0 || filter.capabilities.some((item) => finding.affectedCapabilities.includes(item) || finding.capability === item);
  return severityMatches && packageMatches && capabilityMatches;
}

function matchesCapability(section: GovernanceDiagnosticsSection, capability: string): boolean {
  return section.capability === capability || section.sectionId.endsWith(normalizeId(capability)) || capability.includes(section.capability) || section.capability.includes(capability);
}

function sectionMatchesClaim(section: GovernanceDiagnosticsSection, capability: string): boolean {
  return matchesCapability(section, capability) || section.findings.some((finding) => matchesFindingCapability(finding, capability));
}

function matchesFindingCapability(finding: GovernanceDiagnosticFinding, capability: string): boolean {
  const normalizedCapability = normalizeId(capability);
  return normalizeId(finding.capability) === normalizedCapability
    || finding.affectedCapabilities.some((item) => normalizeId(item) === normalizedCapability)
    || normalizedCapability.includes(normalizeId(finding.capability))
    || normalizeId(finding.capability).includes(normalizedCapability);
}

function statusFromFindings(findings: readonly GovernanceDiagnosticFinding[]): ReadinessStatus {
  if (findings.some((finding) => finding.status === "fail" || finding.severity === "release-blocking")) return "fail";
  if (findings.some((finding) => finding.status === "warn" || finding.severity === "warning")) return "warn";
  return "pass";
}

function severityFromStatus(status: ReadinessStatus): GovernanceFindingSeverity {
  if (status === "fail") return "release-blocking";
  if (status === "warn") return "warning";
  return "info";
}

function section(
  sectionId: GovernanceDiagnosticsSectionId,
  checkId: string | undefined,
  label: string,
  ownerPackage: string,
  capability: string,
  maturityState: GovernanceMaturityState,
  fallbackStatus: ReadinessStatus,
  fallbackMessage: string,
  evidenceIds: readonly string[],
  nextAction: string
): SectionSpec {
  return {
    sectionId,
    ...(checkId ? { checkId } : {}),
    label,
    ownerPackage,
    capability,
    maturityState,
    fallbackStatus,
    fallbackMessage,
    evidenceIds,
    nextAction
  };
}

function risk(
  id: string,
  sectionId: GovernanceDiagnosticsSectionId,
  ownerPackage: string,
  capability: string,
  maturityState: GovernanceMaturityState,
  status: ReadinessStatus,
  severity: GovernanceFindingSeverity,
  message: string,
  evidenceIds: readonly string[],
  nextAction: string
): CapabilityRiskSpec {
  return { id, sectionId, ownerPackage, capability, maturityState, status, severity, message, evidenceIds, nextAction };
}

function productReadyClaim(capability: string, ownerPackage?: string, evidenceIds: readonly string[] = []): GovernanceProductReadyClaim {
  return {
    capability,
    ...(ownerPackage ? { ownerPackage } : {}),
    claimedState: "product-ready",
    evidenceIds,
    redaction: { class: "internal" }
  };
}

function collectEvidenceIds(value: unknown): readonly string[] {
  const evidence = new Set<string>();
  visitEvidence(value, "", evidence);
  return [...evidence].sort();
}

function visitEvidence(value: unknown, key: string, evidence: Set<string>): void {
  if (evidence.size >= 50) return;
  if (typeof value === "string") {
    if (isEvidenceKey(key)) evidence.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visitEvidence(item, key, evidence);
    return;
  }
  if (!isJsonObject(value)) return;
  for (const [entryKey, entryValue] of Object.entries(value)) {
    visitEvidence(entryValue, entryKey, evidence);
  }
}

function isEvidenceKey(key: string): boolean {
  return key === "evidenceIds"
    || key === "referencePitFixtureIds"
    || key === "acceptanceEvidencePaths"
    || key === "requiredEvidencePaths"
    || key === "evidence"
    || key === "sourceEvidencePath";
}

function arrayFrom(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function isGovernanceFindingSeverity(value: string): value is GovernanceFindingSeverity {
  return value === "info" || value === "warning" || value === "release-blocking";
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
