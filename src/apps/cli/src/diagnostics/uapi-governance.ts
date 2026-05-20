import {
  PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
  UAPI_COMPATIBILITY_LABELS,
  assessUapiChange,
  listUapiContractSurfaces,
  type JsonObject,
  type ReadinessCheck,
  type UapiChangeAssessment,
  type UapiContractSurface
} from "@deepseek/platform-contracts";

export interface PlatformContractsUapiGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly surfaceCount: number;
  readonly persistedSurfaceCount: number;
  readonly replayedSurfaceCount: number;
  readonly hostFacingSurfaceCount: number;
  readonly pluginFacingSurfaceCount: number;
  readonly compatibilityLabels: readonly string[];
  readonly surfaces: readonly UapiContractSurface[];
  readonly negativeFixture: UapiChangeAssessment;
  readonly positiveFixture: UapiChangeAssessment;
  readonly diagnostics: readonly JsonObject[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export function collectPlatformContractsUapiGovernanceEvidence(): PlatformContractsUapiGovernanceEvidence {
  const surfaces = listUapiContractSurfaces();
  const negativeFixture = assessUapiChange({
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    surfaceId: "runtime-event",
    changeKind: "breaking",
    description: "Readiness fixture: persisted runtime event breaking change without migration evidence.",
    redaction: { class: "internal" }
  });
  const positiveFixture = assessUapiChange({
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    surfaceId: "runtime-event",
    changeKind: "breaking",
    description: "Readiness fixture: persisted runtime event breaking change with migration and replay evidence.",
    evidence: {
      schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
      migrationId: "migration.runtime-event.v1",
      versionedReader: true,
      migrationTest: true,
      replayEvidence: true,
      redaction: { class: "internal" }
    },
    redaction: { class: "internal" }
  });
  const persistedSurfaceCount = surfaces.filter((surface) => surface.persistence === "persisted" || surface.persistence === "replayed").length;
  const replayedSurfaceCount = surfaces.filter((surface) => surface.persistence === "replayed" || surface.audiences.includes("replay")).length;
  const hostFacingSurfaceCount = surfaces.filter((surface) => surface.audiences.includes("host")).length;
  const pluginFacingSurfaceCount = surfaces.filter((surface) => surface.audiences.includes("plugin")).length;
  const diagnostics: JsonObject[] = [];

  if (negativeFixture.status !== "fail") {
    diagnostics.push({ code: "UAPI_NEGATIVE_FIXTURE_NOT_DETECTED", message: "Breaking persisted UAPI change without migration evidence was not rejected." });
  }
  if (positiveFixture.status !== "pass") {
    diagnostics.push({ code: "UAPI_POSITIVE_FIXTURE_REJECTED", message: "Breaking persisted UAPI change with migration evidence was rejected." });
  }
  if (persistedSurfaceCount === 0 || replayedSurfaceCount === 0 || hostFacingSurfaceCount === 0 || pluginFacingSurfaceCount === 0) {
    diagnostics.push({ code: "UAPI_INVENTORY_INCOMPLETE", message: "UAPI inventory must cover persisted, replayed, host-facing, and plugin-facing surfaces." });
  }

  return {
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    status: diagnostics.length === 0 ? "pass" : "fail",
    surfaceCount: surfaces.length,
    persistedSurfaceCount,
    replayedSurfaceCount,
    hostFacingSurfaceCount,
    pluginFacingSurfaceCount,
    compatibilityLabels: [...UAPI_COMPATIBILITY_LABELS],
    surfaces,
    negativeFixture,
    positiveFixture,
    diagnostics,
    redaction: { class: "internal", fields: ["surfaces.exportedNames", "negativeFixture.description", "positiveFixture.description"] }
  };
}

export function platformContractsUapiGovernanceCheck(
  evidence: PlatformContractsUapiGovernanceEvidence = collectPlatformContractsUapiGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.platform-contracts-uapi",
    label: "Platform contracts UAPI",
    status: evidence.status,
    message: `Platform UAPI governed: surfaces=${evidence.surfaceCount}, persisted=${evidence.persistedSurfaceCount}, replayed=${evidence.replayedSurfaceCount}, labels=${evidence.compatibilityLabels.length}.`,
    suggestedActions: evidence.status === "pass" ? [] : ["Add missing UAPI inventory, migration evidence, or fail-closed version rejection before release."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.surfaces.exportedNames"] }
  };
}
