import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { DefaultPolicyEngine } from "@deepseek/policy-sandbox";
import { buildExecutionEnvelope, runtimeEchoCapability, validateExecutionEnvelope } from "@deepseek/runtime";

describe("cross-platform runtime contracts", () => {
  it("exposes stable descriptor shape and provider result metadata", async () => {
    const platform = new FakePlatformRuntime("windows", "C:/repo", {
      environmentKind: "local",
      searchProvider: "select-string",
      secureStorageStatus: "available"
    });
    await platform.writeFile("C:/repo/src/index.ts", "const needle = true;\n");
    const descriptor = await platform.descriptor();
    const search = await platform.searchText("needle", "C:/repo");

    assert.equal(descriptor.os, "windows");
    assert.equal(descriptor.environmentKind, "local");
    assert.equal(descriptor.search.provider, "select-string");
    assert.equal(descriptor.secureStorage.status, "available");
    assert.equal(descriptor.redaction.class, "internal");
    assert.equal(search.length, 1);
    assert.equal(search.every((result) => result.metadata?.selectedProvider === "select-string"), true);
  });

  it("fails closed with diagnostics for unsafe paths and unavailable process execution", async () => {
    const platform = new FakePlatformRuntime("linux", "/workspace/remote", {
      environmentKind: "remote",
      noLocalShell: true,
      secureStorageStatus: "unavailable",
      nativeStatus: "unavailable"
    });

    const rejectedPath = platform.resolveWorkspacePath("/workspace/remote", "../escape");
    const process = await platform.runProcess("echo", ["ok"]);
    const shell = await platform.resolveShell("bash");

    assert.equal(rejectedPath.ok, false);
    assert.equal(rejectedPath.error?.code, "PLATFORM_PATH_OUTSIDE_ROOT");
    assert.equal(process.exitCode, 126);
    assert.equal(process.metadata?.status, "unavailable");
    assert.equal(shell.ok, false);
    assert.equal(shell.error?.code, "SHELL_UNAVAILABLE");
  });

  it("adds platform execution context to envelopes and policy decisions", async () => {
    const platform = new FakePlatformRuntime("linux", "/workspace/remote", {
      environmentKind: "remote",
      noLocalShell: true,
      secureStorageStatus: "unavailable"
    });
    const descriptor = await platform.descriptor();
    const shell = await platform.resolveShell("bash");
    const process = await platform.resolveProcessProvider();
    const envelope = buildExecutionEnvelope({
      request: {
        capabilityId: runtimeEchoCapability.id,
        caller: "contract-test",
        input: { workspaceRoot: "/workspace/remote", cwd: "." },
        timeoutMs: 30_000
      },
      manifest: {
        ...runtimeEchoCapability,
        sideEffect: "process"
      },
      sessionId: asId<"session">("session-platform"),
      workflowId: "workflow-platform",
      taskId: "task-platform",
      invocationId: "invocation-platform",
      trace: {
        traceId: asId<"trace">("trace-platform"),
        spanId: asId<"span">("span-platform"),
        correlationId: asId<"correlation">("corr-platform"),
        sessionId: asId<"session">("session-platform")
      },
      createdAt: new Date(0).toISOString(),
      platformContext: {
        descriptor,
        ...(shell.value ? { shell: shell.value } : {}),
        processProvider: process,
        resourceLocks: [],
        timeoutMs: 30_000,
        environmentScope: "scoped",
        sandboxCapabilities: descriptor.sandbox,
        redaction: { class: "internal" }
      }
    });
    const policy = new DefaultPolicyEngine();
    const decision = await policy.decide({
      subject: "contract-test",
      action: "execute:runtime.echo",
      resource: "runtime.echo",
      metadata: { sideEffect: "process" },
      platform: envelope.policyContext.platform as never
    });

    assert.deepEqual(validateExecutionEnvelope(envelope), []);
    assert.equal((envelope.policyContext.platform as { descriptor?: { environmentKind?: string } }).descriptor?.environmentKind, "remote");
    assert.equal(decision.action, "deny");
    assert.equal(decision.sandbox?.reasonCodes.includes("process.unavailable"), true);
  });
});
