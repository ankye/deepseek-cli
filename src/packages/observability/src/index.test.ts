import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OBSERVABILITY_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { ApprovalLifecycleRecord, ApprovalId } from "@deepseek/platform-contracts";
import { InMemoryUsageBudgetManager } from "@deepseek/usage-budget-management";
import { createTraceBudgetEvidence, defaultPrivacySettings, InMemoryObservabilitySink, redactObservabilityArtifact } from "./index.js";
import { getReferencePitFixture } from "@deepseek/testing-regression";

const secret = "sk-live-1234567890";

describe("observability privacy sink", () => {
  it("normalizes emitted events into canonical redacted records", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({
      kind: "trace",
      at: new Date(0).toISOString(),
      name: "provider.request",
      fields: {
        url: "https://api.deepseek.com",
        Authorization: `Bearer ${secret}`,
        nested: { apiKey: secret }
      }
    });

    const records = await sink.drain();
    assert.equal(records.length, 1);
    const [record] = records;
    assert.ok(record);
    const serialized = JSON.stringify(record);
    assert.equal(record.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.equal(record.recordId, "observability-record-1");
    assert.equal(record.privacyDecision.action, "allow-local");
    assert.equal(record.persistence.scope, "local-diagnostics");
    assert.equal(record.redactionSummary.redactedValueCount >= 2, true);
    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("[REDACTED:secret]") || serialized.includes("[REDACTED:api-key]"), true);
  });

  it("generates bounded local diagnostic bundles and denies external export by default", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({ kind: "log", at: new Date(0).toISOString(), name: "first", fields: { message: "one" } });
    await sink.emit({ kind: "audit", at: new Date(0).toISOString(), name: "second", fields: { token: secret } });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "support case", maxRecords: 1 });
    const denied = await sink.createDiagnosticBundle({ target: "external-telemetry", reason: `upload ${secret}` });

    assert.equal(bundle.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.equal(bundle.records.length, 1);
    assert.equal(bundle.selectedRecordCount, 1);
    assert.equal(bundle.totalRecordCount, 2);
    assert.equal(bundle.truncated, true);
    assert.equal(bundle.privacyDecision.action, "allow-local");
    assert.equal(JSON.stringify(bundle).includes(secret), false);
    assert.equal(denied.privacyDecision.action, "deny-export");
    assert.equal(denied.records.length, 0);
    assert.equal(JSON.stringify(denied).includes(secret), false);
  });

  it("honors local diagnostic opt-out", async () => {
    const sink = new InMemoryObservabilitySink({
      ...defaultPrivacySettings,
      localDiagnosticsEnabled: false
    });
    await sink.emit({ kind: "trace", at: new Date(0).toISOString(), name: "dropped", fields: { message: "drop" } });

    assert.deepEqual(await sink.drain(), []);
    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "local disabled" });
    assert.equal(bundle.records.length, 0);
    assert.equal(bundle.privacyDecision.action, "allow-local");
  });

  it("redacts standalone observability artifacts", () => {
    const artifact = redactObservabilityArtifact({ env: `DEEPSEEK_API_KEY=${secret}` });
    assert.equal(JSON.stringify(artifact).includes(secret), false);
    assert.equal(JSON.stringify(artifact).includes("[REDACTED:secret]"), true);
  });

  it("redacts reference pit support bundle material across env auth mcp plugin paths and traces", async () => {
    const fixture = getReferencePitFixture("pit.diagnostic-redaction.support-bundle");
    assert.equal(fixture?.evidenceIds.includes("observability:diagnostic-redaction"), true);
    const sink = new InMemoryObservabilitySink();
    await sink.emit({
      kind: "trace",
      at: new Date(0).toISOString(),
      name: "reference-pit.support-bundle",
      trace: {
        traceId: asId<"trace">("trace-support"),
        spanId: asId<"span">("span-support"),
        correlationId: asId<"correlation">("corr-support"),
        sessionId: asId<"session">("session-support")
      },
      fields: {
        env: `DEEPSEEK_API_KEY=${secret}`,
        headers: { Authorization: `Bearer ${secret}` },
        mcp: { credential: secret, serverId: "mcp-local" },
        plugin: { id: "plugin-local", token: secret, path: "C:/Users/dev/private/repo" },
        tracePayload: { apiKey: secret }
      }
    });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: `support ${secret}` });
    const serialized = JSON.stringify(bundle);

    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("DEEPSEEK_API_KEY=sk-live"), false);
    assert.equal(bundle.redactionSummary.redactedValueCount >= 5, true);
    assert.equal(bundle.redactionSummary.highestPrivacyClass, "secret");
  });

  it("redacts approval diagnostics while preserving replayable ids and pit evidence", async () => {
    const fixture = getReferencePitFixture("pit.diagnostic-redaction.support-bundle");
    assert.equal(fixture?.evidenceIds.includes("observability:diagnostic-redaction"), true);
    const sink = new InMemoryObservabilitySink();
    const approval = approvalDiagnosticRecord();
    await sink.emit({
      kind: "audit",
      at: new Date(0).toISOString(),
      name: "approval.denied",
      fields: {
        approval,
        env: { DEEPSEEK_API_KEY: secret },
        authHeader: `Bearer ${secret}`,
        credentialMaterial: secret,
        file: { path: "C:/Users/dev/private/project/secret.txt", content: `token=${secret}` },
        plugin: { token: secret, permissionDiff: ["capability:write"] },
        extension: { diff: "added workspace write" },
        tracePayload: { apiKey: secret },
        referencePitFixtureIds: ["pit.diagnostic-redaction.support-bundle"]
      }
    });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: `approval ${secret}` });
    const serialized = JSON.stringify(bundle);

    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("token=sk-live"), false);
    assert.equal(serialized.includes("approval:observability"), true);
    assert.equal(serialized.includes("pit.diagnostic-redaction.support-bundle"), true);
    assert.equal(bundle.redactionSummary.highestPrivacyClass, "secret");
  });

  it("keeps self-repair diagnostic evidence local, bounded, and redacted", async () => {
    const sink = new InMemoryObservabilitySink();
    const longStdout = `repair stdout ${"x".repeat(1600)} ${secret}`;
    await sink.emit({
      kind: "repair",
      at: new Date(0).toISOString(),
      name: "agent.repair.verification.completed",
      trace: {
        traceId: asId<"trace">("trace-repair-observability"),
        spanId: asId<"span">("span-repair-observability"),
        correlationId: asId<"correlation">("corr-repair-observability"),
        sessionId: asId<"session">("session-repair-observability")
      },
      fields: {
        classification: {
          classificationId: "repair-classification:observability",
          failureSource: "build-test-error",
          evidenceFingerprints: ["repair:h1"]
        },
        attempt: {
          attemptId: "repair-attempt:observability",
          stopReason: "verification-failed"
        },
        verification: {
          verificationId: "repair-verification:observability",
          command: "npm test",
          stdoutPreview: longStdout,
          stderrPreview: `Bearer ${secret}`,
          providerReasoning: `raw provider diagnosis ${secret}`
        }
      }
    });

    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "repair bundle" });
    const denied = await sink.createDiagnosticBundle({ target: "external-telemetry", reason: `repair upload ${secret}` });
    const serialized = JSON.stringify(bundle);

    assert.equal(bundle.records[0]?.kind, "repair");
    assert.equal(bundle.records[0]?.name, "agent.repair.verification.completed");
    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes(`Bearer ${secret}`), false);
    assert.equal(serialized.includes("raw provider diagnosis"), false);
    assert.equal(serialized.includes("x".repeat(1300)), false);
    assert.equal(serialized.includes("[truncated]"), true);
    assert.equal(bundle.redactionSummary.secretLikeFields.length > 0, true);
    assert.equal(denied.privacyDecision.action, "deny-export");
    assert.equal(denied.records.length, 0);
    assert.equal(JSON.stringify(denied).includes(secret), false);
  });

  it("creates observability.trace-budget evidence from redacted traces and usage totals", async () => {
    const sessionId = asId<"session">("session-trace-budget");
    const sink = new InMemoryObservabilitySink();
    const usage = new InMemoryUsageBudgetManager({ maxInputTokens: 100 });
    await usage.record({ sessionId, inputTokens: 70, outputTokens: 10, costMicros: 200, elapsedMs: 5 });
    await sink.emit({
      kind: "usage",
      at: new Date(0).toISOString(),
      name: "usage.secret",
      fields: { token: secret, inputTokens: 70 }
    });

    const evidence = await createTraceBudgetEvidence(sink, usage, {
      sessionId,
      reason: `budget ${secret}`,
      proposedUsage: { inputTokens: 40 }
    });
    const serialized = JSON.stringify(evidence);

    assert.equal(evidence.familyId, "observability.trace-budget");
    assert.equal(evidence.status, "degraded");
    assert.equal(evidence.budgetAllowed, false);
    assert.equal(evidence.budgetHardLimit, "usage.inputTokens");
    assert.equal(evidence.usageTotal.inputTokens, 70);
    assert.equal(serialized.includes(secret), false);
    assert.match(evidence.replayFingerprint, /^observability\.trace-budget:h[0-9a-f]+$/);
  });
});

