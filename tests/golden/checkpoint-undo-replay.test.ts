import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { collectRuntimeEvents, createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

describe("checkpoint undo golden replay", () => {
  it("normalizes checkpoint evidence without raw rollback content", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const workspaceRoot = "/workspace";
    await deps.platform.writeFile(`${workspaceRoot}/secret.txt`, "DEEPSEEK_API_KEY=changed\n");
    await registerDeterministicCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);

    const runtime = await collectRuntimeEvents(kernel.execute({
      capabilityId: coreToolIds.fileEdit,
      caller: "golden",
      input: {
        path: "secret.txt",
        expected: "changed",
        replacement: "redacted",
        workspaceRoot
      }
    }));
    const sessionId = runtime[0]?.sessionId;
    assert.ok(sessionId);

    const trace = await deps.regression.normalize({
      name: "checkpoint-undo",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "capability.completed" }]
    });
    const serialized = JSON.stringify(trace);
    assert.equal(serialized.includes("DEEPSEEK_API_KEY=changed"), false);
    assert.match(serialized, /checkpoint/);
    assert.equal((await deps.regression.replay(trace)).ok, true);
    await kernel.shutdown();
  });
});
