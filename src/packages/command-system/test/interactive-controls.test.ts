import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  interactiveControlManifest,
  interactiveControlCompositionRecords,
  interactiveHelpProjection,
  invokeInteractiveCommand,
  invokeInteractiveControlCommand,
  modeControlCompositionRecords,
  modeControlVisibilityProfiles,
  modelVisibleInteractiveControlProjection,
  readinessCompositionRecords
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
    assert.equal(cancel.projection?.hostOnly, true);
    assert.equal(cancel.target?.id, "command:interactive.cancel");
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

  it("derives help and slash projection from inert composition records", () => {
    const records = interactiveControlCompositionRecords();
    const help = interactiveHelpProjection();

    assert.equal(records.some((record) => record.displayName === "cancel" && record.sideEffect === "runtime-control"), true);
    assert.equal(help.some((item) => item.name === "/exit" && Array.isArray(item.aliases) && item.aliases.includes("/quit")), true);
    assert.equal(modelVisibleInteractiveControlProjection().length, 0);
  });

  it("projects readiness commands with typed targets and model-hidden defaults", () => {
    const records = readinessCompositionRecords();
    const init = records.find((record) => record.displayName === "init");
    const verify = records.find((record) => record.displayName === "verify-install");

    assert.equal(init?.target.id, "command:readiness.init");
    assert.equal(init?.permissions.includes("workspace:metadata"), true);
    assert.equal(init?.projection.modelVisible, false);
    assert.deepEqual(verify?.aliases, ["verify"]);
  });

  it("declares mode-aware visibility metadata for local and remote profiles", () => {
    const records = modeControlCompositionRecords();
    const mode = records.find((record) => record.displayName === "mode");
    const workers = records.find((record) => record.displayName === "workers");
    const remote = modeControlVisibilityProfiles("remote").find((profile) => profile.profile === "remote");

    assert.equal(mode?.projection.modelVisible, false);
    assert.equal(workers?.projection.metadata?.interactionModes instanceof Array, true);
    assert.equal(remote?.commandVisibilities.some((entry) => entry.commandId === "/workers" && entry.visibility === "rejected"), true);
    assert.equal(remote?.commandVisibilities.some((entry) => entry.commandId === "/mode" && entry.visibility === "visible"), true);
  });
});