function approvalDiagnosticRecord(): ApprovalLifecycleRecord {
  const trace = {
    traceId: asId<"trace">("trace-observability-approval"),
    spanId: asId<"span">("span-observability-approval"),
    correlationId: asId<"correlation">("corr-observability-approval"),
    sessionId: asId<"session">("session-observability-approval")
  };
  return {
    schemaVersion: "1.0.0",
    kind: "approval.denied",
    approvalId: "approval:observability" as ApprovalId,
    sessionId: trace.sessionId,
    trace,
    summary: {
      schemaVersion: "1.0.0",
      title: "Approval denied",
      subject: "observability",
      action: "execute:file.write",
      resource: "core.file.write",
      targetKind: "capability",
      targetLabel: "core.file.write",
      riskSummaries: [{
        schemaVersion: "1.0.0",
        kind: "redaction",
        severity: "critical",
        title: "Secret redaction",
        detail: `Raw ${secret} must not leak.`,
        reasonCodes: ["secret.api-key"],
        referencePitFixtureIds: ["pit.diagnostic-redaction.support-bundle"],
        redaction: { class: "secret", fields: ["detail"] },
        metadata: { credentialMaterial: secret }
      }],
      allowedDecisions: ["deny", "cancel"],
      referencePitFixtureIds: ["pit.diagnostic-redaction.support-bundle"],
      redaction: { class: "internal", fields: ["targetLabel", "riskSummaries.detail"] },
      metadata: {}
    },
    decision: {
      schemaVersion: "1.0.0",
      approvalId: "approval:observability" as ApprovalId,
      approved: false,
      decision: "deny",
      source: "headless-default",
      reason: `Denied ${secret}`,
      reasonCode: "headless.fail_closed",
      auditReference: {
        schemaVersion: "1.0.0",
        traceId: trace.traceId,
        correlationId: trace.correlationId,
        policyDecision: "ask",
        reasonCodes: ["headless.fail_closed"],
        redaction: { class: "internal" }
      },
      trace,
      redaction: { class: "secret", fields: ["reason"] },
      metadata: { token: secret }
    },
    auditReference: {
      schemaVersion: "1.0.0",
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      policyDecision: "ask",
      reasonCodes: ["headless.fail_closed"],
      redaction: { class: "internal" }
    },
    redaction: { class: "secret", fields: ["summary.riskSummaries.detail", "decision.reason"] },
    compatibility: { schemaVersion: "1.0.0" }
  };
}
