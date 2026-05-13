import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../../src/apps/cli/src/index.js";

const commands = ["init", "config", "auth", "doctor", "privacy", "verify-install"] as const;

async function capture(args: readonly string[]): Promise<readonly string[]> {
  const lines: string[] = [];
  const previousCwd = process.cwd();
  const cwd = await mkdtemp(join(tmpdir(), "deepseek-cli-e2e-"));
  try {
    process.chdir(cwd);
    await runCli(args, (line: string) => {
      lines.push(line);
    });
    return lines;
  } finally {
    process.chdir(previousCwd);
    await rm(cwd, { recursive: true, force: true });
  }
}

describe("local readiness CLI", () => {
  for (const command of commands) {
    it(`renders ${command} as text`, async () => {
      const lines = await capture([command]);

      assert.equal(lines.length > 0, true);
      assert.equal(lines[0]?.startsWith(`${command}:`), true);
      assert.equal(JSON.stringify(lines).includes("sk-live-secret-value"), false);
    });

    it(`renders ${command} as JSON`, async () => {
      const lines = await capture([command, "--output", "json"]);
      const parsed = JSON.parse(lines[0] ?? "{}") as { command?: string; checks?: unknown[] };

      assert.equal(parsed.command, command);
      assert.equal(Array.isArray(parsed.checks), true);
      assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
    });
  }

  it("sets config values with redacted structured output", async () => {
    const lines = await capture(["config", "set", "model", "deepseek-v4-flash", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as { command?: string; metadata?: { resolvedConfig?: { values?: readonly { key?: string; value?: unknown }[] } } };

    assert.equal(parsed.command, "config");
    assert.equal(parsed.metadata?.resolvedConfig?.values?.some((value) => value.key === "model" && value.value === "deepseek-v4-flash"), true);
  });

  it("initializes workspace metadata with non-secret defaults", async () => {
    const lines: string[] = [];
    const previousCwd = process.cwd();
    const cwd = await mkdtemp(join(tmpdir(), "deepseek-cli-e2e-"));
    try {
      process.chdir(cwd);
      await runCli(["init", "--output", "json"], (line: string) => {
        lines.push(line);
      });
      const parsed = JSON.parse(lines[0] ?? "{}") as { command?: string; metadata?: { initialized?: boolean; initializedThisRun?: boolean; workspaceMetadataPath?: string } };
      const configPath = join(cwd, ".deepseek", "config.json");
      const document = JSON.parse(await readFile(configPath, "utf8")) as { values?: Record<string, unknown> };

      assert.equal(parsed.command, "init");
      assert.equal(parsed.metadata?.initialized, false);
      assert.equal(parsed.metadata?.initializedThisRun, true);
      assert.equal(parsed.metadata?.workspaceMetadataPath, configPath);
      assert.equal(document.values?.model, "deepseek-v4-flash");
      assert.equal(document.values?.telemetry, "disabled");
      assert.equal(JSON.stringify(document).includes("sk-live-secret-value"), false);
    } finally {
      process.chdir(previousCwd);
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it("runs fake live doctor without network and returns structural evidence", async () => {
    const lines = await capture(["doctor", "--fake-live", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as { command?: string; live?: { ok?: boolean; eventKinds?: string[] } };

    assert.equal(parsed.command, "doctor");
    assert.equal(parsed.live?.ok, true);
    assert.equal(parsed.live?.eventKinds?.includes("delta"), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("reports platform provider diagnostics while doctor stays offline", async () => {
    const lines = await capture(["doctor", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      command?: string;
      checks?: readonly { id?: string; metadata?: Record<string, unknown> }[];
      metadata?: { liveRequested?: boolean };
    };

    assert.equal(parsed.command, "doctor");
    assert.equal(parsed.metadata?.liveRequested, false);
    assert.equal(parsed.checks?.some((check) => check.id === "platform.descriptor"), true);
    assert.equal(parsed.checks?.some((check) => check.id === "platform.search" && typeof check.metadata?.provider === "string"), true);
    assert.equal(parsed.checks?.some((check) => check.id === "doctor.live"), true);
  });

  it("renders index provider status and set downgrade evidence locally", async () => {
    const statusLines = await capture(["index-provider", "status", "--output", "json"]);
    const status = JSON.parse(statusLines[0] ?? "{}") as {
      kind?: string;
      summary?: { enabledProviderIds?: string[]; providers?: readonly { providerId?: string; status?: string; implementationStatus?: string }[] };
    };

    assert.equal(status.kind, "index-provider.status");
    assert.equal(status.summary?.enabledProviderIds?.includes("pageindex"), true);
    assert.equal(status.summary?.providers?.some((provider) => provider.providerId === "zvec" && provider.status === "deferred"), true);

    const setLines = await capture(["index-provider", "set", "zvec", "enabled", "--output", "json"]);
    const set = JSON.parse(setLines[0] ?? "{}") as {
      kind?: string;
      written?: boolean;
      summary?: { providers?: readonly { providerId?: string; status?: string; requestedStatus?: string; implementationStatus?: string }[]; diagnostics?: readonly { code?: string }[] };
    };
    const zvec = set.summary?.providers?.find((provider) => provider.providerId === "zvec");

    assert.equal(set.kind, "index-provider.set");
    assert.equal(set.written, true);
    assert.equal(zvec?.requestedStatus, "enabled");
    assert.equal(zvec?.status, "deferred");
    assert.equal(zvec?.implementationStatus, "missing");
    assert.equal(set.summary?.diagnostics?.some((diagnostic) => diagnostic.code === "INDEX_PROVIDER_UNSUPPORTED_ENABLED"), true);
    assert.equal([...statusLines, ...setLines].join("\n").includes("sk-live-secret-value"), false);
  });

  it("renders index provider activation evidence in text output", async () => {
    const statusLines = await capture(["index-provider", "status"]);
    const doctorLines = await capture(["diagnostics", "doctor"]);
    const text = [...statusLines, ...doctorLines].join("\n");

    assert.equal(text.includes("evidence=implementation-module:missing, embedding-provider:missing, vector-store:missing"), true);
    assert.equal(text.includes("missing-evidence=implementation-module, embedding-provider, vector-store"), true);
    assert.equal(text.includes("\u001b["), false);
  });

  it("renders diagnostics release readiness as JSON", async () => {
    const lines = await capture(["diagnostics", "release", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      kind?: string;
      release?: {
        packageSurface?: { packageName?: string; executableName?: string; generatedBundleIgnored?: boolean; unexpectedPackageFiles?: string[] };
        verification?: { acceptanceEvidencePaths?: string[]; missingAcceptanceEvidencePaths?: string[] };
        supportBundle?: { externalExportAllowed?: boolean; referencePitFixtureIds?: string[] };
        checks?: readonly { id?: string }[];
      };
    };

    assert.equal(parsed.kind, "diagnostics.release");
    assert.equal(parsed.release?.packageSurface?.packageName, "deepseek-agent-cli");
    assert.equal(parsed.release?.packageSurface?.executableName, "deepseek");
    assert.equal(parsed.release?.packageSurface?.generatedBundleIgnored, true);
    assert.deepEqual(parsed.release?.packageSurface?.unexpectedPackageFiles, []);
    assert.equal(parsed.release?.verification?.acceptanceEvidencePaths?.includes("tests/acceptance/acceptance-index.md"), true);
    assert.equal(parsed.release?.supportBundle?.externalExportAllowed, false);
    assert.equal(parsed.release?.supportBundle?.referencePitFixtureIds?.includes("pit.diagnostic-redaction.support-bundle"), true);
    assert.equal(parsed.release?.checks?.some((check) => check.id === "release.package-surface"), true);
  });

  it("renders diagnostics release acceptance evidence in text output", async () => {
    const lines = await capture(["diagnostics", "release"]);
    const text = lines.join("\n");

    assert.equal(text.includes("- evidence: tests/acceptance/acceptance-index.md"), true);
    assert.equal(text.includes("tests/acceptance/latest/openspec-validation.txt"), true);
    assert.equal(text.includes("- build artifact:"), true);
    assert.equal(text.includes("- package surface: safe"), true);
    assert.equal(text.includes("\u001b["), false);
  });

  it("renders diagnostics verify as a local pre-publish decision", async () => {
    const lines = await capture(["diagnostics", "verify", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      kind?: string;
      status?: string;
      release?: { checks?: readonly { id?: string }[] };
      verificationSummary?: { status?: string; nextAction?: string; publishDryRunReady?: boolean; requiredCommands?: readonly string[] };
    };

    assert.equal(parsed.kind, "diagnostics.verify");
    assert.equal(parsed.status === "warn" || parsed.status === "fail" || parsed.status === "pass", true);
    assert.equal(parsed.release?.checks?.some((check) => check.id === "release.build-output"), true);
    assert.equal(typeof parsed.verificationSummary?.nextAction, "string");
    assert.equal(Array.isArray(parsed.verificationSummary?.requiredCommands), true);
    assert.equal(parsed.verificationSummary?.requiredCommands?.some((command) => command.includes("npm publish --dry-run")), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("renders diagnostics refresh dry-run as a local evidence plan", async () => {
    const lines = await capture(["diagnostics", "refresh", "--dry-run", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      kind?: string;
      status?: string;
      refresh?: {
        mode?: string;
        dryRun?: boolean;
        steps?: readonly { id?: string; outputPath?: string; exitCode?: number }[];
        refreshedPaths?: readonly string[];
      };
    };

    assert.equal(parsed.kind, "diagnostics.refresh");
    assert.equal(parsed.status, "pass");
    assert.equal(parsed.refresh?.mode, "default");
    assert.equal(parsed.refresh?.dryRun, true);
    assert.equal(parsed.refresh?.steps?.some((step) => step.id === "release-verify" && step.outputPath === "tests/acceptance/latest/release-verify.txt"), true);
    assert.equal(parsed.refresh?.steps?.every((step) => step.exitCode === undefined), true);
    assert.deepEqual(parsed.refresh?.refreshedPaths, []);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });

  it("renders diagnostics evaluate without invoking external baselines", async () => {
    const lines = await capture(["diagnostics", "evaluate", "--baseline", "codex", "--dry-run", "--output", "json"]);
    const parsed = JSON.parse(lines[0] ?? "{}") as {
      kind?: string;
      status?: string;
      evaluation?: {
        taskCatalogVersion?: string;
        baselines?: readonly { baselineId?: string; status?: string; configured?: boolean }[];
        taskRuns?: readonly { outcome?: string }[];
        diagnostics?: readonly { code?: string }[];
      };
    };

    assert.equal(parsed.kind, "diagnostics.evaluate");
    assert.equal(parsed.status, "warn");
    assert.equal(parsed.evaluation?.taskCatalogVersion, "fallback.missing-catalog");
    assert.equal(parsed.evaluation?.baselines?.[0]?.baselineId, "codex");
    assert.equal(parsed.evaluation?.baselines?.[0]?.status, "deferred");
    assert.equal(parsed.evaluation?.baselines?.[0]?.configured, false);
    assert.equal(parsed.evaluation?.taskRuns?.every((run) => run.outcome === "deferred"), true);
    assert.equal(parsed.evaluation?.diagnostics?.some((diagnostic) => diagnostic.code === "CLI_EVALUATION_BASELINE_DEFERRED"), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });
});
