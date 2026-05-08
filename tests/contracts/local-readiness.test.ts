import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryCommandSystem,
  readinessCommandNames,
  readinessManifest,
  registerLocalReadinessCommands,
  runLocalReadinessCommand
} from "@deepseek/command-system";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import type { ReadinessCommandResult } from "@deepseek/platform-contracts";

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

  it("reports credential references without raw secret fields", () => {
    const result = runLocalReadinessCommand("auth", {}, fakeEnv());

    assert.equal(result.credential?.available, true);
    assert.equal(result.credential?.source, "process-env");
    assert.equal(result.credential?.redaction.class, "secret");
    assertNoSecret(result);
  });
});
