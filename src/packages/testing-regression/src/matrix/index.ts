import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import type {
  GovernanceDiagnosticFinding,
  GovernanceEvidenceItem,
  GovernanceEvidenceMatrixRecord,
  GovernanceEvidenceMatrixSummary,
  GovernanceEvidenceProductReadinessStatus,
  GovernanceEvidenceRiskTier,
  GovernanceEvidenceStatus,
  GovernanceEvidenceType,
  GovernanceFindingSeverity,
  GovernanceMaturityState,
  GovernanceProductReadyClaim,
  JsonObject,
  ReadinessStatus
} from "@deepseek/platform-contracts";
import { DIAGNOSTICS_READINESS_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export function createFakePlatformMatrix() {
  return [
    new FakePlatformRuntime("macos", "/workspace/macos", { environmentKind: "local", searchProvider: "rg", secureStorageStatus: "available", nativeStatus: "degraded" }),
    new FakePlatformRuntime("windows", "C:/workspace/windows", { environmentKind: "local", searchProvider: "select-string", secureStorageStatus: "available", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/workspace/linux", { environmentKind: "local", searchProvider: "grep", secureStorageStatus: "degraded", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/mnt/c/workspace/wsl", { environmentKind: "wsl", searchProvider: "rg", secureStorageStatus: "degraded", nativeStatus: "degraded" }),
    new FakePlatformRuntime("linux", "/workspace/ci", { environmentKind: "ci", searchProvider: "js", secureStorageStatus: "unavailable", nativeStatus: "unavailable" }),
    new FakePlatformRuntime("linux", "/workspace/remote", { environmentKind: "remote", noLocalShell: true, searchProvider: "js", secureStorageStatus: "unavailable", nativeStatus: "unavailable" }),
    new FakePlatformRuntime("linux", "/workspace/readonly", { environmentKind: "local", searchProvider: "js", secureStorageStatus: "available", nativeStatus: "degraded", readOnlyFilesystem: true }),
    new FakePlatformRuntime("linux", "/workspace/offline", { environmentKind: "local", searchProvider: "js", secureStorageStatus: "available", nativeStatus: "degraded", networkStatus: "unavailable" })
  ];
}

export interface CollectGovernanceEvidenceMatrixInput {
  readonly productReadyClaims?: readonly GovernanceProductReadyClaim[];
}

interface EvidenceRecordSpec {
  readonly packageName: string;
  readonly capability: string;
  readonly ownerPackage: string;
  readonly riskTier: GovernanceEvidenceRiskTier;
  readonly maturityState: GovernanceMaturityState;
  readonly hostSurface?: GovernanceEvidenceMatrixRecord["hostSurface"];
  readonly requiredEvidenceTypes: readonly GovernanceEvidenceType[];
  readonly evidence: Partial<Record<GovernanceEvidenceType, readonly string[]>>;
  readonly nextAction: string;
}

const allEvidenceTypes: readonly GovernanceEvidenceType[] = [
  "contract",
  "integration",
  "golden",
  "matrix",
  "e2e",
  "live-smoke",
  "acceptance",
  "readiness"
];

const defaultRecordSpecs: readonly EvidenceRecordSpec[] = [
  recordSpec(
    "platform-contracts",
    "platform-contracts-uapi",
    "platform-contracts",
    "critical",
    "implemented",
    "none",
    ["contract", "golden", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/platform-contracts-uapi.test.ts"],
      golden: ["tests/golden/governance-diagnostics-replay.test.ts"],
      acceptance: ["tests/acceptance/latest/uapi-compatibility.txt"],
      readiness: ["governance.platform-contracts-uapi"]
    },
    "Keep UAPI compatibility, migration, and acceptance evidence current before changing platform contracts."
  ),
  recordSpec(
    "runtime",
    "runtime-kernel",
    "runtime",
    "critical",
    "implemented",
    "none",
    ["contract", "integration", "golden", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/runtime-kernel-contract.test.ts"],
      integration: ["tests/integration"],
      golden: ["tests/golden/runtime-kernel-replay.test.ts"],
      acceptance: ["tests/acceptance/latest/runtime-kernel.txt"],
      readiness: ["governance.runtime-kernel-boundary"]
    },
    "Keep runtime kernel boundary evidence current before promoting dependent host or module work."
  ),
  recordSpec(
    "deepseek-agent-cli",
    "cli-release-surface",
    "src/apps/cli",
    "product",
    "implemented",
    "cli",
    ["e2e", "live-smoke", "acceptance", "readiness"],
    {
      e2e: ["tests/e2e/local-readiness-cli.test.ts"],
      "live-smoke": ["tests/acceptance/latest/live-cli-run-smoke.txt", "tests/acceptance/latest/live-doctor-smoke.txt"],
      acceptance: ["tests/acceptance/acceptance-index.md"],
      readiness: ["release.package", "release.acceptance"]
    },
    "Keep CLI release, live smoke, and acceptance evidence refreshed before publishing."
  ),
  recordSpec(
    "vscode-extension",
    "vscode-host-adapter",
    "vscode-extension",
    "product",
    "partial",
    "vscode",
    ["e2e", "acceptance", "readiness"],
    {
      e2e: ["tests/e2e/headless-cli-and-vscode.test.ts"]
    },
    "Add VSCode acceptance and readiness evidence before claiming IDE product readiness."
  ),
  recordSpec(
    "remote-runtime-connectivity",
    "remote-runtime-connectivity",
    "platform-abstraction",
    "product",
    "placeholder",
    "server",
    ["integration", "e2e", "live-smoke", "acceptance", "readiness"],
    {},
    "Replace NoopRemoteRuntimeConnectivity with real transport, identity, policy, and acceptance evidence before promotion."
  ),
  recordSpec(
    "distribution-update-management",
    "distribution-update-management",
    "platform-abstraction",
    "product",
    "placeholder",
    "none",
    ["integration", "acceptance", "readiness"],
    {},
    "Add signed update catalog, channel, rollback, and dry-run evidence before update claims are product-ready."
  ),
  recordSpec(
    "index-provider",
    "semantic-indexing",
    "index-provider",
    "platform",
    "deferred",
    "none",
    ["contract", "integration", "e2e", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/index-provider-contracts.test.ts"],
      e2e: ["tests/e2e/local-readiness-cli.test.ts"]
    },
    "Provide semantic provider implementation, activation, integration, and acceptance evidence before enabling semantic recall."
  ),
  recordSpec(
    "agent-management",
    "multi-agent-write-defaults",
    "agent-management",
    "platform",
    "rollout-gated",
    "cli",
    ["contract", "golden", "matrix", "e2e", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/agent-management-modes.test.ts", "tests/contracts/agent-spawn.test.ts"],
      golden: ["tests/golden/mode-aware-agent-loop-replay.test.ts"],
      matrix: ["tests/matrix/cli-mode-terminal-matrix.test.ts"],
      readiness: ["governance.agent-namespace-quotas"]
    },
    "Add scoped write, conflict-handling, e2e, and acceptance evidence before default multi-agent writes."
  ),
  recordSpec(
    "plugin-system",
    "plugin-module-boundaries",
    "plugin-system",
    "extension",
    "rollout-gated",
    "cli",
    ["contract", "matrix", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/plugin-platform-foundation.test.ts"],
      matrix: ["tests/matrix/plugin-extension-tui-matrix.test.ts"],
      acceptance: ["tests/acceptance/acceptance-index.md"],
      readiness: ["governance.plugin-module-boundaries"]
    },
    "Keep module manifest, policy, disable/unload, and acceptance evidence current before third-party execution."
  ),
  recordSpec(
    "testing-regression",
    "governance-evidence-matrix",
    "testing-regression",
    "support",
    "implemented",
    "none",
    ["contract", "golden", "acceptance", "readiness"],
    {
      contract: ["tests/contracts/governance-evidence-matrix.test.ts"],
      golden: ["tests/golden/governance-evidence-matrix-replay.test.ts"],
      acceptance: ["tests/acceptance/latest/governance-evidence-matrix.json"],
      readiness: ["governance.evidence-matrix"]
    },
    "Keep matrix fixtures and release readiness projection in sync."
  )
];

export function collectGovernanceEvidenceMatrix(input: CollectGovernanceEvidenceMatrixInput = {}): GovernanceEvidenceMatrixSummary {
  const records = defaultRecordSpecs.map(recordFromSpec);
  const findings = [
    ...records.flatMap(findingFromRecord),
    ...productReadyClaimFindings(records, input.productReadyClaims ?? [])
  ];
  const status = statusFromFindings(findings);
  return {
    schemaVersion: DIAGNOSTICS_READINESS_SCHEMA_VERSION,
    kind: "governance.evidence-matrix",
    status,
    records,
    recordCount: records.length,
    readyCount: records.filter((record) => record.productReadiness === "ready").length,
    gatedCount: records.filter((record) => record.productReadiness === "gated").length,
    promotionBlockerCount: findings.filter((finding) => finding.releaseBlocking).length,
    evidenceTypes: allEvidenceTypes,
    riskTiers: [...new Set(records.map((record) => record.riskTier))].sort() as readonly GovernanceEvidenceRiskTier[],
    findings,
    redaction: { class: "internal", fields: ["records.evidence.evidenceIds", "findings.message", "findings.nextAction"] }
  };
}

export function createGovernanceEvidenceMatrixFixtures(): readonly GovernanceEvidenceMatrixRecord[] {
  return [
    recordFromSpec(recordSpec("fixture-contract-only", "contract-only-capability", "testing-regression", "platform", "implemented", "none", ["contract", "integration", "acceptance"], { contract: ["tests/contracts/fixture-contract-only.test.ts"] }, "Add integration and acceptance evidence before promotion.")),
    recordFromSpec(recordSpec("fixture-integration-only", "integration-only-capability", "testing-regression", "platform", "implemented", "none", ["contract", "integration", "acceptance"], { integration: ["tests/integration/fixture-integration-only.test.ts"] }, "Add contract and acceptance evidence before promotion.")),
    recordFromSpec(recordSpec("fixture-e2e-missing", "e2e-missing-capability", "testing-regression", "product", "implemented", "cli", ["contract", "e2e", "acceptance"], { contract: ["tests/contracts/fixture-e2e-missing.test.ts"], acceptance: ["tests/acceptance/fixture-e2e-missing.json"] }, "Add e2e evidence before product promotion.")),
    recordFromSpec(recordSpec("fixture-live-smoke-missing", "live-smoke-missing-capability", "testing-regression", "product", "implemented", "cli", ["e2e", "live-smoke", "acceptance"], { e2e: ["tests/e2e/fixture-live-smoke-missing.test.ts"], acceptance: ["tests/acceptance/fixture-live-smoke-missing.json"] }, "Add live smoke evidence before live product promotion.")),
    recordFromSpec(recordSpec("fixture-acceptance-ready", "acceptance-ready-capability", "testing-regression", "support", "implemented", "none", ["contract", "acceptance", "readiness"], { contract: ["tests/contracts/fixture-acceptance-ready.test.ts"], acceptance: ["tests/acceptance/fixture-acceptance-ready.json"], readiness: ["governance.fixture.acceptance-ready"] }, "Keep fixture evidence current."))
  ];
}

function recordFromSpec(spec: EvidenceRecordSpec): GovernanceEvidenceMatrixRecord {
  const evidence = allEvidenceTypes.map((type) => evidenceItem(type, spec.requiredEvidenceTypes.includes(type), spec.evidence[type] ?? []));
  const missingEvidenceTypes = evidence.filter((item) => item.required && item.status === "missing").map((item) => item.type);
  const productReadiness = productReadinessFor(spec, missingEvidenceTypes);
  const severity = severityFor(spec, missingEvidenceTypes, productReadiness);
  return {
    id: `governance.evidence.${normalizeId(spec.packageName)}.${normalizeId(spec.capability)}`,
    packageName: spec.packageName,
    capability: spec.capability,
    ownerPackage: spec.ownerPackage,
    riskTier: spec.riskTier,
    maturityState: spec.maturityState,
    ...(spec.hostSurface ? { hostSurface: spec.hostSurface } : {}),
    productReadiness,
    requiredEvidenceTypes: spec.requiredEvidenceTypes,
    evidence,
    missingEvidenceTypes,
    severity,
    promotionBlocker: productReadiness === "gated" && (spec.maturityState === "implemented" || spec.maturityState === "product-ready"),
    nextAction: missingEvidenceTypes.length > 0 ? spec.nextAction : "Evidence threshold is satisfied; keep evidence fresh before release.",
    redaction: { class: "internal", fields: ["evidence.evidenceIds", "nextAction"] }
  };
}

function evidenceItem(type: GovernanceEvidenceType, required: boolean, evidenceIds: readonly string[]): GovernanceEvidenceItem {
  return {
    type,
    status: required ? evidenceIds.length > 0 ? "present" : "missing" : "not-required",
    evidenceIds,
    required,
    redaction: { class: "internal", fields: ["evidenceIds"] }
  };
}

function productReadinessFor(spec: EvidenceRecordSpec, missingEvidenceTypes: readonly GovernanceEvidenceType[]): GovernanceEvidenceProductReadinessStatus {
  if (spec.maturityState === "placeholder" || spec.maturityState === "deferred" || spec.maturityState === "rollout-gated" || spec.maturityState === "unsupported") return "gated";
  if (spec.hostSurface === "none" && spec.riskTier === "support" && missingEvidenceTypes.length === 0) return "ready";
  return missingEvidenceTypes.length === 0 ? "ready" : "gated";
}

function severityFor(
  spec: EvidenceRecordSpec,
  missingEvidenceTypes: readonly GovernanceEvidenceType[],
  productReadiness: GovernanceEvidenceProductReadinessStatus
): GovernanceFindingSeverity {
  if (productReadiness !== "gated") return "info";
  if (spec.maturityState === "implemented" || spec.maturityState === "product-ready") return "release-blocking";
  return "warning";
}

function findingFromRecord(record: GovernanceEvidenceMatrixRecord): readonly GovernanceDiagnosticFinding[] {
  if (record.productReadiness === "ready") return [];
  return [governanceFinding({
    id: `governance.evidence-matrix.${normalizeId(record.packageName)}.${normalizeId(record.capability)}.missing`,
    capability: record.capability,
    ownerPackage: record.ownerPackage,
    severity: record.severity,
    maturityState: record.maturityState,
    status: record.severity === "release-blocking" ? "fail" : "warn",
    message: `${record.packageName}/${record.capability} is gated by missing evidence: ${record.missingEvidenceTypes.join(", ") || "none"}.`,
    evidenceIds: record.evidence.flatMap((item) => item.evidenceIds),
    nextAction: record.nextAction,
    releaseBlocking: record.severity === "release-blocking"
  })];
}

function productReadyClaimFindings(
  records: readonly GovernanceEvidenceMatrixRecord[],
  claims: readonly GovernanceProductReadyClaim[]
): readonly GovernanceDiagnosticFinding[] {
  return claims.flatMap((claim) => {
    const record = records.find((item) => matchesCapability(item, claim.capability));
    if (!record || record.productReadiness === "ready") return [];
    return [governanceFinding({
      id: `governance.evidence-matrix.product-ready-claim.${normalizeId(claim.capability)}.conflict`,
      capability: record.capability,
      ownerPackage: record.ownerPackage,
      severity: "release-blocking",
      maturityState: record.maturityState,
      status: "fail",
      message: `Product-ready claim for ${claim.capability} conflicts with evidence matrix status=${record.productReadiness}, missing=${record.missingEvidenceTypes.join(", ") || "none"}.`,
      evidenceIds: unique([...(claim.evidenceIds ?? []), ...record.evidence.flatMap((item) => item.evidenceIds)]),
      nextAction: "Downgrade the product-ready claim or attach the required evidence matrix records before promotion.",
      releaseBlocking: true
    })];
  });
}

function governanceFinding(input: {
  readonly id: string;
  readonly capability: string;
  readonly ownerPackage: string;
  readonly severity: GovernanceFindingSeverity;
  readonly maturityState: GovernanceMaturityState;
  readonly status: ReadinessStatus;
  readonly message: string;
  readonly evidenceIds: readonly string[];
  readonly nextAction: string;
  readonly releaseBlocking: boolean;
}): GovernanceDiagnosticFinding {
  return {
    id: input.id,
    sectionId: "governance.evidence-matrix",
    capability: input.capability,
    ownerPackage: input.ownerPackage,
    affectedPackages: [input.ownerPackage],
    affectedCapabilities: [input.capability],
    severity: input.severity,
    maturityState: input.maturityState,
    status: input.status,
    message: input.message,
    evidenceIds: input.evidenceIds,
    nextAction: input.nextAction,
    releaseBlocking: input.releaseBlocking,
    redaction: { class: "internal", fields: ["message", "nextAction"] }
  };
}

function statusFromFindings(findings: readonly GovernanceDiagnosticFinding[]): ReadinessStatus {
  if (findings.some((finding) => finding.status === "fail" || finding.severity === "release-blocking")) return "fail";
  if (findings.some((finding) => finding.status === "warn" || finding.severity === "warning")) return "warn";
  return "pass";
}

function recordSpec(
  packageName: string,
  capability: string,
  ownerPackage: string,
  riskTier: GovernanceEvidenceRiskTier,
  maturityState: GovernanceMaturityState,
  hostSurface: GovernanceEvidenceMatrixRecord["hostSurface"],
  requiredEvidenceTypes: readonly GovernanceEvidenceType[],
  evidence: Partial<Record<GovernanceEvidenceType, readonly string[]>>,
  nextAction: string
): EvidenceRecordSpec {
  return { packageName, capability, ownerPackage, riskTier, maturityState, ...(hostSurface ? { hostSurface } : {}), requiredEvidenceTypes, evidence, nextAction };
}

function matchesCapability(record: GovernanceEvidenceMatrixRecord, capability: string): boolean {
  const normalized = normalizeId(capability);
  return normalizeId(record.capability) === normalized
    || normalizeId(record.packageName) === normalized
    || normalized.includes(normalizeId(record.capability))
    || normalizeId(record.capability).includes(normalized);
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
