import { join } from "node:path";
import type {
  AcceptanceEvidenceRefreshMode,
  AcceptanceEvidenceRefreshStep,
  AcceptanceEvidenceRefreshSummary,
  JsonObject,
  PlatformRuntime,
  ReadinessCheck
} from "@deepseek/platform-contracts";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { diagnosticPitIds, diagnosticsSchemaVersion } from "./release-evidence.js";

interface RefreshPlanStep {
  readonly id: string;
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly outputPath: string;
  readonly required: boolean;
}

export interface RefreshEvidenceOptions {
  readonly mode: AcceptanceEvidenceRefreshMode;
  readonly dryRun: boolean;
  readonly extraArgs: readonly string[];
  readonly platform?: PlatformRuntime;
}

const defaultRefreshPlan: readonly RefreshPlanStep[] = [
  step("acceptance-index", "Acceptance index", "npm", ["run", "acceptance:index"], "tests/acceptance/latest/acceptance-index.txt"),
  step("typecheck", "Typecheck", "npm", ["run", "typecheck"], "tests/acceptance/latest/typecheck.txt"),
  step("lint", "Lint", "npm", ["run", "lint"], "tests/acceptance/latest/lint.txt"),
  step("dependency-boundaries", "Dependency boundaries", "node", ["scripts/check-boundaries.mjs"], "tests/acceptance/latest/dependency-boundaries.txt"),
  step("build-cli", "CLI build", "npm", ["run", "build:cli"], "tests/acceptance/latest/build-cli.txt"),
  step("smoke-headless", "Headless smoke", "npm", ["run", "smoke:headless"], "tests/acceptance/latest/smoke-headless.txt"),
  step("npm-publish-dry-run", "npm publish dry-run", "npm", ["publish", "--dry-run", "--workspace", "deepseek-agent-cli", "--access", "public"], "tests/acceptance/latest/npm-publish-dry-run.txt"),
  step("release-verify", "Release verify", "npx", ["tsx", "src/apps/cli/src/index.ts", "diagnostics", "verify", "--output", "json"], "tests/acceptance/latest/release-verify.txt"),
  step("release-diagnostics", "Release diagnostics", "npx", ["tsx", "src/apps/cli/src/index.ts", "diagnostics", "release", "--output", "json"], "tests/acceptance/latest/release-diagnostics.txt")
];

const fullRefreshPlan: readonly RefreshPlanStep[] = [
  step("contracts", "Contract tests", "npm", ["run", "test:contracts"], "tests/acceptance/latest/contracts.txt"),
  step("integration", "Integration tests", "npm", ["run", "test:integration"], "tests/acceptance/latest/integration.txt"),
  step("golden-replay", "Golden replay", "npm", ["run", "test:golden"], "tests/acceptance/latest/golden-replay.txt"),
  step("versioning", "Versioning tests", "npm", ["run", "test:versioning"], "tests/acceptance/latest/versioning.txt"),
  step("matrix", "Matrix tests", "npm", ["run", "test:matrix"], "tests/acceptance/latest/matrix.txt"),
  step("e2e", "E2E tests", "npm", ["run", "test:e2e"], "tests/acceptance/latest/smoke-host-adapters.txt")
];

export function refreshPlan(mode: AcceptanceEvidenceRefreshMode): readonly RefreshPlanStep[] {
  return mode === "full" ? [...defaultRefreshPlan, ...fullRefreshPlan] : defaultRefreshPlan;
}

export async function refreshAcceptanceEvidence(options: RefreshEvidenceOptions): Promise<AcceptanceEvidenceRefreshSummary> {
  if (options.extraArgs.length > 0) return invalidRefreshSummary(options);
  const platform = options.platform ?? new NodePlatformRuntime();
  const steps: AcceptanceEvidenceRefreshStep[] = [];
  for (const planStep of refreshPlan(options.mode)) {
    steps.push(options.dryRun ? dryRunStep(planStep) : await executeStep(platform, planStep));
  }
  return buildSummary(options, steps, []);
}

