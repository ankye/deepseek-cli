import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CliInteractionContribution, CliTargetRef } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { createCliPluginActionDescriptor } from "@deepseek/command-system";
import { createChatTuiContributionRegistry } from "../../src/apps/cli/src/commands/chat-tui.js";

describe("plugin extension TUI matrix", () => {
  it("explains active, hidden, degraded, conflicted, rejected, read-only, side-effecting, and permission-gated actions", () => {
    const registry = createChatTuiContributionRegistry({
      keymapProfile: "vi-professional",
      plugin: [
        contribution("plugin.active.action", "action", { action: "plugin-action", targetKind: "plugin-contribution" }),
        contribution("plugin.hidden.conflict", "keymap", {
          action: "plugin-action",
          targetKind: "plugin-contribution",
          keymap: {
            id: "plugin.hidden.conflict",
            mode: "result-list",
            key: "j",
            action: "plugin-action",
            targetKind: "plugin-contribution"
          }
        }),
        contribution("plugin.rejected.missing-keymap", "keymap", {
          action: "plugin-action",
          targetKind: "plugin-contribution"
        }),
        contribution("plugin.readonly.inspect", "command", {
          commandName: "plugin-readonly-inspect",
          action: "inspect",
          targetKind: "file",
          permissions: ["workspace:read"],
          sideEffects: ["read"],
          governance: { routesThroughContracts: true, directHostAccess: false, permissionGate: "workspace:read" }
        }),
        contribution("plugin.sideeffect.apply", "command", {
          commandName: "plugin-sideeffect-apply",
          action: "apply",
          targetKind: "diff",
          permissions: ["workspace:write"],
          sideEffects: ["write"],
          governance: { routesThroughContracts: true, directHostAccess: false, approvalRequired: true }
        }),
        contribution("plugin.permission.process", "action", {
          action: "plugin-action",
          targetKind: "plugin-contribution",
          permissions: ["process:execute"],
          sideEffects: ["process"],
          governance: { routesThroughContracts: true, directHostAccess: false, permissionGate: "process:execute", approvalRequired: true }
        })
      ]
    });

    const explanations = new Map(registry.pluginExplanations.map((entry) => [entry.contributionId, entry]));
    const active = explanations.get("plugin.active.action");
    const hidden = explanations.get("plugin.hidden.conflict");
    const rejected = explanations.get("plugin.rejected.missing-keymap");
    const readonly = explanations.get("plugin.readonly.inspect");
    const sideEffecting = explanations.get("plugin.sideeffect.apply");
    const permissionGated = explanations.get("plugin.permission.process");

    assert.equal(active?.active, true);
    assert.equal(active?.hidden, false);
    assert.equal(hidden?.active, false);
    assert.equal(hidden?.hidden, true);
    assert.equal(hidden?.degraded, true);
    assert.equal(hidden?.diagnostics.some((message) => message.includes("duplicate keymap contribution")), true);
    assert.equal(rejected?.active, false);
    assert.equal(rejected?.hidden, false);
    assert.equal(rejected?.degraded, true);
    assert.equal(rejected?.diagnostics.some((message) => message.includes("missing keymap")), true);
    assert.deepEqual(readonly?.sideEffects, ["read"]);
    assert.equal(readonly?.permissions.includes("workspace:read"), true);
    assert.deepEqual(sideEffecting?.sideEffects, ["write"]);
    assert.equal(sideEffecting?.governance.approvalRequired, true);
    assert.equal(permissionGated?.permissions.includes("process:execute"), true);
    assert.equal(permissionGated?.governance.permissionGate, "process:execute");
    assert.equal(registry.accepted.some((entry) => entry.id === "plugin.rejected.missing-keymap"), false);
    assert.equal(registry.summary.conflicts > 0, true);
    assert.equal(registry.summary.accepted < registry.summary.total, true);
  });

  it("creates dry-run plugin action descriptors that never grant direct host execution", () => {
    const target: CliTargetRef = { kind: "plugin-contribution", id: "plugin.sideeffect.apply", label: "Side-effecting apply" };
    const descriptor = createCliPluginActionDescriptor({
      contribution: contribution("plugin.sideeffect.apply", "action", {
        action: "plugin-action",
        targetKind: "plugin-contribution",
        permissions: ["workspace:write"],
        sideEffects: ["write"],
        governance: { routesThroughContracts: true, approvalRequired: true }
      }),
      target
    });

    assert.equal(descriptor.dryRun, true);
    assert.deepEqual(descriptor.permissions, ["workspace:write"]);
    assert.deepEqual(descriptor.sideEffects, ["write"]);
    assert.equal(descriptor.governance.directProcessExecution, false);
    assert.equal(descriptor.governance.directFilesystemExecution, false);
    assert.equal(descriptor.governance.directModelExecution, false);
    assert.equal(descriptor.governance.directMcpExecution, false);
    assert.equal(descriptor.governance.directHookExecution, false);
  });
});

function contribution(
  id: string,
  kind: CliInteractionContribution["kind"],
  overrides: Partial<CliInteractionContribution>
): CliInteractionContribution {
  return {
    id,
    kind,
    source: "plugin",
    pluginId: asId<"plugin">("@deepseek/plugin-matrix"),
    namespace: "matrix",
    label: id.replace(/^plugin\./, ""),
    previewText: `${id} preview`,
    helpText: `${id} help`,
    priority: 1,
    ...overrides
  };
}
