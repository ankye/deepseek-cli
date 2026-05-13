import type {
  IndexProviderActivationEvidence,
  IndexProviderActivationEvidenceKind,
  IndexProviderActivationEvidenceStatus,
  IndexProviderDiagnosticRecord,
  IndexProviderDiagnosticsSummary,
  IndexProviderImplementationStatus,
  IndexProviderManifest,
  IndexProviderManifestEntry,
  IndexProviderManifestSource,
  IndexProviderStatus,
  IndexRankingKind,
  IndexRecallScope,
  JsonObject
} from "@deepseek/platform-contracts";
import { INDEX_PROVIDER_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { PAGEINDEX_PROVIDER_ID } from "./pageindex.js";

export const ZVEC_PROVIDER_ID = "zvec";
export const CODE_INDEX_PROVIDER_ID = "code-index";

interface ProviderDiagnosticRecordInput {
  readonly providerId: string;
  readonly kind: IndexProviderDiagnosticRecord["kind"];
  readonly status: IndexProviderDiagnosticRecord["status"];
  readonly requestedStatus?: IndexProviderStatus | undefined;
  readonly implementationStatus: IndexProviderImplementationStatus;
  readonly activationEvidence: readonly IndexProviderActivationEvidence[];
  readonly scope: readonly IndexRecallScope[];
  readonly ranking: readonly IndexRankingKind[];
  readonly diagnostics: IndexProviderDiagnosticRecord["diagnostics"];
  readonly metadata: JsonObject;
}

interface ProviderDefaults {
  readonly providerId: string;
  readonly kind: IndexProviderDiagnosticRecord["kind"];
  readonly status: IndexProviderStatus;
  readonly scope: readonly IndexRecallScope[];
  readonly ranking: readonly IndexRankingKind[];
  readonly implementationStatus: IndexProviderImplementationStatus;
  readonly requiredActivationEvidence: readonly IndexProviderActivationEvidenceKind[];
  readonly metadata: JsonObject;
}

type RedactedDiagnosticBuffer = IndexProviderDiagnosticsSummary["diagnostics"] extends readonly (infer T)[] ? T[] : never;
type ProviderDiagnosticBuffer = IndexProviderDiagnosticRecord["diagnostics"] extends readonly (infer T)[] ? T[] : never;

const DEFAULT_MANIFEST_SOURCE: IndexProviderManifestSource = {
  scope: "default",
  sourceId: "index-provider.default",
  description: "Built-in PageIndex-first provider manifest.",
  redaction: { class: "internal" }
};

const PROVIDER_DEFAULTS = [
  {
    providerId: PAGEINDEX_PROVIDER_ID,
    kind: "pageindex",
    status: "enabled",
    scope: ["session", "workspace"],
    ranking: ["deterministic-text"],
    implementationStatus: "available",
    requiredActivationEvidence: ["implementation-module", "pageindex-provenance"],
    metadata: {
      truthSource: true,
      storage: "session-and-workspace-pageindex",
      semanticCandidateSource: false
    }
  },
  {
    providerId: ZVEC_PROVIDER_ID,
    kind: "zvec",
    status: "deferred",
    scope: ["workspace", "global"],
    ranking: ["semantic", "hybrid"],
    implementationStatus: "missing",
    requiredActivationEvidence: ["implementation-module", "embedding-provider", "vector-store"],
    metadata: {
      requires: ["embedding-provider", "vector-store"],
      fallbackProviderId: PAGEINDEX_PROVIDER_ID
    }
  },
  {
    providerId: CODE_INDEX_PROVIDER_ID,
    kind: "code-index",
    status: "deferred",
    scope: ["workspace"],
    ranking: ["semantic", "hybrid"],
    implementationStatus: "missing",
    requiredActivationEvidence: ["implementation-module", "code-analyzer", "pageindex-provenance"],
    metadata: {
      requires: ["local-analyzer", "symbol-index", "pageindex-provenance"],
      fallbackProviderId: PAGEINDEX_PROVIDER_ID
    }
  }
] as const satisfies readonly ProviderDefaults[];

export function createDefaultIndexProviderDiagnostics(): IndexProviderDiagnosticsSummary {
  return resolveIndexProviderDiagnostics();
}

export function createDefaultIndexProviderManifest(): IndexProviderManifest {
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    kind: "index-provider.manifest",
    defaultProviderId: PAGEINDEX_PROVIDER_ID,
    source: DEFAULT_MANIFEST_SOURCE,
    providers: PROVIDER_DEFAULTS.map((provider) => ({
      providerId: provider.providerId,
      kind: provider.kind,
      status: provider.status,
      scope: provider.scope,
      ranking: provider.ranking,
      implementationStatus: provider.implementationStatus,
      activationEvidence: defaultActivationEvidence(provider),
      metadata: provider.metadata,
      redaction: { class: "internal", fields: ["metadata"] }
    })),
    metadata: { mode: "pageindex-first" },
    redaction: { class: "internal", fields: ["providers.metadata", "providers.activationEvidence.metadata", "source"] }
  };
}

