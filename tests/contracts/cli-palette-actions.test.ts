import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CliActionRequest, CliCompositionSnapshot, CliInteractionContribution, CliResultList, CommandCompositionRecord } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import {
  commandManifestToCompositionRecord,
  coreKeymapProfile,
  projectCommandPalette,
  resolveCliAction,
  validateKeymapProfile,
  viMinimalKeymapProfile
} from "@deepseek/command-system";

describe("cli palette and vi result actions", () => {
  it("projects composition records into inert palette entries and result-list targets", () => {
    let invoked = 0;
    const records = [record("doctor", "readiness", ["pit.legacy-contribution-normalization.manifest-boundary"])];
    const handler = () => {
      invoked += 1;
    };
    void handler;

    const projection = projectCommandPalette(records);

    assert.equal(invoked, 0);
    assert.equal(projection.entries[0]?.entry.id, "palette:command:command:doctor");
    assert.equal(projection.entries[0]?.target.id, "command:doctor");
    assert.equal(projection.entries[0]?.metadata.ownerSubsystem, "command-system");
    assert.equal(projection.entries[0]?.referencePitFixtureIds.includes("pit.legacy-contribution-normalization.manifest-boundary"), true);
    assert.equal(projection.resultList.items[0]?.target.id, "command:doctor");
    assert.equal(JSON.stringify(projection).includes("\u001b["), false);
  });

  it("keeps palette ordering stable through composition projection", () => {
    const projection = projectCommandPalette([
      record("zeta", "plugins", ["pit.extension-permission-expansion.permission-diff"], "plugin", "workspace"),
      record("alpha", "commands", []),
      record("beta", "commands", [])
    ]);

    assert.deepEqual(projection.entries.map((entry) => entry.entry.title), ["alpha", "beta", "zeta"]);
    assert.deepEqual(projection.resultList.items.map((item) => item.label), ["alpha", "beta", "zeta"]);
  });

  it("resolves result-list navigation into focus and jump updates", () => {
    const snapshot = snapshotWithList();
    const request: CliActionRequest = {
      action: "next",
      mode: "result-list",
      target: { kind: "result-list", id: "results" }
    };

    const result = resolveCliAction(request, snapshot);

    assert.equal(result.ok, true);
    assert.equal(result.update?.activeTarget?.id, "file:b.ts");
    assert.equal(result.update?.resultLists?.[0]?.activeItemId, "item:b");
    assert.equal(result.update?.jumpEntry?.destination.id, "file:b.ts");
    assert.equal(result.snapshot.jumpHistory.entries.length, 1);
  });

  it("resolves jump history back and forward without owner execution", () => {
    const snapshot = resolveCliAction({
      action: "next",
      mode: "result-list",
      target: { kind: "result-list", id: "results" }
    }, snapshotWithList()).snapshot;

    const back = resolveCliAction({
      action: "back",
      mode: "result-list",
      target: { kind: "result-list", id: "results" }
    }, snapshot);
    const forward = resolveCliAction({
      action: "forward",
      mode: "result-list",
      target: { kind: "result-list", id: "results" }
    }, back.snapshot);

    assert.equal(back.ok, true);
    assert.equal(back.update?.activeTarget?.id, "file:a.ts");
    assert.equal(back.update?.resultLists?.[0]?.activeItemId, "item:a");
    assert.equal(back.snapshot.jumpHistory.cursor, -1);
    assert.equal(forward.ok, true);
    assert.equal(forward.update?.activeTarget?.id, "file:b.ts");
    assert.equal(forward.update?.resultLists?.[0]?.activeItemId, "item:b");
    assert.equal(forward.snapshot.jumpHistory.cursor, 0);
    assert.equal(JSON.stringify(forward).includes("workspaceMutation"), false);
  });

  it("returns typed jump traversal diagnostics at history bounds", () => {
    const back = resolveCliAction({
      action: "back",
      mode: "result-list",
      target: { kind: "result-list", id: "results" }
    }, snapshotWithList());

    assert.equal(back.ok, false);
    assert.equal(back.diagnostics[0]?.code, "CLI_ACTION_TARGET_NOT_FOUND");
    assert.equal(back.snapshot.jumpHistory.cursor, -1);
    assert.equal(back.update, undefined);
  });

  it("adds result-list items to active reference set without mutating workspace", () => {
    const snapshot = snapshotWithList();
    const request: CliActionRequest = {
      action: "add-to-reference-set",
      mode: "result-list",
      target: { kind: "result-list-item", id: "item:a" }
    };

    const result = resolveCliAction(request, snapshot);

    assert.equal(result.ok, true);
    assert.equal(result.update?.referenceSets?.[0]?.items[0]?.target.id, "file:a.ts");
    assert.equal(result.update?.referenceSets?.[0]?.items[0]?.provenance.source, "result-list");
    assert.equal(JSON.stringify(result).includes("workspaceMutation"), false);
  });

  it("focuses reference items while preserving the reference set", () => {
    const withReference = resolveCliAction({
      action: "add-to-reference-set",
      mode: "result-list",
      target: { kind: "result-list-item", id: "item:a" }
    }, snapshotWithList()).snapshot;
    const result = resolveCliAction({
      action: "focus-reference",
      mode: "result-list",
      target: { kind: "file", id: "ref:item:a" }
    }, withReference);

    assert.equal(result.ok, true);
    assert.equal(result.update?.activeTarget?.id, "file:a.ts");
    assert.equal(result.update?.referenceSets?.[0]?.activeItemId, "ref:item:a");
    assert.equal(result.update?.referenceSets?.[0]?.items.length, 1);
    assert.equal(JSON.stringify(result).includes("workspaceMutation"), false);
  });

  it("returns typed diagnostics for missing reference focus", () => {
    const result = resolveCliAction({
      action: "focus-reference",
      mode: "result-list",
      target: { kind: "file", id: "ref:missing" }
    }, snapshotWithList());

    assert.equal(result.ok, false);
    assert.equal(result.diagnostics[0]?.code, "CLI_ACTION_TARGET_NOT_FOUND");
    assert.equal(result.update, undefined);
  });

  it("returns inert descriptors for inspect/copy/explain/open and dry-run revert", () => {
    const snapshot = snapshotWithList();
    const inspect = resolveCliAction({ action: "inspect", mode: "result-list", target: { kind: "file", id: "file:a.ts", path: "a.ts" } }, snapshot);
    const revert = resolveCliAction({ action: "revert", mode: "normal", target: { kind: "turn", id: "turn-1", turnId: asId<"turn">("turn-1") } }, snapshot);

    assert.equal(inspect.ok, true);
    assert.equal(inspect.update?.commandDescriptor?.kind, "cli.inspect");
    assert.equal(revert.ok, true);
    assert.equal(revert.update?.commandDescriptor?.kind, "cli.revert.preview");
    assert.equal(revert.update?.commandDescriptor?.dryRun, true);
    assert.equal(JSON.stringify(revert).includes("deleted"), false);
  });

  it("provides minimal vi profile mappings and deterministic conflict diagnostics", () => {
    const core = coreKeymapProfile();
    const vi = viMinimalKeymapProfile();
    const conflict: CliInteractionContribution = {
      id: "plugin.next",
      kind: "keymap",
      source: "plugin",
      keymap: { id: "plugin.next", mode: "result-list", key: "j", action: "previous" }
    };

    assert.equal(core.diagnostics.length, 0);
    assert.equal(vi.contributions.some((entry) => entry.keymap?.key === "j" && entry.keymap.action === "next"), true);
    assert.equal(vi.contributions.some((entry) => entry.keymap?.key === "gg" && entry.keymap.action === "first"), true);

    const diagnostics = validateKeymapProfile([...vi.contributions, conflict]);
    assert.equal(diagnostics.some((diagnostic) => diagnostic.code === "CLI_PALETTE_KEYMAP_CONFLICT" && diagnostic.targetIds.includes("vi.next") && diagnostic.targetIds.includes("plugin.next")), true);
  });
});

