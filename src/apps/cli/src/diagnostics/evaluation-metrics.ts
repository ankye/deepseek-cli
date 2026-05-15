import type {
  CliEvaluationBaselineAggregate,
  CliEvaluationBaselineDefinition,
  CliEvaluationGapFinding,
  CliEvaluationLoopBudgetMetric,
  CliEvaluationMetricAvailability,
  CliEvaluationMetricAvailabilityStatus,
  CliEvaluationPhaseUsageMetric,
  CliEvaluationQualityStatus,
  CliEvaluationRunMetrics,
  CliEvaluationTaskDefinition,
  CliEvaluationTaskRunRecord,
  JsonObject
} from "@deepseek/platform-contracts";
import { evidenceManifestStatus } from "./webpage-evidence.js";
import type { WebpageCheckerOutput } from "./webpage-evidence.js";

export interface RuntimeEvaluationSignals {
  readonly eventKinds: readonly string[];
  readonly phaseUsage: readonly CliEvaluationPhaseUsageMetric[];
  readonly loopBudgets: readonly CliEvaluationLoopBudgetMetric[];
  readonly verifierVerdicts: readonly string[];
  readonly repairAttemptCount: number;
  readonly reconciliationStatuses: readonly string[];
  readonly workerFanOut: number;
  readonly reasoningEffort?: string;
  readonly providerMappedEffort?: string;
}

export function emptyMetrics(): CliEvaluationRunMetrics {
  return {
    retryCount: 0,
    userInterventionCount: 0,
    safetyViolationCount: 0,
    commandRunCount: 0,
    commandSuccessCount: 0,
    commandFailureCount: 0,
    contextRecallQuality: "not-applicable",
    workerFanOut: 0,
    overDelegationFlag: false,
    verifierQuality: "unavailable",
    repairQuality: "unavailable",
    evidenceCredit: false,
    verificationCredit: false,
    repairCredit: false,
    reconciliationCredit: false,
    metricAvailability: unavailableMetrics("planned-run"),
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
    const workerFanOut = executed.map((run) => run.metrics.workerFanOut).filter(isNumber);
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
      ...(executed.length > 0 ? {
        evidenceCreditRate: creditRate(executed, "evidenceCredit"),
        verificationCreditRate: creditRate(executed, "verificationCredit"),
        repairCreditRate: creditRate(executed, "repairCredit"),
        reconciliationCreditRate: creditRate(executed, "reconciliationCredit"),
        overDelegationRate: creditRate(executed, "overDelegationFlag")
      } : {}),
      ...(structureScores.length > 0 ? { averageStructureScore: roundRatio(average(structureScores)) } : {}),
      ...(elapsed.length > 0 ? { averageElapsedMs: Math.round(average(elapsed)) } : {}),
      ...(workerFanOut.length > 0 ? { averageWorkerFanOut: roundRatio(average(workerFanOut)) } : {}),
      ...availabilityCounts(runs),
      redaction: { class: "internal" }
    };
  });
}

export function extractRuntimeSignals(stdout: string): RuntimeEvaluationSignals {
  const records = stdout.split(/\r?\n/).map((line) => parseJsonLine(line)).filter(isJsonObject);
  return {
    eventKinds: records.map((record) => String(record.kind ?? "")),
    phaseUsage: extractPhaseUsage(records),
    loopBudgets: extractLoopBudgets(records),
    verifierVerdicts: records.filter((record) => record.kind === "agent.verifier.verdict").map((record) => String(dataObject(record)?.verdict ?? "")),
    repairAttemptCount: records.filter((record) => record.kind === "agent.repair.attempted").length,
    reconciliationStatuses: records.filter((record) => record.kind === "agent.result.reconciled").map((record) => String(dataObject(record)?.status ?? "")),
    workerFanOut: records.filter((record) => record.kind === "agent.worker.launched").length,
    ...reasoningSignals(records)
  };
}

export function phaseUsageMetrics(
  checkerOutput: WebpageCheckerOutput | undefined,
  signals: RuntimeEvaluationSignals,
  checkPassed: boolean
): readonly CliEvaluationPhaseUsageMetric[] {
  if (signals.phaseUsage.length > 0) return signals.phaseUsage;
  return [
    phaseMetric("evidence", evidenceCredit(checkerOutput), true, "checker"),
    phaseMetric("verify", checkPassed, true, "checker"),
    phaseMetric("repair", false, false, "unavailable")
  ];
}

