import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDefaultRuntimeKernel } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runInteractiveCli } from "../../src/apps/cli/src/index.js";

describe("minimal interactive CLI runtime integration", () => {
  it("renders scripted prompts from kernel-backed runtime events", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const lines: string[] = [];
    const result = await runInteractiveCli({
      input: ["integration prompt\n/exit\n"],
      output: "stream-json",
      write: (line) => {
        lines.push(line);
      },
      createKernel: () => createDefaultRuntimeKernel(deps)
    });

    const events = lines.map((line) => JSON.parse(line));
    assert.equal(result.status, "completed");
    assert.equal(events.some((event) => event.kind === "interactive.started"), true);
    assert.equal(events.some((event) => event.kind === "kernel.request.accepted"), true);
    assert.equal(events.some((event) => event.kind === "execution.envelope.created"), true);
    assert.equal(events.some((event) => event.kind === "policy.decided"), true);
    assert.equal(events.some((event) => event.kind === "scheduler.completed"), true);
    assert.equal(events.some((event) => event.kind === "capability.completed"), true);
    assert.equal(events.some((event) => event.kind === "interactive.completed"), true);
    assert.equal(lines.join("\n").includes("sk-live-secret-value"), false);
  });
});
