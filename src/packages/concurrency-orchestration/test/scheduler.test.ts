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
      ["running", "completed"]
    );
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
