import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { APPROVAL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { ApprovalId, ApprovalLifecycleRecord, RuntimeEvent } from "@deepseek/platform-contracts";
import { createTerminalCapabilityProfile } from "../../src/apps/cli/src/host/terminal-profile.js";
import { terminalProfileFixtures } from "../../src/apps/cli/src/host/terminal-fixtures.js";
import { renderApprovalJson, renderApprovalText } from "../../src/apps/cli/src/renderers/approval.js";

describe("approval rendering terminal matrix", () => {
  it("renders deterministic approval fallback across terminal profiles", () => {
    const event = approvalEvent();
    const outputs = terminalProfileFixtures.map((fixture) => {
      const profile = createTerminalCapabilityProfile({
        command: fixture.command,
        output: fixture.output,
        terminal: fixture.terminal,
        input: fixture.terminal.stdinIsTTY ? process.stdin : [],
        facts: { ...fixture.facts, processStdin: process.stdin }
      });
      const rendered = profile.rendererProfile === "json" || profile.rendererProfile === "jsonl"
        ? JSON.stringify(renderApprovalJson(event))
        : renderApprovalText(event, profile);
      return { name: fixture.name, profile, rendered };
    });

    assert.equal(outputs.every((entry) => entry.rendered.includes("approval:matrix") || entry.rendered.includes("approvalId")), true);
    assert.equal(outputs.every((entry) => !entry.rendered.includes("\u001b[")), true);
    assert.equal(outputs.some((entry) => entry.name === "ci-non-tty" && entry.rendered.includes("profile: plain")), true);
    assert.equal(outputs.some((entry) => entry.name === "redirected-jsonl" && entry.rendered.includes("\"kind\":\"approval.denied\"")), true);
    assert.equal(outputs.some((entry) => entry.name === "remote-unknown-width" && entry.rendered.includes("profile:")), true);
    assert.equal(outputs.some((entry) => entry.name === "no-color-terminal" && entry.profile.colorDepth === "none"), true);
  });
});

function approvalEvent(): RuntimeEvent {
  const trace = {
    traceId: asId<"trace">("trace-approval-matrix"),
    spanId: asId<"span">("span-approval-matrix"),
    correlationId: asId<"correlation">("corr-approval-matrix"),
    sessionId: asId<"session">("session-approval-matrix")
  };
  const record: ApprovalLifecycleRecord = {
    schemaVersion: APPROVAL_SCHEMA_VERSION,
    kind: "approval.denied",
    approvalId: "approval:matrix" as ApprovalId,
    sessionId: trace.sessionId,
    trace,
    summary: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      title: "Approval denied",
      subject: "matrix",
      action: "execute:shell",
      resource: "core.shell.run",
      capability: "core.shell.run",
      targetKind: "capability",
      targetLabel: "npm test",
      riskSummaries: [{
        schemaVersion: APPROVAL_SCHEMA_VERSION,
        kind: "shell",
        severity: "high",
        title: "Shell fallback",
        detail: "Wrapped shell command requires deterministic fallback rendering.",
        reasonCodes: ["shell.analysis.manually-reviewable"],
        referencePitFixtureIds: ["pit.shell-parser.fallback-risk"],
        redaction: { class: "internal", fields: ["detail"] },
        metadata: {}
      }],
      allowedDecisions: ["deny", "cancel"],
      referencePitFixtureIds: ["pit.shell-parser.fallback-risk"],
      redaction: { class: "internal", fields: ["targetLabel"] },
      metadata: {}
    },
    auditReference: {
      schemaVersion: APPROVAL_SCHEMA_VERSION,
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      policyDecision: "ask",
      reasonCodes: ["shell.analysis.manually-reviewable"],
      redaction: { class: "internal" }
    },
    redaction: { class: "internal" },
    compatibility: { schemaVersion: APPROVAL_SCHEMA_VERSION }
  };
  return {
    kind: "approval.denied",
    sessionId: trace.sessionId,
    createdAt: new Date(0).toISOString(),
    trace,
    data: {
      approval: record
    }
  };
}
