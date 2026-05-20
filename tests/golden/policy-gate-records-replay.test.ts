import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeResourceScope,
  createPolicyDecisionRecord,
  createPolicyGateFixtureRecords
} from "@deepseek/policy-sandbox";
import type { PolicyDecision, PolicyRequest } from "@deepseek/platform-contracts";

describe("policy gate records replay", () => {
  it("replays policy gate outcomes deterministically without raw secrets", () => {
    const fixtures = createPolicyGateFixtureRecords();
    const request: PolicyRequest = {
      subject: "golden",
      action: "execute:shell",
      resource: "core.shell.run",
      metadata: {
        sideEffect: "process",
        command: "npm",
        args: ["test"],
        permissionMode: "bypass",
        prompt: "Bearer abcdefghijklmnop"
      },
      resourceScope: analyzeResourceScope({
        command: "npm",
        args: ["test"],
        cwd: "/workspace"
      }, "process")
    };
    const decision: PolicyDecision = {
      action: "deny",
      reason: "Denied Bearer abcdefghijklmnop"
    };
    const first = createPolicyDecisionRecord(request, decision);
    const second = createPolicyDecisionRecord(request, decision);
    const summary = {
      fixtureDecisions: fixtures.map((record) => record.decision),
      bypass: first
    };
    const serialized = JSON.stringify(summary);

    assert.deepEqual(first, second);
    assert.deepEqual(summary.fixtureDecisions, ["allow", "deny", "prompt", "redact", "audit-only", "bypass-detected"]);
    assert.equal(first.decision, "bypass-detected");
    assert.equal(first.replayBehavior, "fail-closed");
    assert.equal(serialized.includes("Bearer abcdefghijklmnop"), false);
  });
});
