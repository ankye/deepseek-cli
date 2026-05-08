import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../../src/apps/cli/src/index.js";

const commands = ["init", "config", "auth", "doctor", "privacy", "verify-install"] as const;

async function capture(args: readonly string[]): Promise<readonly string[]> {
  const lines: string[] = [];
  await runCli(args, (line) => lines.push(line));
  return lines;
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
});
