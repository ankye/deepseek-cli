import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { SessionId, TurnId } from "./ids.js";
import type { AgentLoopTerminalStatus } from "./runtime.js";

export const INDEX_PROVIDER_SCHEMA_VERSION = "1.0.0";

export type IndexProviderKind = "pageindex" | "zvec" | "code-index";
export type IndexProviderStatus = "enabled" | "deferred" | "disabled" | "unavailable" | "degraded";
export type IndexRecallScope = "session" | "workspace" | "global";
export type IndexFreshnessStatus = "fresh" | "stale" | "unknown";
export type IndexRankingKind = "deterministic-text" | "semantic" | "hybrid";
export type IndexProviderManifestSourceScope = "default" | "workspace" | "user" | "profile" | "runtime";
export type IndexProviderImplementationStatus = "available" | "missing" | "unknown";
export type IndexProviderActivationEvidenceKind = "implementation-module" | "embedding-provider" | "vector-store" | "code-analyzer" | "pageindex-provenance";
export type IndexProviderActivationEvidenceStatus = "present" | "missing" | "unknown";

export interface IndexProviderConfig extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly kind: IndexProviderKind;
  readonly status: IndexProviderStatus;
  readonly scope: readonly IndexRecallScope[];
  readonly ranking: readonly IndexRankingKind[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderManifestSource extends JsonObject {
  readonly scope: IndexProviderManifestSourceScope;
  readonly sourceId: string;
  readonly description?: string;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderManifestEntry extends JsonObject {
  readonly providerId: string;
  readonly kind: IndexProviderKind;
  readonly status?: IndexProviderStatus;
  readonly scope?: readonly IndexRecallScope[];
  readonly ranking?: readonly IndexRankingKind[];
  readonly implementationStatus?: IndexProviderImplementationStatus;
  readonly activationEvidence?: readonly IndexProviderActivationEvidence[];
  readonly metadata?: JsonObject;
  readonly redaction?: RedactionMetadata;
}

export interface IndexProviderManifest extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "index-provider.manifest";
  readonly defaultProviderId?: string;
  readonly source: IndexProviderManifestSource;
  readonly providers: readonly IndexProviderManifestEntry[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderState extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly kind: IndexProviderKind;
  readonly status: IndexProviderStatus;
  readonly diagnostics: readonly RedactedError[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderDiagnosticRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly kind: IndexProviderKind;
  readonly status: IndexProviderStatus;
  readonly requestedStatus?: IndexProviderStatus;
  readonly implementationStatus: IndexProviderImplementationStatus;
  readonly activationEvidence: readonly IndexProviderActivationEvidence[];
  readonly scope: readonly IndexRecallScope[];
  readonly ranking: readonly IndexRankingKind[];
  readonly diagnostics: readonly RedactedError[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderActivationEvidence extends JsonObject {
  readonly kind: IndexProviderActivationEvidenceKind;
  readonly status: IndexProviderActivationEvidenceStatus;
  readonly sourceId: string;
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexProviderDiagnosticsSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "index-provider.diagnostics";
  readonly defaultProviderId: string;
  readonly providerCount: number;
  readonly enabledProviderIds: readonly string[];
  readonly deferredProviderIds: readonly string[];
  readonly source: IndexProviderManifestSource;
  readonly providers: readonly IndexProviderDiagnosticRecord[];
  readonly diagnostics: readonly RedactedError[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface IndexFreshnessEvidence extends JsonObject {
  readonly reason?: string;
  readonly scope?: string;
  readonly staleMutationTurnId?: string;
  readonly workspaceCheckpointWatermark?: number;
  readonly currentWorkspaceCheckpointWatermark?: number;
}

export interface PageIndexEvidenceQuality extends JsonObject {
  readonly createdAt: string;
  readonly createdAtSource: "runtime-event" | "deterministic-fallback";
  readonly freshnessStatus: IndexFreshnessStatus;
  readonly ranking: IndexRankingKind;
  readonly semanticStatus: IndexProviderStatus;
  readonly staleReason?: string;
  readonly staleScope?: string;
  readonly staleMutationTurnId?: string;
  readonly workspaceCheckpointWatermark?: number;
  readonly currentWorkspaceCheckpointWatermark?: number;
}

export interface PageIndexSemanticMetadata extends JsonObject {
  readonly status: IndexProviderStatus;
  readonly provider: IndexProviderKind | string;
  readonly scope?: IndexRecallScope;
  readonly workspaceRootHash?: string;
  readonly pageId?: string;
}

export interface PageIndexPage extends JsonObject {
  readonly kind: "pageindex.page";
  readonly schemaVersion: string;
  readonly scope: Extract<IndexRecallScope, "session" | "workspace">;
  readonly pageId: string;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly sequence: number;
  readonly status: AgentLoopTerminalStatus;
  readonly traceId: string;
  readonly createdAt: string;
  readonly promptPreview: string;
  readonly assistantPreview: string;
  readonly evidenceQuality: PageIndexEvidenceQuality;
  readonly freshnessEvidence: IndexFreshnessEvidence;
  readonly redaction: RedactionMetadata;
  readonly semantic: PageIndexSemanticMetadata;
}

export interface IndexRecallRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly scope: IndexRecallScope;
  readonly query: string;
  readonly limit: number;
  readonly metadata: JsonObject;
}

export interface IndexRecallItem extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly providerKind: IndexProviderKind;
  readonly scope: IndexRecallScope;
  readonly page: PageIndexPage;
  readonly deterministicScore: number;
  readonly ranking: IndexRankingKind;
  readonly rankingReason: string;
  readonly matchedFields: readonly string[];
  readonly freshnessStatus: IndexFreshnessStatus;
  readonly freshnessEvidence: IndexFreshnessEvidence;
  readonly semanticStatus: IndexProviderStatus;
  readonly redaction: RedactionMetadata;
  readonly metadata: JsonObject;
}

export interface IndexRecallResult extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly providerKind: IndexProviderKind;
  readonly scope: IndexRecallScope;
  readonly query: string;
  readonly indexedCount: number;
  readonly matchedCount: number;
  readonly renderedCount: number;
  readonly ranking: IndexRankingKind;
  readonly semanticStatus: IndexProviderStatus;
  readonly items: readonly IndexRecallItem[];
  readonly provider: IndexProviderState;
  readonly redaction: RedactionMetadata;
  readonly metadata: JsonObject;
}

export interface SemanticRecallCandidate extends JsonObject {
  readonly schemaVersion: string;
  readonly providerId: string;
  readonly providerKind: Exclude<IndexProviderKind, "pageindex">;
  readonly pageId: string;
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly scope: IndexRecallScope;
  readonly freshnessStatus: IndexFreshnessStatus;
  readonly freshnessEvidence: IndexFreshnessEvidence;
  readonly score: number;
  readonly rankingReason: string;
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}