export function loopBudgetMetrics(signals: RuntimeEvaluationSignals): readonly CliEvaluationLoopBudgetMetric[] {
  if (signals.loopBudgets.length > 0) return signals.loopBudgets;
  return [
    budgetMetric("evidence", "unavailable"),
    budgetMetric("verification", "unavailable"),
    budgetMetric("repair", "unavailable"),
    budgetMetric("delegation", "unavailable")
  ];
}

export function evidenceCredit(checkerOutput: WebpageCheckerOutput | undefined): boolean {
  return evidenceManifestStatus(checkerOutput) === "passed" &&
    (checkerOutput?.evidence?.evidenceItemCount ?? 0) > 0 &&
    (checkerOutput?.evidence?.sourceCoverageRate ?? 0) > 0 &&
    (checkerOutput?.evidence?.unsupportedClaimCount ?? 0) === 0;
}

export function verificationCredit(
  checkerOutput: WebpageCheckerOutput | undefined,
  signals: RuntimeEvaluationSignals,
  checkPassed: boolean
): boolean {
  const hasCommandOrCheckerProof = checkPassed || signals.loopBudgets.some((budget) => budget.kind === "verification" && (budget.consumed ?? 0) > 0);
  const hasVerifierPass = signals.verifierVerdicts.includes("pass");
  return hasCommandOrCheckerProof && (hasVerifierPass || evidenceCredit(checkerOutput));
}

export function repairCredit(signals: RuntimeEvaluationSignals, correctionCount: number): boolean {
  return signals.repairAttemptCount > 0 && correctionCount > 0;
}

export function reconciliationCredit(signals: RuntimeEvaluationSignals, checkPassed: boolean): boolean {
  return signals.reconciliationStatuses.includes(checkPassed ? "pass" : "fail") || signals.reconciliationStatuses.includes("partial");
}

export function verifierQuality(
  checkerOutput: WebpageCheckerOutput | undefined,
  signals: RuntimeEvaluationSignals,
  checkPassed: boolean
): CliEvaluationQualityStatus {
  if (signals.verifierVerdicts.includes("pass")) return "pass";
  if (signals.verifierVerdicts.includes("fail")) return "fail";
  if (signals.verifierVerdicts.includes("partial")) return "partial";
  if (checkPassed && evidenceCredit(checkerOutput)) return "pass";
  return "missing";
}

export function repairQuality(signals: RuntimeEvaluationSignals, correctionCount: number): CliEvaluationQualityStatus {
  if (signals.repairAttemptCount > 0 && correctionCount > 0) return "pass";
  if (signals.repairAttemptCount > 0) return "partial";
  return "unavailable";
}

export function overDelegationFlag(signals: RuntimeEvaluationSignals, commandRunCount: number, task: CliEvaluationTaskDefinition): boolean {
  return signals.workerFanOut > Math.max(1, task.checkCommands.length) && commandRunCount <= 2;
}

