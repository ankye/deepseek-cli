import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstPartyPluginCommandContributions,
  firstPartyPluginReasoningContributions,
  listFirstPartyDevPluginManifests,
  snapshotFirstPartyDevPluginPack,
  validateFirstPartyPluginReasoningContributions,
  validateFirstPartyDevPluginPack
} from "@deepseek/first-party-dev-plugins";
import { asId } from "@deepseek/platform-contracts";
import { contributionToCompositionRecord, projectCommandComposition } from "@deepseek/command-system";
import { createChatTuiContributionRegistry } from "../../src/apps/cli/src/commands/chat-tui.js";
import { createCliPaletteProjection } from "../../src/apps/cli/src/commands/palette.js";

describe("first-party dev plugins", () => {
  it("ships deterministic built-in manifests with permission metadata", () => {
    const manifests = listFirstPartyDevPluginManifests();
    const snapshot = snapshotFirstPartyDevPluginPack();
    const validation = validateFirstPartyDevPluginPack(manifests);

    assert.equal(validation.ok, true);
    assert.deepEqual(manifests.map((manifest) => manifest.id), [
      "@deepseek/plugin-context-compactor",
      "@deepseek/plugin-dev-checks",
      "@deepseek/plugin-git-review",
      "@deepseek/plugin-repo-navigator"
    ]);
    assert.equal(snapshot.pluginCount, 4);
    assert.equal(snapshot.commandCount, 20);
    assert.equal(snapshot.paletteEntryCount, 4);
    assert.equal(snapshot.reasoningContributionCount, 4);
    assert.equal(manifests.every((manifest) => manifest.source === "built-in"), true);
    assert.equal(manifests.every((manifest) => manifest.integrity.startsWith("sha256:")), true);
    assert.equal(manifests.some((manifest) => manifest.permissions.includes("context:lcm:write")), true);
    assert.equal(manifests.every((manifest) => Array.isArray(manifest.contributions.reasoningContributions)), true);
  });

  it("projects command contributions without executing plugin owners", () => {
    const contributions = firstPartyPluginCommandContributions();
    const records = contributions.map(contributionToCompositionRecord);
    const projection = projectCommandComposition(records, "user-visible");
    const checkCommands = records.filter((record) => record.source.pluginId === "@deepseek/plugin-dev-checks");

    assert.equal(projection.ok, true);
    assert.equal(records.length, 20);
    assert.equal(checkCommands.length, 6);
    assert.equal(checkCommands.every((record) => record.metadata?.builtIn === true), true);
    assert.equal(checkCommands.every((record) => record.metadata?.commandId !== "shell"), true);
    assert.equal(checkCommands.every((record) => record.sideEffect === "process"), true);
    assert.equal(records.some((record) => record.aliases.includes("/context grep")), true);
  });

  it("feeds palette and TUI projection as metadata-only plugin contributions", () => {
    const palette = createCliPaletteProjection();
    const tuiRegistry = createChatTuiContributionRegistry();

    assert.equal(palette.entries.some((entry) => entry.source.pluginId === "@deepseek/plugin-context-compactor"), true);
    assert.equal(palette.entries.some((entry) => entry.entry.title === "Context: Status"), true);
    assert.equal(tuiRegistry.summary.bySource.plugin > 0, true);
    assert.equal(tuiRegistry.summary.conflicts, 0);
    assert.equal(tuiRegistry.accepted.some((entry) => entry.pluginId === "@deepseek/plugin-context-compactor"), true);
  });

  it("contributes bounded visible reasoning records for native plugin workflows", () => {
    const records = firstPartyPluginReasoningContributions({
      sessionId: asId<"session">("session-first-party-reasoning"),
      turnId: asId<"turn">("turn-first-party-reasoning"),
      trace: {
        traceId: asId<"trace">("trace-first-party-reasoning"),
        spanId: asId<"span">("span-first-party-reasoning"),
        correlationId: asId<"correlation">("corr-first-party-reasoning")
      }
    });
    const validation = validateFirstPartyPluginReasoningContributions(records);

    assert.equal(records.length, 4);
    assert.equal(validation.ok, true);
    assert.equal(records.every((record) => record.actor === "plugin"), true);
    assert.equal(records.some((record) => record.stepKind === "verification"), true);
    assert.equal(JSON.stringify(records).includes("rawProviderReasoning"), false);
  });
});
