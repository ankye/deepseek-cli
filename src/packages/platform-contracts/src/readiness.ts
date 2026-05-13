import type { JsonObject, RedactionMetadata } from "./common.js";
import type { CommandId, CredentialRef } from "./ids.js";
import type { IndexProviderDiagnosticsSummary } from "./index-provider.js";
import type { ModelLiveVerificationResult } from "./model.js";

export const DIAGNOSTICS_READINESS_SCHEMA_VERSION = "1.0.0";

export type ReadinessStatus = "pass" | "warn" | "fail";
export type ReleaseVerificationSummaryStatus = "ready" | "warn" | "blocked";
export type AcceptanceEvidenceRefreshMode = "default" | "full";

export type ReadinessCommandName = "init" | "config" | "auth" | "doctor" | "privacy" | "verify-install";
export type DiagnosticsCommandName = "bundle" | "release" | "doctor" | "verify" | "refresh" | "evaluate";

export interface ReleasePackageSurface extends JsonObject {
  readonly schemaVersion: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly executableName: string;
  readonly binEntry: string;
  readonly buildOutputPath: string;
  readonly buildOutputExists?: boolean;
  readonly sourcePackageManifestFound?: boolean;
  readonly publishAccess: "public" | "restricted" | "private";
  readonly expectedPackageFiles: readonly string[];
  readonly packageSurfaceFiles?: readonly string[];
  readonly unexpectedPackageFiles?: readonly string[];
  readonly excludedFromSource: readonly string[];
  readonly generatedBundlePath: string;
  readonly generatedBundleIgnored: boolean;
  readonly redaction: RedactionMetadata;
}

export interface ReleaseEvidenceFileStatus extends JsonObject {
  readonly path: string;
  readonly exists: boolean;
  readonly required: boolean;
  readonly redaction: RedactionMetadata;
}

export interface ReleaseVerificationEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly requiredCommands: readonly string[];
  readonly acceptanceEvidencePaths: readonly string[];
  readonly acceptanceEvidenceFiles?: readonly ReleaseEvidenceFileStatus[];
  readonly missingAcceptanceEvidencePaths?: readonly string[];
  readonly referencePitFixtureIds: readonly string[];
  readonly dryRunCommand: string;
  readonly rollbackGuidance: string;
  readonly redaction: RedactionMetadata;
}

export interface SupportBundlePolicyEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly localDiagnosticsAvailable: boolean;
  readonly externalExportAllowed: boolean;
  readonly externalExportReasonCode: string;
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface DiagnosticsReleaseReadinessEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessStatus;
  readonly packageSurface: ReleasePackageSurface;
  readonly verification: ReleaseVerificationEvidence;
  readonly supportBundle: SupportBundlePolicyEvidence;
  readonly checks: readonly ReadinessCheck[];
  readonly redaction: RedactionMetadata;
}

export interface ReleaseVerificationSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "release.verification.summary";
  readonly status: ReleaseVerificationSummaryStatus;
  readonly releaseStatus: ReadinessStatus;
  readonly blockingChecks: readonly ReadinessCheck[];
  readonly warningChecks: readonly ReadinessCheck[];
  readonly missingAcceptanceEvidencePaths: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly nextAction: string;
  readonly dryRunCommand: string;
  readonly publishDryRunReady: boolean;
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface AcceptanceEvidenceRefreshStep extends JsonObject {
  readonly id: string;
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly outputPath: string;
  readonly required: boolean;
  readonly exitCode?: number;
  readonly durationMs?: number;
  readonly status: ReadinessStatus;
  readonly redaction: RedactionMetadata;
}

export interface AcceptanceEvidenceRefreshSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "acceptance.evidence.refresh.summary";
  readonly mode: AcceptanceEvidenceRefreshMode;
  readonly dryRun: boolean;
  readonly status: ReadinessStatus;
  readonly steps: readonly AcceptanceEvidenceRefreshStep[];
  readonly refreshedPaths: readonly string[];
  readonly failedStepIds: readonly string[];
  readonly diagnostics: readonly ReadinessCheck[];
  readonly nextAction: string;
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ReadinessCheck extends JsonObject {
  readonly id: string;
  readonly label: string;
  readonly status: ReadinessStatus;
  readonly message: string;
  readonly metadata?: JsonObject;
  readonly suggestedActions?: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ReadinessCredentialReference extends JsonObject {
  readonly ref: CredentialRef;
  readonly provider: "deepseek";
  readonly source: "process-env" | "env-file" | "secure-storage" | "fake-storage" | "missing";
  readonly available: boolean;
  readonly redaction: RedactionMetadata;
}

export interface ReadinessCommandResult extends JsonObject {
  readonly commandId: CommandId;
  readonly command: ReadinessCommandName;
  readonly status: ReadinessStatus;
  readonly checks: readonly ReadinessCheck[];
  readonly warnings: readonly string[];
  readonly metadata: JsonObject;
  readonly suggestedActions: readonly string[];
  readonly credential?: ReadinessCredentialReference;
  readonly live?: ModelLiveVerificationResult;
  readonly indexProviders?: IndexProviderDiagnosticsSummary;
  readonly redaction: RedactionMetadata;
}

export interface ReadinessLiveCheckInput extends JsonObject {
  readonly enabled: boolean;
  readonly timeoutMs?: number;
}
