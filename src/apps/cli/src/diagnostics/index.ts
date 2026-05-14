import type {
  AgentLoopOutputMode,
  CliEvaluationComparisonSummary,
  DiagnosticBundle,
  DiagnosticsCommandName,
  DiagnosticsReleaseReadinessEvidence,
  AcceptanceEvidenceRefreshSummary,
  JsonObject,
  ObservabilityPrivacyDecision,
  IndexProviderDiagnosticsSummary,
  ReadinessCheck,
  ReadinessCommandResult,
  ReleaseVerificationSummary
} from "@deepseek/platform-contracts";
import { invokeLocalReadinessCommand } from "@deepseek/command-system";
import { InMemoryObservabilitySink } from "@deepseek/observability";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import type { CliOptions } from "../types.js";
import { createCliReadinessEnvironment, renderReadinessText } from "../commands/readiness.js";
import { activationEvidenceText, missingActivationEvidence } from "../commands/index-provider.js";
import { collectReleaseReadinessEvidence, diagnosticPitIds, diagnosticsSchemaVersion } from "./release-evidence.js";
import { refreshAcceptanceEvidence, refreshStepRecord } from "./refresh-evidence.js";
import { collectCliEvaluation, evaluationJsonLines } from "./evaluation.js";

export interface CliDiagnosticNotice {
  readonly code: string;
  readonly message: string;
}

export interface CliDiagnosticsResult extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "diagnostics.bundle" | "diagnostics.release" | "diagnostics.doctor" | "diagnostics.verify" | "diagnostics.refresh" | "diagnostics.evaluate";
  readonly status: "pass" | "warn" | "fail";
  readonly command: DiagnosticsCommandName;
  readonly bundle?: DiagnosticBundle;
  readonly externalExportDecision?: ObservabilityPrivacyDecision;
  readonly readiness?: ReadinessCommandResult;
  readonly release?: DiagnosticsReleaseReadinessEvidence;
  readonly verificationSummary?: ReleaseVerificationSummary;
  readonly refresh?: AcceptanceEvidenceRefreshSummary;
  readonly evaluation?: CliEvaluationComparisonSummary;
  readonly indexProviders?: IndexProviderDiagnosticsSummary;
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export async function runDiagnosticsCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  const command = options.diagnosticsCommand ?? "bundle";
  const result = await collectCliDiagnostics(command, options);
  for (const line of renderDiagnosticsResult(result, options.output)) await write(line);
}

export async function collectCliDiagnostics(command: DiagnosticsCommandName, options: CliOptions): Promise<CliDiagnosticsResult> {
  if (command === "release") return releaseDiagnostics(options);
  if (command === "verify") return verifyDiagnostics(options);
  if (command === "refresh") return refreshDiagnostics(options);
  if (command === "evaluate") return evaluateDiagnostics(options);
  if (command === "doctor") return doctorDiagnostics(options);
  return bundleDiagnostics(options);
}

