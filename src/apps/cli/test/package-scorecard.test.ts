import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PackageScorecardCriterionResult } from "@deepseek/platform-contracts";
import { collectCliEvaluation } from "../src/diagnostics/evaluation.js";
import { aggregatePackageScorecards, collectPackageScorecards, packageScorecardCatalog, summarizeCriterionResults } from "../src/diagnostics/package-scorecard.js";
import { coreToolExecutionCriterionId, liveToolCoverageTargets } from "../src/diagnostics/tool-live-coverage.js";
import { runCli } from "../src/index.js";

describe("package scorecard diagnostics", () => {
  it("scores objective package readiness without partial or missing credit", () => {
    const summary = summarizeCriterionResults({
      packageId: "example",
      packageName: "@deepseek/example",
      packagePath: "src/packages/example",
      role: "example",
      rubricIds: ["rubric.package.shared.v1"],
      evidencePaths: [],
      criteria: [
        criterion("criterion.pass", "pass", 2),
        criterion("criterion.partial", "partial", 2),
        criterion("criterion.fail", "fail", 1),
        criterion("criterion.not-assessed", "not_assessed", 1),
        criterion("criterion.not-applicable", "not_applicable", 99)
      ]
    });

    assert.equal(summary.weightedScore, 0.333);
    assert.equal(summary.objectiveScore, 0.266);
    assert.equal(summary.passRate, 0.25);
    assert.equal(summary.assessmentCoverage, 0.75);
    assert.equal(summary.rubricCoverage, 0.8);
    assert.equal(summary.passedCriterionCount, 1);
    assert.equal(summary.partialCriterionCount, 1);
    assert.equal(summary.failedCriterionCount, 1);
    assert.equal(summary.notAssessedCriterionCount, 1);
    assert.equal(summary.readiness, "warn");
  });

  it("lets hard gates override a high weighted score", () => {
    const summary = summarizeCriterionResults({
      packageId: "example",
      packageName: "@deepseek/example",
      packagePath: "src/packages/example",
      role: "example",
      rubricIds: ["rubric.package.shared.v1"],
      evidencePaths: [],
      criteria: [
        criterion("criterion.quality", "pass", 10),
        criterion("criterion.hard-gate", "fail", 1, true)
      ]
    });

    assert.equal(summary.weightedScore, 0.909);
    assert.equal(summary.objectiveScore, 0);
    assert.equal(summary.hardGateStatus, "fail");
    assert.equal(summary.readiness, "fail");
    assert.equal(summary.hardGates[0]?.gateId, "criterion.hard-gate");
  });

  it("collects package scorecards for every workspace package", async () => {
    const result = await collectPackageScorecards();
    const runtime = result.scorecards.find((scorecard) => scorecard.packageId === "runtime");

    assert.equal(result.catalogVersion, packageScorecardCatalog.catalogVersion);
    assert.equal(result.scorecards.length >= 29, true);
    assert.equal(result.aggregate.totalPackageCount, result.scorecards.length);
    assert.ok((result.aggregate.averageObjectiveScore ?? 1) < (result.aggregate.averageWeightedScore ?? 0));
    assert.ok(result.aggregate.averageRubricCoverage < 1);
    assert.equal(runtime?.rubricIds.includes("rubric.package.runtime.v1"), true);
    assert.equal(runtime?.criteria.some((criterionResult) => criterionResult.criterionId === "runtime.tool-feedback-tests" && criterionResult.status === "pass"), true);
  });

  it("requires live model tool coverage before core tools can score above 90 percent", () => {
    const shared = sharedPassCriteria();
    const missingLive = summarizeCriterionResults({
      packageId: "core-coding-tools",
      packageName: "@deepseek/core-coding-tools",
      packagePath: "src/packages/core-coding-tools",
      role: "core-coding-tools",
      rubricIds: ["rubric.package.shared.v1", "rubric.package.core-coding-tools.v1"],
      evidencePaths: [],
      criteria: [
        ...shared,
        ...liveToolCoverageTargets.map((target) => criterion(coreToolExecutionCriterionId(target.toolId), "not_assessed", 2))
      ]
    });
    const eighteenOfTwenty = summarizeCriterionResults({
      packageId: "core-coding-tools",
      packageName: "@deepseek/core-coding-tools",
      packagePath: "src/packages/core-coding-tools",
      role: "core-coding-tools",
      rubricIds: ["rubric.package.shared.v1", "rubric.package.core-coding-tools.v1"],
      evidencePaths: [],
      criteria: [
        ...shared,
        ...liveToolCoverageTargets.map((target, index) => criterion(coreToolExecutionCriterionId(target.toolId), index < 18 ? "pass" : "fail", 2))
      ]
    });

    assert.equal(missingLive.objectiveScore, 0.259);
    assert.equal(missingLive.notAssessedCriterionCount, 20);
    assert.equal((eighteenOfTwenty.objectiveScore ?? 0) >= 0.9, true);
    assert.equal(eighteenOfTwenty.objectiveScore, 0.926);
  });

  it("includes package scorecards in diagnostics evaluate JSON and JSONL output", async () => {
    const lines: string[] = [];
    await runCli(["diagnostics", "evaluate", "--full", "--dry-run", "--output", "jsonl"], (line: string) => {
      lines.push(line);
    });
    const records = lines.map((line) => JSON.parse(line) as {
      kind?: string;
      aggregate?: { totalPackageCount?: number; averageObjectiveScore?: number };
      scorecard?: { packageId?: string; readiness?: string };
      matrix?: { totalFamilyCount?: number; implementedFamilyCount?: number; objectiveScore?: number };
    });

    assert.equal(records.some((record) => record.kind === "diagnostics.evaluate.package-scorecard-aggregate" && (record.aggregate?.totalPackageCount ?? 0) >= 29 && (record.aggregate?.averageObjectiveScore ?? 1) < 1), true);
    assert.equal(records.some((record) => record.kind === "diagnostics.evaluate.package-scorecard" && record.scorecard?.packageId === "runtime" && record.scorecard.readiness), true);
    assert.equal(records.some((record) => record.kind === "diagnostics.evaluate.tool-family-parity" && record.matrix?.totalFamilyCount === 64 && record.matrix.implementedFamilyCount === 64 && record.matrix.objectiveScore === 0), true);
  });

  it("includes package scorecard aggregates in direct evaluation summaries", async () => {
    const summary = await collectCliEvaluation({
      mode: "full",
      dryRun: true,
      live: false,
      baselineId: "deepseek-cli",
      compareBaselineIds: [],
      allowExternalBaseline: false,
      baselineArgs: [],
      extraArgs: []
    });

    assert.equal(summary.packageScorecardCatalogVersion, packageScorecardCatalog.catalogVersion);
    assert.equal((summary.packageScorecards?.length ?? 0) >= 29, true);
    assert.equal(summary.packageScorecardAggregate?.totalPackageCount, summary.packageScorecards?.length);
    assert.equal(summary.toolFamilyParityMatrix?.totalFamilyCount, 64);
    assert.equal(summary.toolFamilyParityMatrix?.implementedFamilyCount, 64);
    assert.equal(summary.toolFamilyParityMatrix?.objectiveScore, 0);
  });

  it("keeps package scorecard release evidence advisory", async () => {
    const lines: string[] = [];
    await runCli(["diagnostics", "release", "--output", "json"], (line: string) => {
      lines.push(line);
    });
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      status?: string;
      release?: {
        status?: string;
        packageScorecardAdvisory?: {
          advisoryOnly?: boolean;
          aggregate?: { totalPackageCount?: number; averageObjectiveScore?: number };
        };
      };
    };

    assert.equal(parsed.status, parsed.release?.status);
    assert.equal(parsed.release?.packageScorecardAdvisory?.advisoryOnly, true);
    assert.equal((parsed.release?.packageScorecardAdvisory?.aggregate?.totalPackageCount ?? 0) >= 29, true);
    assert.ok((parsed.release?.packageScorecardAdvisory?.aggregate?.averageObjectiveScore ?? 1) < 1);
  });

  it("derives platform aggregate counts from package readiness", () => {
    const pass = summarizeCriterionResults({
      packageId: "pass",
      packageName: "@deepseek/pass",
      packagePath: "src/packages/pass",
      role: "pass",
      rubricIds: ["rubric.package.shared.v1"],
      evidencePaths: [],
      criteria: [criterion("criterion.pass", "pass", 1)]
    });
    const fail = summarizeCriterionResults({
      packageId: "fail",
      packageName: "@deepseek/fail",
      packagePath: "src/packages/fail",
      role: "fail",
      rubricIds: ["rubric.package.shared.v1"],
      evidencePaths: [],
      criteria: [criterion("criterion.hard-gate", "fail", 1, true)]
    });
    const aggregate = aggregatePackageScorecards([pass, fail]);

    assert.equal(aggregate.totalPackageCount, 2);
    assert.equal(aggregate.passPackageCount, 1);
    assert.equal(aggregate.failPackageCount, 1);
    assert.equal(aggregate.hardGateFailureCount, 1);
    assert.equal(aggregate.averageObjectiveScore, 0.5);
  });
});

function criterion(
  criterionId: string,
  status: PackageScorecardCriterionResult["status"],
  weight: number,
  hardGate = false
): PackageScorecardCriterionResult {
  const score = status === "not_applicable" ? undefined : status === "pass" ? 1 : 0;
  return {
    criterionId,
    title: criterionId,
    category: "maintainability",
    status,
    ...(score !== undefined ? { score } : {}),
    weight,
    required: hardGate,
    hardGate,
    evidence: [{ kind: "catalog", ref: "test", status, redaction: { class: "internal", fields: ["ref"] } }],
    diagnostics: [],
    redaction: { class: "internal", fields: ["evidence.ref"] }
  };
}

function sharedPassCriteria(): readonly PackageScorecardCriterionResult[] {
  return [
    criterion("package.manifest.present", "pass", 2, true),
    criterion("package.manifest.public-export", "pass", 2, true),
    criterion("package.source-index.present", "pass", 2, true),
    criterion("package.workspace-name.matches-path", "pass", 2, true),
    criterion("package.internal-dependencies.versioned", "pass", 2, true),
    criterion("package.test-evidence.present", "pass", 1),
    criterion("package.secret-source-scan.clean", "pass", 3, true)
  ];
}
