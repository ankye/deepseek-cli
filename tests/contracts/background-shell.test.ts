import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import type { CapabilityExecutionContext, JsonObject } from "@deepseek/platform-contracts";
import { FakeBackgroundTaskManager } from "@deepseek/testing-regression";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defineShellKillTool } from "../../src/packages/core-coding-tools/src/families/shell-process/process-kill/index.js";
import { defineShellOutputTool } from "../../src/packages/core-coding-tools/src/families/shell-process/process-output/index.js";
import { defineShellRunTool } from "../../src/packages/core-coding-tools/src/families/shell-process/shell-run/index.js";

function context(): CapabilityExecutionContext {
  return {
    envelope: {
      invocationId: "inv-bg",
      capabilityId: asId<"capability">("core.shell.run"),
      sessionId: asId<"session">("session-bg"),
      schemaVersion: "1.0.0"
    } as never,
    trace: { traceId: "trace-bg", spanId: "span-bg", schemaVersion: "1.0.0" } as never,
    signal: new AbortController().signal,
    metadata: {}
  };
}

describe("background shell tools", () => {
  it("starts a background task and returns taskId", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const background = new FakeBackgroundTaskManager();
    background.injectedStdout = "hello stdout";
    const tool = defineShellRunTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const result = await tool.execute({ command: "echo", args: ["hi"], runInBackground: true } as JsonObject, context());
    assert.equal(result.ok, true);
    assert.equal(result.value?.evidence.metadata.background, true);
    assert.equal(typeof result.value?.evidence.metadata.taskId, "string");
  });

  it("shell.output returns stored stdout for a task", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const background = new FakeBackgroundTaskManager();
    background.injectedStdout = "build complete";
    const run = defineShellRunTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const started = await run.execute({ command: "npm", args: ["run", "build"], runInBackground: true } as JsonObject, context());
    const taskId = String(started.value?.evidence.metadata.taskId);
    const outputTool = defineShellOutputTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const out = await outputTool.execute({ taskId } as JsonObject, context());
    assert.equal(out.ok, true);
    assert.equal(String(out.value?.evidence.preview?.text ?? "").includes("build complete"), true);
    assert.equal(out.value?.evidence.metadata.done, true);
  });

  it("shell.kill marks the task as killed", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const background = new FakeBackgroundTaskManager();
    const run = defineShellRunTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const started = await run.execute({ command: "sleep", args: ["60"], runInBackground: true } as JsonObject, context());
    const taskId = String(started.value?.evidence.metadata.taskId);
    const killTool = defineShellKillTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const killed = await killTool.execute({ taskId } as JsonObject, context());
    assert.equal(killed.ok, true);
    assert.equal(killed.value?.evidence.metadata.status, "killed");
  });

  it("shell.run without backgroundTasks fails closed when runInBackground=true", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const tool = defineShellRunTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace" });
    const result = await tool.execute({ command: "echo", args: ["x"], runInBackground: true } as JsonObject, context());
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "BACKGROUND_TASKS_UNAVAILABLE");
  });

  it("shell.output returns BACKGROUND_TASK_NOT_FOUND for unknown task", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const background = new FakeBackgroundTaskManager();
    const tool = defineShellOutputTool({ platform: deps.platform, workspaceState: deps.workspaceState, workspaceRoot: "/workspace", backgroundTasks: background });
    const result = await tool.execute({ taskId: "does-not-exist" } as JsonObject, context());
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "BACKGROUND_TASK_NOT_FOUND");
  });
});
