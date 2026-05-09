import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { runInteractiveCli } from "../../src/apps/cli/src/index.js";

const canonicalRuntimeKinds = [
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
];

describe("minimal interactive CLI golden replay", () => {
  it("keeps interactive prompt semantics aligned with headless runtime events", async () => {
    const prompt = "interactive golden";
    const interactiveDeps = createDeterministicRuntimeDependencies();
    const lines: string[] = [];
    await runInteractiveCli({
      input: [`${prompt}\n/exit\n`],
      output: "stream-json",
      write: (line) => {
        lines.push(line);
      },
      createKernel: () => createDefaultRuntimeKernel(interactiveDeps)
    });
    const interactiveEvents = lines.map((line) => JSON.parse(line));
    const interactiveRuntimeEvents = interactiveEvents.filter((event) => canonicalRuntimeKinds.includes(event.kind));

    const headlessDeps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(headlessDeps);
    const headlessEvents = await collectRuntimeEvents(kernel.execute({
      capabilityId: runtimeEchoCapability.id,
      caller: "cli.interactive",
      input: { text: prompt, prompt }
    }));

    assert.deepEqual(interactiveRuntimeEvents.map((event) => event.kind), headlessEvents.map((event) => event.kind));

    const sessionId = interactiveRuntimeEvents[0]?.sessionId;
    assert.ok(sessionId);
    const trace = await interactiveDeps.regression.normalize({
      name: "minimal-interactive-cli",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: interactiveDeps.bus.getReplayRecords(sessionId),
      runtime: interactiveRuntimeEvents,
      sessions: await interactiveDeps.sessions.events(sessionId),
      assertions: [{ expectedKind: "capability.completed" }]
    });
    const replay = await interactiveDeps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
    await kernel.shutdown();
  });

  it("replays deterministic interactive cancellation evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const slowCapabilityId = asId<"capability">("runtime.interactive-cancel-golden");
    await deps.capabilities.register(
      {
        ...runtimeEchoCapability,
        id: slowCapabilityId,
        name: "Interactive Cancel Golden"
      },
      async (_input, context) => {
        await new Promise<void>((resolve) => {
          context.signal.addEventListener("abort", () => resolve(), { once: true });
        });
        return {
          ok: false,
          error: {
            code: "CANCELLED_BY_TEST",
            message: context.cancellationReason ?? "cancelled",
            retryable: false,
            redaction: { class: "public" }
          }
        };
      }
    );

    async function* scriptedInput(): AsyncIterable<string> {
      yield "cancel golden\n";
      await new Promise((resolve) => setTimeout(resolve, 0));
      yield "/cancel\n/exit\n";
    }

    const lines: string[] = [];
    await runInteractiveCli({
      input: scriptedInput(),
      output: "stream-json",
      capabilityId: slowCapabilityId,
      write: (line) => {
        lines.push(line);
      },
      createKernel: () => createDefaultRuntimeKernel(deps)
    });
    const events = lines.map((line) => JSON.parse(line));
    const runtimeEvents = events.filter((event) => typeof event.kind === "string" && !event.kind.startsWith("interactive."));
    const sessionId = runtimeEvents[0]?.sessionId;
    assert.ok(sessionId);
    assert.equal(runtimeEvents.some((event) => event.kind === "scheduler.cancelled"), true);

    const trace = await deps.regression.normalize({
      name: "minimal-interactive-cli-cancel",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: deps.bus.getReplayRecords(sessionId),
      runtime: runtimeEvents,
      sessions: await deps.sessions.events(sessionId),
      assertions: [{ expectedKind: "scheduler.cancelled" }]
    });
    const replay = await deps.regression.replay(trace);
    assert.equal(replay.ok, true, replay.failures.join("\n"));
  });
});
