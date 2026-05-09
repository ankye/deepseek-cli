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
});
