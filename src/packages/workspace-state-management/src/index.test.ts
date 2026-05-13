import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { asId } from "@deepseek/platform-contracts";
import { InMemoryWorkspaceStateManager } from "./index.js";

const workspaceRoot = "/workspace";
const sessionId = asId<"session">("session-checkpoint");

describe("workspace checkpoint and undo manager", () => {
  it("creates checkpoint records and restores matching files", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const path = `${workspaceRoot}/app.ts`;
    await platform.writeFile(path, "after");

    const transaction = await manager.transact(transactionFor(path, "before", "after", "tx-restore"));
    assert.equal(transaction.applied, true);
    assert.equal(transaction.checkpoints.length, 1);
    assert.equal(manager.records()[0]?.rollback.content, undefined);

    const restored = await manager.restoreCheckpoint({ checkpointId: transaction.checkpoints[0]!.checkpointId });
    assert.equal(restored.ok, true);
    assert.equal(restored.value?.status, "restored");
    assert.equal(await platform.readFile(path), "before");
    assert.equal(manager.checkpoints()[0]?.status, "restored");
  });

  it("rejects stale restores without overwriting newer content", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const path = `${workspaceRoot}/app.ts`;
    await platform.writeFile(path, "after");
    const transaction = await manager.transact(transactionFor(path, "before", "after", "tx-stale"));

    await platform.writeFile(path, "user edit");
    const restored = await manager.restoreCheckpoint({ checkpointId: transaction.checkpoints[0]!.checkpointId });
    assert.equal(restored.ok, false);
    assert.equal(restored.error?.code, "CHECKPOINT_STALE_FILE");
    assert.equal(await platform.readFile(path), "user edit");
  });

  it("undoes the latest eligible checkpoint within scope", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const first = `${workspaceRoot}/first.ts`;
    const second = `${workspaceRoot}/second.ts`;
    await platform.writeFile(first, "after first");
    await platform.writeFile(second, "after second");
    await manager.transact(transactionFor(first, "before first", "after first", "tx-first"));
    await manager.transact(transactionFor(second, "before second", "after second", "tx-second"));

    const undo = await manager.undoLatest({ sessionId });
    assert.equal(undo.ok, true);
    assert.equal(undo.value?.checkpoint?.path, second);
    assert.equal(await platform.readFile(first), "after first");
    assert.equal(await platform.readFile(second), "before second");
  });

  it("keeps secret rollback content out of public records", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const path = `${workspaceRoot}/.env`;
    const secret = "DEEPSEEK_API_KEY=sk-test-secret";
    await platform.writeFile(path, "DEEPSEEK_API_KEY=changed");

    const result = await manager.transact(transactionFor(path, secret, "DEEPSEEK_API_KEY=changed", "tx-secret"));
    const serialized = JSON.stringify({
      transaction: result,
      records: manager.records(),
      checkpoints: manager.checkpoints()
    });
    assert.equal(serialized.includes(secret), false);
    assert.equal(result.checkpoints[0]?.beforeHash, hashText(secret));
  });

  it("fails closed when restore has no platform boundary", async () => {
    const manager = new InMemoryWorkspaceStateManager();
    const path = `${workspaceRoot}/app.ts`;
    const result = await manager.transact(transactionFor(path, "before", "after", "tx-no-platform"));

    const restored = await manager.restoreCheckpoint({ checkpointId: result.checkpoints[0]!.checkpointId });
    assert.equal(restored.ok, false);
    assert.equal(restored.error?.code, "CHECKPOINT_PLATFORM_UNAVAILABLE");
  });

  it("reverts checkpoints produced by a target request", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const first = `${workspaceRoot}/first.ts`;
    const second = `${workspaceRoot}/second.ts`;
    await platform.writeFile(first, "after first");
    await platform.writeFile(second, "after second");
    await manager.transact(transactionFor(first, "before first", "after first", "tx-req-first", { requestId: "req-1", turnId: "turn-1" }));
    await manager.transact(transactionFor(second, "before second", "after second", "tx-req-second", { requestId: "req-1", turnId: "turn-1" }));

    const reverted = await manager.revertRequest({ target: { requestId: "req-1" } });

    assert.equal(reverted.ok, true);
    assert.equal(reverted.value?.status, "restored");
    assert.equal(reverted.value?.eventKind, "workspace.request.reverted");
    assert.equal(reverted.value?.contextProjection.reverted, true);
    assert.equal(reverted.value?.contextProjection.targetRequestId, "req-1");
    assert.deepEqual(reverted.value?.restoredPaths, [first, second]);
    assert.equal(await platform.readFile(first), "before first");
    assert.equal(await platform.readFile(second), "before second");
    assert.equal(JSON.stringify(reverted.value).includes("before first"), false);
  });

  it("previews request revert without mutating files", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const path = `${workspaceRoot}/preview.ts`;
    await platform.writeFile(path, "after");
    await manager.transact(transactionFor(path, "before", "after", "tx-preview", { requestId: "req-preview" }));

    const preview = await manager.revertRequest({ target: { requestId: "req-preview" }, dryRun: true });

    assert.equal(preview.ok, true);
    assert.equal(preview.value?.status, "preview");
    assert.equal(await platform.readFile(path), "after");
    assert.deepEqual(preview.value?.affectedPaths, [path]);
  });

  it("reports partial stale request revert without overwriting newer content", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);
    const first = `${workspaceRoot}/partial-first.ts`;
    const second = `${workspaceRoot}/partial-second.ts`;
    await platform.writeFile(first, "after first");
    await platform.writeFile(second, "after second");
    await manager.transact(transactionFor(first, "before first", "after first", "tx-partial-first", { turnId: "turn-partial" }));
    await manager.transact(transactionFor(second, "before second", "after second", "tx-partial-second", { turnId: "turn-partial" }));
    await platform.writeFile(second, "user edit");

    const reverted = await manager.revertRequest({ target: { turnId: "turn-partial" as never } });

    assert.equal(reverted.ok, true);
    assert.equal(reverted.value?.status, "partial");
    assert.deepEqual(reverted.value?.restoredPaths, [first]);
    assert.deepEqual(reverted.value?.stalePaths, [second]);
    assert.equal(await platform.readFile(first), "before first");
    assert.equal(await platform.readFile(second), "user edit");
  });

  it("rejects empty request revert targets", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const manager = new InMemoryWorkspaceStateManager(platform);

    const reverted = await manager.revertRequest({ target: { requestId: "missing" } });

    assert.equal(reverted.ok, false);
    assert.equal(reverted.error?.code, "CHECKPOINT_REVERT_EMPTY");
    assert.equal(reverted.value?.status, "rejected");
  });
});

function transactionFor(path: string, before: string, after: string, id: string, metadata: { requestId?: string; turnId?: string } = {}) {
  return {
    id,
    sessionId,
    ...(metadata.turnId ? { turnId: asId<"turn">(metadata.turnId) } : {}),
    ...(metadata.requestId ? { requestId: metadata.requestId } : {}),
    edits: [{
      path,
      precondition: "exact-match",
      applied: true,
      beforeHash: hashText(before),
      afterHash: hashText(after)
    }],
    rollback: {
      content: before,
      contentHash: hashText(before),
      redaction: { class: "sensitive" as const, fields: ["content"] }
    }
  };
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
