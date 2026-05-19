import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CliCompositionSnapshot, CliResultList, CliTargetRef } from "@deepseek/platform-contracts";
import {
  createChatTuiState,
  dispatchChatTuiInputEvent
} from "../../src/apps/cli/src/commands/chat-tui.js";
import type { ChatTuiStateSnapshot } from "../../src/apps/cli/src/commands/chat-tui.js";
import type { CliTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";
import { readCliRawInputEvents } from "../../src/apps/cli/src/input/raw-keys.js";

describe("professional TUI pseudo-terminal interaction", () => {
  it("drives result-list navigation through real raw key chunks", async () => {
    const trace = await drivePseudoTerminal(resultListState(), ["j", "k", "G", "g", "g", "\r"]);

    assert.deepEqual(trace.map((entry) => [entry.key, entry.kind, entry.action]), [
      ["j", "action", "next"],
      ["k", "action", "previous"],
      ["G", "action", "last"],
      ["g", "sequence", undefined],
      ["g", "action", "first"],
      ["Enter", "action", "open"]
    ]);
    assert.equal(trace.at(0)?.activeTargetId, "file:b.ts");
    assert.equal(trace.at(2)?.activeTargetId, "file:c.ts");
    assert.equal(trace.at(-1)?.activeTargetId, "file:a.ts");
    assert.equal(JSON.stringify(trace).includes("gg"), false);
  });

  it("opens and cancels search and command modes without leaking typed text as model input", async () => {
    const trace = await drivePseudoTerminal(resultListState(), ["/", "\x1b", ":", "\x1b", "q"]);

    assert.equal(trace[0]?.kind, "command");
    assert.equal(trace[0]?.commandName, "search");
    assert.equal(trace[0]?.commandBarMode, "search");
    assert.equal(trace[1]?.mode, "result-list");
    assert.equal(trace[2]?.kind, "command");
    assert.equal(trace[2]?.commandName, "command");
    assert.equal(trace[3]?.mode, "result-list");
    assert.equal(trace[4]?.kind, "focus");
    assert.equal(trace[4]?.mode, "prompt");
    assert.equal(JSON.stringify(trace).includes("modelVisible"), false);
  });

  it("executes leader plugin actions through governed local descriptors", async () => {
    const trace = await drivePseudoTerminal(normalState(), [" ", "p"]);

    assert.deepEqual(trace.map((entry) => [entry.key, entry.kind, entry.action]), [
      ["Space", "sequence", undefined],
      ["p", "action", "plugin-action"]
    ]);
    assert.equal(trace.at(-1)?.activeTargetKind, "plugin-contribution");
    assert.equal((trace.at(-1)?.activeTargetId?.length ?? 0) > 0, true);
  });

  it("routes approval accept, inspect, deny, and escape cancellation from pseudo-terminal input", async () => {
    const accepted = await drivePseudoTerminal(approvalState(), ["\r"]);
    const inspected = await drivePseudoTerminal(approvalState(), ["?"]);
    const denied = await drivePseudoTerminal(approvalState(), ["q"]);
    const escaped = await drivePseudoTerminal(approvalState(), ["\x1b"]);

    assert.equal(accepted[0]?.kind, "action");
    assert.equal(accepted[0]?.action, "accept");
    assert.equal(accepted[0]?.activeTargetKind, "approval-request");
    assert.equal(inspected[0]?.kind, "action");
    assert.equal(inspected[0]?.action, "inspect");
    assert.equal(denied[0]?.kind, "action");
    assert.equal(denied[0]?.action, "deny");
    assert.equal(escaped[0]?.kind, "action");
    assert.equal(escaped[0]?.action, "cancel");
    assert.equal(escaped[0]?.activeTargetKind, "approval-request");
  });
});

async function drivePseudoTerminal(initial: ChatTuiStateSnapshot, chunks: readonly string[]): Promise<readonly DispatchTrace[]> {
  const trace: DispatchTrace[] = [];
  let state = initial;
  for await (const event of readCliRawInputEvents(chunks)) {
    const result = dispatchChatTuiInputEvent(state, event);
    state = result.state;
    const activeTarget = result.state.composition.activeTarget;
    trace.push({
      key: result.key,
      kind: result.kind,
      ...(result.kind === "command" ? { commandName: result.commandName } : {}),
      ...(result.action ? { action: result.action } : {}),
      mode: result.state.mode,
      commandBarMode: result.state.workbench.commandBar.mode,
      ...(activeTarget ? { activeTargetKind: activeTarget.kind, activeTargetId: activeTarget.id } : {}),
      diagnosticCodes: result.diagnostics.map((diagnostic) => diagnostic.code)
    });
  }
  return trace;
}

interface DispatchTrace {
  readonly key: string;
  readonly kind: string;
  readonly commandName?: string;
  readonly action?: string;
  readonly mode: string;
  readonly commandBarMode: string;
  readonly activeTargetKind?: string;
  readonly activeTargetId?: string;
  readonly diagnosticCodes: readonly string[];
}

function resultListState(): ChatTuiStateSnapshot {
  const base = createChatTuiState({
    enabled: true,
    terminalProfile: fullScreenProfile(),
    composition: resultListComposition()
  });
  return {
    ...base,
    mode: "result-list",
    composition: { ...base.composition, mode: "result-list" }
  };
}

function normalState(): ChatTuiStateSnapshot {
  const base = createChatTuiState({ enabled: true, terminalProfile: fullScreenProfile() });
  return {
    ...base,
    mode: "normal",
    composition: { ...base.composition, mode: "normal" }
  };
}

function approvalState(): ChatTuiStateSnapshot {
  const approvalTarget: CliTargetRef = {
    kind: "approval-request",
    id: "approval:write-package",
    label: "Allow package install dry-run"
  };
  const base = createChatTuiState({
    enabled: true,
    terminalProfile: fullScreenProfile(),
    composition: {
      mode: "approval",
      activeTarget: approvalTarget,
      referenceSets: [],
      resultLists: [{
        id: "approvals",
        kind: "approvals",
        label: "Approvals",
        activeItemId: "approval:write-package",
        items: [{ id: "approval:write-package", label: "Allow package install dry-run", order: 0, target: approvalTarget }]
      }],
      jumpHistory: { entries: [], cursor: -1 },
      contributions: []
    }
  });
  return {
    ...base,
    mode: "approval",
    composition: { ...base.composition, mode: "approval", activeTarget: approvalTarget }
  };
}

function resultListComposition(): CliCompositionSnapshot {
  const resultList: CliResultList = {
    id: "results",
    kind: "search",
    label: "Files",
    activeItemId: "item:a",
    items: [
      item("item:a", "file:a.ts", "a.ts", 0),
      item("item:b", "file:b.ts", "b.ts", 1),
      item("item:c", "file:c.ts", "c.ts", 2)
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

function item(id: string, targetId: string, path: string, order: number) {
  return {
    id,
    target: { kind: "file" as const, id: targetId, path },
    label: path,
    order
  };
}

function fullScreenProfile(): CliTerminalCapabilityProfile {
  return {
    rendererProfile: "full-screen",
    inputStrategy: "raw",
    stdinIsTTY: true,
    stdoutIsTTY: true,
    isCI: false,
    platform: "linux",
    columns: 120,
    colorDepth: "ansi256",
    unicode: "unicode",
    rawInput: true,
    inlineText: true,
    tuiProfile: "full-screen",
    reasons: ["renderer:full-screen", "input:raw", "tui:full-screen"]
  };
}
