import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";
import { asId } from "@deepseek/platform-contracts";
import type { CapabilityExecutionContext, CoreToolResult, ExecutionEnvelope, JsonObject, SerializableResult, TraceContext } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";
import { coreToolIds, registerCoreCodingTools } from "./index.js";

const workspaceRoot = "/workspace";

async function invoke(
  id: (typeof coreToolIds)[keyof typeof coreToolIds],
  input: JsonObject,
  options: { readonly platform?: FakePlatformRuntime; readonly workspaceState?: InMemoryWorkspaceStateManager } = {}
): Promise<SerializableResult<CoreToolResult>> {
  const platform = options.platform ?? new FakePlatformRuntime("fake", workspaceRoot);
  const workspaceState = options.workspaceState ?? new InMemoryWorkspaceStateManager();
  const registry = new InMemoryCapabilityRegistry();
  await registerCoreCodingTools(registry, { platform, workspaceState, workspaceRoot });
  const binding = await registry.resolveExecutable(id);
  assert.ok(binding);
  return binding.execute(input, context(id)) as Promise<SerializableResult<CoreToolResult>>;
}

function context(capabilityId: (typeof coreToolIds)[keyof typeof coreToolIds]): CapabilityExecutionContext {
  const trace: TraceContext = {
    traceId: asId<"trace">("trace-core-tool"),
    spanId: asId<"span">("span-core-tool"),
    correlationId: asId<"correlation">("corr-core-tool"),
    sessionId: asId<"session">("session-core-tool")
  };
  return {
    envelope: {
      invocationId: "invocation-core-tool",
      capabilityId,
      capabilityVersion: "1.0.0",
      kind: "capability",
      caller: "unit",
      sessionId: asId<"session">("session-core-tool"),
      inputSchema: {},
      outputSchema: {},
      redactionClass: "internal",
      provenance: {},
      trust: "trusted",
      permissions: [],
      sideEffect: "read",
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

function securityFields(capabilityId: (typeof coreToolIds)[keyof typeof coreToolIds]) {
  const resourceScope = analyzeResourceScope({}, "read");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "read", resourceScope, timeoutMs: 30_000, permissions: [] });
  return {
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "test",
      reasonCode: "test.core-tool-context",
      subject: "unit",
      resource: String(capabilityId),
      sandboxProfile: sandboxRequirements.profile
    })
  };
}

describe("core coding tool executors", () => {
  it("reads, lists, searches, and bounds file evidence", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot, { searchProvider: "js" });
    await platform.writeFile(`${workspaceRoot}/README.md`, `alpha\n${"x".repeat(64)}`);

    const read = await invoke(coreToolIds.fileRead, { path: "README.md", workspaceRoot, limitBytes: 12 }, { platform });
    assert.equal(read.ok, true);
    assert.equal(read.value?.evidence.preview?.truncated, true);
    assert.deepEqual(read.value?.evidence.affectedPaths, [`${workspaceRoot}/README.md`]);

    const list = await invoke(coreToolIds.fileList, { pattern: "README", workspaceRoot }, { platform });
    assert.equal(list.ok, true);
    assert.match(list.value?.evidence.preview?.text ?? "", /README\.md/);

    const search = await invoke(coreToolIds.searchText, { pattern: "alpha", workspaceRoot }, { platform });
    assert.equal(search.ok, true);
    assert.equal(search.value?.evidence.provider?.selectedProvider, "js");
  });

  it("writes and exact-edits with transactions, then rejects ambiguous edits without mutation", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const workspaceState = new InMemoryWorkspaceStateManager(platform);

    const write = await invoke(coreToolIds.fileWrite, { path: "app.ts", content: "one two one", workspaceRoot }, { platform, workspaceState });
    assert.equal(write.ok, true);

    const rejected = await invoke(coreToolIds.fileEdit, { path: "app.ts", expected: "one", replacement: "three", workspaceRoot }, { platform, workspaceState });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.error?.code, "EDIT_PRECONDITION_FAILED");
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one two one");

    const edited = await invoke(coreToolIds.fileEdit, { path: "app.ts", expected: "two", replacement: "three", workspaceRoot }, { platform, workspaceState });
    assert.equal(edited.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one three one");
    assert.equal(workspaceState.records().length, 2);
    const checkpoint = edited.value?.evidence.metadata.checkpoint as { checkpointId?: string; beforeHash?: string; afterHash?: string } | undefined;
    assert.equal(typeof checkpoint?.checkpointId, "string");
    assert.notEqual(checkpoint?.beforeHash, checkpoint?.afterHash);
    const undo = await workspaceState.undoLatest({ path: `${workspaceRoot}/app.ts` });
    assert.equal(undo.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one two one");
  });

  it("rejects path escapes before reading or mutating", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/safe.txt`, "safe");

    const read = await invoke(coreToolIds.fileRead, { path: "../secret.txt", workspaceRoot }, { platform });
    assert.equal(read.ok, false);
    assert.equal(read.error?.code, "PATH_REJECTED");

    const write = await invoke(coreToolIds.fileWrite, { path: "../secret.txt", content: "bad", workspaceRoot }, { platform });
    assert.equal(write.ok, false);
    await assert.rejects(() => platform.readFile("/secret.txt"));
  });

  it("runs shell, git, test, and todo tools with structured evidence", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);

    const shell = await invoke(coreToolIds.shellRun, { command: "echo", args: ["ok"], workspaceRoot }, { platform });
    assert.equal(shell.ok, true);
    assert.equal(shell.value?.evidence.provider?.selectedProvider, "argv");

    const git = await invoke(coreToolIds.gitStatus, { workspaceRoot }, { platform });
    assert.equal(git.ok, true);
    assert.equal(git.value?.evidence.metadata.gitMode, "status");

    const test = await invoke(coreToolIds.testRun, { command: "npm", args: ["test"], workspaceRoot, intent: "unit" }, { platform });
    assert.equal(test.ok, true);
    assert.equal(test.value?.evidence.metadata.intent, "unit");

    const plan = await invoke(coreToolIds.todoPlan, { items: [{ id: "1", title: "ship", status: "completed" }] }, { platform });
    assert.equal(plan.ok, true);
    assert.equal(plan.value?.evidence.metadata.count, 1);
  });

  it("reports platform-unavailable process diagnostics", async () => {
    const platform = new FakePlatformRuntime("linux", workspaceRoot, { environmentKind: "remote", noLocalShell: true });
    const result = await invoke(coreToolIds.shellRun, { command: "echo", args: ["ok"], workspaceRoot }, { platform });
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "PROCESS_UNAVAILABLE");
  });
});
