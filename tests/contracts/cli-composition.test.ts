import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  CliActionRequest,
  CliApprovalActionRequest,
  CliJumpHistory,
  CliRevertPreview,
  CliReferenceSet,
  CliResultList
} from "../../src/packages/platform-contracts/src/index.js";
import { createCliApprovalActionRequest, resolveCliApprovalAction, validateCliInteractionContributions } from "../../src/packages/platform-contracts/src/index.js";

describe("cli composition contracts", () => {
  it("models reference sets, result lists, jumps, and typed actions", () => {
    const fileTarget = { kind: "file" as const, id: "file:README.md", path: "README.md", label: "README.md" };
    const referenceSet: CliReferenceSet = {
      id: "refs:active",
      label: "Active files",
      activeItemId: "ref:readme",
      provenance: { source: "user" },
      items: [
        {
          id: "ref:readme",
          kind: "file",
          target: fileTarget,
          label: "README.md",
          provenance: { source: "user" },
          order: 0,
          budget: { estimatedTokens: 128 }
        }
      ]
    };
    const resultList: CliResultList = {
      id: "quickfix:diagnostics",
      kind: "diagnostics",
      label: "Diagnostics",
      activeItemId: "diag:1",
      items: [
        {
          id: "diag:1",
          target: { kind: "diagnostic", id: "diag:1", path: "README.md" },
          label: "README.md:1",
          order: 0,
          severity: "warning"
        }
      ]
    };
    const jumpHistory: CliJumpHistory = {
      cursor: 0,
      entries: [
        {
          id: "jump:1",
          source: fileTarget,
          destination: resultList.items[0]!.target,
          timestamp: "2026-05-12T00:00:00.000Z",
          provenance: { source: "diagnostics" }
        }
      ]
    };
    const revert: CliActionRequest = {
      action: "revert",
      mode: "normal",
      target: { kind: "turn", id: "turn:1" },
      dryRun: true
    };

    assert.equal(referenceSet.items[0]?.target.kind, "file");
    assert.equal(resultList.items[0]?.target.kind, "diagnostic");
    assert.equal(jumpHistory.entries[0]?.destination.id, "diag:1");
    assert.equal(revert.action, "revert");
    assert.equal(revert.target.kind, "turn");
  });

  it("models request revert previews without raw rollback content", () => {
    const preview: CliRevertPreview = {
      target: {
        turnId: "turn-1" as never,
        sessionId: "session-1" as never,
        target: { kind: "turn", id: "turn-1" }
      },
      affectedCheckpointIds: ["checkpoint-1"],
      affectedPaths: ["README.md"],
      stalePaths: [],
      nonReversibleEffects: [{ kind: "network", review: "manual" }],
      contextProjectionIds: ["context-1"],
      redaction: { class: "internal", fields: ["affectedPaths"] }
    };

    assert.equal(preview.target.target.kind, "turn");
    assert.deepEqual(preview.affectedCheckpointIds, ["checkpoint-1"]);
    assert.equal(JSON.stringify(preview).includes("before content"), false);
  });

  it("models approval actions as typed targets without direct runtime execution", () => {
    const inspect: CliApprovalActionRequest = createCliApprovalActionRequest({
      action: "inspect",
      approvalId: "approval:contract",
      label: "Review shell command"
    });
    const accept = createCliApprovalActionRequest({
      action: "accept",
      approvalId: "approval:contract"
    });
    const deny = createCliApprovalActionRequest({
      action: "deny",
      approvalId: "approval:contract"
    });
    const cancel = createCliApprovalActionRequest({
      action: "cancel",
      approvalId: "approval:contract"
    });

    assert.equal(inspect.target.kind, "approval-request");
    assert.equal(resolveCliApprovalAction(inspect).inspected?.approvalId, "approval:contract");
    assert.deepEqual(resolveCliApprovalAction(accept).protocolControl, { kind: "approval.decision", approvalId: "approval:contract", decision: "allow" });
    assert.equal(resolveCliApprovalAction(deny).brokerDecision, "deny");
    assert.equal(resolveCliApprovalAction(cancel).brokerDecision, "cancel");
    assert.equal(JSON.stringify(resolveCliApprovalAction(accept)).includes("scheduler"), false);
  });

  it("detects deterministic contribution conflicts", () => {
    const result = validateCliInteractionContributions([
      {
        id: "core.open",
        kind: "keymap",
        source: "core",
        keymap: { id: "core.open", mode: "normal", key: "Enter", action: "open" }
      },
      {
        id: "plugin.inspect",
        kind: "keymap",
        source: "plugin",
        keymap: { id: "plugin.inspect", mode: "normal", key: "Enter", action: "inspect" }
      }
    ]);

    assert.equal(result.ok, true);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0]?.winnerId, "core.open");
    assert.deepEqual(result.conflicts[0]?.loserIds, ["plugin.inspect"]);
  });

  it("reports malformed contribution diagnostics", () => {
    const result = validateCliInteractionContributions([
      { id: "", kind: "keymap", source: "user" },
      { id: "palette.bad", kind: "palette-entry", source: "user" }
    ]);

    assert.equal(result.ok, false);
    assert.equal(result.diagnostics.some((diagnostic) => diagnostic.includes("id is required")), true);
    assert.equal(result.diagnostics.some((diagnostic) => diagnostic.includes("missing keymap")), true);
    assert.equal(result.diagnostics.some((diagnostic) => diagnostic.includes("missing paletteEntry")), true);
  });
});
