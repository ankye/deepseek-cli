import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createExtensionManagementRecord } from "../../src/apps/cli/src/commands/extension.js";

describe("plugin contribution diagnostics surface", () => {
  it("lists governed plugin contribution explanations through the CLI extension command", async () => {
    const record = await createExtensionManagementRecord({
      command: "extension",
      extensionCommand: "extension.plugin.contributions",
      prompt: "",
      output: "json",
      live: false
    });

    assert.equal(record.kind, "extension.plugin.contributions");
    assert.equal(record.status, "completed");
    assert.equal(record.items.some((item) => item.targetKind === "plugin-contribution" && item.summary.includes("active=true")), true);
    assert.equal(JSON.stringify(record).includes("directHostAccess"), true);
    assert.equal(JSON.stringify(record).includes("api-key"), false);
  });
});