export function resolveIndexProviderDiagnostics(manifest: IndexProviderManifest | undefined = undefined): IndexProviderDiagnosticsSummary {
  const inputManifest = manifest ?? createDefaultIndexProviderManifest();
  const diagnostics = validateManifest(inputManifest);
  const entriesById = new Map<string, IndexProviderManifestEntry>();
  for (const entry of inputManifest.providers) {
    if (!isKnownProviderId(entry.providerId)) {
      diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_UNKNOWN", `Unknown index provider '${entry.providerId}' was ignored.`, { providerId: entry.providerId }));
      continue;
    }
    if (entriesById.has(entry.providerId)) {
      diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_DUPLICATE", `Duplicate index provider '${entry.providerId}' was ignored after the first entry.`, { providerId: entry.providerId }));
      continue;
    }
    entriesById.set(entry.providerId, entry);
  }
  const providers = PROVIDER_DEFAULTS.map((defaults) => providerRecordFromManifest(defaults, entriesById.get(defaults.providerId), diagnostics));
  const summaryDiagnostics = [...diagnostics, ...providers.flatMap((provider) => provider.diagnostics)];
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    kind: "index-provider.diagnostics",
    defaultProviderId: isKnownProviderId(inputManifest.defaultProviderId) ? inputManifest.defaultProviderId : PAGEINDEX_PROVIDER_ID,
    providerCount: providers.length,
    enabledProviderIds: providers.filter((provider) => provider.status === "enabled").map((provider) => provider.providerId),
    deferredProviderIds: providers.filter((provider) => provider.status === "deferred").map((provider) => provider.providerId),
    source: normalizeSource(inputManifest.source),
    providers,
    diagnostics: summaryDiagnostics,
    metadata: {
      mode: providers.some((provider) => provider.providerId !== PAGEINDEX_PROVIDER_ID && provider.requestedStatus === "enabled") ? "pageindex-first-configured-semantic" : "pageindex-only",
      semanticRecall: providers.some((provider) => provider.providerId !== PAGEINDEX_PROVIDER_ID && provider.status === "enabled") ? "enabled" : "deferred",
      deterministicFallback: PAGEINDEX_PROVIDER_ID,
      manifestProviderCount: inputManifest.providers.length,
      validationDiagnosticCodes: diagnostics.map((diagnostic) => diagnostic.code)
    },
    redaction: { class: "internal", fields: ["providers.metadata", "providers.activationEvidence.metadata", "providers.diagnostics.details"] }
  };
}

