import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
import {
  buildExecutionEnvelope,
  collectRuntimeEvents,
  createDefaultRuntimeKernel,
  runtimeEchoCapability,
  validateExecutionEnvelope
} from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("runtime kernel contracts", () => {
  it("constructs the kernel and validates execution envelopes", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.capabilities.register(runtimeEchoCapability, async (_input, context) => ({
      ok: true,
      value: { envelopeId: context.envelope.invocationId }
    }));
    const envelope = buildExecutionEnvelope({
      request: {
        capabilityId: runtimeEchoCapability.id,
        caller: "contract-test",
        input: {}
      },
      manifest: runtimeEchoCapability,
      sessionId: asId<"session">("session-contract"),
      invocationId: "invocation-contract",
      trace: {
        traceId: asId<"trace">("trace-contract"),
        spanId: asId<"span">("span-contract"),
        correlationId: asId<"correlation">("corr-contract"),
        sessionId: asId<"session">("session-contract")
      },
      createdAt: new Date(0).toISOString()
    });

    assert.deepEqual(validateExecutionEnvelope(envelope), []);
    assert.equal(validateExecutionEnvelope({}).some((error) => error.code === "KERNEL_ENVELOPE_INVALID"), true);
    assert.equal((await deps.capabilities.listHostVisible()).some((manifest) => manifest.id === runtimeEchoCapability.id), true);
    assert.equal((await deps.capabilities.resolveExecutable(runtimeEchoCapability.id))?.manifest.id, runtimeEchoCapability.id);
  });

  it("returns typed rejection events for unknown capabilities", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = await collectRuntimeEvents(kernel.execute({
      capabilityId: asId<"capability">("runtime.missing"),
      caller: "contract-test",
      input: {}
    }));

    const rejected = events.find((event) => event.kind === "execution.rejected");
    assert.equal(rejected?.error?.code, "KERNEL_CAPABILITY_NOT_FOUND");
    await kernel.shutdown();
  });
});