export function renderDiagnosticsResult(result: CliDiagnosticsResult, output: AgentLoopOutputMode): readonly string[] {
  if (output === "json") return [JSON.stringify(result)];
  if (output === "jsonl") return diagnosticsJsonLines(result).map((entry) => JSON.stringify(entry));
  const lines = [`${result.kind}: ${result.status}`];
  if (result.bundle) {
    lines.push(`- bundle: ${result.bundle.bundleId}`);
    lines.push(`- records: ${result.bundle.selectedRecordCount}/${result.bundle.totalRecordCount}${result.bundle.truncated ? " truncated" : ""}`);
    lines.push(`- privacy: ${result.bundle.privacyDecision.action} (${result.bundle.privacyDecision.reasonCode})`);
    lines.push(`- redactions: ${result.bundle.redactionSummary.redactedValueCount}`);
  }
  if (result.externalExportDecision) {
    lines.push(`- external export: ${result.externalExportDecision.action} (${result.externalExportDecision.reasonCode})`);
  }
  if (result.readiness) {
    lines.push(...renderReadinessText(result.readiness).map((line) => `- ${line}`));
  }
  if (result.indexProviders) {
    lines.push(`- index providers: enabled=${result.indexProviders.enabledProviderIds.join(", ") || "none"} deferred=${result.indexProviders.deferredProviderIds.join(", ") || "none"}`);
    for (const provider of result.indexProviders.providers) {
      lines.push(`- index provider ${provider.providerId}: ${provider.status} (${provider.kind}, ${provider.ranking.join(", ")})`);
      lines.push(`  evidence=${activationEvidenceText(provider)}`);
      const missing = missingActivationEvidence(provider);
      if (missing.length > 0) lines.push(`  missing-evidence=${missing.join(", ")}`);
      if (provider.diagnostics.length > 0) lines.push(`  diagnostics=${provider.diagnostics.map((diagnostic) => diagnostic.code).join(", ")}`);
    }
  }
  if (result.release) {
    lines.push(`- package: ${result.release.packageSurface.packageName}@${result.release.packageSurface.packageVersion}`);
    lines.push(`- bin: ${result.release.packageSurface.executableName} -> ${result.release.packageSurface.binEntry}`);
    lines.push(`- build artifact: ${result.release.packageSurface.buildOutputPath} ${result.release.packageSurface.buildOutputExists === true ? "present" : result.release.packageSurface.sourcePackageManifestFound === false ? "deferred" : "missing"}`);
    lines.push(`- package files: ${result.release.packageSurface.expectedPackageFiles.join(", ")}`);
    lines.push(`- package surface: ${result.release.packageSurface.unexpectedPackageFiles?.length ? `unexpected=${result.release.packageSurface.unexpectedPackageFiles.join(", ")}` : "safe"}`);
    lines.push(`- generated bundle ignored: ${String(result.release.packageSurface.generatedBundleIgnored)}`);
    lines.push(`- verify: ${result.release.verification.requiredCommands.join(" && ")}`);
    lines.push(`- evidence: ${result.release.verification.acceptanceEvidencePaths.join(", ")}`);
    if ((result.release.verification.missingAcceptanceEvidencePaths?.length ?? 0) > 0) {
      lines.push(`- missing evidence: ${result.release.verification.missingAcceptanceEvidencePaths?.join(", ")}`);
    }
    for (const check of result.release.checks) lines.push(`- ${check.id}: ${check.status} - ${check.message}`);
  }
  if (result.verificationSummary) {
    const summary = result.verificationSummary;
    lines.push(`- verification: ${summary.status}`);
    lines.push(`- publish dry-run ready: ${String(summary.publishDryRunReady)}`);
    lines.push(`- next action: ${summary.nextAction}`);
    if (summary.blockingChecks.length > 0) lines.push(`- blocking checks: ${summary.blockingChecks.map((check) => check.id).join(", ")}`);
    if (summary.warningChecks.length > 0) lines.push(`- warning checks: ${summary.warningChecks.map((check) => check.id).join(", ")}`);
    if (summary.missingAcceptanceEvidencePaths.length > 0) lines.push(`- missing evidence: ${summary.missingAcceptanceEvidencePaths.join(", ")}`);
    lines.push(`- command plan: ${summary.requiredCommands.join(" && ")}`);
  }
  if (result.refresh) {
    lines.push(`- mode: ${result.refresh.mode}`);
    lines.push(`- dry-run: ${String(result.refresh.dryRun)}`);
    lines.push(`- refreshed: ${result.refresh.refreshedPaths.length}`);
    lines.push(`- failed: ${result.refresh.failedStepIds.join(", ") || "none"}`);
    lines.push(`- next action: ${result.refresh.nextAction}`);
    for (const step of result.refresh.steps) {
      lines.push(`- ${step.id}: ${step.status}${typeof step.exitCode === "number" ? ` exit=${step.exitCode}` : ""} -> ${step.outputPath}`);
    }
    for (const diagnostic of result.refresh.diagnostics) {
      lines.push(`- ${diagnostic.id}: ${diagnostic.status} - ${diagnostic.message}`);
    }
  }
  if (result.evaluation) {
    lines.push(`- mode: ${result.evaluation.mode}`);
    lines.push(`- dry-run: ${String(result.evaluation.dryRun)}`);
    lines.push(`- catalog: ${result.evaluation.taskCatalogVersion}`);
    lines.push(`- baselines: ${result.evaluation.baselines.map((baseline) => `${baseline.baselineId}:${baseline.status}`).join(", ")}`);
    lines.push(`- task runs: ${result.evaluation.taskRuns.length}`);
    lines.push(`- next action: ${result.evaluation.nextAction}`);
    for (const run of result.evaluation.taskRuns) {
      lines.push(`- ${run.task.taskId}: ${run.outcome} (${run.baseline.baselineId})`);
    }
    for (const diagnostic of result.evaluation.diagnostics) {
      lines.push(`- ${diagnostic.code}: ${diagnostic.severity} - ${diagnostic.message}`);
    }
  }
  lines.push(`- reference pits: ${result.referencePitFixtureIds.join(", ")}`);
  return lines;
}

