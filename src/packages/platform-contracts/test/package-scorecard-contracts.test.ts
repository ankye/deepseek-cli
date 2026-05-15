import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CliEvaluationComparisonSummary, PackageScorecardAggregate, PackageScorecardSummary } from "../src/index.js";
import { CLI_TASK_EVALUATION_SCHEMA_VERSION, PACKAGE_SCORECARD_SCHEMA_VERSION } from "../src/index.js";

describe("package scorecard contracts", () => {
  it("serializes package scorecard summaries as additive evaluation evidence", () => {
    const scorecard: PackageScorecardSummary = {
      schemaVersion: PACKAGE_SCORECARD_SCHEMA_VERSION,
      kind: "package.scorecard.summary",
      scorecardId: "package-scorecard:runtime",
      packageId: "runtime",
      packageName: "@deepseek/runtime",
      packagePath: "src/packages/runtime",
      role: "runtime",
      catalogVersion: "catalog.test",
      rubricIds: ["rubric.package.shared.v1", "rubric.package.runtime.v1"],
      criteria: [{
        criterionId: "runtime.tool-feedback-tests",
        title: "Runtime tests tool feedback loop closure",
        category: "role",
        status: "pass",
        score: 1,
        weight: 3,
        required: true,
        hardGate: false,
        evidence: [{ kind: "test", ref: "src/packages/runtime/test/runtime-tool-feedback.test.ts", status: "pass", redaction: { class: "internal", fields: ["ref"] } }],
        diagnostics: [],
        redaction: { class: "internal", fields: ["evidence.ref"] }
      }],
      hardGates: [],
      hardGateStatus: "pass",
      weightedScore: 1,
      objectiveScore: 1,
      passRate: 1,
      assessmentCoverage: 1,
      rubricCoverage: 1,
      applicableCriterionCount: 1,
      assessedCriterionCount: 1,
      passedCriterionCount: 1,
      partialCriterionCount: 0,
      failedCriterionCount: 0,
      notAssessedCriterionCount: 0,
      readiness: "pass",
      diagnostics: [],
      evidencePaths: ["src/packages/runtime/test/runtime-tool-feedback.test.ts"],
      redaction: { class: "internal", fields: ["criteria.evidence.ref", "evidencePaths"] }
    };
    const aggregate: PackageScorecardAggregate = {
      schemaVersion: PACKAGE_SCORECARD_SCHEMA_VERSION,
      kind: "package.scorecard.aggregate",
      catalogVersion: "catalog.test",
      totalPackageCount: 1,
      passPackageCount: 1,
      warnPackageCount: 0,
      failPackageCount: 0,
      averageWeightedScore: 1,
      averageObjectiveScore: 1,
      averagePassRate: 1,
      averageAssessmentCoverage: 1,
      averageRubricCoverage: 1,
      hardGateFailureCount: 0,
      packageScorecardIds: [scorecard.scorecardId],
      redaction: { class: "internal" }
    };
    const summary: CliEvaluationComparisonSummary = {
      schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
      kind: "cli.evaluation.comparison.summary",
      status: "pass",
      mode: "full",
      dryRun: true,
      taskCatalogVersion: "catalog.test",
      reportTimestamp: "1970-01-01T00:00:00.000Z",
      baselines: [],
      taskRuns: [],
      baselineAggregates: [],
      packageScorecardCatalogVersion: "catalog.test",
      packageScorecards: [scorecard],
      packageScorecardAggregate: aggregate,
      gapFindings: [],
      publicBenchmarkReferences: [],
      evidencePaths: [],
      diagnostics: [],
      nextAction: "Inspect package scorecards.",
      redaction: { class: "internal", fields: ["packageScorecards.evidencePaths"] }
    };

    const serialized = JSON.stringify(summary);

    assert.equal(summary.packageScorecards?.[0]?.readiness, "pass");
    assert.equal(summary.packageScorecardAggregate?.totalPackageCount, 1);
    assert.equal(serialized.includes("package.scorecard.summary"), true);
  });
});