function providerDiagnosticRecord(input: ProviderDiagnosticRecordInput): IndexProviderDiagnosticRecord {
  return {
    schemaVersion: INDEX_PROVIDER_SCHEMA_VERSION,
    providerId: input.providerId,
    kind: input.kind,
    status: input.status,
    ...(input.requestedStatus ? { requestedStatus: input.requestedStatus } : {}),
    implementationStatus: input.implementationStatus,
    activationEvidence: input.activationEvidence,
    scope: input.scope,
    ranking: input.ranking,
    diagnostics: input.diagnostics,
    metadata: input.metadata,
    redaction: { class: "internal", fields: ["metadata", "diagnostics.details", "activationEvidence.metadata"] }
  };
}

function providerRecordFromManifest(
  defaults: ProviderDefaults,
  entry: IndexProviderManifestEntry | undefined,
  diagnostics: RedactedDiagnosticBuffer
): IndexProviderDiagnosticRecord {
  const requestedStatus = normalizeStatus(entry?.status) ?? defaults.status;
  const implementationStatus = normalizeImplementationStatus(entry?.implementationStatus) ?? defaults.implementationStatus;
  const activationEvidence = normalizeActivationEvidence(entry?.activationEvidence, defaults);
  const providerDiagnostics: ProviderDiagnosticBuffer = [];
  let effectiveStatus = requestedStatus;
  if (defaults.kind !== "pageindex" && requestedStatus === "enabled" && implementationStatus !== "available") {
    effectiveStatus = "deferred";
    providerDiagnostics.push(manifestDiagnostic("INDEX_PROVIDER_UNSUPPORTED_ENABLED", `${defaults.providerId} was requested as enabled but has no implementation evidence; effective status is deferred.`, {
      providerId: defaults.providerId,
      requestedStatus,
      effectiveStatus,
      implementationStatus,
      suggestedActions: ["Keep deterministic PageIndex recall active until semantic provider implementation evidence is available."]
    }));
  }
  const missingActivationEvidence = missingRequiredActivationEvidence(defaults, activationEvidence);
  if (defaults.kind !== "pageindex" && requestedStatus === "enabled" && missingActivationEvidence.length > 0) {
    effectiveStatus = "deferred";
    providerDiagnostics.push(manifestDiagnostic("INDEX_PROVIDER_ACTIVATION_EVIDENCE_MISSING", `${defaults.providerId} was requested as enabled but activation evidence is incomplete; effective status is deferred.`, {
      providerId: defaults.providerId,
      requestedStatus,
      effectiveStatus,
      implementationStatus,
      missingEvidenceKinds: missingActivationEvidence,
      suggestedActions: ["Provide activation evidence from the runtime-owned semantic provider implementation before enabling semantic recall."]
    }));
  }
  if (defaults.kind === "pageindex" && requestedStatus !== "enabled") {
    effectiveStatus = "enabled";
    providerDiagnostics.push(manifestDiagnostic("INDEX_PROVIDER_PAGEINDEX_FORCED_ENABLED", "PageIndex remains enabled as the deterministic truth source.", {
      providerId: defaults.providerId,
      requestedStatus,
      effectiveStatus,
      suggestedActions: ["Keep PageIndex enabled for provenance-backed recall."]
    }));
  }
  if (effectiveStatus === "deferred") {
    providerDiagnostics.push(deferredProviderDiagnostic(defaults.providerId, defaults.kind, `${defaults.providerId} recall is deferred; deterministic PageIndex recall remains active.`));
  }
  addInvalidEntryDiagnostics(defaults, entry, diagnostics);
  const recordInput: ProviderDiagnosticRecordInput = {
    providerId: defaults.providerId,
    kind: defaults.kind,
    status: effectiveStatus,
    implementationStatus,
    activationEvidence,
    scope: normalizeScopes(entry?.scope, defaults.scope),
    ranking: normalizeRankings(entry?.ranking, defaults.ranking),
    diagnostics: providerDiagnostics,
    metadata: {
      ...defaults.metadata,
      ...(isRecord(entry?.metadata) ? entry.metadata : {}),
      requestedStatus,
      effectiveStatus,
      requiredActivationEvidence: defaults.requiredActivationEvidence,
      missingActivationEvidence,
      manifestConfigured: Boolean(entry)
    }
  };
  return providerDiagnosticRecord(requestedStatus === effectiveStatus ? recordInput : { ...recordInput, requestedStatus });
}

