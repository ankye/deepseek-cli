import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeterministicScheduler } from "../src/index.js";
import { asId } from "@deepseek/platform-contracts";

describe("deterministic scheduler", () => {
  it("serializes work through explicit locks", async () => {
    const scheduler = new DeterministicScheduler();
    const order: string[] = [];
    await Promise.all([
      scheduler.withLock({ kind: "workspace", key: "root" }, async () => {
        order.push("a");
      }),
      scheduler.withLock({ kind: "workspace", key: "root" }, async () => {
        order.push("b");
      })
    ]);
    await scheduler.run({ id: asId<"task">("task-1"), name: "work" }, async () => "done");
    assert.deepEqual(order, ["a", "b"]);
    assert.deepEqual(
      scheduler.events().map((event) => event.status),
      ["queued", "running", "completed"]
    );
  });

  it("queues work beyond the concurrency limit", async () => {
    const scheduler = new DeterministicScheduler({ maxConcurrency: 1 });
    let releaseFirst!: () => void;
    const first = scheduler.run({ id: asId<"task">("task-first"), name: "first" }, async () => {
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      return "first";
    });
    const second = scheduler.run({ id: asId<"task">("task-second"), name: "second" }, async () => "second");

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(
      scheduler.events().map((event) => `${event.taskId}:${event.status}`),
      ["task-first:queued", "task-second:queued", "task-first:running"]
    );
    releaseFirst();
    assert.deepEqual(await Promise.all([first, second]), ["first", "second"]);
    assert.equal(scheduler.events().some((event) => event.taskId === "task-second" && event.status === "running"), true);
  });

  it("emits terminal events for deadlines and cancellation", async () => {
    const scheduler = new DeterministicScheduler();
    await assert.rejects(() => scheduler.run({ id: asId<"task">("task-timeout"), name: "timeout", deadlineMs: 0 }, async () => "nope"));
    await scheduler.cancel(asId<"task">("task-cancelled"), "user");
    await assert.rejects(() => scheduler.run({ id: asId<"task">("task-cancelled"), name: "cancelled" }, async () => "nope"));
    assert.ok(scheduler.events().some((event) => event.status === "timed-out"));
    assert.ok(scheduler.events().some((event) => event.status === "cancelled"));
  });
});
