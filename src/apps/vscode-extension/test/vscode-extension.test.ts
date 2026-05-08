import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { activate } from "../src/index.js";

describe("vscode extension host adapter", () => {
  it("exposes a thin bridge without CLI app imports", async () => {
    const subscriptions: { dispose(): unknown }[] = [];
    const bridge = activate({ subscriptions });
    assert.equal(bridge.context.hostKind, "vscode");
    assert.deepEqual(await bridge.collectEditorContext(), {
      activeDocument: null,
      selections: [],
      diagnostics: [],
      workspaceFolders: []
    });
    assert.equal(subscriptions.length, 1);
  });
});