function addInvalidEntryDiagnostics(defaults: ProviderDefaults, entry: IndexProviderManifestEntry | undefined, diagnostics: RedactedDiagnosticBuffer): void {
  const invalidScopes = (entry?.scope ?? []).filter((scope) => !isRecallScope(scope));
  if (invalidScopes.length > 0) {
    diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_INVALID_SCOPE", `${defaults.providerId} has invalid scope entries that were ignored.`, { providerId: defaults.providerId, invalidScopes }));
  }
  const invalidRankings = (entry?.ranking ?? []).filter((ranking) => !isRankingKind(ranking));
  if (invalidRankings.length > 0) {
    diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_INVALID_RANKING", `${defaults.providerId} has invalid ranking entries that were ignored.`, { providerId: defaults.providerId, invalidRankings }));
  }
  const invalidEvidence = (entry?.activationEvidence ?? []).filter((evidence) => !isRecord(evidence) || !isActivationEvidenceKind(evidence.kind) || !isActivationEvidenceStatus(evidence.status));
  if (invalidEvidence.length > 0) {
    diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_INVALID_ACTIVATION_EVIDENCE", `${defaults.providerId} has invalid activation evidence entries that were ignored.`, {
      providerId: defaults.providerId,
      invalidEvidenceCount: invalidEvidence.length
    }));
  }
}

function deferredProviderDiagnostic(providerId: string, kind: string, message: string): ProviderDiagnosticBuffer[number] {
  return {
    code: "INDEX_PROVIDER_DEFERRED",
    message,
    retryable: false,
    details: {
      providerId,
      kind,
      suggestedActions: ["Use PageIndex deterministic recall until this provider is configured."]
    },
    redaction: { class: "internal", fields: ["details"] }
  };
}

function validateManifest(manifest: IndexProviderManifest): RedactedDiagnosticBuffer {
  const diagnostics: RedactedDiagnosticBuffer = [];
  if (manifest.schemaVersion !== INDEX_PROVIDER_SCHEMA_VERSION) {
    diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_MANIFEST_SCHEMA_VERSION", `Index provider manifest schema ${manifest.schemaVersion} will be normalized as ${INDEX_PROVIDER_SCHEMA_VERSION}.`, {
      inputSchemaVersion: manifest.schemaVersion,
      normalizedSchemaVersion: INDEX_PROVIDER_SCHEMA_VERSION
    }));
  }
  if (!isKnownProviderId(manifest.defaultProviderId)) {
    diagnostics.push(manifestDiagnostic("INDEX_PROVIDER_DEFAULT_FALLBACK", "Index provider manifest default provider was missing or unknown; PageIndex was selected.", {
      requestedDefaultProviderId: manifest.defaultProviderId ?? "missing",
      effectiveDefaultProviderId: PAGEINDEX_PROVIDER_ID
    }));
  }
  return diagnostics;
}

function manifestDiagnostic(code: string, message: string, details: JsonObject = {}): RedactedDiagnosticBuffer[number] {
  return {
    code,
    message,
    retryable: false,
    details,
    redaction: { class: "internal", fields: ["details"] }
  };
}

function normalizeSource(source: IndexProviderManifestSource): IndexProviderManifestSource {
  const description = stringValue(source.description);
  return {
    scope: isManifestSourceScope(source.scope) ? source.scope : "default",
    sourceId: stringValue(source.sourceId) ?? "index-provider.default",
    ...(description ? { description } : {}),
    redaction: { class: "internal", fields: ["sourceId", "description"] }
  };
}

function normalizeStatus(status: unknown): IndexProviderStatus | undefined {
  return status === "enabled" || status === "deferred" || status === "disabled" || status === "unavailable" || status === "degraded" ? status : undefined;
}

