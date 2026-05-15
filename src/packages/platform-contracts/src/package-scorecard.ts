import type { JsonObject, RedactionMetadata } from "./common.js";
import type { ReadinessStatus } from "./readiness.js";

export const PACKAGE_SCORECARD_SCHEMA_VERSION = "1.0.0";

export type PackageScorecardCriterionStatus = "pass" | "partial" | "fail" | "not_assessed" | "not_applicable";
export type PackageScorecardEvidenceKind = "catalog" | "file" | "package-manifest" | "test" | "lint-rule" | "static-scan" | "command";
export type PackageScorecardHardGateStatus = "pass" | "fail" | "not_assessed";

export interface PackageScorecardDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: "info" | "warn" | "error";
  readonly message: string;
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardEvidenceRef extends JsonObject {
  readonly kind: PackageScorecardEvidenceKind;
  readonly ref: string;
  readonly status?: PackageScorecardCriterionStatus | ReadinessStatus | PackageScorecardHardGateStatus;
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardCriterionDefinition extends JsonObject {
  readonly criterionId: string;
  readonly title: string;
  readonly category: "boundary" | "contract" | "testing" | "security" | "observability" | "maintainability" | "role";
  readonly weight: number;
  readonly required: boolean;
  readonly hardGate: boolean;
  readonly appliesToRoles: readonly string[];
  readonly evidenceHint: string;
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardRubric extends JsonObject {
  readonly rubricId: string;
  readonly role: string;
  readonly criterionIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardCatalog extends JsonObject {
  readonly schemaVersion: string;
  readonly catalogVersion: string;
  readonly sharedRubricId: string;
  readonly rubrics: readonly PackageScorecardRubric[];
  readonly criteria: readonly PackageScorecardCriterionDefinition[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardCriterionResult extends JsonObject {
  readonly criterionId: string;
  readonly title: string;
  readonly category: PackageScorecardCriterionDefinition["category"];
  readonly status: PackageScorecardCriterionStatus;
  readonly score?: number;
  readonly weight: number;
  readonly required: boolean;
  readonly hardGate: boolean;
  readonly evidence: readonly PackageScorecardEvidenceRef[];
  readonly diagnostics: readonly PackageScorecardDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardHardGateResult extends JsonObject {
  readonly gateId: string;
  readonly status: PackageScorecardHardGateStatus;
  readonly message: string;
  readonly evidence: readonly PackageScorecardEvidenceRef[];
  readonly diagnostics: readonly PackageScorecardDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "package.scorecard.summary";
  readonly scorecardId: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly packagePath: string;
  readonly role: string;
  readonly catalogVersion: string;
  readonly rubricIds: readonly string[];
  readonly criteria: readonly PackageScorecardCriterionResult[];
  readonly hardGates: readonly PackageScorecardHardGateResult[];
  readonly hardGateStatus: PackageScorecardHardGateStatus;
  readonly weightedScore?: number;
  readonly objectiveScore?: number;
  readonly passRate?: number;
  readonly assessmentCoverage: number;
  readonly rubricCoverage: number;
  readonly applicableCriterionCount: number;
  readonly assessedCriterionCount: number;
  readonly passedCriterionCount: number;
  readonly partialCriterionCount: number;
  readonly failedCriterionCount: number;
  readonly notAssessedCriterionCount: number;
  readonly readiness: ReadinessStatus;
  readonly diagnostics: readonly PackageScorecardDiagnostic[];
  readonly evidencePaths: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardAggregate extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "package.scorecard.aggregate";
  readonly catalogVersion: string;
  readonly totalPackageCount: number;
  readonly passPackageCount: number;
  readonly warnPackageCount: number;
  readonly failPackageCount: number;
  readonly averageWeightedScore?: number;
  readonly averageObjectiveScore?: number;
  readonly averagePassRate?: number;
  readonly averageAssessmentCoverage: number;
  readonly averageRubricCoverage: number;
  readonly hardGateFailureCount: number;
  readonly packageScorecardIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface PackageScorecardReleaseAdvisory extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "package.scorecard.release-advisory";
  readonly advisoryOnly: true;
  readonly status: ReadinessStatus;
  readonly aggregate: PackageScorecardAggregate;
  readonly evidencePaths: readonly string[];
  readonly diagnostics: readonly PackageScorecardDiagnostic[];
  readonly redaction: RedactionMetadata;
}
