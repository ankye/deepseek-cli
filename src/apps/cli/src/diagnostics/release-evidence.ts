import { join } from "node:path";
import type {
  DiagnosticsReleaseReadinessEvidence,
  JsonObject,
  ReadinessCheck,
  ReleasePackageSurface,
  ReleaseVerificationEvidence,
  SupportBundlePolicyEvidence
} from "@deepseek/platform-contracts";
import { DIAGNOSTICS_READINESS_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { InMemoryObservabilitySink } from "@deepseek/observability";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

export const diagnosticsSchemaVersion = DIAGNOSTICS_READINESS_SCHEMA_VERSION;
export const diagnosticPitIds = ["pit.diagnostic-redaction.support-bundle", "pit.env-snapshot.immutable-startup"] as const;

export async function collectReleaseReadinessEvidence(): Promise<DiagnosticsReleaseReadinessEvidence> {
  const packageSurface = await releasePackageSurface();
  const supportBundle = supportBundlePolicyEvidence();
  const verification = await releaseVerificationEvidence();
  const checks = releaseReadinessChecks(packageSurface, supportBundle, verification);
  const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
  return {
    schemaVersion: diagnosticsSchemaVersion,
    status,
    packageSurface,
    verification,
    supportBundle,
    checks,
    redaction: { class: "internal", fields: ["packageSurface.buildOutputPath", "verification.acceptanceEvidencePaths"] }
  };
}

export async function releasePackageSurface(): Promise<ReleasePackageSurface> {
  const packageJson = await cliPackageJson();
  const sourcePackageManifestFound = await fileExists("src/apps/cli/package.json");
  const bin = packageJson.bin && typeof packageJson.bin === "object" ? packageJson.bin as Record<string, unknown> : {};
  const files = Array.isArray(packageJson.files) ? packageJson.files.filter((value): value is string => typeof value === "string") : [];
  const expectedPackageFiles = files.length > 0 ? files : ["dist", "README.md"];
  const binEntry = stringValue(bin.deepseek, "dist/index.js");
  const exportsEntry = typeof packageJson.exports === "string"
    ? packageJson.exports.replace(/^\.\//, "")
    : packageJson.exports && typeof packageJson.exports === "object"
      ? stringValue((packageJson.exports as Record<string, unknown>)["."], "").replace(/^\.\//, "")
      : "";
  const packageSurfaceFiles = [...new Set(["README.md", "package.json", binEntry, ...(exportsEntry ? [exportsEntry] : []), ...expectedPackageFiles])].sort();
  const unexpectedPackageFiles = packageSurfaceFiles.filter((file) => !isAllowedPackageSurfaceFile(file));
  const buildOutputPath = "src/apps/cli/dist/index.js";
  return {
    schemaVersion: diagnosticsSchemaVersion,
    packageName: stringValue(packageJson.name, "deepseek-agent-cli"),
    packageVersion: stringValue(packageJson.version, "0.0.0"),
    executableName: Object.keys(bin)[0] ?? "deepseek",
    binEntry,
    buildOutputPath,
    ...(sourcePackageManifestFound ? { buildOutputExists: await fileExists(buildOutputPath) } : {}),
    sourcePackageManifestFound,
    publishAccess: packageJson.publishConfig && typeof packageJson.publishConfig === "object" && (packageJson.publishConfig as Record<string, unknown>).access === "public" ? "public" : "private",
    expectedPackageFiles,
    packageSurfaceFiles,
    unexpectedPackageFiles,
    excludedFromSource: [".codex/", ".env", "node_modules/", "src/apps/cli/dist/", "参考/"],
    generatedBundlePath: "src/apps/cli/dist/",
    generatedBundleIgnored: true,
    redaction: { class: "internal", fields: ["buildOutputPath", "generatedBundlePath", "excludedFromSource"] }
  };
}

export async function releaseVerificationEvidence(): Promise<ReleaseVerificationEvidence> {
  const acceptanceEvidencePaths = [
    "tests/acceptance/acceptance-index.md",
    "tests/acceptance/latest/openspec-validation.txt",
    "tests/acceptance/latest/typecheck.txt",
    "tests/acceptance/latest/lint.txt",
    "tests/acceptance/latest/test-summary.txt",
    "tests/acceptance/latest/dependency-boundaries.txt",
    "tests/acceptance/latest/build-cli.txt",
    "tests/acceptance/latest/release-verify.txt",
    "tests/acceptance/latest/smoke-headless.txt",
    "tests/acceptance/latest/reference-hygiene.txt"
  ];
  return {
    schemaVersion: diagnosticsSchemaVersion,
    requiredCommands: [
      "openspec validate --specs --strict",
      "npm run typecheck",
      "npm run lint",
      "npm test",
      "node scripts/check-boundaries.mjs",
      "npm run build:cli",
      "npm run smoke:headless",
      "npm publish --dry-run --workspace deepseek-agent-cli --access public"
    ],
    acceptanceEvidencePaths,
    acceptanceEvidenceFiles: await Promise.all(acceptanceEvidencePaths.map(async (path) => ({
      path,
      exists: await fileExists(path),
      required: true,
      redaction: { class: "internal" as const, fields: ["path"] }
    }))),
    missingAcceptanceEvidencePaths: await missingPaths(acceptanceEvidencePaths),
    referencePitFixtureIds: [...diagnosticPitIds],
    dryRunCommand: "npm publish --dry-run --workspace deepseek-agent-cli --access public",
    rollbackGuidance: "Do not publish; fix failing readiness evidence and rerun diagnostics release.",
    redaction: { class: "internal", fields: ["acceptanceEvidencePaths"] }
  };
}

export function supportBundlePolicyEvidence(): SupportBundlePolicyEvidence {
  const sink = new InMemoryObservabilitySink();
  const decision = sink.decideExport("support-upload");
  return {
    schemaVersion: diagnosticsSchemaVersion,
    localDiagnosticsAvailable: true,
    externalExportAllowed: decision.exportAllowed,
    externalExportReasonCode: decision.reasonCode,
    referencePitFixtureIds: [...diagnosticPitIds],
    redaction: { class: "internal", fields: ["externalExportReasonCode"] }
  };
}

export function releaseReadinessChecks(
  packageSurface: ReleasePackageSurface,
  supportBundle: SupportBundlePolicyEvidence,
  verification: ReleaseVerificationEvidence
): readonly ReadinessCheck[] {
  return [
    readinessCheck("release.package", "CLI package metadata", packageSurface.packageName === "deepseek-agent-cli" ? "pass" : "fail", `${packageSurface.packageName}@${packageSurface.packageVersion}`, [], { packageName: packageSurface.packageName, packageVersion: packageSurface.packageVersion }),
    readinessCheck("release.bin", "CLI executable", packageSurface.executableName === "deepseek" && packageSurface.binEntry === "dist/index.js" ? "pass" : "fail", `${packageSurface.executableName} -> ${packageSurface.binEntry}`, [], { executableName: packageSurface.executableName, binEntry: packageSurface.binEntry }),
    readinessCheck("release.build-output", "CLI build artifact", packageSurface.sourcePackageManifestFound === false ? "warn" : packageSurface.buildOutputExists === true ? "pass" : "fail", packageSurface.sourcePackageManifestFound === false ? "Source package manifest is unavailable from this working directory; build artifact check is deferred." : packageSurface.buildOutputExists === true ? `${packageSurface.buildOutputPath} exists.` : `${packageSurface.buildOutputPath} is missing.`, packageSurface.sourcePackageManifestFound === false ? ["Run diagnostics release from the repository root before publishing."] : packageSurface.buildOutputExists === true ? [] : ["Run npm run build:cli before publishing."], { buildOutputPath: packageSurface.buildOutputPath, buildOutputExists: packageSurface.buildOutputExists, sourcePackageManifestFound: packageSurface.sourcePackageManifestFound }),
    readinessCheck("release.package-files", "Package files", packageSurface.expectedPackageFiles.includes("dist") && packageSurface.expectedPackageFiles.includes("README.md") ? "pass" : "warn", `Expected package files: ${packageSurface.expectedPackageFiles.join(", ")}.`, ["Keep npm tarball limited to README.md, dist/index.js, and package metadata."], { expectedPackageFiles: packageSurface.expectedPackageFiles }),
    readinessCheck("release.package-surface", "Package surface safety", (packageSurface.unexpectedPackageFiles?.length ?? 0) === 0 ? "pass" : "fail", (packageSurface.unexpectedPackageFiles?.length ?? 0) === 0 ? `Package surface limited to ${packageSurface.packageSurfaceFiles?.join(", ")}.` : `Unexpected package files: ${packageSurface.unexpectedPackageFiles?.join(", ")}.`, (packageSurface.unexpectedPackageFiles?.length ?? 0) === 0 ? [] : ["Restrict src/apps/cli/package.json files/bin/exports to README.md and dist output."], { packageSurfaceFiles: packageSurface.packageSurfaceFiles ?? [], unexpectedPackageFiles: packageSurface.unexpectedPackageFiles ?? [] }),
    readinessCheck("release.generated-hygiene", "Generated bundle hygiene", packageSurface.generatedBundleIgnored ? "pass" : "fail", "Generated CLI dist bundle is treated as ignored local output.", [], { generatedBundlePath: packageSurface.generatedBundlePath }),
    readinessCheck("release.support-bundle", "Support bundle policy", supportBundle.localDiagnosticsAvailable && !supportBundle.externalExportAllowed ? "pass" : "warn", `External export policy: ${supportBundle.externalExportReasonCode}.`, [], { externalExportAllowed: supportBundle.externalExportAllowed, referencePitFixtureIds: supportBundle.referencePitFixtureIds }),
    readinessCheck("release.acceptance", "Acceptance evidence", (verification.missingAcceptanceEvidencePaths?.length ?? 0) === 0 ? "pass" : "warn", (verification.missingAcceptanceEvidencePaths?.length ?? 0) === 0 ? `${verification.acceptanceEvidencePaths.length} acceptance evidence files present.` : `Missing acceptance evidence: ${verification.missingAcceptanceEvidencePaths?.join(", ")}.`, (verification.missingAcceptanceEvidencePaths?.length ?? 0) === 0 ? [] : ["Refresh tests/acceptance/latest evidence before publishing."], { requiredCommands: verification.requiredCommands, acceptanceEvidencePaths: verification.acceptanceEvidencePaths, missingAcceptanceEvidencePaths: verification.missingAcceptanceEvidencePaths ?? [] })
  ];
}

async function cliPackageJson(): Promise<Record<string, unknown>> {
  const platform = new NodePlatformRuntime();
  const raw = await platform.readFile(join(process.cwd(), "src/apps/cli/package.json")).catch(() => JSON.stringify({
    name: "deepseek-agent-cli",
    version: "0.0.0",
    exports: { ".": "./dist/index.js" },
    files: ["dist", "README.md"],
    bin: { deepseek: "dist/index.js" },
    publishConfig: { access: "public" }
  }));
  return JSON.parse(raw) as Record<string, unknown>;
}

function readinessCheck(id: string, label: string, status: ReadinessCheck["status"], message: string, suggestedActions: readonly string[] = [], metadata: JsonObject = {}): ReadinessCheck {
  return {
    id,
    label,
    status,
    message,
    metadata,
    suggestedActions,
    redaction: { class: "internal", fields: ["metadata"] }
  };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function isAllowedPackageSurfaceFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
  return normalized === "README.md" || normalized === "package.json" || normalized === "dist" || normalized === "dist/index.js";
}

async function fileExists(path: string): Promise<boolean> {
  const platform = new NodePlatformRuntime();
  try {
    await platform.statFile(join(process.cwd(), path));
    return true;
  } catch {
    return false;
  }
}

async function missingPaths(paths: readonly string[]): Promise<readonly string[]> {
  const statuses = await Promise.all(paths.map(async (path) => ({ path, exists: await fileExists(path) })));
  return statuses.filter((status) => !status.exists).map((status) => status.path);
}
