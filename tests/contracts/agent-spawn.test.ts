import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import type { AgentSpawner, CapabilityExecutionContext, JsonObject } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, createAgentSpawner, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defineAgentContinueTool } from "../../src/packages/core-coding-tools/src/tools/agent-continue/index.js";
import { defineAgentSpawnTool } from "../../src/packages/core-coding-tools/src/tools/agent-spawn/index.js";
import { defineAgentStopTool } from "../../src/packages/core-coding-tools/src/tools/agent-stop/index.js";

function context(): CapabilityExecutionContext {
  return {
    envelope: {
      invocationId: "inv-spawn",
      capabilityId: asId<"capability">("core.agent.spawn"),
      sessionId: asId<"session">("session-parent"),
      schemaVersion: "1.0.0"
    } as never,
    trace: { traceId: "trace-spawn", spanId: "span-spawn", schemaVersion: "1.0.0" } as never,
    signal: new AbortController().signal,
    metadata: {}
  };
}

describe("core.agent.spawn tool", () => {
  it("fails closed when no agentSpawner registered", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ prompt: "hello sub" } as JsonObject, context());
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "AGENT_SPAWNER_UNAVAILABLE");
  });

  it("runs the sub-agent via injected spawner and returns structured result", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const result = await tool.execute({ prompt: "summarize the repository" } as JsonObject, context());
    assert.equal(result.ok, true, `expected ok, got ${JSON.stringify(result)}`);
    const metadata = result.value?.evidence.metadata;
    assert.equal(metadata?.terminalStatus, "completed");
    assert.equal(typeof metadata?.childSessionId, "string");
    assert.equal(typeof metadata?.iterations, "number");
    assert.equal(typeof metadata?.workerInstanceId, "string");
    assert.equal(typeof metadata?.workOrderId, "string");
    assert.equal(metadata?.agentMode, "worker");
    assert.equal(metadata?.verifierStatus, "partial");
    assert.equal((metadata?.workerResult as { status?: string } | undefined)?.status, "completed");
    assert.equal((metadata?.resultProvenance as { delegationDecision?: { kind?: string; reasonCode?: string } } | undefined)?.delegationDecision?.kind, "spawn");
    assert.equal((metadata?.resultProvenance as { delegationDecision?: { kind?: string; reasonCode?: string } } | undefined)?.delegationDecision?.reasonCode, "parallel-independent-work");
    const parentEvents = await deps.sessions.events(asId<"session">("session-parent"));
    assert.equal(parentEvents.some((event) => event.kind === "agent.worker.launched"), true);
    assert.equal(parentEvents.some((event) => event.kind === "agent.worker.result"), true);
  });

  it("default toolProjection is read-only when caller omits it", async () => {
    const calls: Array<{ toolProjection?: string; targetCount?: number }> = [];
    const stub: AgentSpawner = {
      async spawn(input) {
        calls.push({
          ...(input.toolProjection ? { toolProjection: input.toolProjection } : {}),
          ...(input.workOrder ? { targetCount: input.workOrder.targets.length } : {})
        });
        return {
          childSessionId: asId<"session">("session-child"),
          terminalStatus: "completed",
          assistantText: "stub reply",
          iterations: 1,
          toolCalls: 0,
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          resultProvenance: { source: "stub" },
          diagnostics: []
        };
      }
    };
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: stub });
    await tool.execute({ prompt: "anything" } as JsonObject, context());
    assert.deepEqual(calls, [{ toolProjection: "read-only", targetCount: 1 }]);
  });

  it("rejects lazy delegated work orders before worker launch", async () => {
    let called = false;
    const stub: AgentSpawner = {
      async spawn() {
        called = true;
        throw new Error("should not spawn");
      }
    };
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: stub });
    const result = await tool.execute({
      prompt: "worker task",
      workOrder: {
        schemaVersion: "1.0.0",
        workOrderId: "work-order:lazy",
        mode: "worker",
        purpose: "Continue delegated work.",
        originalUserGoal: "Ship the change.",
        taskSummary: "continue from prior findings",
        evidenceIds: [],
        targets: [{ kind: "file", id: "readme", path: "README.md" }],
        allowedTools: ["file.read"],
        permissionScope: { toolProjection: "read-only" },
        doneCriteria: ["Report based on prior findings."],
        verificationExpectations: ["Parent checks result."],
        redaction: { class: "internal" },
        compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" }
      }
    } as JsonObject, context());

    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "AGENT_WORK_ORDER_LAZY_DELEGATION");
    assert.equal(called, false);
  });

  it("preserves explicit implementer work order and write projection metadata", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const result = await tool.execute({
      prompt: "implement README change",
      agentMode: "implementer",
      toolProjection: "read-write",
      workOrder: {
        schemaVersion: "1.0.0",
        workOrderId: "work-order:implementer",
        parentSessionId: asId<"session">("session-parent"),
        mode: "implementer",
        purpose: "Implement bounded README change.",
        originalUserGoal: "implement README change",
        taskSummary: "Update README with a bounded change.",
        evidenceIds: ["evidence:readme"],
        targets: [{ kind: "file", id: "readme", path: "README.md" }],
        allowedTools: ["file.read", "file.edit"],
        permissionScope: { toolProjection: "read-write", writeScope: ["README.md"] },
        doneCriteria: ["README is updated only within declared scope."],
        verificationExpectations: ["Parent verifier checks git diff."],
        redaction: { class: "internal" },
        compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" }
      }
    } as JsonObject, context());

    assert.equal(result.ok, true, `expected ok, got ${JSON.stringify(result)}`);
    const metadata = result.value?.evidence.metadata;
    assert.equal(metadata?.workOrderId, "work-order:implementer");
    assert.equal(metadata?.agentMode, "implementer");
    assert.equal((metadata?.workerResult as { evidenceIds?: readonly string[] } | undefined)?.evidenceIds?.includes("evidence:readme"), true);
  });

  it("continues and stops workers through governed lifecycle tools", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const spawnTool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const continueTool = defineAgentContinueTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const stopTool = defineAgentStopTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });

    const spawned = await spawnTool.execute({ prompt: "inspect package structure" } as JsonObject, context());
    assert.equal(spawned.ok, true);
    const workerInstanceId = String(spawned.value?.evidence.metadata.workerInstanceId);
    const continued = await continueTool.execute({
      workerInstanceId,
      prompt: "continue with the same package structure task",
      workOrderId: "work-order:continue-1",
      contextOverlapScore: 0.92,
      reasonCode: "high-context-overlap"
    } as JsonObject, context());
    assert.equal(continued.ok, true, `expected continue ok, got ${JSON.stringify(continued)}`);
    assert.equal(continued.value?.evidence.metadata.continuationOf, workerInstanceId);
    assert.equal(continued.value?.evidence.metadata.workOrderId, "work-order:continue-1");
    const continueDecision = (continued.value?.evidence.metadata.resultProvenance as { delegationDecision?: { kind?: string; reasonCode?: string; contextOverlapScore?: number } } | undefined)?.delegationDecision;
    assert.equal(continueDecision?.kind, "continue");
    assert.equal(continueDecision?.reasonCode, "high-context-overlap");
    assert.equal(continueDecision?.contextOverlapScore, 0.92);

    const stopped = await stopTool.execute({
      workerInstanceId,
      stopReason: "user-changed-request",
      reason: "User changed requirements."
    } as JsonObject, context());
    assert.equal(stopped.ok, true, `expected stop ok, got ${JSON.stringify(stopped)}`);
    assert.equal(stopped.value?.evidence.metadata.status, "stopped");
    assert.equal(stopped.value?.evidence.metadata.stopReason, "user-changed-request");
    assert.equal((stopped.value?.evidence.metadata.resultProvenance as { delegationDecision?: { kind?: string } } | undefined)?.delegationDecision?.kind, "stop");
    const parentEvents = await deps.sessions.events(asId<"session">("session-parent"));
    assert.equal(parentEvents.some((event) => event.kind === "agent.worker.continued"), true);
    assert.equal(parentEvents.some((event) => event.kind === "agent.worker.stopped"), true);
    assert.equal(parentEvents.filter((event) => event.kind === "agent.worker.result").length >= 2, true);
  });

  it("can stop a wrong-direction worker and continue with a corrected work order", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const spawnTool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const continueTool = defineAgentContinueTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const stopTool = defineAgentStopTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });

    const spawned = await spawnTool.execute({ prompt: "work on the wrong target file" } as JsonObject, context());
    assert.equal(spawned.ok, true);
    const workerInstanceId = asId<"agentInstance">(String(spawned.value?.evidence.metadata.workerInstanceId));

    const stopped = await stopTool.execute({
      workerInstanceId,
      stopReason: "wrong-direction",
      reason: "The worker was targeting the wrong file."
    } as JsonObject, context());
    assert.equal(stopped.ok, true);
    const stoppedInstance = await deps.agents.getInstance(workerInstanceId);
    assert.equal(stoppedInstance?.lifecycleState, "stopped");

    const continued = await continueTool.execute({
      workerInstanceId,
      prompt: "continue with the corrected target file",
      workOrder: {
        schemaVersion: "1.0.0",
        workOrderId: "work-order:corrected-target",
        parentSessionId: asId<"session">("session-parent"),
        mode: "worker",
        purpose: "Continue after wrong-direction stop with corrected target.",
        originalUserGoal: "work on the corrected target file",
        taskSummary: "Use the corrected target path instead of the prior wrong direction.",
        evidenceIds: ["evidence:wrong-direction-stop"],
        targets: [{ kind: "file", id: "corrected", path: "README.md" }],
        allowedTools: ["file.read"],
        permissionScope: { toolProjection: "read-only" },
        doneCriteria: ["Report only on the corrected target."],
        verificationExpectations: ["Parent verifies the corrected target was used."],
        redaction: { class: "internal" },
        compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" }
      },
      reasonCode: "wrong-approach-retry",
      contextOverlapScore: 0.35
    } as JsonObject, context());

    assert.equal(continued.ok, true, `expected continue ok, got ${JSON.stringify(continued)}`);
    assert.equal(continued.value?.evidence.metadata.continuationOf, workerInstanceId);
    assert.equal(continued.value?.evidence.metadata.workOrderId, "work-order:corrected-target");
    const previousAfterContinue = await deps.agents.getInstance(workerInstanceId);
    assert.equal(previousAfterContinue?.lifecycleEvents.some((event) => event.transition === "stop"), true);
    assert.equal(previousAfterContinue?.lifecycleEvents.some((event) => event.transition === "continue"), true);
    const decision = (continued.value?.evidence.metadata.resultProvenance as { delegationDecision?: { kind?: string; reasonCode?: string; contextOverlapScore?: number } } | undefined)?.delegationDecision;
    assert.equal(decision?.kind, "continue");
    assert.equal(decision?.reasonCode, "wrong-approach-retry");
    assert.equal(decision?.contextOverlapScore, 0.35);
  });

  it("spawns verifier with fresh-verification decision and proof-oriented scope", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const result = await tool.execute({
      prompt: "verify generated artifact independently",
      agentMode: "verifier",
      workOrder: {
        schemaVersion: "1.0.0",
        workOrderId: "work-order:verifier",
        parentSessionId: asId<"session">("session-parent"),
        mode: "verifier",
        purpose: "Verify generated artifact independently.",
        originalUserGoal: "Ship generated artifact.",
        taskSummary: "Inspect artifact evidence without implementation anchoring.",
        evidenceIds: ["evidence:artifact"],
        targets: [{ kind: "file", id: "artifact", path: "website/index.html" }],
        allowedTools: ["file.read", "test.run"],
        permissionScope: { toolProjection: "read-only", independence: "fresh-context" },
        doneCriteria: ["Return pass/fail/partial with evidence ids."],
        verificationExpectations: ["Cite checked artifact evidence."],
        redaction: { class: "internal" },
        compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" }
      }
    } as JsonObject, context());

    assert.equal(result.ok, true, `expected verifier spawn ok, got ${JSON.stringify(result)}`);
    const metadata = result.value?.evidence.metadata;
    assert.equal(metadata?.agentMode, "verifier");
    const decision = (metadata?.resultProvenance as { delegationDecision?: { reasonCode?: string } } | undefined)?.delegationDecision;
    assert.equal(decision?.reasonCode, "fresh-verification");
    const instance = await deps.agents.getInstance(asId<"agentInstance">(String(metadata?.workerInstanceId)));
    assert.equal(instance?.scopes.capabilities.includes("test.run"), true);
    assert.equal(instance?.scopes.capabilities.includes("file.write"), false);
  });

  it("can continue after a failed worker result while preserving failure lineage", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await registerRuntimeCoreTools(deps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(deps);
    const spawner = createAgentSpawner(deps, kernel, "/workspace");
    const definition = await deps.agents.getDefault();
    const failed = await deps.agents.createInstance(definition.id, asId<"session">("session-failed-worker"), {
      mode: "worker",
      parentSessionId: asId<"session">("session-parent"),
      workOrderId: "work-order:failed"
    });
    await deps.agents.transitionInstance(failed.id, { transition: "fail", reason: "worker failed before follow-up" });
    const continueTool = defineAgentContinueTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: spawner });
    const continued = await continueTool.execute({
      workerInstanceId: failed.id,
      prompt: "retry failed worker with targeted correction",
      workOrderId: "work-order:retry-failed",
      reasonCode: "high-context-overlap",
      contextOverlapScore: 0.81
    } as JsonObject, context());

    assert.equal(continued.ok, true, `expected continue ok, got ${JSON.stringify(continued)}`);
    assert.equal(continued.value?.evidence.metadata.continuationOf, failed.id);
    const previousAfterContinue = await deps.agents.getInstance(failed.id);
    assert.equal(previousAfterContinue?.lifecycleEvents.some((event) => event.transition === "fail"), true);
    assert.equal(previousAfterContinue?.lifecycleEvents.some((event) => event.transition === "continue"), true);
  });
});
