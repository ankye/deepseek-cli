import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
  assessUapiChange,
  getUapiContractSurface,
  listUapiContractSurfaces
} from "@deepseek/platform-contracts";
import {
  assessUapiCompatibilityFixture,
  migratedRuntimeEventBreakingChangeFixture,
  persistedRuntimeEventBreakingChangeFixture,
  uapiMigrationEvidence
} from "@deepseek/testing-regression";

describe("platform contracts UAPI governance", () => {
  it("inventories persisted replayed host-facing and plugin-facing contract surfaces", () => {
    const surfaces = listUapiContractSurfaces();
    const ids = new Set(surfaces.map((surface) => surface.id));

    assert.equal(surfaces.every((surface) => surface.schemaVersion === PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION), true);
    assert.equal(ids.has("runtime-event"), true);
    assert.equal(ids.has("execution-envelope"), true);
    assert.equal(ids.has("session-event"), true);
    assert.equal(ids.has("plugin-manifest"), true);
    assert.equal(surfaces.some((surface) => surface.persistence === "persisted"), true);
    assert.equal(surfaces.some((surface) => surface.persistence === "replayed"), true);
    assert.equal(surfaces.some((surface) => surface.audiences.includes("host")), true);
    assert.equal(surfaces.some((surface) => surface.audiences.includes("plugin")), true);
  });

  it("rejects breaking persisted UAPI changes without migration and replay evidence", () => {
    const assessment = assessUapiCompatibilityFixture(persistedRuntimeEventBreakingChangeFixture);
    const codes = new Set(assessment.diagnostics.map((diagnostic) => diagnostic.code));

    assert.equal(assessment.status, "fail");
    assert.equal(codes.has("UAPI_VERSION_DECISION_MISSING"), true);
    assert.equal(codes.has("UAPI_MIGRATION_TEST_MISSING"), true);
    assert.equal(codes.has("UAPI_REPLAY_EVIDENCE_MISSING"), true);
  });

  it("accepts breaking persisted UAPI changes with versioned migration and replay evidence", () => {
    const assessment = assessUapiCompatibilityFixture(migratedRuntimeEventBreakingChangeFixture);

    assert.equal(assessment.status, "pass");
    assert.deepEqual(assessment.diagnostics, []);
  });

  it("requires persisted additive changes to declare a version reader or fail-closed rejection", () => {
    const withoutVersionDecision = assessUapiChange({
      schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
      surfaceId: "session-event",
      changeKind: "additive",
      description: "Add optional persisted session event metadata.",
      redaction: { class: "internal" }
    });
    const withFailClosedAndReplayDecision = assessUapiChange({
      schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
      surfaceId: "session-event",
      changeKind: "additive",
      description: "Add optional persisted session event metadata.",
      evidence: uapiMigrationEvidence({ failClosedRejection: true, replayEvidence: true }),
      redaction: { class: "internal" }
    });

    assert.equal(withoutVersionDecision.status, "fail");
    assert.equal(withoutVersionDecision.diagnostics.some((diagnostic) => diagnostic.code === "UAPI_VERSION_DECISION_MISSING"), true);
    assert.equal(withoutVersionDecision.diagnostics.some((diagnostic) => diagnostic.code === "UAPI_REPLAY_EVIDENCE_MISSING"), true);
    assert.equal(withFailClosedAndReplayDecision.status, "pass");
  });

  it("keeps unknown UAPI surfaces fail-closed", () => {
    const assessment = assessUapiChange({
      schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
      surfaceId: "unknown-contract",
      changeKind: "additive",
      description: "Unknown UAPI surface should not pass silently.",
      redaction: { class: "internal" }
    });

    assert.equal(getUapiContractSurface("unknown-contract"), undefined);
    assert.equal(assessment.status, "fail");
    assert.equal(assessment.diagnostics.some((diagnostic) => diagnostic.code === "UAPI_SURFACE_UNKNOWN"), true);
  });
});
