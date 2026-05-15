import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyRepairFailure,
  createAttemptRecord,
  createRepairPlan,
  createVerificationSummary,
  decideRepairPolicy,
  emptySelfRepairOutcome,
  validateRepairHypothesis,
  verificationDecision,
  verificationLadderFor
} from "../src/index.js";
import { asId, type RedactedError, type SelfRepairFailureClassification } from "@deepseek/platform-contracts";

const trace = {
  traceId: asId<"trace">("trace-self-repair-unit"),
  spanId: asId<"span">("span-self-repair-unit"),
  correlationId: asId<"correlation">("corr-self-repair-unit")
};

describe("self-repair runtime modules", () => {
  it("classifies deterministic failure sources before planning", () => {
    const provider = classifyRepairFailure({ terminalKind: "runtime.error", error: error("MODEL_FAILED"), trace });
    const typecheck = classifyRepairFailure({ terminalKind: "runtime.error", error: error("TYPECHECK_FAILED"), trace });
    const artifact = classifyRepairFailure({ terminalKind: "artifact.check.failed", error: error("WEBPAGE_ARTIFACT_FAILED"), trace });
    const workspace = classifyRepairFailure({ terminalKind: "execution.rejected", error: error("CHECKPOINT_STALE_FILE"), trace });

    assert.equal(provider.failureSource, "provider-error");
    assert.equal(typecheck.failureSource, "build-test-error");
    assert.equal(typecheck.safetyClass, "safe-write");
    assert.equal(artifact.failureSource, "task-output-error");
    assert.equal(workspace.failureSource, "workspace-error");
  });

  it("gates repair with enablement, budget, repeated no-op, safety, and checkpoint policy", () => {
    const classification = classificationFixture({ safetyClass: "safe-write" });
    const enabled = { enabled: true, maxAttempts: 1, requireCheckpointForWrites: true, verificationMode: "targeted" as const };
    const disabled = decideRepairPolicy({ ...enabled, enabled: false }, classification, emptySelfRepairOutcome(false));
    const allowed = decideRepairPolicy(enabled, classification, emptySelfRepairOutcome(true));
    const budget = decideRepairPolicy(enabled, classification, {
      ...emptySelfRepairOutcome(true),
      attemptCount: 1
    });
    const repeated = decideRepairPolicy(enabled, classification, {
      ...emptySelfRepairOutcome(true),
      repeatedNoopCount: 1
    });
    const unsafe = decideRepairPolicy(enabled, classificationFixture({ safetyClass: "unsafe" }), emptySelfRepairOutcome(true));

    assert.deepEqual(disabled, { allowed: false, stopReason: "disabled", requiresCheckpoint: false });
    assert.deepEqual(allowed, { allowed: true, stopReason: "terminal-failure", requiresCheckpoint: true });
    assert.equal(budget.stopReason, "budget-exhausted");
    assert.equal(repeated.stopReason, "repeated-noop");
    assert.equal(unsafe.stopReason, "unsafe");
  });

  it("plans verification ladders from failure scope and mode", () => {
    const classification = classificationFixture({ failureSource: "task-output-error", affectedScope: "artifact" });
    const minimal = verificationLadderFor(classification, "minimal");
    const targeted = verificationLadderFor(classification, "targeted");
    const broad = verificationLadderFor(classification, "broad");
    const plan = createRepairPlan({ classification, attemptNumber: 1, requiresCheckpoint: false, verificationMode: "targeted", trace });

    assert.deepEqual(minimal, ["artifact existence check"]);
    assert.deepEqual(targeted, ["artifact existence check", "artifact checker"]);
    assert.equal(broad.includes("npm run typecheck"), true);
    assert.deepEqual(plan.expectedVerification, targeted);
    assert.equal(plan.evidenceFingerprints[0], "repair:h1");
  });

  it("records bounded redacted verification and maps stop decisions", () => {
    const secret = "sk-live-1234567890";
    const verification = createVerificationSummary({
      command: "npm test",
      status: "failed",
      exitCode: 1,
      stdout: `ok\nDEEPSEEK_API_KEY=${secret}\n${"x".repeat(800)}`,
      stderr: `Bearer ${secret}`,
      elapsedMs: 25
    });
    const plan = createRepairPlan({ classification: classificationFixture({}), attemptNumber: 1, requiresCheckpoint: false, trace });
    const attempt = createAttemptRecord({ plan, status: "failed", verification: [verification], materialChangeFingerprint: "noop" });
    const serialized = JSON.stringify({ verification, attempt });

    assert.equal(verification.decision, "retry");
    assert.equal(verificationDecision("passed", 0), "complete");
    assert.equal(serialized.includes(secret), false);
    assert.equal((verification.stdoutPreview?.length ?? 0) <= 503, true);
    assert.equal(attempt.materialChangeFingerprint, "noop");
    assert.equal(attempt.redaction.fields?.includes("verification.stdoutPreview"), true);
  });

  it("validates model repair hypotheses as bounded evidence, not execution decisions", () => {
    const classification = classificationFixture({ failureSource: "build-test-error", affectedScope: "test" });
    const accepted = validateRepairHypothesis({
      classification,
      text: "The likely cause is a narrow type mismatch in the failing test path; rerun the targeted test after the focused edit.",
      proposedActionType: "model-feedback",
      trace
    });
    const rejected = validateRepairHypothesis({
      classification,
      text: "Rewrite the entire codebase, remove tests, disable typecheck, and edit secret credentials.",
      proposedActionType: "deterministic-repair",
      trace
    });
    const mismatch = validateRepairHypothesis({
      classification,
      text: "The fix is to change package boundary dependency direction.",
      proposedActionType: "model-feedback",
      trace
    });

    assert.equal(accepted.status, "accepted");
    assert.equal(accepted.evidenceFingerprints[0], "repair:h1");
    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.diagnostics.some((diagnostic) => diagnostic.code === "SELF_REPAIR_HYPOTHESIS_BROAD_OR_UNSAFE"), true);
    assert.equal(mismatch.diagnostics.some((diagnostic) => diagnostic.code === "SELF_REPAIR_HYPOTHESIS_SCOPE_MISMATCH"), true);
    assert.equal(JSON.stringify(rejected).includes("secret credentials"), true);
    assert.equal((rejected.hypothesisPreview.length <= 503), true);
  });
});

function error(code: string): RedactedError {
  return {
    code,
    message: `${code} fixture`,
    retryable: true,
    redaction: { class: "internal" }
  };
}

function classificationFixture(overrides: Partial<SelfRepairFailureClassification>): SelfRepairFailureClassification {
  return {
    schemaVersion: "1.0.0",
    classificationId: "repair-classification:unit",
    failureSource: "build-test-error",
    status: "classified",
    repairability: "repairable",
    safetyClass: "safe-read",
    affectedScope: "test",
    severity: "error",
    evidenceFingerprints: ["repair:h1"],
    diagnostics: [],
    trace,
    compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" },
    redaction: { class: "internal" },
    ...overrides
  };
}
