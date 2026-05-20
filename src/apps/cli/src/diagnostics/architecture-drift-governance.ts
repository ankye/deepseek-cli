import type { JsonObject, ReadinessCheck, ReadinessStatus } from "@deepseek/platform-contracts";
import { DIAGNOSTICS_READINESS_SCHEMA_VERSION } from "@deepseek/platform-contracts";

interface AliasGovernanceRecord extends JsonObject {
  readonly alias: string;
  readonly targetPath: string;
  readonly status: "placeholder" | "retired" | "merged" | "deferred";
  readonly ownerPackage: string;
  readonly severity: "warning" | "release-blocking";
  readonly maturityState: "placeholder" | "deferred";
  readonly allowedConsumers: readonly string[];
  readonly blockedProductClaims: readonly string[];
  readonly replacementTrigger: string;
  readonly evidenceIds: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

interface PackageMapDriftRecord extends JsonObject {
  readonly packageName: string;
  readonly documentedOwner: string;
  readonly sourceState: "missing-package" | "implemented-package";
  readonly maturityState: "placeholder" | "implemented";
  readonly evidenceIds: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface ArchitectureDriftGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "governance.architecture-drift";
  readonly status: ReadinessStatus;
  readonly aliasCount: number;
  readonly placeholderAliasCount: number;
  readonly packageMapDriftCount: number;
  readonly aliasRecords: readonly AliasGovernanceRecord[];
  readonly packageMapRecords: readonly PackageMapDriftRecord[];
  readonly roadmapEvidenceIds: readonly string[];
  readonly missingMetadata: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

const aliasRecords: readonly AliasGovernanceRecord[] = [
  aliasRecord(
    "@deepseek/distribution-update-management",
    "src/packages/distribution-update-management/src/index.ts",
    "platform-abstraction",
    ["release diagnostics", "package-map planning", "update placeholder adapter"],
    ["distribution-update-management", "release-channel-management", "update-catalog"],
    "Create a real distribution-update-management workspace before update channel or release catalog promotion.",
    ["src/packages/platform-abstraction/src/placeholders/agent-distribution.ts", "docs/architecture/package-map.md", "docs/product/product-roadmap.md"]
  ),
  aliasRecord(
    "@deepseek/evolution-engine",
    "src/packages/evolution-engine/src/index.ts",
    "platform-abstraction",
    ["release diagnostics", "package-map planning", "evolution placeholder adapter"],
    ["evolution-engine", "feedback-loop", "managed-rollout"],
    "Create a real evolution-engine workspace before feedback, evaluation, or managed rollout promotion.",
    ["src/packages/platform-abstraction/src/placeholders/agent-evolution.ts", "docs/architecture/package-map.md", "docs/product/product-roadmap.md"]
  ),
  aliasRecord(
    "@deepseek/extension-system",
    "src/packages/extension-system/src/index.ts",
    "plugin-system",
    ["release diagnostics", "package-map planning", "governed module projection"],
    ["extension-system", "third-party-extension-runtime", "host-extension-marketplace"],
    "Create a real extension-system workspace or merge the alias into plugin-system before extension product promotion.",
    ["src/packages/platform-abstraction/src/placeholders/agent-extension.ts", "docs/architecture/plugin-module-boundaries.md", "docs/architecture/package-map.md"]
  ),
  aliasRecord(
    "@deepseek/remote-runtime-connectivity",
    "src/packages/remote-runtime-connectivity/src/index.ts",
    "platform-abstraction",
    ["release diagnostics", "package-map planning", "remote placeholder adapter"],
    ["remote-runtime-connectivity", "server-runtime", "remote-control-api"],
    "Create a real remote-runtime-connectivity workspace before server, SDK, or remote runtime promotion.",
    ["src/packages/platform-abstraction/src/placeholders/agent-remote.ts", "docs/architecture/future-host-landings.md", "docs/product/product-roadmap.md"]
  )
];

const packageMapRecords: readonly PackageMapDriftRecord[] = aliasRecords.map((record) => ({
  packageName: record.alias.replace("@deepseek/", ""),
  documentedOwner: record.ownerPackage,
  sourceState: "missing-package",
  maturityState: "placeholder",
  evidenceIds: ["docs/architecture/package-map.md", ...record.evidenceIds],
  redaction: { class: "internal", fields: ["evidenceIds"] }
}));

export function collectArchitectureDriftGovernanceEvidence(): ArchitectureDriftGovernanceEvidence {
  const missingMetadata = aliasRecords.flatMap(missingAliasMetadata);
  return {
    schemaVersion: DIAGNOSTICS_READINESS_SCHEMA_VERSION,
    kind: "governance.architecture-drift",
    status: missingMetadata.length > 0 ? "fail" : "pass",
    aliasCount: aliasRecords.length,
    placeholderAliasCount: aliasRecords.filter((record) => record.status === "placeholder").length,
    packageMapDriftCount: packageMapRecords.length,
    aliasRecords,
    packageMapRecords,
    roadmapEvidenceIds: [
      "docs/product/product-roadmap.md",
      "docs/architecture/package-map.md",
      "openspec/changes/enforce-architecture-guardrails-drift"
    ],
    missingMetadata,
    redaction: { class: "internal", fields: ["aliasRecords.evidenceIds", "packageMapRecords.evidenceIds", "missingMetadata"] }
  };
}

export function architectureDriftGovernanceCheck(
  evidence: ArchitectureDriftGovernanceEvidence = collectArchitectureDriftGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.architecture-drift",
    label: "Architecture drift guardrails",
    status: evidence.status,
    message: evidence.status === "pass"
      ? `${evidence.aliasCount} ghost alias(es) are governed by explicit placeholder/retired records.`
      : `${evidence.missingMetadata.length} architecture drift metadata gap(s) require governance records.`,
    suggestedActions: evidence.status === "pass"
      ? ["Keep roadmap and package-map claims downgraded until the missing workspaces are implemented or aliases are removed."]
      : ["Add owner, allowed consumers, blocked product claims, replacement trigger, and evidence ids for each ghost alias."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.aliasRecords.evidenceIds", "metadata.evidence.packageMapRecords.evidenceIds", "metadata.evidence.missingMetadata"] }
  };
}

function aliasRecord(
  alias: string,
  targetPath: string,
  ownerPackage: string,
  allowedConsumers: readonly string[],
  blockedProductClaims: readonly string[],
  replacementTrigger: string,
  evidenceIds: readonly string[]
): AliasGovernanceRecord {
  return {
    alias,
    targetPath,
    status: "placeholder",
    ownerPackage,
    severity: "warning",
    maturityState: "placeholder",
    allowedConsumers,
    blockedProductClaims,
    replacementTrigger,
    evidenceIds,
    redaction: { class: "internal", fields: ["evidenceIds", "replacementTrigger"] }
  };
}

function missingAliasMetadata(record: AliasGovernanceRecord): readonly string[] {
  const missing: string[] = [];
  if (record.allowedConsumers.length === 0) missing.push(`${record.alias}:allowedConsumers`);
  if (record.blockedProductClaims.length === 0) missing.push(`${record.alias}:blockedProductClaims`);
  if (record.replacementTrigger.length === 0) missing.push(`${record.alias}:replacementTrigger`);
  if (record.evidenceIds.length === 0) missing.push(`${record.alias}:evidenceIds`);
  if (record.ownerPackage.length === 0) missing.push(`${record.alias}:ownerPackage`);
  return missing;
}
