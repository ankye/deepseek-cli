import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

describe("core coding tools golden replay", () => {
  it("normalizes and replays deterministic core tool evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const workspaceRoot = "/workspace";
    await deps.platform.writeFile(`${workspaceRoot}/README.md`, "golden core tool\n");
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);
    const runtime = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileRead,
      caller: "golden",
      input: { path: "README.md", workspaceRoot, limitBytes: 8 }
    }));
    const sessionId = runtime[0]?.sessionId;
    assert.ok(sessionId);

    const trace = await deps.regression.normalize({
      name: "core-tool-read",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "capability.completed" }]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal((await deps.regression.assertSemantic(trace, { expectedKind: "capability.completed" })).ok, true);
    assert.deepEqual(
      runtime.map((event) => event.kind),
      [
        "kernel.request.accepted",
        "workflow.opened",
        "execution.envelope.created",
        "policy.decided",
        "sandbox.selected",
        "capability.started",
        "scheduler.queued",
        "scheduler.started",
        "scheduler.completed",
        "capability.output",
        "capability.completed",
        "workflow.closed"
      ]
    );
    const output = runtime.find((event) => event.kind === "capability.output")?.data.output as { evidence?: { preview?: { truncated?: boolean } } } | undefined;
    assert.equal(output?.evidence?.preview?.truncated, true);
    await kernel.shutdown();
  });
});
