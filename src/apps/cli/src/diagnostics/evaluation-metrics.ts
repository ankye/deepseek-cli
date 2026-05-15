import type {
  CliEvaluationBaselineAggregate,
  CliEvaluationGapFinding,
  CliEvaluationRunMetrics,
  CliEvaluationTaskRunRecord,
  JsonObject
} from "@deepseek/platform-contracts";

export function emptyMetrics(): CliEvaluationRunMetrics {
  return {
    retryCount: 0,
    userInterventionCount: 0,
    safetyViolationCount: 0,
    commandRunCount: 0,
    commandSuccessCount: 0,
    commandFailureCount: 0,
    contextRecallQuality: "not-applicable",
    recoveryUsed: false,
    repairActivationCount: 0,
    repairSuccessCount: 0,
    failedVerificationCount: 0,
    correctedVerificationCount: 0,
    repeatedIneffectiveAttemptCount: 0,
    repairMetricsAvailability: "unavailable",
    redaction: { class: "internal", fields: ["estimatedCostUsd"] }
  };
}

export function aggregateBaselines(taskRuns: readonly CliEvaluationTaskRunRecord[]): readonly CliEvaluationBaselineAggregate[] {
  const ids = [...new Set(taskRuns.map((run) => run.baseline.baselineId))];
  return ids.map((baselineId) => {
    const runs = taskRuns.filter((run) => run.baseline.baselineId === baselineId);
    const executed = runs.filter((run) => run.outcome !== "planned" && run.outcome !== "deferred");
    const solved = runs.filter((run) => run.outcome === "solved");
    const failed = runs.filter((run) => run.outcome === "failed");
    const deferred = runs.filter((run) => run.outcome === "deferred");
    const invalid = runs.filter((run) => run.outcome === "invalid");
    const checkRates = runs.map((run) => run.metrics.checkPassRate).filter(isNumber);
    const firstRun = executed.map((run) => run.metrics.firstRunSuccess).filter((value): value is boolean => typeof value === "boolean");
    const structureScores = runs.map((run) => run.metrics.codeStructureScore).filter(isNumber);
    const elapsed = runs.map((run) => run.metrics.elapsedMs).filter(isNumber);
    const correctionCount = executed.reduce((sum, run) => sum + (run.metrics.correctionCount ?? 0), 0);
    const commandRunCount = executed.reduce((sum, run) => sum + (run.metrics.commandRunCount ?? 0), 0);
    const commandSuccessCount = executed.reduce((sum, run) => sum + (run.metrics.commandSuccessCount ?? 0), 0);
    const repairActivationCount = executed.reduce((sum, run) => sum + (run.metrics.repairActivationCount ?? 0), 0);
    const repairSuccessCount = executed.reduce((sum, run) => sum + (run.metrics.repairSuccessCount ?? 0), 0);
    return {
      baselineId,
      taskRunCount: runs.length,
      executedRunCount: executed.length,
      solvedRunCount: solved.length,
      failedRunCount: failed.length,
      deferredRunCount: deferred.length,
      invalidRunCount: invalid.length,
      ...(executed.length > 0 ? { successRate: roundRatio(solved.length / executed.length) } : {}),
      ...(firstRun.length > 0 ? { firstRunSuccessRate: roundRatio(firstRun.filter(Boolean).length / firstRun.length) } : {}),
      ...(checkRates.length > 0 ? { checkPassRate: roundRatio(average(checkRates)) } : {}),
      ...(executed.length > 0 ? { correctionRate: roundRatio(correctionCount / executed.length) } : {}),
      ...(commandRunCount > 0 ? { commandRunCount, commandSuccessCount, commandSuccessRate: roundRatio(commandSuccessCount / commandRunCount) } : {}),
      ...(repairActivationCount > 0 ? { repairActivationCount, repairSuccessCount, repairSuccessRate: roundRatio(repairSuccessCount / repairActivationCount) } : {}),
      ...(structureScores.length > 0 ? { averageStructureScore: roundRatio(average(structureScores)) } : {}),
      ...(elapsed.length > 0 ? { averageElapsedMs: Math.round(average(elapsed)) } : {}),
      redaction: { class: "internal" }
    };
  });
}

