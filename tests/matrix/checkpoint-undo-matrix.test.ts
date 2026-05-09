import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { createFakePlatformMatrix } from "@deepseek/testing-regression";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";

describe("checkpoint undo platform matrix", () => {
  it("rejects stale restores consistently across writable fake platforms", async () => {
    for (const platform of createFakePlatformMatrix()) {
      if ((await platform.descriptor()).sandbox.filesystem.readOnly) continue;
      const workspaceRoot = platform.os === "windows" ? "C:/workspace/windows" : `/workspace/${platform.environmentKind}`;
      const path = `${workspaceRoot}/app.ts`;
      const manager = new InMemoryWorkspaceStateManager(platform);
      await platform.writeFile(path, "after");
      const result = await manager.transact({
        id: `tx-${platform.os}-${platform.environmentKind}`,
        sessionId: asId<"session">("session-matrix-checkpoint"),
        edits: [{ path, applied: true, precondition: "exact-match", beforeHash: hashText("before"), afterHash: hashText("after") }],
        rollback: { content: "before", contentHash: hashText("before") }
      });

      await platform.writeFile(path, "newer");
      const restored = await manager.restoreCheckpoint({ checkpointId: result.checkpoints[0]!.checkpointId });
      assert.equal(restored.ok, false);
      assert.equal(restored.error?.code, "CHECKPOINT_STALE_FILE");
      assert.equal(await platform.readFile(path), "newer");
    }
  });
});

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
