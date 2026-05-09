import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { asId, type WorkspaceCheckpointRecord, type WorkspaceTransactionResult } from "@deepseek/platform-contracts";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";

describe("checkpoint undo contracts", () => {
  it("returns contract-safe checkpoint and restore result shapes", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    const manager = new InMemoryWorkspaceStateManager(platform);
    const path = "/workspace/app.ts";
    await platform.writeFile(path, "after");

    const result: WorkspaceTransactionResult = await manager.transact({
      id: "tx-contract",
      sessionId: asId<"session">("session-contract"),
      edits: [{
        path,
        precondition: "exact-match",
        applied: true,
        beforeHash: hashText("before"),
        afterHash: hashText("after")
      }],
      rollback: { content: "before", contentHash: "00000001" }
    });
    const checkpoint: WorkspaceCheckpointRecord | undefined = manager.checkpoints()[0];

    assert.equal(result.checkpoints.length, 1);
    assert.equal(typeof result.checkpoints[0]?.checkpointId, "string");
    assert.equal(checkpoint?.status, "eligible");
    assert.equal(checkpoint?.redaction.class, "sensitive");
    assert.equal("beforeContent" in (checkpoint as object), false);

    const restored = await manager.restoreCheckpoint({ checkpointId: result.checkpoints[0]!.checkpointId });
    assert.equal(restored.ok, true);
    assert.equal(restored.value?.status, "restored");
    assert.equal(restored.value?.redaction.fields?.includes("path"), true);
  });
});

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
