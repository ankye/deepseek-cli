import type { CompatibilityMetadata, JsonObject, RedactionMetadata } from "./common.js";
import type { SessionId, TaskId, TraceId, TurnId } from "./ids.js";

export const EVIDENCE_FIRST_SCHEMA_VERSION = "1.0.0";

export type EvidenceTaskIntent =
  | "repository"
  | "product"
  | "command"
  | "package"
  | "code"
  | "docs"
  | "release"
  | "evaluation"
  | "generated-artifact"
  | "speculative"
  | "casual";

export type EvidenceTaskSensitivity = "fact-sensitive" | "speculative" | "casual";

export type EvidenceFactClass =
  | "command"
  | "package"
  | "executable"
  | "feature"
  | "install"
  | "release"
  | "architecture"
  | "evaluation"
  | "docs"
  | "code"
  | "product-copy"
  | "roadmap";

export type EvidenceSourceGroup =
  | "readme"
  | "package-metadata"
  | "command-index"
  | "openspec"
  | "product-docs"
  | "task-catalog"
  | "tests"
  | "source"
  | "runtime-record";

export type EvidenceClaimCertainty = "verified" | "inferred" | "assumption" | "unsupported";

export type EvidenceManifestStatus = "present" | "missing" | "malformed" | "incomplete" | "failed" | "passed";

export interface EvidenceCompatibility extends CompatibilityMetadata {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly minReaderVersion: "1.0.0";
}

export interface EvidenceTraceMetadata extends JsonObject {
  readonly traceId?: TraceId;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly taskId?: TaskId;
}

export interface EvidenceTaskClassification extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly classificationId: string;
  readonly sensitivity: EvidenceTaskSensitivity;
  readonly intents: readonly EvidenceTaskIntent[];
  readonly factClasses: readonly EvidenceFactClass[];
  readonly evidenceRequired: boolean;
  readonly reason: string;
  readonly trace: EvidenceTraceMetadata;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceSourceRequirement extends JsonObject {
  readonly sourceGroup: EvidenceSourceGroup;
  readonly required: boolean;
  readonly factClasses: readonly EvidenceFactClass[];
  readonly minimumItemCount: number;
}

export interface EvidencePlan extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly planId: string;
  readonly classificationId: string;
  readonly requiredFactClasses: readonly EvidenceFactClass[];
  readonly candidateSourceGroups: readonly EvidenceSourceRequirement[];
  readonly minimumSourceCoverage: number;
  readonly freshnessPolicy: string;
  readonly redactionPolicy: string;
  readonly stopConditions: readonly string[];
  readonly trace: EvidenceTraceMetadata;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceItem extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly evidenceId: string;
  readonly sourceGroup: EvidenceSourceGroup;
  readonly sourcePath: string;
  readonly sourceLabel: string;
  readonly factClasses: readonly EvidenceFactClass[];
  readonly preview: string;
  readonly fingerprint: string;
  readonly freshness: {
    readonly status: "current" | "stale" | "unknown";
    readonly observedAt?: string;
  };
  readonly trace: EvidenceTraceMetadata;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceSourceCoverage extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly sourceGroup: EvidenceSourceGroup;
  readonly covered: boolean;
  readonly itemCount: number;
  readonly factClasses: readonly EvidenceFactClass[];
  readonly fingerprints: readonly string[];
  readonly missingFactClasses: readonly EvidenceFactClass[];
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export type EvidenceCandidateExclusionReason =
  | "stale"
  | "missing"
  | "duplicate"
  | "secret-like"
  | "out-of-scope"
  | "over-budget";

export interface EvidenceCandidateExclusion extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly exclusionId: string;
  readonly sourceGroup: EvidenceSourceGroup;
  readonly sourcePath: string;
  readonly reason: EvidenceCandidateExclusionReason;
  readonly fingerprint?: string;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface ClaimGrounding extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly claimId: string;
  readonly claimPreview: string;
  readonly claimFingerprint: string;
  readonly factClass: EvidenceFactClass;
  readonly certainty: EvidenceClaimCertainty;
  readonly evidenceIds: readonly string[];
  readonly outputScope: string;
  readonly remediation?: "remove" | "rewrite-as-unknown" | "label-assumption" | "ask-clarification" | "fail-check";
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface UnsupportedClaimDiagnostic extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly diagnosticId: string;
  readonly code: "unsupported-command" | "unsupported-package" | "unsupported-feature" | "unsupported-release" | "unsupported-claim";
  readonly severity: "warn" | "error";
  readonly claimId?: string;
  readonly claimFingerprint: string;
  readonly claimPreview: string;
  readonly missingFactClass: EvidenceFactClass;
  readonly artifactId?: string;
  readonly remediationHint: string;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceManifest extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly manifestId: string;
  readonly artifactId: string;
  readonly artifactKind: "webpage" | "report" | "document" | "code-change" | "diagnostic";
  readonly status: EvidenceManifestStatus;
  readonly generatedAt: string;
  readonly sourceCoverage: readonly EvidenceSourceCoverage[];
  readonly evidenceItems: readonly EvidenceItem[];
  readonly claimGroundings: readonly ClaimGrounding[];
  readonly assumptions: readonly ClaimGrounding[];
  readonly unsupportedClaims: readonly UnsupportedClaimDiagnostic[];
  readonly unsupportedClaimCount: number;
  readonly trace: EvidenceTraceMetadata;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceFirstSummary extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly summaryId: string;
  readonly classification: EvidenceTaskClassification;
  readonly plan?: EvidencePlan;
  readonly manifestStatus: EvidenceManifestStatus;
  readonly evidenceItemCount: number;
  readonly excludedCandidateCount?: number;
  readonly sourceCoverageRate: number;
  readonly claimGroundingRate: number;
  readonly unsupportedClaimCount: number;
  readonly assumptionCount: number;
  readonly hallucinatedCommandCount: number;
  readonly trace: EvidenceTraceMetadata;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export interface EvidenceFirstRuntimeContext extends JsonObject {
  readonly schemaVersion: typeof EVIDENCE_FIRST_SCHEMA_VERSION;
  readonly classification: EvidenceTaskClassification;
  readonly plan?: EvidencePlan;
  readonly selectedEvidence: readonly EvidenceItem[];
  readonly excludedCandidates?: readonly EvidenceCandidateExclusion[];
  readonly sourceCoverage: readonly EvidenceSourceCoverage[];
  readonly summary: EvidenceFirstSummary;
  readonly compatibility: EvidenceCompatibility;
  readonly redaction: RedactionMetadata;
}

export const EVIDENCE_FIRST_COMPATIBILITY: EvidenceCompatibility = {
  schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