async function bundleDiagnostics(options: CliOptions): Promise<CliDiagnosticsResult> {
  const sink = new InMemoryObservabilitySink();
  await seedDiagnosticRecords(sink, options);
  const maxRecords = typeof options.diagnosticsInput?.maxRecords === "number" ? options.diagnosticsInput.maxRecords : 10;
  const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "cli diagnostics bundle", maxRecords });
  const externalExportDecision = sink.decideExport("support-upload");
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.bundle",
    status: bundle.privacyDecision.action === "allow-local" ? "pass" : "warn",
    command: "bundle",
    bundle,
    externalExportDecision,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["bundle.records", "externalExportDecision"] }
  };
}

async function releaseDiagnostics(_options: CliOptions): Promise<CliDiagnosticsResult> {
  const release = await collectReleaseReadinessEvidence();
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.release",
    status: release.status,
    command: "release",
    release,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["release.packageSurface.buildOutputPath"] }
  };
}

async function verifyDiagnostics(_options: CliOptions): Promise<CliDiagnosticsResult> {
  const release = await collectReleaseReadinessEvidence();
  const verificationSummary = releaseVerificationSummary(release);
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.verify",
    status: verificationSummary.status === "blocked" ? "fail" : verificationSummary.status === "warn" ? "warn" : "pass",
    command: "verify",
    release,
    verificationSummary,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["release", "verificationSummary.missingAcceptanceEvidencePaths"] }
  };
}

async function refreshDiagnostics(options: CliOptions): Promise<CliDiagnosticsResult> {
  const refresh = await refreshAcceptanceEvidence({
    mode: options.diagnosticsInput?.full === true ? "full" : "default",
    dryRun: options.diagnosticsInput?.dryRun === true,
    extraArgs: Array.isArray(options.diagnosticsInput?.extraArgs)
      ? options.diagnosticsInput.extraArgs.filter((item): item is string => typeof item === "string")
      : []
  });
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.refresh",
    status: refresh.status,
    command: "refresh",
    refresh,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["refresh.steps.args", "refresh.steps.outputPath", "refresh.refreshedPaths"] }
  };
}

