import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  InMemoryCommandSystem,
  readinessCommandNames,
  readinessManifest,
  registerLocalReadinessCommands,
  runLocalReadinessCommand
} from "@deepseek/command-system";
import { createDefaultIndexProviderDiagnostics, createDefaultIndexProviderManifest, resolveIndexProviderDiagnostics } from "@deepseek/index-provider";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import type { ReadinessCommandResult } from "@deepseek/platform-contracts";
import { collectReleaseReadinessEvidence } from "../../src/apps/cli/src/diagnostics/release-evidence.js";
import { releaseVerificationSummary } from "../../src/apps/cli/src/diagnostics/index.js";

const fakeSecret = "sk-live-secret-value";

function fakeEnv(): LocalReadinessEnvironment {
  return {
    cwd: "D:/work/deepseek",
    nodeVersion: "v22.0.0",
    platform: "win32",
    packageName: "deepseek-cli-platform",
    packageVersion: "0.1.0",
    env: { DEEPSEEK_API_KEY: fakeSecret },
    ignoredPaths: [".env", ".env.*", "参考/"],
    availableCommands: ["node", "npm", "git", "rg"],
    config: { model: "deepseek-v4-flash" },
    indexProviderDiagnostics: createDefaultIndexProviderDiagnostics(),
    initialized: true
  };
}

function assertNoSecret(value: unknown): void {
  assert.equal(JSON.stringify(value).includes(fakeSecret), false);
}