function normalizeImplementationStatus(status: unknown): IndexProviderImplementationStatus | undefined {
  return status === "available" || status === "missing" || status === "unknown" ? status : undefined;
}

function normalizeActivationEvidence(entryEvidence: readonly IndexProviderActivationEvidence[] | undefined, defaults: ProviderDefaults): readonly IndexProviderActivationEvidence[] {
  const evidenceByKind = new Map<IndexProviderActivationEvidenceKind, IndexProviderActivationEvidence>();
  for (const evidence of defaultActivationEvidence(defaults)) {
    evidenceByKind.set(evidence.kind, evidence);
  }
  for (const evidence of entryEvidence ?? []) {
    if (!isRecord(evidence) || !isActivationEvidenceKind(evidence.kind) || !isActivationEvidenceStatus(evidence.status)) continue;
    evidenceByKind.set(evidence.kind, {
      kind: evidence.kind,
      status: evidence.status,
      sourceId: stringValue(evidence.sourceId) ?? `manifest.${defaults.providerId}.${evidence.kind}`,
      ...(isRecord(evidence.metadata) ? { metadata: evidence.metadata } : {}),
      redaction: evidence.redaction ?? { class: "internal", fields: ["metadata"] }
    });
  }
  return [...evidenceByKind.values()];
}

function defaultActivationEvidence(defaults: ProviderDefaults): readonly IndexProviderActivationEvidence[] {
  return defaults.requiredActivationEvidence.map((kind) => ({
    kind,
    status: defaults.kind === "pageindex" ? "present" : "missing",
    sourceId: `index-provider.default.${defaults.providerId}.${kind}`,
    metadata: { defaultEvidence: true, providerId: defaults.providerId },
    redaction: { class: "internal", fields: ["metadata"] }
  }));
}

function missingRequiredActivationEvidence(defaults: ProviderDefaults, evidence: readonly IndexProviderActivationEvidence[]): readonly IndexProviderActivationEvidenceKind[] {
  const present = new Set(evidence.filter((item) => item.status === "present").map((item) => item.kind));
  return defaults.requiredActivationEvidence.filter((kind) => !present.has(kind));
}

function normalizeScopes(scopes: readonly unknown[] | undefined, fallback: readonly IndexRecallScope[]): readonly IndexRecallScope[] {
  const normalized = [...new Set((scopes ?? []).filter(isRecallScope))];
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeRankings(rankings: readonly unknown[] | undefined, fallback: readonly IndexRankingKind[]): readonly IndexRankingKind[] {
  const normalized = [...new Set((rankings ?? []).filter(isRankingKind))];
  return normalized.length > 0 ? normalized : fallback;
}

function isKnownProviderId(value: unknown): value is typeof PAGEINDEX_PROVIDER_ID | typeof ZVEC_PROVIDER_ID | typeof CODE_INDEX_PROVIDER_ID {
  return value === PAGEINDEX_PROVIDER_ID || value === ZVEC_PROVIDER_ID || value === CODE_INDEX_PROVIDER_ID;
}

function isManifestSourceScope(value: unknown): value is IndexProviderManifestSource["scope"] {
  return value === "default" || value === "workspace" || value === "user" || value === "profile" || value === "runtime";
}

function isRecallScope(value: unknown): value is IndexRecallScope {
  return value === "session" || value === "workspace" || value === "global";
}

function isRankingKind(value: unknown): value is IndexRankingKind {
  return value === "deterministic-text" || value === "semantic" || value === "hybrid";
}

function isActivationEvidenceKind(value: unknown): value is IndexProviderActivationEvidenceKind {
  return value === "implementation-module" || value === "embedding-provider" || value === "vector-store" || value === "code-analyzer" || value === "pageindex-provenance";
}

function isActivationEvidenceStatus(value: unknown): value is IndexProviderActivationEvidenceStatus {
  return value === "present" || value === "missing" || value === "unknown";
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
