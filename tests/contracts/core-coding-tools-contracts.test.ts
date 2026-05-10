import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { coreToolIds, coreToolManifests, registerCoreCodingTools } from "@deepseek/core-coding-tools";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { asId } from "@deepseek/platform-contracts";
import type { CapabilityExecutionContext, CoreToolResult, ExecutionEnvelope, SerializableResult, TraceContext } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";

const workspaceRoot = "/workspace";

describe("core coding tool contracts", () => {
  it("defines stable manifests with schema, replay, timeout, projection, and compatibility metadata", () => {
    const manifests = coreToolManifests();
    const ids = manifests.map((manifest) => String(manifest.id));

    assert.deepEqual(ids, [
      "core.file.read",
      "core.file.write",
      "core.file.edit",
      "core.file.list",
      "core.search.text",
      "core.shell.run",
      "core.shell.output",
      "core.shell.kill",
      "core.git.status",
      "core.git.diff",
      "core.test.run",
      "core.todo.plan",
      "core.web.fetch",
      "core.web.search",
      "core.agent.spawn"
    ]);
    for (const manifest of manifests) {
      assert.equal(manifest.enabled, true);
      assert.equal(typeof manifest.description, "string");
      assert.equal(typeof manifest.inputSchema.type, "string");
      assert.equal(typeof manifest.outputSchema.type, "string");
      assert.equal(typeof manifest.timeoutMs, "number");
      assert.equal(manifest.replayPolicy?.replayable, true);
      assert.equal(manifest.projection?.modelVisible, true);
      assert.equal(manifest.projection?.executorVisible, false);
      assert.equal(manifest.compatibility?.schemaVersion, "1.0.0");
    }
  });

  it("projects model-visible schemas while executor bindings remain registry-only", async () => {
    const registry = new InMemoryCapabilityRegistry();
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await registerCoreCodingTools(registry, { platform, workspaceState: new InMemoryWorkspaceStateManager(), workspaceRoot });

    const modelVisible = await registry.listModelVisible();
    assert.equal(modelVisible.some((manifest) => manifest.id === coreToolIds.fileRead), true);
    assert.equal("execute" in modelVisible[0]!, false);
    const direct = await registry.execute(coreToolIds.fileRead, { path: "README.md", workspaceRoot });
    assert.equal(direct.ok, false);
    assert.equal(direct.error?.code, "CAPABILITY_CONTEXT_REQUIRED");
    assert.equal(typeof (await registry.resolveExecutable(coreToolIds.fileRead))?.execute, "function");
  });

  it("keeps workspace edit transaction evidence replay-safe and records only successful mutations", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const workspaceState = new InMemoryWorkspaceStateManager(platform);
    const registry = new InMemoryCapabilityRegistry();
    await platform.writeFile(`${workspaceRoot}/app.ts`, "before");
    await registerCoreCodingTools(registry, { platform, workspaceState, workspaceRoot });

    const binding = await registry.resolveExecutable(coreToolIds.fileEdit);
    assert.ok(binding);
    const result = await binding.execute(
      { path: "app.ts", expected: "before", replacement: "after", workspaceRoot },
      context(coreToolIds.fileEdit)
    ) as SerializableResult<CoreToolResult>;

    assert.equal(result.ok, true);
    const transaction = result.value?.evidence.metadata.transaction as { beforeHash?: string; afterHash?: string; rollback?: { content?: string; contentHash?: string }; redaction?: { fields?: readonly string[] } } | undefined;
    const checkpoint = result.value?.evidence.metadata.checkpoint as { checkpointId?: string; beforeHash?: string; afterHash?: string } | undefined;
    assert.ok(transaction);
    assert.equal(transaction.beforeHash !== transaction.afterHash, true);
    assert.equal(transaction.rollback?.content, undefined);
    assert.equal(typeof transaction.rollback?.contentHash, "string");
    assert.equal(transaction.redaction?.fields?.includes("rollback.content"), true);
    assert.equal(typeof checkpoint?.checkpointId, "string");
    assert.equal(workspaceState.records().length, 1);
    assert.equal(workspaceState.checkpoints().length, 1);

    const failed = await binding.execute(
      { path: "app.ts", expected: "missing", replacement: "bad", workspaceRoot },
      context(coreToolIds.fileEdit)
    ) as SerializableResult<CoreToolResult>;
    assert.equal(failed.ok, false);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "after");
    assert.equal(workspaceState.records().length, 1);
  });
});

function context(capabilityId: typeof coreToolIds.fileEdit | typeof coreToolIds.fileRead): CapabilityExecutionContext {
  const trace: TraceContext = {
    traceId: asId<"trace">("trace-contract"),
    spanId: asId<"span">("span-contract"),
    correlationId: asId<"correlation">("corr-contract"),
    sessionId: asId<"session">("session-contract")
  };
  return {
    envelope: {
      invocationId: "invocation-contract",
      capabilityId,
      capabilityVersion: "1.0.0",
      kind: "capability",
      caller: "contract",
      sessionId: asId<"session">("session-contract"),
      inputSchema: {},
      outputSchema: {},
      redactionClass: "internal",
      provenance: {},
      trust: "trusted",
      permissions: [],
      sideEffect: "write",
      policyContext: {},
      approvalRequired: false,
      resourceLocks: [],
      timeoutMs: 30_000,
      cancellation: {},
      retryPolicy: {},
      idempotency: {},
      trace,
      telemetry: {},
      replayPolicy: {},
      ...securityFields(capabilityId),
      createdAt: new Date(0).toISOString()
    } satisfies ExecutionEnvelope,
    trace,
    signal: new AbortController().signal,
    metadata: {}
  };
}

function securityFields(capabilityId: typeof coreToolIds.fileEdit | typeof coreToolIds.fileRead) {
  const resourceScope = analyzeResourceScope({}, "write");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "write", resourceScope, timeoutMs: 30_000, permissions: [] });
  return {
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "test",
      reasonCode: "test.core-tool-contract",
      subject: "contract",
      resource: String(capabilityId),
      sandboxProfile: sandboxRequirements.profile
    })
  };
}
