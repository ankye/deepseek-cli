import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createConfigDocument, PersistentConfigService, validateConfigDocument } from "../src/index.js";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";

describe("persistent config service", () => {
  it("resolves values by defaults, user, workspace, environment, then CLI precedence", async () => {
    const platform = new FakePlatformRuntime("linux");
    const service = new PersistentConfigService({
      platform,
      workspaceRoot: "/repo",
      defaults: { model: "default-model", telemetry: "disabled" },
      userDocument: createConfigDocument("user", { model: "user-model", output: "text" }),
      workspaceDocument: createConfigDocument("workspace", { model: "workspace-model", sandbox: "ask" }),
      environment: { model: "env-model" },
      cli: { model: "cli-model" }
    });

    const resolved = await service.resolve();
    const model = resolved.values.find((value) => value.key === "model");

    assert.equal(model?.redactedValue, "cli-model");
    assert.equal(model?.source.scope, "cli");
    assert.deepEqual(model?.shadowedSources.map((source) => source.scope), ["environment", "workspace", "user", "defaults"]);
  });

  it("rejects secret-like config values before persistence", async () => {
    const platform = new FakePlatformRuntime("linux");
    const service = new PersistentConfigService({ platform, workspaceRoot: "/repo" });

    const result = await service.set({ scope: "workspace", key: "apiKey", value: "sk-live-secret-value" });

    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "CONFIG_SECRET_VALUE_REJECTED");
    assert.equal(JSON.stringify(result).includes("sk-live-secret-value"), false);
  });

  it("reports atomic write failures without partial persisted values", async () => {
    const platform = new FakePlatformRuntime("linux");
    platform.failNextAtomicWrite = true;
    const service = new PersistentConfigService({ platform, workspaceRoot: "/repo" });

    const result = await service.set({ scope: "workspace", key: "model", value: "deepseek-v4-flash" });

    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "ATOMIC_WRITE_FAILED");
    assert.equal(await service.document("workspace"), undefined);
  });

  it("fails closed when the platform rejects workspace metadata paths", async () => {
    const platform = new FakePlatformRuntime("linux");
    const service = new PersistentConfigService({ platform, workspaceRoot: "../repo" });

    const result = await service.set({ scope: "workspace", key: "model", value: "deepseek-v4-flash" });

    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "WORKSPACE_METADATA_PATH_REJECTED");
    assert.equal(await service.document("workspace"), undefined);
  });

  it("preserves persisted schema versions for migration diagnostics", async () => {
    const platform = new FakePlatformRuntime("linux");
    const path = platform.workspaceMetadataPath("/repo", "deepseek").value ?? "/repo/.deepseek/config.json";
    await platform.writeFile(path, JSON.stringify({ schemaVersion: "999.0.0", profile: "default", values: { model: "old-model" } }));
    const service = new PersistentConfigService({ platform, workspaceRoot: "/repo" });

    const document = await service.document("workspace");
    const diagnostics = document ? validateConfigDocument(document) : [];

    assert.equal(document?.schemaVersion, "999.0.0");
    assert.equal(diagnostics.some((diagnostic) => diagnostic.code === "CONFIG_SCHEMA_VERSION_UNSUPPORTED"), true);
  });
});
