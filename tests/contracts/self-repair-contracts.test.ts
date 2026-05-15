import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SELF_REPAIR_COMPATIBILITY,
  SELF_REPAIR_SCHEMA_VERSION,
  asId,
  type AgentLoopLimits,
  type AgentLoopRequest,
  type RuntimeEventKind,
  type SelfRepairAttemptRecord,
  type SelfRepairConfig,
  type SelfRepairFailureClassification,
  type SelfRepairModelHypothesis,
  type SelfRepairOutcomeSummary,
  type SelfRepairPlan,
  type SelfRepairVerificationSummary
} from "@deepseek/platform-contracts";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

describe("self-repair contracts", () => {
  it("declares versioned repair DTOs and agent-loop configuration", () => {
    const trace = {
      traceId: asId<"trace">("trace-repair-contract"),
      spanId: asId<"span">("span-repair-contract"),
      correlationId: asId<"correlation">("corr-repair-contract")
    };
    const config: SelfRepairConfig = {
      enabled: true,
      maxAttempts: 1,
      requireCheckpointForWrites: true,
      verificationMode: "targeted"
    };
    const classification: SelfRepairFailureClassification = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      classificationId: "repair-classification:test",
      failureSource: "build-test-error",
      status: "classified",
      repairability: "repairable",
      safetyClass: "safe-write",
      affectedScope: "test",
      severity: "error",
      evidenceFingerprints: ["repair:h1"],
      diagnostics: [{ code: "TEST_FAILED", message: "test failed", retryable: true, redaction: { class: "internal" } }],
      trace,
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["diagnostics.details"] }
    };
    const plan: SelfRepairPlan = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      planId: "repair-plan:test",
      classificationId: classification.classificationId,
      attemptId: "repair-attempt:test",
      actionType: "model-feedback",
      targetScope: "test",
      expectedVerification: ["targeted test"],
      stopCriteria: ["completed", "verification-failed"],
      requiresCheckpoint: true,
      evidenceFingerprints: ["repair:h1"],
      trace,
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["expectedVerification"] }
    };
    const verification: SelfRepairVerificationSummary = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      verificationId: "repair-verification:test",
      command: "npm test -- tests/example.test.ts",
      status: "skipped",
      outputDigest: "sha256:test",
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["command", "stdoutPreview", "stderrPreview"] }
    };
    const hypothesis: SelfRepairModelHypothesis = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      hypothesisId: "repair-hypothesis:test",
      classificationId: classification.classificationId,
      status: "accepted",
      hypothesisPreview: "narrow test failure hypothesis",
      proposedActionType: "model-feedback",
      evidenceFingerprints: ["repair:h1"],
      diagnostics: [],
      trace,
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["hypothesisPreview", "evidenceFingerprints"] }
    };
    const attempt: SelfRepairAttemptRecord = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      attemptId: plan.attemptId,
      planId: plan.planId,
      status: "completed",
      actionType: "model-feedback",
      toolIds: [],
      touchedFiles: [],
      materialChangeFingerprint: "model-feedback",
      diagnostics: [],
      verification: [verification],
      trace,
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["diagnostics.details"] }
    };
    const outcome: SelfRepairOutcomeSummary = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      enabled: true,
      activated: true,
      attemptCount: 1,
      successCount: 1,
      repeatedNoopCount: 0,
      stopReason: "completed",
      classifications: [classification],
      attempts: [attempt],
      verification: [verification],
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["classifications.diagnostics"] }
    };
    const limits: AgentLoopLimits = {
      maxModelIterations: 4,
      maxToolCalls: 8,
      turnTimeoutMs: 120_000,
      toolTimeoutMs: 30_000,
      maxOutputBytes: 16_000,
      maxRetries: 0,
      maxRepairAttempts: 1
    };
    const request: AgentLoopRequest = {
      prompt: "fix failing test",
      caller: "contract",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits,
      selfRepair: config
    };

    assert.equal(outcome.schemaVersion, "1.0.0");
    assert.equal(request.selfRepair?.enabled, true);
    assert.equal(request.limits?.maxRepairAttempts, 1);
    assert.equal(hypothesis.status, "accepted");
    assert.equal(JSON.stringify(outcome).includes(SELF_REPAIR_SCHEMA_VERSION), true);
  });

  it("includes repair runtime event kinds", () => {
    const eventKinds: readonly RuntimeEventKind[] = [
      "agent.repair.started",
      "agent.repair.classified",
      "agent.repair.plan.created",
      "agent.repair.attempt.started",
      "agent.repair.attempt.completed",
      "agent.repair.verification.started",
      "agent.repair.verification.completed",
      "agent.repair.stopped"
    ];

    assert.equal(eventKinds.length, 8);
  });
});
