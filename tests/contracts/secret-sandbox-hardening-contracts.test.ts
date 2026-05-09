import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId, SECRET_SANDBOX_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { CapabilityManifest, PlatformExecutionContext, SandboxCapabilityMatrix } from "@deepseek/platform-contracts";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision
} from "@deepseek/policy-sandbox";
import { buildExecutionEnvelope, runtimeEchoCapability, validateExecutionEnvelope } from "@deepseek/runtime";

describe("secret sandbox hardening contracts", () => {
  it("serializes secret, sandbox, and audit DTOs without raw secret evidence", () => {
    const secret = createSecretRedactionDecision({ apiKey: "sk-live-1234567890" });
    const resourceScope = analyzeResourceScope({ path: "README.md", workspaceRoot: "/workspace" }, "write");
    const sandbox = createSandboxRequirement({ sideEffect: "write", resourceScope, timeoutMs: 30_000, permissions: ["workspace:write"] });
    const audit = createSandboxAuditEvidence({
      decision: "deny",
      reasonCode: "secret.raw-exposure",
      subject: "contract",
      resource: "core.file.write",
      sandboxProfile: sandbox.profile,
      metadata: { apiKey: "sk-live-1234567890" }
    });
    const serialized = JSON.stringify({ secret, resourceScope, sandbox, audit });

    assert.equal(secret.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(sandbox.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(audit.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(serialized.includes("sk-live-1234567890"), false);
    assert.equal(serialized.includes("[REDACTED:secret]") || serialized.includes("[REDACTED:api-key]"), true);
  });

  it("requires execution envelopes to carry secret, resource, sandbox, and audit metadata", () => {
    const resourceScope = analyzeResourceScope({ workspaceRoot: "/workspace", cwd: "." }, "process");
    const sandboxCapabilities = capabilityMatrix();
    const platformContext: PlatformExecutionContext = {
      descriptor: { sandbox: sandboxCapabilities, degradedReasons: [] } as never,
      sandboxCapabilities,
      resourceLocks: [],
      timeoutMs: 30_000,
      environmentScope: "scoped",
      redaction: { class: "internal" }
    };
    const manifest: CapabilityManifest = {
      ...runtimeEchoCapability,
      sideEffect: "process",
      permissions: ["process:test"]
    };
    const envelope = buildExecutionEnvelope({
      request: {
        capabilityId: runtimeEchoCapability.id,
        caller: "contract",
        input: { workspaceRoot: "/workspace", cwd: "." },
        timeoutMs: 30_000
      },
      manifest,
      sessionId: asId<"session">("session-secret-contract"),
      workflowId: "workflow-secret-contract",
      taskId: "task-secret-contract",
      invocationId: "invocation-secret-contract",
      trace: {
        traceId: asId<"trace">("trace-secret-contract"),
        spanId: asId<"span">("span-secret-contract"),
        correlationId: asId<"correlation">("corr-secret-contract"),
        sessionId: asId<"session">("session-secret-contract")
      },
      createdAt: new Date(0).toISOString(),
      platformContext: { ...platformContext, resourceScope }
    });

    assert.deepEqual(validateExecutionEnvelope(envelope), []);
    assert.equal(envelope.secretExposure.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(envelope.resourceScope.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(envelope.sandboxRequirements.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
    assert.equal(envelope.audit.schemaVersion, SECRET_SANDBOX_SCHEMA_VERSION);
  });
});

function capabilityMatrix(): SandboxCapabilityMatrix {
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    filesystem: { read: true, write: true, readOnly: false, traversalPolicy: "workspace-root", rollback: true },
    processExecution: { execute: true, providerStatus: "available" },
    shell: { execute: true, profile: "bash", providerStatus: "available" },
    network: { access: true, providerStatus: "available", hostScopes: [] },
    environment: { access: "scoped" },
    native: { access: false, providerStatuses: {} },
    secureStorage: { status: "degraded", scopedReferences: true },
    degraded: false,
    degradedReasons: [],
    redaction: { class: "internal" }
  };
}
