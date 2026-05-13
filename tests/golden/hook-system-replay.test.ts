import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createHookOutput } from "@deepseek/hook-system";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("hook system golden replay", () => {
  it("normalizes hook ordering, invocation, and output evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.hooks.registerHook(
      {
        id: asId<"hook">("hook-golden"),
        name: "golden",
        version: "1.0.0",
        point: "user-input.before",
        source: "built-in",
        trust: "trusted",
        ordering: { priority: 1 },
        timeoutMs: 100,
        failurePolicy: "continue",
        isolation: "in-process-observe-only",
        permissions: [],
        inputSchema: {},
        outputSchema: {}
      },
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-golden"), "observation", { checked: true }) })
    );

    const order = await deps.hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before" });
    const invocation = await deps.hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: { prompt: "golden" } });
    const trace = await deps.regression.normalize({
      name: "hook-system",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: [],
      runtime: [
        {
          kind: "workflow.step",
          sessionId: asId<"session">("session-hook-golden"),
          createdAt: new Date(0).toISOString(),
          trace: {
            traceId: asId<"trace">("trace-hook-golden"),
            spanId: asId<"span">("span-hook-golden"),
            correlationId: asId<"correlation">("corr-hook-golden"),
            sessionId: asId<"session">("session-hook-golden")
          },
          data: {
            hookOrder: order.replayFingerprint,
            hookInvocation: invocation.replayFingerprint
          }
        }
      ],
      sessions: [],
      assertions: [{ expectedKind: "workflow.step" }]
    });
    const replay = await deps.regression.replay(trace);

    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal(invocation.status, "completed");
    assert.equal(invocation.executions[0]?.outputs[0]?.kind, "observation");
  });
});
