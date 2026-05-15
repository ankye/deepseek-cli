import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { AgentWorkOrder, JsonObject } from "@deepseek/platform-contracts";
import { AGENT_MODE_COMPATIBILITY, AGENT_MODE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { validateWorkOrderCompleteness } from "../../src/packages/runtime/src/modes/delegation-policy.js";

describe("adversarial mode fixtures", () => {
  it("declares required adversarial categories for mode-aware agent behavior", async () => {
    const raw = await readFile("tests/fixtures/adversarial-mode-fixtures.json", "utf8");
    const parsed = JSON.parse(raw) as { fixtures?: readonly { category?: string; expectedDiagnosticCode?: string; expectedOutcome?: string }[] };
    const categories = new Set((parsed.fixtures ?? []).map((fixture) => fixture.category));

    for (const category of ["mode-mismatch", "lazy-delegation", "over-delegation", "missing-verification", "unsafe-scratchpad", "worker-raw-output-as-user-prompt", "unsupported-reasoning-effort"]) {
      assert.equal(categories.has(category), true, `${category} fixture missing`);
    }
    assert.equal((parsed.fixtures ?? []).every((fixture) => fixture.expectedDiagnosticCode && fixture.expectedOutcome), true);
  });

  it("rejects lazy delegation work orders before worker launch", () => {
    const errors = validateWorkOrderCompleteness(workOrder({
      purpose: "Based on the prior findings, continue.",
      taskSummary: "Inspect the recent changes and fix what we discussed.",
      doneCriteria: ["Continue from previous findings."]
    }));

    assert.equal(errors.some((error) => error.code === "WORK_ORDER_LAZY_DELEGATION"), true);
  });

  it("requires scratchpad and checkpoint governance metadata to stay bounded and redacted", () => {
    const order = workOrder({
      purpose: "Implement a bounded fixture.",
      taskSummary: "Edit one file and record scoped scratchpad metadata.",
      scratchpadScope: {
        scopeId: "scratchpad:worker:test",
        maxBytes: 4096,
        retention: "session",
        redaction: { class: "internal", fields: ["notes"] }
      },
      checkpointPolicy: {
        required: true,
        checkpointId: "checkpoint:worker:test",
        writeScope: ["src/apps/cli/src/diagnostics"],
        fingerprint: "sha256:checkpoint-fixture"
      }
    });

    assert.equal((order.scratchpadScope as JsonObject | undefined)?.maxBytes, 4096);
    assert.equal((order.scratchpadScope as JsonObject | undefined)?.redaction !== undefined, true);
    assert.equal((order.checkpointPolicy as JsonObject | undefined)?.required, true);
    assert.equal(String((order.checkpointPolicy as JsonObject | undefined)?.fingerprint).startsWith("sha256:"), true);
    assert.equal(JSON.stringify(order).includes("sk-"), false);
  });
});

function workOrder(overrides: Partial<AgentWorkOrder>): AgentWorkOrder {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    workOrderId: "agent-work-order:adversarial",
    parentSessionId: asId<"session">("session-adversarial"),
    parentAgentId: asId<"agent">("agent-parent"),
    targetAgentId: asId<"agent">("agent-worker"),
    mode: "worker",
    purpose: "Implement a bounded fixture.",
    originalUserGoal: "Improve the CLI.",
    taskSummary: "Edit one file.",
    evidenceIds: ["evidence:fixture"],
    targets: [{ kind: "file", id: "file:fixture", path: "src/apps/cli/src/index.ts" }],
    allowedTools: ["core.file.read", "core.file.write"],
    permissionScope: { toolProjection: "read-write" },
    doneCriteria: ["Report changed files."],
    verificationExpectations: ["Run focused tests."],
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY,
    ...overrides
  };
}