async function evaluateDiagnostics(options: CliOptions): Promise<CliDiagnosticsResult> {
  const evaluation = await collectCliEvaluation({
    mode: options.diagnosticsInput?.full === true ? "full" : "smoke",
    dryRun: options.diagnosticsInput?.dryRun === true,
    live: options.live === true,
    baselineId: typeof options.diagnosticsInput?.baseline === "string" ? options.diagnosticsInput.baseline : "deepseek-cli",
    compareBaselineIds: Array.isArray(options.diagnosticsInput?.compareBaselines)
      ? options.diagnosticsInput.compareBaselines.filter((item): item is string => typeof item === "string")
      : [],
    allowExternalBaseline: options.diagnosticsInput?.allowExternalBaseline === true,
    ...(typeof options.diagnosticsInput?.baselineCommand === "string" ? { baselineCommand: options.diagnosticsInput.baselineCommand } : {}),
    ...(typeof options.diagnosticsInput?.codexCommand === "string" ? { codexCommand: options.diagnosticsInput.codexCommand } : {}),
    ...(typeof options.diagnosticsInput?.claudeCommand === "string" ? { claudeCommand: options.diagnosticsInput.claudeCommand } : {}),
    ...(typeof options.diagnosticsInput?.executeTask === "string" ? { executeTaskId: options.diagnosticsInput.executeTask } : {}),
    baselineArgs: Array.isArray(options.diagnosticsInput?.baselineArgs)
      ? options.diagnosticsInput.baselineArgs.filter((item): item is string => typeof item === "string")
      : [],
    extraArgs: Array.isArray(options.diagnosticsInput?.extraArgs)
      ? options.diagnosticsInput.extraArgs.filter((item): item is string => typeof item === "string")
      : []
  });
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.evaluate",
    status: evaluation.status,
    command: "evaluate",
    evaluation,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["evaluation.taskRuns.task.promptDigest", "evaluation.evidencePaths"] }
  };
}

async function doctorDiagnostics(options: CliOptions): Promise<CliDiagnosticsResult> {
  const environment = await createCliReadinessEnvironment({ ...options, readinessCommand: "doctor", readinessInput: { live: false } });
  const readiness = await invokeLocalReadinessCommand("doctor", { live: false }, environment);
  const release = await collectReleaseReadinessEvidence();
  const status = readiness.value?.status === "fail" || release.status === "fail" ? "fail" : readiness.value?.status === "warn" || release.status === "warn" ? "warn" : "pass";
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.doctor",
    status,
    command: "doctor",
    ...(readiness.value ? { readiness: readiness.value } : {}),
    release,
    ...(readiness.value?.indexProviders ? { indexProviders: readiness.value.indexProviders } : {}),
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["readiness", "release", "indexProviders.providers.metadata", "indexProviders.providers.activationEvidence.metadata", "indexProviders.providers.diagnostics.details"] }
  };
}

export function releaseVerificationSummary(release: DiagnosticsReleaseReadinessEvidence): ReleaseVerificationSummary {
  const blockingChecks = release.checks.filter((check) => check.status === "fail");
  const warningChecks = release.checks.filter((check) => check.status === "warn");
  const status = blockingChecks.length > 0 ? "blocked" : warningChecks.length > 0 ? "warn" : "ready";
  const nextAction = nextReleaseVerificationAction(release, blockingChecks, warningChecks);
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "release.verification.summary",
    status,
    releaseStatus: release.status,
    blockingChecks,
    warningChecks,
    missingAcceptanceEvidencePaths: release.verification.missingAcceptanceEvidencePaths ?? [],
    requiredCommands: release.verification.requiredCommands,
    nextAction,
    dryRunCommand: release.verification.dryRunCommand,
    publishDryRunReady: status === "ready",
    referencePitFixtureIds: release.verification.referencePitFixtureIds,
    redaction: { class: "internal", fields: ["blockingChecks.metadata", "warningChecks.metadata", "missingAcceptanceEvidencePaths"] }
  };
}

function nextReleaseVerificationAction(
  release: DiagnosticsReleaseReadinessEvidence,
  blockingChecks: readonly ReadinessCheck[],
  warningChecks: readonly ReadinessCheck[]
): string {
  const firstBlockingAction = blockingChecks.flatMap((check) => check.suggestedActions ?? [])[0];
  if (firstBlockingAction) return firstBlockingAction;
  const firstWarningAction = warningChecks.flatMap((check) => check.suggestedActions ?? [])[0];
  if (firstWarningAction) return firstWarningAction;
  return release.verification.dryRunCommand;
}

