import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { command, defineBuiltinPlugin, keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";
import { validatePluginManifestMetadata } from "@deepseek/plugin-system";
import type { PluginManifest } from "@deepseek/platform-contracts";

describe("plugin author API", () => {
  it("creates declarative built-in manifests without runtime handles", () => {
    const manifest = defineBuiltinPlugin({
      id: "@deepseek/plugin-test-author-api",
      name: "Author API Test",
      version: "0.1.0",
      integrity: "sha256:test",
      permissions: ["workspace:read"],
      commands: [
        command({
          id: "test.find",
          name: "Test: Find",
          aliases: ["/test find"],
          description: "Find test targets.",
          ownerSubsystem: "command-system",
          commandId: "test.find",
          sideEffect: "read",
          permissions: ["workspace:read"],
          group: "test",
          order: 10,
          inputSchema: { type: "object" },
          outputSchema: { type: "object" }
        })
      ],
      paletteEntries: [paletteEntry({ id: "test", title: "Test", category: "test", targetKind: "plugin-command" })],
      resultListProviders: [resultListProvider({ id: "test-results", targetKinds: ["workspace-file"] })],
      keymaps: [keymap({ id: "test.find-key", mode: "normal", key: "Space t", action: "search", targetKind: "command", namespace: "test" })],
      rendererHints: [rendererHint({ id: "test.results", host: "cli-tui", placement: "palette" })]
    });

    assert.equal(manifest.source, "built-in");
    assert.equal(manifest.contributions.schemaVersion, "1.0.0");
    assert.equal(manifest.contributions.pluginApiVersion, "0.1.0");
    assert.equal(JSON.stringify(manifest).includes("runtimeHandle"), false);
    assert.equal(JSON.stringify(manifest).includes("callback"), false);
  });

  it("rejects executable-looking contribution metadata before projection", () => {
    const manifest = {
      id: "@deepseek/plugin-bad-callback",
      name: "Bad Callback",
      version: "0.1.0",
      source: "built-in",
      integrity: "sha256:test",
      permissions: ["workspace:read"],
      contributions: {
        commands: [{ id: "bad", handler: "host-private-callback" }]
      }
    } as unknown as PluginManifest;

    const validation = validatePluginManifestMetadata([manifest], {
      requiredSource: "built-in",
      requireSha256Integrity: true,
      requireCommands: true
    });

    assert.equal(validation.ok, false);
    assert.equal(validation.errors.some((error) => error.code === "PLUGIN_EXECUTABLE_METADATA_REJECTED"), true);
  });
});
