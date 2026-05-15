import { join } from "node:path";
import { deepSeekLiveCredentialProcessEnv } from "@deepseek/credential-auth-management";
import type {
  CliEvaluationBaselineDefinition,
  CliEvaluationComparisonSummary,
  CliEvaluationDiagnostic,
  CliEvaluationInstrumentationEvent,
  CliEvaluationMode,
  CliEvaluationPublicBenchmarkReference,
  CliEvaluationTaskDefinition,
  CliEvaluationTaskRunRecord,
  JsonObject,
  PlatformRuntime
} from "@deepseek/platform-contracts";
import { CLI_TASK_EVALUATION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { generatedArtifactMetrics } from "./generated-artifacts.js";
import {
  aggregateBaselines,
  deriveGapFindings,
  emptyMetrics,
  evidenceCredit,
  extractRuntimeSignals,
  loopBudgetMetrics,
  metricAvailabilityForRun,
  overDelegationFlag,
  phaseUsageMetrics,
  reconciliationCredit,
  repairCredit,
  repairQuality,
  repairMetricsFromStdout,
  roundRatio,
  verificationCredit,
  verifierQuality
} from "./evaluation-metrics.js";
import { promptAssemblyMetricsFromJsonl } from "./prompt-assembly-metrics.js";
import { checkerDiagnostics, evidenceManifestStatus, parseCheckerOutput, webpageProjectEvidence } from "./webpage-evidence.js";
import { webpageTaskPrompt } from "./webpage-task.js";

interface CatalogFile extends JsonObject {
  readonly catalogVersion?: string;
  readonly tasks?: readonly JsonObject[];
}

interface EvaluationEventRecorder {
  readonly events: () => readonly CliEvaluationInstrumentationEvent[];
  readonly record: (kind: CliEvaluationInstrumentationEvent["kind"], metadata?: JsonObject) => void;
}

export interface CliEvaluationOptions {
  readonly mode: CliEvaluationMode;
  readonly dryRun: boolean;
  readonly live: boolean;
  readonly baselineId: string;
  readonly compareBaselineIds: readonly string[];
  readonly allowExternalBaseline: boolean;
  readonly baselineCommand?: string;
  readonly codexCommand?: string;
  readonly claudeCommand?: string;
  readonly executeTaskId?: string;
  readonly baselineArgs: readonly string[];
  readonly extraArgs: readonly string[];
  readonly platform?: PlatformRuntime;
}

export const defaultEvaluationCatalogPath = "tests/evaluation/task-catalog.json";

export async function collectCliEvaluation(options: CliEvaluationOptions): Promise<CliEvaluationComparisonSummary> {
  const platform = options.platform ?? new NodePlatformRuntime();
  const catalog = await loadCatalog(platform);
  const requestedBaselineIds = requestedBaselines(options);
  const baselines = await Promise.all(requestedBaselineIds.map((baselineId) => baselineDefinition(platform, { ...options, baselineId })));
  if (options.extraArgs.length > 0) {
    return comparisonSummary(options, catalog.catalogVersion, baselines, [], [diagnostic("CLI_EVALUATION_INVALID_ARGS", "error", `diagnostics evaluate received ${options.extraArgs.length} unsupported argument(s).`)]);
  }
  const selectedTasks = catalog.tasks.filter((task) => options.mode === "full" || task.mode === "smoke");
  const runs = (await Promise.all(baselines.map(async (baseline) => Promise.all(selectedTasks.map((task) => taskRun(platform, task, baseline, options)))))).flat();
  const diagnostics = [
    ...baselines
      .filter((baseline) => baseline.status !== "available")
      .map((baseline) => diagnostic("CLI_EVALUATION_BASELINE_DEFERRED", "warn", `${baseline.baselineId} baseline is ${baseline.status}; configure an adapter before comparing live task completion.`)),
    ...(options.executeTaskId && !selectedTasks.some((task) => task.taskId === options.executeTaskId)
      ? [diagnostic("CLI_EVALUATION_EXECUTE_TASK_NOT_SELECTED", "error", `${options.executeTaskId} is not selected by ${options.mode} evaluation mode.`)]
      : [])
  ];
  return comparisonSummary(options, catalog.catalogVersion, baselines, runs, diagnostics);
}

export function evaluationJsonLines(summary: CliEvaluationComparisonSummary): readonly JsonObject[] {
  return [
    {
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.summary",
      summary,
      redaction: summary.redaction
    },
    ...summary.taskRuns.map((run) => ({
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.task-run",
      run,
      redaction: run.redaction
    })),
    ...summary.taskRuns.flatMap((run) => run.instrumentationEvents.map((event) => ({
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.instrumentation-event",
      event,
      redaction: event.redaction
    }))),
    ...summary.baselineAggregates.map((aggregate) => ({
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.baseline-aggregate",
      aggregate,
      redaction: aggregate.redaction
    })),
    ...summary.gapFindings.map((finding) => ({
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.gap-finding",
      finding,
      redaction: finding.redaction
    })),
    ...summary.diagnostics.map((item) => ({
      schemaVersion: summary.schemaVersion,
      kind: "diagnostics.evaluate.diagnostic",
      diagnostic: item,
      redaction: item.redaction
    }))
  ];
}

async function loadCatalog(platform: PlatformRuntime): Promise<{ readonly catalogVersion: string; readonly tasks: readonly CliEvaluationTaskDefinition[] }> {
  const raw = await platform.readFile(join(process.cwd(), defaultEvaluationCatalogPath)).catch(() => JSON.stringify(fallbackCatalog()));
  const parsed = JSON.parse(raw) as CatalogFile;
  const tasks = (parsed.tasks ?? []).map(taskDefinition);
  return {
    catalogVersion: typeof parsed.catalogVersion === "string" ? parsed.catalogVersion : "unknown",
    tasks
  };
}

function fallbackCatalog(): CatalogFile {
  return {
    schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
    catalogVersion: "fallback.missing-catalog",
    tasks: [{
      taskId: "eval.catalog.missing",
      title: "Evaluation catalog unavailable",
      category: "diagnostic",
      fixtureId: "fixture.eval.catalog.missing",
      workspaceSnapshotId: "snapshot.eval.missing",
      promptDigest: "sha256:eval-catalog-missing",
      promptSummary: "Run diagnostics evaluate from the repository root so tests/evaluation/task-catalog.json can be loaded.",
      allowedCapabilityProfile: "none",
      timeBudgetMs: 0,
      checkCommands: [],
      scoringRubricId: "rubric.eval.catalog-required",
      mode: "smoke"
    }]
  };
}

function taskDefinition(input: JsonObject): CliEvaluationTaskDefinition {
  return {
    schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
    taskId: stringField(input, "taskId"),
    title: stringField(input, "title"),
    category: stringField(input, "category"),
    fixtureId: stringField(input, "fixtureId"),
    workspaceSnapshotId: stringField(input, "workspaceSnapshotId"),
    promptDigest: stringField(input, "promptDigest"),
    promptSummary: stringField(input, "promptSummary"),
    allowedCapabilityProfile: stringField(input, "allowedCapabilityProfile"),
    timeBudgetMs: numberField(input, "timeBudgetMs"),
    checkCommands: stringArrayField(input, "checkCommands"),
    scoringRubricId: stringField(input, "scoringRubricId"),
    mode: input.mode === "full" ? "full" : "smoke",
    redaction: { class: "internal", fields: ["promptDigest", "workspaceSnapshotId"] }
  };
}

async function baselineDefinition(platform: PlatformRuntime, options: CliEvaluationOptions): Promise<CliEvaluationBaselineDefinition> {
  const baselineId = options.baselineId;
  if (baselineId === "deepseek-cli") {
    return {
      baselineId,
      label: "DeepSeek CLI",
      kind: "deepseek-cli",
      status: "available",
      versionCommand: "deepseek --version",
      configured: true,
      diagnostics: [],
      redaction: { class: "internal", fields: ["versionCommand"] }
    };
  }
  const knownExternal = baselineId === "claude-code" || baselineId === "codex";
  const command = externalBaselineCommand(options, baselineId);
  if (options.allowExternalBaseline && command) {
    return probeExternalBaseline(platform, baselineId, knownExternal, command, probeArgsFor(options, baselineId));
  }
  return {
    baselineId,
    label: knownExternal ? (baselineId === "claude-code" ? "Claude Code" : "Codex") : baselineId,
    kind: knownExternal ? "external-cli" : "manual-import",
    status: "deferred",
    configured: false,
    diagnostics: [diagnostic("CLI_EVALUATION_EXTERNAL_BASELINE_NOT_CONFIGURED", "warn", `${baselineId} is opt-in and has no configured adapter.`)],
    redaction: { class: "internal", fields: ["diagnostics.metadata"] }
  };
}

function requestedBaselines(options: CliEvaluationOptions): readonly string[] {
  const ids = options.compareBaselineIds.length > 0 ? options.compareBaselineIds : [options.baselineId];
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

function externalBaselineCommand(options: CliEvaluationOptions, baselineId: string): string | undefined {
  if (baselineId === "codex") return options.codexCommand ?? options.baselineCommand;
  if (baselineId === "claude-code") return options.claudeCommand ?? options.baselineCommand;
  return options.baselineCommand;
}

function probeArgsFor(options: CliEvaluationOptions, baselineId: string): readonly string[] {
  if (options.baselineArgs.length > 0) return options.baselineArgs;
  return baselineId === "claude-code" ? ["--version"] : ["--version"];
}

async function probeExternalBaseline(
  platform: PlatformRuntime,
  baselineId: string,
  knownExternal: boolean,
  command: string,
  args: readonly string[]
): Promise<CliEvaluationBaselineDefinition> {
  const probeArgs = args.length > 0 ? args : ["--version"];
  const result = await platform.runProcess(command, probeArgs, { cwd: process.cwd() });
  const ok = result.exitCode === 0;
  const probeOutputPreview = boundedPreview([result.stdout, result.stderr].filter(Boolean).join("\n"));
  const diagnostics = ok
    ? [diagnostic("CLI_EVALUATION_EXTERNAL_BASELINE_PROBED", "info", `${baselineId} external baseline probe completed.`)]
    : [diagnostic("CLI_EVALUATION_EXTERNAL_BASELINE_PROBE_FAILED", "warn", `${baselineId} external baseline probe failed with exit code ${result.exitCode}.`)];
  return {
    baselineId,
    label: knownExternal ? (baselineId === "claude-code" ? "Claude Code" : "Codex") : baselineId,
    kind: knownExternal ? "external-cli" : "manual-import",
    status: ok ? "available" : "unavailable",
    versionCommand: [command, ...probeArgs].join(" "),
    commandFingerprint: commandFingerprint(command, probeArgs),
    probeExitCode: result.exitCode,
    probeOutputPreview,
    configured: true,
    diagnostics,
    redaction: { class: "internal", fields: ["versionCommand", "commandFingerprint", "probeOutputPreview", "diagnostics.metadata"] }
  };
}

function plannedRun(task: CliEvaluationTaskDefinition, baseline: CliEvaluationBaselineDefinition, dryRun: boolean): CliEvaluationTaskRunRecord {
  const deferred = baseline.status !== "available";
  return {
    schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
    kind: "cli.evaluation.task-run",
    runId: `eval:${baseline.baselineId}:${task.taskId}`,
    task,
    baseline,
    dryRun,
    outcome: deferred ? "deferred" : "planned",
    checks: task.checkCommands.map((command) => ({
      command,
      status: "skipped",
      redaction: { class: "internal", fields: ["command"] }
    })),
    metrics: emptyMetrics(),
    instrumentationEvents: [],
    diagnostics: deferred ? baseline.diagnostics : [],
    evidencePaths: [],
    redaction: { class: "internal", fields: ["task.promptDigest", "checks.command", "evidencePaths"] }
  };
}

async function taskRun(
  platform: PlatformRuntime,
  task: CliEvaluationTaskDefinition,
  baseline: CliEvaluationBaselineDefinition,
  options: CliEvaluationOptions
): Promise<CliEvaluationTaskRunRecord> {
  const shouldExecute = !options.dryRun && options.executeTaskId === task.taskId && task.taskId === "eval.webpage.generation" && baseline.status === "available";
  if (!shouldExecute) return plannedRun(task, baseline, options.dryRun);
  return executeWebpageTask(platform, task, baseline, options);
}

async function executeWebpageTask(
  platform: PlatformRuntime,
  task: CliEvaluationTaskDefinition,
  baseline: CliEvaluationBaselineDefinition,
  options: CliEvaluationOptions
): Promise<CliEvaluationTaskRunRecord> {
  const runId = `eval:${baseline.baselineId}:${task.taskId}`;
  const events = createEventRecorder(runId, baseline.baselineId, task.taskId);
  events.record("run_started", { dryRun: false });
  const workspaceRoot = await isolatedWorkspaceRoot(platform, runId);
  events.record("workspace_created", { workspaceRoot });
  const generatedDir = platform.resolvePath(workspaceRoot, "generated-webpage");
  await platform.ensureDirectory(generatedDir);
  const projectEvidencePath = platform.resolvePath(workspaceRoot, "PROJECT-EVIDENCE.md");
  await platform.writeFile(projectEvidencePath, await webpageProjectEvidence(platform));
  events.record("evidence_written", { path: projectEvidencePath, purpose: "webpage-project-evidence" });
  await platform.writeFile(platform.resolvePath(workspaceRoot, "TASK.md"), webpageTaskPrompt(task));
  events.record("prompt_written", { path: platform.resolvePath(workspaceRoot, "TASK.md") });

  const started = Date.now();
  const command = await baselineCommandForExecution(platform, baseline.baselineId, options, workspaceRoot, webpageTaskPrompt(task));
  if (!command) {
    return {
      ...plannedRun(task, baseline, false),
      outcome: "invalid",
      diagnostics: [diagnostic("CLI_EVALUATION_EXECUTION_ADAPTER_UNAVAILABLE", "error", `${baseline.baselineId} has no execution adapter for ${task.taskId}.`)],
      evidencePaths: [workspaceRoot],
      metrics: { ...emptyMetrics(), elapsedMs: Date.now() - started },
      instrumentationEvents: withRecordedEvent(events, "run_finished", { outcome: "invalid" }),
      redaction: { class: "internal", fields: ["task.promptDigest", "checks.command", "evidencePaths", "diagnostics.metadata"] }
    };
  }

  events.record("prompt_sent", { adapter: baseline.baselineId });
  events.record("command_started", { command: command.command, argCount: command.args.length });
  const runResult = await platform.runProcess(command.command, command.args, {
    cwd: workspaceRoot,
    timeoutMs: task.timeBudgetMs,
    ...(command.env ? { env: command.env } : {})
  });
  events.record("command_finished", { exitCode: runResult.exitCode, stdoutBytes: byteLength(runResult.stdout), stderrBytes: byteLength(runResult.stderr) });
  const promptAssembly = baseline.baselineId === "deepseek-cli" ? promptAssemblyMetricsFromJsonl(runResult.stdout) : { available: false, gapReason: "not-applicable" as const };
  const runtimeSignals = extractRuntimeSignals(runResult.stdout);
  const checkCommand = task.checkCommands[0] ?? "node scripts/check-webpage-generation.mjs tests/evaluation/generated-webpage";
  events.record("checker_started", { command: checkCommand });
  const checkerResult = await platform.runProcess(process.execPath, [join(process.cwd(), "scripts/check-webpage-generation.mjs"), generatedDir], { cwd: process.cwd(), timeoutMs: 60_000 });
  events.record("checker_finished", { exitCode: checkerResult.exitCode, stdoutBytes: byteLength(checkerResult.stdout), stderrBytes: byteLength(checkerResult.stderr) });
  const checkerOutput = parseCheckerOutput(checkerResult.stdout);
  events.record("artifact_scan_started", { generatedDir });
  const artifactMetrics = await generatedArtifactMetrics(platform, generatedDir);
  events.record("artifact_scan_finished", {
    fileCount: artifactMetrics.fileCount,
    byteTotal: artifactMetrics.byteTotal,
    structureScore: artifactMetrics.structureScore
  });
  const elapsedMs = Date.now() - started;
  const checkPassed = checkerResult.exitCode === 0;
  const commandFailed = runResult.exitCode !== 0;
  const commandFailureCount = (commandFailed ? 1 : 0) + (checkPassed ? 0 : 1);
  const commandRunCount = 2;
  const commandSuccessCount = (commandFailed ? 0 : 1) + (checkPassed ? 1 : 0);
  const correctionCount = correctionSignalCount([runResult.stdout, runResult.stderr].join("\n"));
  const outcome = checkPassed ? "solved" : commandFailed ? "failed" : "invalid";
  const stdoutPreview = boundedPreview(runResult.stdout);
  const stderrPreview = boundedPreview(runResult.stderr);
  const repairMetrics = repairMetricsFromStdout(runResult.stdout);
  await platform.writeFile(platform.resolvePath(workspaceRoot, "baseline-output.txt"), [
    `# ${baseline.baselineId}`,
    "",
    `Command: ${command.command} ${command.args.map(redactPromptArg).join(" ")}`,
    `Exit Code: ${runResult.exitCode}`,
    "",
    "## stdout",
    stdoutPreview,
    "",
    "## stderr",
    stderrPreview,
    ""
  ].join("\n"));
  events.record("evidence_written", { path: platform.resolvePath(workspaceRoot, "baseline-output.txt") });
  events.record("run_finished", { outcome, elapsedMs });

  return {
    schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
    kind: "cli.evaluation.task-run",
    runId,
    task,
    baseline,
    dryRun: false,
    outcome,
    checks: [{
      command: checkCommand,
      status: checkPassed ? "pass" : "fail",
      exitCode: checkerResult.exitCode,
      evidencePath: generatedDir,
      stdoutPreview: boundedPreview(checkerResult.stdout),
      stderrPreview: boundedPreview(checkerResult.stderr),
      redaction: { class: "internal", fields: ["command", "evidencePath", "stdoutPreview", "stderrPreview"] }
    }],
    metrics: {
      elapsedMs,
      firstRunSuccess: checkPassed && !commandFailed,
      checkPassRate: checkPassed ? 1 : 0,
      retryCount: 0,
      userInterventionCount: 0,
      safetyViolationCount: 0,
      correctionCount,
      commandRunCount,
      commandSuccessCount,
      commandSuccessRate: roundRatio(commandSuccessCount / commandRunCount),
      commandFailureCount,
      generatedFileCount: artifactMetrics.fileCount,
      generatedHtmlFileCount: artifactMetrics.htmlFileCount,
      generatedCssFileCount: artifactMetrics.cssFileCount,
      generatedJsFileCount: artifactMetrics.jsFileCount,
      generatedByteTotal: artifactMetrics.byteTotal,
      largestGeneratedFileBytes: artifactMetrics.largestFileBytes,
      codeStructureScore: artifactMetrics.structureScore,
      contextRecallQuality: "not-applicable",
      firstPassSuccess: checkPassed && !commandFailed,
      repairActivationCount: repairMetrics.repairActivationCount,
      repairSuccessCount: repairMetrics.repairSuccessCount,
      ...(repairMetrics.repairActivationCount > 0 ? { repairSuccessRate: roundRatio(repairMetrics.repairSuccessCount / repairMetrics.repairActivationCount) } : {}),
      failedVerificationCount: 0,
      correctedVerificationCount: correctionCount > 0 && checkPassed ? 1 : 0,
      repeatedIneffectiveAttemptCount: 0,
      ...(repairMetrics.repairStopReason ? { repairStopReason: repairMetrics.repairStopReason } : {}),
      repairMetricsAvailability: baseline.baselineId === "deepseek-cli" ? "available" : "unavailable",
      promptAssemblyAvailable: promptAssembly.available,
      ...(promptAssembly.fingerprint ? { promptAssemblyFingerprint: promptAssembly.fingerprint } : {}),
      ...(promptAssembly.sectionCount !== undefined ? { promptAssemblySectionCount: promptAssembly.sectionCount } : {}),
      ...(promptAssembly.excludedSectionCount !== undefined ? { promptAssemblyExcludedSectionCount: promptAssembly.excludedSectionCount } : {}),
      ...(promptAssembly.budgetStatus ? { promptAssemblyBudgetStatus: promptAssembly.budgetStatus } : {}),
      ...(promptAssembly.visibleToolCount !== undefined ? { promptAssemblyVisibleToolCount: promptAssembly.visibleToolCount } : {}),
      ...(promptAssembly.gapReason ? { promptAssemblyGapReason: promptAssembly.gapReason } : {}),
      evidencePlanPresent: true,
      evidenceItemCount: checkerOutput?.evidence?.evidenceItemCount ?? 0,
      evidenceSourceCoverageRate: checkerOutput?.evidence?.sourceCoverageRate ?? 0,
      claimGroundingRate: checkerOutput?.evidence?.claimGroundingRate ?? 0,
      unsupportedClaimCount: checkerOutput?.evidence?.unsupportedClaimCount ?? 0,
      assumptionCount: checkerOutput?.evidence?.assumptionCount ?? 0,
      hallucinatedCommandCount: checkerOutput?.evidence?.hallucinatedCommandCount ?? 0,
      evidenceManifestStatus: evidenceManifestStatus(checkerOutput),
      phaseUsage: phaseUsageMetrics(checkerOutput, runtimeSignals, checkPassed),
      loopBudgets: loopBudgetMetrics(runtimeSignals),
      workerFanOut: runtimeSignals.workerFanOut,
      overDelegationFlag: overDelegationFlag(runtimeSignals, commandRunCount, task),
      ...(overDelegationFlag(runtimeSignals, commandRunCount, task) ? { overDelegationReason: "worker fan-out exceeded useful parallelism for the scenario." } : {}),
      verifierQuality: verifierQuality(checkerOutput, runtimeSignals, checkPassed),
      repairQuality: repairQuality(runtimeSignals, correctionCount),
      ...(runtimeSignals.reasoningEffort ? { reasoningEffort: runtimeSignals.reasoningEffort } : {}),
      ...(runtimeSignals.providerMappedEffort ? { providerMappedEffort: runtimeSignals.providerMappedEffort } : {}),
      evidenceCredit: evidenceCredit(checkerOutput),
      verificationCredit: verificationCredit(checkerOutput, runtimeSignals, checkPassed),
      repairCredit: repairCredit(runtimeSignals, correctionCount),
      reconciliationCredit: reconciliationCredit(runtimeSignals, checkPassed),
      metricAvailability: metricAvailabilityForRun(baseline, runtimeSignals, checkerOutput),
      recoveryUsed: correctionCount > 0,
      redaction: { class: "internal", fields: ["estimatedCostUsd"] }
    },
    instrumentationEvents: events.events(),
    diagnostics: [
      ...(commandFailed ? [diagnostic("CLI_EVALUATION_BASELINE_COMMAND_FAILED", "warn", `${baseline.baselineId} exited with code ${runResult.exitCode}.`)] : []),
      ...(checkPassed ? [] : [diagnostic("CLI_EVALUATION_WEBPAGE_CHECK_FAILED", "warn", `${baseline.baselineId} generated webpage failed local artifact checks.`)]),
      ...checkerDiagnostics(checkerOutput, diagnostic),
      ...(baseline.baselineId === "deepseek-cli" && !promptAssembly.available ? [diagnostic("CLI_EVALUATION_PROMPT_ASSEMBLY_MISSING", "warn", "DeepSeek CLI run did not expose prompt assembly evidence.")] : []),
      ...(baseline.baselineId === "deepseek-cli" && !checkPassed && promptAssembly.gapReason && promptAssembly.gapReason !== "not-applicable" ? [diagnostic(`CLI_EVALUATION_PROMPT_ASSEMBLY_${promptAssembly.gapReason.toUpperCase().replace(/-/g, "_")}`, "warn", `DeepSeek CLI webpage failure categorized as ${promptAssembly.gapReason}.`)] : [])
    ],
    evidencePaths: [workspaceRoot, generatedDir, projectEvidencePath, platform.resolvePath(workspaceRoot, "baseline-output.txt")],
    redaction: { class: "internal", fields: ["task.promptDigest", "checks.command", "checks.evidencePath", "checks.stdoutPreview", "checks.stderrPreview", "instrumentationEvents.metadata", "evidencePaths", "diagnostics.metadata"] }
  };
}

async function baselineCommandForExecution(
  platform: PlatformRuntime,
  baselineId: string,
  options: CliEvaluationOptions,
  workspaceRoot: string,
  prompt: string
): Promise<{ readonly command: string; readonly args: readonly string[]; readonly env?: JsonObject } | undefined> {
  if (baselineId === "deepseek-cli") {
    const args = [
      join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
      "--tsconfig",
      join(process.cwd(), "tsconfig.json"),
      join(process.cwd(), "src/apps/cli/src/index.ts"),
      "run",
      prompt,
      "--output",
      "jsonl",
      "--timeout-ms",
      String(15 * 60 * 1000)
    ];
    if (options.live) {
      args.push("--live", "--tool-projection", "read-write");
    }
    return {
      command: process.execPath,
      args,
      ...(options.live ? { env: await liveCredentialEnv(platform) } : {})
    };
  }
  if (baselineId === "codex") {
    const command = externalBaselineCommand(options, baselineId);
    if (!command || !options.allowExternalBaseline) return undefined;
    return {
      command,
      args: [
        "exec",
        "--cd",
        workspaceRoot,
        "--sandbox",
        "workspace-write",
        "--skip-git-repo-check",
        "--ephemeral",
        "--color",
        "never",
        prompt
      ]
    };
  }
  if (baselineId === "claude-code") {
    const command = externalBaselineCommand(options, baselineId);
    if (!command || !options.allowExternalBaseline) return undefined;
    return {
      command,
      args: [
        "-p",
        "--output-format",
        "json",
        "--permission-mode",
        "acceptEdits",
        "--no-session-persistence",
        prompt
      ]
    };
  }
  return undefined;
}

async function liveCredentialEnv(platform: PlatformRuntime): Promise<JsonObject> {
  return Object.fromEntries(Object.entries(await deepSeekLiveCredentialProcessEnv(platform)).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0));
}

async function isolatedWorkspaceRoot(platform: PlatformRuntime, runId: string): Promise<string> {
  return platform.createTempDirectory(`${sanitizePathSegment(runId)}-`);
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

function correctionSignalCount(value: string): number {
  const normalized = value.toLowerCase();
  const matches = normalized.match(/\b(retry|retried|again|fix|fixed|correct|corrected|repair|repaired|failed|error)\b/g);
  return Math.min(matches?.length ?? 0, 20);
}

function redactPromptArg(value: string): string {
  return value.includes("\n") || value.length > 80 ? "[PROMPT]" : value;
}

function comparisonSummary(
  options: CliEvaluationOptions,
  taskCatalogVersion: string,
  baselines: readonly CliEvaluationBaselineDefinition[],
  taskRuns: readonly CliEvaluationTaskRunRecord[],
  diagnostics: readonly CliEvaluationDiagnostic[]
): CliEvaluationComparisonSummary {
  const hasError = diagnostics.some((item) => item.severity === "error");
  const hasWarn = diagnostics.some((item) => item.severity === "warn") || baselines.some((baseline) => baseline.status !== "available");
  const baselineAggregates = aggregateBaselines(taskRuns);
  const gapFindings = deriveGapFindings(baselineAggregates);
  return {
    schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
    kind: "cli.evaluation.comparison.summary",
    status: hasError ? "fail" : hasWarn ? "warn" : "pass",
    mode: options.mode,
    dryRun: options.dryRun,
    taskCatalogVersion,
    reportTimestamp: "1970-01-01T00:00:00.000Z",
    baselines,
    taskRuns,
    baselineAggregates,
    gapFindings,
    publicBenchmarkReferences: publicBenchmarkReferences(),
    evidencePaths: [],
    diagnostics,
    nextAction: hasError
      ? "Remove unsupported arguments, then rerun diagnostics evaluate."
      : hasWarn
        ? "Configure opt-in external baseline adapters before making competitive claims."
        : options.executeTaskId
          ? "Inspect baseline gap findings, then expand the task catalog before making product claims."
          : "Run diagnostics evaluate --full --execute-task eval.webpage.generation after smoke evaluation is stable.",
    redaction: { class: "internal", fields: ["taskRuns.task.promptDigest", "publicBenchmarkReferences.url", "evidencePaths", "gapFindings.message"] }
  };
}

function publicBenchmarkReferences(): readonly CliEvaluationPublicBenchmarkReference[] {
  return [
    {
      name: "SWE-bench Verified",
      url: "https://www.swebench.com/",
      observedAt: "2026-05-13",
      note: "Advisory public benchmark reference; not a substitute for DeepSeek-owned CLI product evidence.",
      advisoryOnly: true,
      redaction: { class: "public" }
    },
    {
      name: "Terminal-Bench",
      url: "https://www.tbench.ai/",
      observedAt: "2026-05-13",
      note: "Advisory terminal-agent benchmark reference; local product claims require replayable internal evidence.",
      advisoryOnly: true,
      redaction: { class: "public" }
    }
  ];
}

function createEventRecorder(runId: string, baselineId: string, taskId: string): EvaluationEventRecorder {
  const events: CliEvaluationInstrumentationEvent[] = [];
  return {
    events: () => events,
    record: (kind, metadata = {}) => {
      const sequence = events.length + 1;
      events.push({
        schemaVersion: CLI_TASK_EVALUATION_SCHEMA_VERSION,
        eventId: `${runId}:event:${sequence}`,
        kind,
        runId,
        baselineId,
        taskId,
        sequence,
        recordedAt: "1970-01-01T00:00:00.000Z",
        metadata,
        redaction: {
          class: "internal",
          fields: [
            "metadata.workspaceRoot",
            "metadata.path",
            "metadata.generatedDir",
            "metadata.command"
          ]
        }
      });
    }
  };
}

function withRecordedEvent(
  events: EvaluationEventRecorder,
  kind: CliEvaluationInstrumentationEvent["kind"],
  metadata: JsonObject = {}
): readonly CliEvaluationInstrumentationEvent[] {
  events.record(kind, metadata);
  return events.events();
}

function diagnostic(code: string, severity: CliEvaluationDiagnostic["severity"], message: string): CliEvaluationDiagnostic {
  return {
    code,
    severity,
    message,
    metadata: {},
    redaction: { class: "internal", fields: ["metadata"] }
  };
}

function commandFingerprint(command: string, args: readonly string[]): string {
  return `cmd:${hashText([command, ...args].join("\u0000"))}`;
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash.toString(16).padStart(8, "0");
}

function boundedPreview(value: string): string {
  const normalized = value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").trim();
  return normalized.length > 500 ? `${normalized.slice(0, 500)}...` : normalized;
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function stringField(input: JsonObject, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

function numberField(input: JsonObject, key: string): number {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringArrayField(input: JsonObject, key: string): readonly string[] {
  const value = input[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