async function seedDiagnosticRecords(sink: InMemoryObservabilitySink, options: CliOptions): Promise<void> {
  const platform = new NodePlatformRuntime();
  const descriptor = await platform.descriptor();
  const fakeSecret = options.diagnosticsInput?.fakeSecret === true ? "sk-diagnostics-secret-123456" : "[REDACTED:synthetic]";
  await sink.emit({
    kind: "audit",
    at: new Date(0).toISOString(),
    name: "cli.diagnostics.snapshot",
    fields: {
      command: "diagnostics",
      package: await safePackageSummary(),
      platform: { os: descriptor.os, environmentKind: descriptor.environmentKind, degraded: descriptor.degraded },
      env: { DEEPSEEK_API_KEY: fakeSecret },
      authHeader: `Bearer ${fakeSecret}`,
      plugin: { authMaterial: fakeSecret, path: "C:/Users/dev/private/project" },
      mcp: { authMaterial: fakeSecret },
      referencePitFixtureIds: [...diagnosticPitIds]
    },
    dataPrivacyClass: "secret",
    redaction: { class: "secret", fields: ["fields.env", "fields.authHeader", "fields.plugin", "fields.mcp"] }
  });
}

function diagnosticsJsonLines(result: CliDiagnosticsResult): readonly JsonObject[] {
  const entries: JsonObject[] = [{
    schemaVersion: result.schemaVersion,
    kind: result.kind,
    status: result.status,
    command: result.command,
    referencePitFixtureIds: result.referencePitFixtureIds,
    redaction: result.redaction
  }];
  if (result.bundle) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.bundle.summary",
      bundleId: result.bundle.bundleId,
      selectedRecordCount: result.bundle.selectedRecordCount,
      totalRecordCount: result.bundle.totalRecordCount,
      privacyDecision: result.bundle.privacyDecision,
      redactionSummary: result.bundle.redactionSummary,
      redaction: { class: "internal", fields: ["privacyDecision", "redactionSummary"] }
    });
  }
  if (result.externalExportDecision) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.export.decision",
      decision: result.externalExportDecision,
      redaction: { class: "internal", fields: ["decision"] }
    });
  }
  if (result.readiness) {
    for (const check of result.readiness.checks) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.readiness.check",
        check,
        redaction: { class: "internal", fields: ["check.metadata"] }
      });
    }
  }
  if (result.indexProviders) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.index-provider.summary",
      summary: result.indexProviders,
      redaction: result.indexProviders.redaction
    });
    for (const provider of result.indexProviders.providers) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.index-provider.provider",
        provider,
        redaction: provider.redaction
      });
    }
  }
  if (result.release) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.release.summary",
      status: result.release.status,
      packageSurface: result.release.packageSurface,
      verification: result.release.verification,
      supportBundle: result.release.supportBundle,
      redaction: result.release.redaction
    });
    for (const check of result.release.checks) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.release.check",
        check,
        redaction: { class: "internal", fields: ["check.metadata"] }
      });
    }
  }
  if (result.verificationSummary) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.verify.summary",
      summary: result.verificationSummary,
      redaction: result.verificationSummary.redaction
    });
    for (const check of result.verificationSummary.blockingChecks) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.verify.blocker",
        status: "fail",
        check,
        redaction: { class: "internal", fields: ["check.metadata"] }
      });
    }
    for (const check of result.verificationSummary.warningChecks) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.verify.warning",
        status: "warn",
        check,
        redaction: { class: "internal", fields: ["check.metadata"] }
      });
    }
  }
  if (result.refresh) {
    entries.push({
      schemaVersion: result.schemaVersion,
      kind: "diagnostics.refresh.summary",
      summary: result.refresh,
      redaction: result.refresh.redaction
    });
    for (const step of result.refresh.steps) {
      entries.push(refreshStepRecord(step));
    }
    for (const diagnostic of result.refresh.diagnostics) {
      entries.push({
        schemaVersion: result.schemaVersion,
        kind: "diagnostics.refresh.diagnostic",
        diagnostic,
        redaction: diagnostic.redaction
      });
    }
  }
  if (result.evaluation) {
    entries.push(...evaluationJsonLines(result.evaluation));
  }
  return entries;
}

async function safePackageSummary(): Promise<JsonObject> {
  const release = await collectReleaseReadinessEvidence();
  return {
    name: release.packageSurface.packageName,
    version: release.packageSurface.packageVersion
  };
}