describe("local readiness contracts", () => {
  it("defines stable manifests for every readiness command", () => {
    const manifests = readinessCommandNames.map(readinessManifest);

    assert.deepEqual(manifests.map((manifest) => manifest.name), ["init", "config", "auth", "doctor", "privacy", "verify-install"]);
    assert.equal(manifests.every((manifest) => manifest.id.startsWith("readiness.")), true);
    assert.equal(manifests.every((manifest) => manifest.inputSchema.type === "object"), true);
  });

  it("runs every readiness command through the command registry", async () => {
    const commandSystem = new InMemoryCommandSystem();
    await registerLocalReadinessCommands(commandSystem, fakeEnv());

    for (const command of readinessCommandNames) {
      const result = await commandSystem.invoke(command, {});
      assert.equal(result.ok, true);
      const value = result.value as ReadinessCommandResult;
      assert.equal(value.command, command);
      assert.equal(Array.isArray(value.checks), true);
      assertNoSecret(value);
    }
  });

  it("reports credential references without raw secret fields", async () => {
    const result = await runLocalReadinessCommand("auth", {}, fakeEnv());

    assert.equal(result.credential?.available, true);
    assert.equal(result.credential?.source, "process-env");
    assert.equal(result.credential?.redaction.class, "secret");
    assertNoSecret(result);
  });

  it("includes release and support bundle evidence when provided by the CLI host", async () => {
    const release = await collectReleaseReadinessEvidence();
    const environment: LocalReadinessEnvironment = {
      ...fakeEnv(),
      releasePackageSurface: release.packageSurface,
      releaseVerification: release.verification,
      supportBundlePolicy: release.supportBundle
    };
    const result = await runLocalReadinessCommand("verify-install", {}, environment);

    assert.equal(result.checks.some((check) => check.id === "release.package"), true);
    assert.equal(result.checks.some((check) => check.id === "release.verification"), true);
    assert.equal(result.metadata.release && typeof result.metadata.release === "object", true);
    assert.equal(release.verification.acceptanceEvidencePaths.includes("tests/acceptance/acceptance-index.md"), true);
    assert.equal(JSON.stringify(result).includes("npm publish --dry-run"), true);
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
  });

  it("derives release readiness from concrete local evidence gates", async () => {
    await withTempRepo(async () => {
      const missingBuild = await collectReleaseReadinessEvidence();
      const blockedSummary = releaseVerificationSummary(missingBuild);
      assert.equal(missingBuild.status, "fail");
      assert.equal(missingBuild.packageSurface.buildOutputExists, false);
      assert.equal(missingBuild.checks.find((check) => check.id === "release.build-output")?.status, "fail");
      assert.equal(missingBuild.verification.missingAcceptanceEvidencePaths?.length, 0);
      assert.equal(blockedSummary.status, "blocked");
      assert.equal(blockedSummary.publishDryRunReady, false);
      assert.equal(blockedSummary.blockingChecks.some((check) => check.id === "release.build-output"), true);

      await writeFile("src/apps/cli/dist/index.js", "#!/usr/bin/env node\n", "utf8");
      const ready = await collectReleaseReadinessEvidence();
      const readySummary = releaseVerificationSummary(ready);
      assert.equal(ready.status, "pass");
      assert.equal(ready.packageSurface.buildOutputExists, true);
      assert.equal(ready.checks.find((check) => check.id === "release.package-surface")?.status, "pass");
      assert.equal(readySummary.status, "ready");
      assert.equal(readySummary.publishDryRunReady, true);
      assert.equal(readySummary.nextAction, "npm publish --dry-run --workspace deepseek-agent-cli --access public");
      assert.equal(JSON.stringify(ready).includes(fakeSecret), false);
    });
  });

  it("warns on missing historical acceptance evidence without marking package metadata failed", async () => {
    await withTempRepo(async () => {
      await rm("tests/acceptance/latest/typecheck.txt", { force: true });
      await writeFile("src/apps/cli/dist/index.js", "#!/usr/bin/env node\n", "utf8");

      const release = await collectReleaseReadinessEvidence();
      const summary = releaseVerificationSummary(release);

      assert.equal(release.status, "warn");
      assert.equal(release.verification.missingAcceptanceEvidencePaths?.includes("tests/acceptance/latest/typecheck.txt"), true);
      assert.equal(release.checks.find((check) => check.id === "release.package")?.status, "pass");
      assert.equal(release.checks.find((check) => check.id === "release.acceptance")?.status, "warn");
      assert.equal(summary.status, "warn");
      assert.equal(summary.warningChecks.some((check) => check.id === "release.acceptance"), true);
      assert.equal(summary.missingAcceptanceEvidencePaths.includes("tests/acceptance/latest/typecheck.txt"), true);
    });
  });

  it("surfaces index provider diagnostics in doctor without raw provider material", async () => {
    const result = await runLocalReadinessCommand("doctor", { live: false }, fakeEnv());

    assert.equal(result.indexProviders?.enabledProviderIds.includes("pageindex"), true);
    assert.equal(result.indexProviders?.deferredProviderIds.includes("zvec"), true);
    assert.equal(result.checks.some((check) => check.id === "index-provider.pageindex" && check.status === "pass"), true);
    assert.equal(result.checks.some((check) => check.id === "index-provider.zvec" && check.status === "warn"), true);
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
  });

  it("reports configured provider manifest downgrades in doctor metadata", async () => {
    const environment: LocalReadinessEnvironment = {
      ...fakeEnv(),
      indexProviderDiagnostics: resolveIndexProviderDiagnostics({
        ...createDefaultIndexProviderManifest(),
        source: {
          scope: "workspace",
          sourceId: "config.indexProviders",
          redaction: { class: "internal", fields: ["sourceId"] }
        },
        providers: [{
          providerId: "zvec",
          kind: "zvec",
          status: "enabled",
          implementationStatus: "missing",
          metadata: { configured: true },
          redaction: { class: "internal", fields: ["metadata"] }
        }]
      })
    };
    const result = await runLocalReadinessCommand("doctor", { live: false }, environment);
    const zvec = result.indexProviders?.providers.find((provider) => provider.providerId === "zvec");
    const zvecCheck = result.checks.find((check) => check.id === "index-provider.zvec");

    assert.equal(result.indexProviders?.source.scope, "workspace");
    assert.equal(zvec?.status, "deferred");
    assert.equal(zvec?.requestedStatus, "enabled");
    assert.equal(zvec?.implementationStatus, "missing");
    assert.equal(zvecCheck?.metadata?.requestedStatus, "enabled");
    assert.equal(result.indexProviders?.diagnostics.some((diagnostic) => diagnostic.code === "INDEX_PROVIDER_UNSUPPORTED_ENABLED"), true);
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
  });

  it("reports missing activation evidence in doctor metadata", async () => {
    const environment: LocalReadinessEnvironment = {
      ...fakeEnv(),
      indexProviderDiagnostics: resolveIndexProviderDiagnostics({
        ...createDefaultIndexProviderManifest(),
        source: {
          scope: "workspace",
          sourceId: "config.indexProviders",
          redaction: { class: "internal", fields: ["sourceId"] }
        },
        providers: [{
          providerId: "zvec",
          kind: "zvec",
          status: "enabled",
          implementationStatus: "available",
          metadata: { configured: true },
          redaction: { class: "internal", fields: ["metadata"] }
        }]
      })
    };
    const result = await runLocalReadinessCommand("doctor", { live: false }, environment);
    const indexProviderMetadata = result.metadata.indexProviders;
    const providerMetadataRecords = isRecord(indexProviderMetadata) && Array.isArray(indexProviderMetadata.providers) ? indexProviderMetadata.providers.filter(isRecord) : [];
    const zvecMetadata = providerMetadataRecords.find((provider) => provider.providerId === "zvec");
    const zvecCheck = result.checks.find((check) => check.id === "index-provider.zvec");
    const diagnosticCodes = Array.isArray(zvecCheck?.metadata?.diagnosticCodes) ? zvecCheck.metadata.diagnosticCodes : [];
    const activationEvidence = Array.isArray(zvecMetadata?.activationEvidence) ? zvecMetadata.activationEvidence.filter(isRecord) : [];

    assert.equal(zvecCheck?.status, "warn");
    assert.equal(zvecCheck?.metadata?.requestedStatus, "enabled");
    assert.equal(zvecCheck?.metadata?.implementationStatus, "available");
    assert.equal(diagnosticCodes.includes("INDEX_PROVIDER_ACTIVATION_EVIDENCE_MISSING"), true);
    assert.equal(activationEvidence.every((evidence) => evidence.status === "missing"), true);
    assert.equal(result.indexProviders?.diagnostics.some((diagnostic) => diagnostic.code === "INDEX_PROVIDER_ACTIVATION_EVIDENCE_MISSING"), true);
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
  });
});