export function metricAvailabilityForRun(
  baseline: CliEvaluationBaselineDefinition,
  signals: RuntimeEvaluationSignals,
  checkerOutput: WebpageCheckerOutput | undefined
): readonly CliEvaluationMetricAvailability[] {
  const runtimeInstrumented = signals.eventKinds.length > 0;
  const checkerAvailable = checkerOutput !== undefined;
  const baselineReason = baseline.kind === "external-cli"
    ? "External baseline does not expose DeepSeek runtime events; metrics are unavailable or checker-inferred."
    : "DeepSeek runtime emitted structured events where available.";
  return [
    availability("phase_usage", runtimeInstrumented ? "instrumented" : checkerAvailable ? "inferred" : "unavailable", baselineReason),
    availability("loop_budgets", signals.loopBudgets.length > 0 ? "instrumented" : "unavailable", baselineReason),
    availability("worker_fan_out", runtimeInstrumented ? "instrumented" : baseline.kind === "external-cli" ? "unavailable" : "inferred", baselineReason),
    availability("verifier_quality", signals.verifierVerdicts.length > 0 ? "instrumented" : checkerAvailable ? "inferred" : "unavailable", baselineReason),
    availability("repair_quality", signals.repairAttemptCount > 0 ? "instrumented" : "unavailable", baselineReason),
    availability("reasoning_effort", signals.reasoningEffort || signals.providerMappedEffort ? "instrumented" : "unavailable", "Reasoning effort is a provider/model setting and never counts as proof by itself.")
  ];
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
    findings.push(...metricGap("CLI_EVALUATION_VERIFICATION_CREDIT_GAP", deepseek, competitor, "verificationCreditRate", "independent verification credit"));
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

function parseJsonLine(line: string): unknown {
  if (!line.trim().startsWith("{")) return undefined;
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dataObject(record: unknown): JsonObject | undefined {
  if (!isJsonObject(record)) return undefined;
  return isJsonObject(record.data) ? record.data : undefined;
}

function extractPhaseUsage(records: readonly JsonObject[]): readonly CliEvaluationPhaseUsageMetric[] {
  const plan = records.find((record) => record.kind === "agent.phase.plan.created");
  const phases = Array.isArray(dataObject(plan)?.phases) ? dataObject(plan)?.phases as readonly JsonObject[] : [];
  return phases.map((phase) => ({
    phase: String(phase.phase ?? "unknown"),
    used: phase.status === "running" || phase.status === "completed" || phase.status === "required",
    required: phase.required === true,
    skipped: phase.status === "skipped",
    evidenceSource: "runtime-event",
    redaction: { class: "internal" }
  }));
}

function extractLoopBudgets(records: readonly JsonObject[]): readonly CliEvaluationLoopBudgetMetric[] {
  return records
    .filter((record) => record.kind === "agent.loop.budget.consumed")
    .map((record) => dataObject(record))
    .filter(isJsonObject)
    .map((budget) => ({
      kind: String(budget.kind ?? "unknown"),
      ...(isNumber(budget.requested) ? { requested: budget.requested } : {}),
      ...(isNumber(budget.allowed) ? { allowed: budget.allowed } : {}),
      ...(isNumber(budget.consumed) ? { consumed: budget.consumed } : {}),
      ...(isNumber(budget.remaining) ? { remaining: budget.remaining } : {}),
      ...(typeof budget.stopReason === "string" ? { stopReason: budget.stopReason } : {}),
      evidenceSource: "runtime-event",
      redaction: { class: "internal" }
    }));
}

function reasoningSignals(records: readonly JsonObject[]): Pick<RuntimeEvaluationSignals, "reasoningEffort" | "providerMappedEffort"> {
  const mapped = dataObject(records.find((record) => record.kind === "model.reasoning.effort.mapped"));
  return {
    ...(typeof mapped?.requestedEffort === "string" ? { reasoningEffort: mapped.requestedEffort } : {}),
    ...(typeof mapped?.providerEffort === "string" ? { providerMappedEffort: mapped.providerEffort } : {})
  };
}

function phaseMetric(
  phase: string,
  used: boolean,
  required: boolean,
  evidenceSource: CliEvaluationPhaseUsageMetric["evidenceSource"]
): CliEvaluationPhaseUsageMetric {
  return {
    phase,
    used,
    required,
    skipped: !used,
    evidenceSource,
    redaction: { class: "internal" }
  };
}

function budgetMetric(kind: string, evidenceSource: CliEvaluationLoopBudgetMetric["evidenceSource"]): CliEvaluationLoopBudgetMetric {
  return {
    kind,
    evidenceSource,
    redaction: { class: "internal" }
  };
}

function unavailableMetrics(reason: string): readonly CliEvaluationMetricAvailability[] {
  return ["phase_usage", "loop_budgets", "worker_fan_out", "verifier_quality", "repair_quality", "reasoning_effort"]
    .map((metric) => availability(metric, "unavailable", reason));
}

function availability(metric: string, status: CliEvaluationMetricAvailabilityStatus, reason: string): CliEvaluationMetricAvailability {
  return {
    metric,
    status,
    reason,
    redaction: { class: "internal", fields: ["reason"] }
  };
}

function availabilityCounts(runs: readonly CliEvaluationTaskRunRecord[]): JsonObject {
  const unavailableMetricCount = runs.reduce((sum, run) => sum + metricAvailabilityCount(run.metrics.metricAvailability, "unavailable"), 0);
  const inferredMetricCount = runs.reduce((sum, run) => sum + metricAvailabilityCount(run.metrics.metricAvailability, "inferred"), 0);
  return {
    ...(unavailableMetricCount > 0 ? { unavailableMetricCount } : {}),
    ...(inferredMetricCount > 0 ? { inferredMetricCount } : {})
  };
}

function metricAvailabilityCount(items: readonly CliEvaluationMetricAvailability[] | undefined, status: CliEvaluationMetricAvailabilityStatus): number {
  return (items ?? []).filter((item) => item.status === status).length;
}

function creditRate(executed: readonly CliEvaluationTaskRunRecord[], key: "evidenceCredit" | "verificationCredit" | "repairCredit" | "reconciliationCredit" | "overDelegationFlag"): number {
  return roundRatio(executed.filter((run) => run.metrics[key] === true).length / executed.length);
}

function metricGap(
  code: string,
  deepseek: CliEvaluationBaselineAggregate,
  competitor: CliEvaluationBaselineAggregate,
  key: "successRate" | "averageStructureScore" | "correctionRate" | "verificationCreditRate",
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