export function repairMetricsFromStdout(stdout: string): {
  readonly repairActivationCount: number;
  readonly repairSuccessCount: number;
  readonly repairStopReason?: string;
} {
  const repairActivationCount = jsonlKindCount(stdout, "agent.repair.started");
  const repairStopReason = repairStopReasonFromStdout(stdout);
  const eventSuccessCount = jsonlKindCount(stdout, "agent.repair.stopped", (record) => {
    const data = record.data as { stopReason?: string } | undefined;
    return data?.stopReason === "completed";
  });
  return {
    repairActivationCount,
    repairSuccessCount: repairStopReason && repairStopReason !== "completed" ? 0 : eventSuccessCount,
    ...(repairStopReason ? { repairStopReason } : {})
  };
}

export function deriveGapFindings(aggregates: readonly CliEvaluationBaselineAggregate[]): readonly CliEvaluationGapFinding[] {
  const deepseek = aggregates.find((item) => item.baselineId === "deepseek-cli");
  if (!deepseek) return [];
  const findings: CliEvaluationGapFinding[] = [];
  for (const competitor of aggregates.filter((item) => item.baselineId !== "deepseek-cli")) {
    findings.push(...metricGap("CLI_EVALUATION_SUCCESS_RATE_GAP", deepseek, competitor, "successRate", "task success rate"));
    findings.push(...metricGap("CLI_EVALUATION_STRUCTURE_SCORE_GAP", deepseek, competitor, "averageStructureScore", "generated code structure score"));
    findings.push(...metricGap("CLI_EVALUATION_CORRECTION_RATE_GAP", deepseek, competitor, "correctionRate", "correction rate"));
  }
  if (findings.length === 0 && aggregates.length > 1) {
    return [{
      code: "CLI_EVALUATION_GAP_PENDING_EXECUTION",
      severity: "info",
      baselineId: "deepseek-cli",
      metric: "execution",
      message: "Baseline gap findings require executed task evidence.",
      redaction: { class: "internal", fields: ["message"] }
    }];
  }
  return findings;
}

export function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function repairStopReasonFromStdout(stdout: string): string | undefined {
  for (const line of stdout.split(/\r?\n/).reverse()) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as { kind?: string; data?: { stopReason?: string; selfRepair?: { stopReason?: string } } };
      if (record.kind === "agent.repair.stopped" && record.data?.stopReason) return record.data.stopReason;
      if ((record.kind === "agent.loop.completed" || record.kind === "agent.loop.failed") && record.data?.selfRepair?.stopReason) return record.data.selfRepair.stopReason;
    } catch {
      continue;
    }
  }
  return undefined;
}

function jsonlKindCount(stdout: string, kind: string, predicate: (record: JsonObject) => boolean = () => true): number {
  let count = 0;
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as JsonObject;
      if (record.kind === kind && predicate(record)) count += 1;
    } catch {
      continue;
    }
  }
  return count;
}

function metricGap(
  code: string,
  deepseek: CliEvaluationBaselineAggregate,
  competitor: CliEvaluationBaselineAggregate,
  key: "successRate" | "averageStructureScore" | "correctionRate",
  label: string
): readonly CliEvaluationGapFinding[] {
  const ours = deepseek[key];
  const theirs = competitor[key];
  if (!isNumber(ours) || !isNumber(theirs)) return [];
  const delta = roundRatio(ours - theirs);
  if (Math.abs(delta) < 0.01) {
    return [{
      code,
      severity: "info",
      baselineId: "deepseek-cli",
      comparedBaselineId: competitor.baselineId,
      metric: key,
      message: `DeepSeek CLI is comparable with ${competitor.baselineId} on ${label}.`,
      delta,
      redaction: { class: "internal", fields: ["message"] }
    }];
  }
  return [{
    code,
    severity: delta < 0 ? "warn" : "info",
    baselineId: "deepseek-cli",
    comparedBaselineId: competitor.baselineId,
    metric: key,
    message: delta < 0
      ? `DeepSeek CLI trails ${competitor.baselineId} on ${label}.`
      : `DeepSeek CLI leads ${competitor.baselineId} on ${label}.`,
    delta,
    redaction: { class: "internal", fields: ["message"] }
  }];
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