function invalidRefreshSummary(options: RefreshEvidenceOptions): AcceptanceEvidenceRefreshSummary {
  const diagnostic = check(
    "diagnostics.refresh.invalid-args",
    "Invalid refresh arguments",
    "fail",
    `diagnostics refresh received ${options.extraArgs.length} unsupported argument(s).`,
    ["Use --full to run the extended allowlisted plan, or --dry-run to inspect the plan."]
  );
  return buildSummary(options, [], [diagnostic]);
}

async function executeStep(platform: PlatformRuntime, planStep: RefreshPlanStep): Promise<AcceptanceEvidenceRefreshStep> {
  const started = Date.now();
  const result = await platform.runProcess(executableCommand(platform, planStep.command), planStep.args, { cwd: process.cwd() });
  const durationMs = Date.now() - started;
  const output = evidenceOutput(planStep, result.exitCode, durationMs, result.stdout, result.stderr);
  const writeResult = await platform.atomicWriteFile(join(process.cwd(), planStep.outputPath), output);
  const status = result.exitCode === 0 && writeResult.ok ? "pass" : "fail";
  return {
    id: planStep.id,
    label: planStep.label,
    command: planStep.command,
    args: planStep.args,
    outputPath: planStep.outputPath,
    required: planStep.required,
    exitCode: result.exitCode,
    durationMs,
    status,
    redaction: { class: "internal", fields: ["args", "outputPath"] }
  };
}

function dryRunStep(planStep: RefreshPlanStep): AcceptanceEvidenceRefreshStep {
  return {
    id: planStep.id,
    label: planStep.label,
    command: planStep.command,
    args: planStep.args,
    outputPath: planStep.outputPath,
    required: planStep.required,
    status: "pass",
    redaction: { class: "internal", fields: ["args", "outputPath"] }
  };
}

function buildSummary(
  options: RefreshEvidenceOptions,
  steps: readonly AcceptanceEvidenceRefreshStep[],
  diagnostics: readonly ReadinessCheck[]
): AcceptanceEvidenceRefreshSummary {
  const failedStepIds = steps.filter((item) => item.status === "fail").map((item) => item.id);
  const status = diagnostics.some((item) => item.status === "fail") || failedStepIds.length > 0 ? "fail" : diagnostics.some((item) => item.status === "warn") ? "warn" : "pass";
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "acceptance.evidence.refresh.summary",
    mode: options.mode,
    dryRun: options.dryRun,
    status,
    steps,
    refreshedPaths: steps.filter((item) => !options.dryRun && item.status === "pass").map((item) => item.outputPath),
    failedStepIds,
    diagnostics,
    nextAction: status === "pass" ? "Run deepseek diagnostics verify --output json." : "Fix failed refresh steps, then rerun deepseek diagnostics refresh.",
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["steps.args", "steps.outputPath", "refreshedPaths", "diagnostics.metadata"] }
  };
}

function evidenceOutput(planStep: RefreshPlanStep, exitCode: number, durationMs: number, stdout: string, stderr: string): string {
  return [
    `# ${planStep.label}`,
    "",
    `Command: ${planStep.command} ${planStep.args.join(" ")}`,
    `Exit Code: ${exitCode}`,
    `Duration Ms: ${durationMs}`,
    "",
    "## stdout",
    stdout.trimEnd(),
    "",
    "## stderr",
    stderr.trimEnd(),
    ""
  ].join("\n");
}

function step(id: string, label: string, command: string, args: readonly string[], outputPath: string): RefreshPlanStep {
  return { id, label, command, args, outputPath, required: true };
}

function executableCommand(platform: PlatformRuntime, command: string): string {
  if (platform.os === "windows" && (command === "npm" || command === "npx")) return `${command}.cmd`;
  return command;
}

function check(id: string, label: string, status: ReadinessCheck["status"], message: string, suggestedActions: readonly string[]): ReadinessCheck {
  return {
    id,
    label,
    status,
    message,
    suggestedActions,
    metadata: {},
    redaction: { class: "internal", fields: ["metadata"] }
  };
}

export function refreshStepRecord(stepRecord: AcceptanceEvidenceRefreshStep): JsonObject {
  return {
    schemaVersion: diagnosticsSchemaVersion,
    kind: "diagnostics.refresh.step",
    step: stepRecord,
    redaction: stepRecord.redaction
  };
}