function isRecord(value: unknown): value is { readonly [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function withTempRepo(run: () => Promise<void>): Promise<void> {
  const previousCwd = process.cwd();
  const cwd = await mkdtemp(join(tmpdir(), "deepseek-release-evidence-"));
  try {
    process.chdir(cwd);
    await mkdir("src/apps/cli", { recursive: true });
    await mkdir("src/apps/cli/dist", { recursive: true });
    await mkdir("tests/acceptance/latest", { recursive: true });
    await writeFile("src/apps/cli/package.json", JSON.stringify({
      name: "deepseek-agent-cli",
      version: "0.1.3",
      type: "module",
      exports: { ".": "./dist/index.js" },
      files: ["dist", "README.md"],
      bin: { deepseek: "dist/index.js" },
      publishConfig: { access: "public" }
    }), "utf8");
    await writeFile("tests/acceptance/acceptance-index.md", "# Acceptance Evidence Index\n", "utf8");
    for (const file of [
      "openspec-validation.txt",
      "typecheck.txt",
      "lint.txt",
      "test-summary.txt",
      "dependency-boundaries.txt",
      "build-cli.txt",
      "release-verify.txt",
      "smoke-headless.txt",
      "reference-hygiene.txt"
    ]) {
      await writeFile(join("tests/acceptance/latest", file), "ok\n", "utf8");
    }
    await run();
  } finally {
    process.chdir(previousCwd);
    await rm(cwd, { recursive: true, force: true });
  }
}