function record(
  name: string,
  group: string,
  pits: readonly string[],
  sourceKind = "built-in",
  trust: "trusted" | "workspace" | "untrusted" | "quarantined" = "trusted"
): CommandCompositionRecord {
  return commandManifestToCompositionRecord({
    id: asId<"command">(name),
    name,
    aliases: [],
    modes: ["user", "host"],
    hostSupport: ["cli"],
    sideEffect: "none",
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    ownerSubsystem: "command-system",
    source: { kind: sourceKind, id: sourceKind, trust },
    target: { kind: "command", id: `command:${name}` },
    projection: { userVisible: true, hostVisible: true, modelVisible: false, resultListVisible: true, group },
    referencePitFixtureIds: pits,
    redaction: { class: "internal" }
  });
}

function snapshotWithList(): CliCompositionSnapshot {
  const resultList: CliResultList = {
    id: "results",
    kind: "search",
    label: "Search",
    activeItemId: "item:a",
    items: [
      { id: "item:a", target: { kind: "file", id: "file:a.ts", path: "a.ts" }, label: "a.ts", order: 0 },
      { id: "item:b", target: { kind: "file", id: "file:b.ts", path: "b.ts" }, label: "b.ts", order: 1 }
    ]
  };
  return {
    mode: "result-list",
    activeTarget: resultList.items[0]!.target,
    referenceSets: [],
    resultLists: [resultList],
    jumpHistory: { entries: [], cursor: -1 },
    contributions: []
  };
}
