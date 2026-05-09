import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  interactiveControlManifest,
  interactiveHelpProjection,
  invokeInteractiveCommand,
  invokeInteractiveControlCommand
} from "../src/index.js";

describe("interactive control commands", () => {
  it("declares stable host-agnostic command manifests", () => {
    const help = interactiveControlManifest("help");
    const cancel = interactiveControlManifest("cancel");

    assert.equal(help.id, "interactive.help");
    assert.equal(help.sideEffect, "none");
    assert.deepEqual(help.hostSupport, ["cli"]);
    assert.equal(cancel.id, "interactive.cancel");
    assert.equal(cancel.sideEffect, "runtime-control");
  });

  it("returns structured help and control results", async () => {
    const help = await invokeInteractiveControlCommand("help");
    assert.equal(help.ok, true);
    assert.equal(help.value?.action, "help");
    assert.ok(Array.isArray(help.value?.controls));

    const exit = await invokeInteractiveControlCommand("exit");
    assert.equal(exit.ok, true);
    assert.equal(exit.value?.terminal, true);

    const quit = await invokeInteractiveCommand("quit");
    assert.equal(quit.ok, true);
    assert.equal(quit.value?.action, "exit");
    assert.equal(quit.value?.command, "exit");

    assert.equal(interactiveHelpProjection().some((item) => item.name === "/cancel"), true);
  });
});
