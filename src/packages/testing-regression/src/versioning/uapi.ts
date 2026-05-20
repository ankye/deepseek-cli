import {
  PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
  assessUapiChange,
  type UapiChangeAssessment,
  type UapiChangeRequest,
  type UapiMigrationEvidence
} from "@deepseek/platform-contracts";

export const persistedRuntimeEventBreakingChangeFixture: UapiChangeRequest = {
  schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
  surfaceId: "runtime-event",
  changeKind: "breaking",
  description: "Fixture: rename a persisted runtime event field without migration evidence.",
  redaction: { class: "internal" }
};

export const migratedRuntimeEventBreakingChangeFixture: UapiChangeRequest = {
  ...persistedRuntimeEventBreakingChangeFixture,
  evidence: uapiMigrationEvidence({
    migrationId: "migration.runtime-event.v1",
    versionedReader: true,
    migrationTest: true,
    replayEvidence: true
  })
};

export function uapiMigrationEvidence(input: {
  readonly migrationId?: string;
  readonly versionedReader?: boolean;
  readonly failClosedRejection?: boolean;
  readonly migrationTest?: boolean;
  readonly replayEvidence?: boolean;
}): UapiMigrationEvidence {
  return {
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    ...(input.migrationId !== undefined ? { migrationId: input.migrationId } : {}),
    ...(input.versionedReader !== undefined ? { versionedReader: input.versionedReader } : {}),
    ...(input.failClosedRejection !== undefined ? { failClosedRejection: input.failClosedRejection } : {}),
    ...(input.migrationTest !== undefined ? { migrationTest: input.migrationTest } : {}),
    ...(input.replayEvidence !== undefined ? { replayEvidence: input.replayEvidence } : {}),
    redaction: { class: "internal" }
  };
}

export function assessUapiCompatibilityFixture(change: UapiChangeRequest): UapiChangeAssessment {
  return assessUapiChange(change);
}
