import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import type { AgentSpawner, CapabilityExecutionContext, JsonObject } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, createAgentSpawner, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defineAgentSpawnTool } from "../../src/packages/core-coding-tools/src/tools/agent-spawn/index.js";

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
  });

  it("default toolProjection is read-only when caller omits it", async () => {
    const calls: Array<string | undefined> = [];
    const stub: AgentSpawner = {
      async spawn(input) {
        calls.push(input.toolProjection);
        return {
          childSessionId: asId<"session">("session-child"),
          terminalStatus: "completed",
          assistantText: "stub reply",
          iterations: 1,
          toolCalls: 0,
          diagnostics: []
        };
      }
    };
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineAgentSpawnTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", agentSpawner: stub });
    await tool.execute({ prompt: "anything" } as JsonObject, context());
    assert.deepEqual(calls, ["read-only"]);
  });
});
