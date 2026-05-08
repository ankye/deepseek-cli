import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { asId } from "@deepseek/platform-contracts";
import type { CapabilityManifest } from "@deepseek/platform-contracts";

const manifest: CapabilityManifest = {
  id: asId<"capability">("registry.echo"),
  name: "Registry Echo",
  source: "test",
  version: "1.0.0",
  trust: "trusted",
  sideEffect: "none",
  permissions: ["read:workspace"],
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string" }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      text: { type: "string" }
    }
  },
  enabled: true
};

describe("capability registry hardening", () => {
  it("returns immutable deep-copy host and model projections without executor bindings", async () => {
    const registry = new InMemoryCapabilityRegistry();
    await registry.register(manifest, async () => ({ ok: true, value: { text: "ok" } }));

    const [hostProjection] = await registry.listHostVisible();
    const [modelProjection] = await registry.listModelVisible();
    assert.ok(hostProjection);
    assert.ok(modelProjection);
    assert.equal(Object.isFrozen(hostProjection), true);
    assert.equal(Object.isFrozen(hostProjection.inputSchema), true);
    assert.equal(Object.hasOwn(hostProjection, "execute"), false);
    assert.equal(Object.hasOwn(modelProjection, "execute"), false);
    assert.throws(() => {
      (hostProjection.inputSchema as { properties: { text: { type: string } } }).properties.text.type = "number";
    }, TypeError);

    const [freshProjection] = await registry.listHostVisible();
    assert.equal((freshProjection?.inputSchema.properties as { text: { type: string } }).text.type, "string");
  });

  it("keeps stored manifests isolated from registration input and get() mutations", async () => {
    const registry = new InMemoryCapabilityRegistry();
    const mutableManifest = {
      ...manifest,
      id: asId<"capability">("registry.mutable"),
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string" }
        }
      }
    };
    await registry.register(mutableManifest, async () => ({ ok: true, value: {} }));
    mutableManifest.inputSchema.properties.text.type = "number";

    const stored = await registry.get(mutableManifest.id);
    assert.equal((stored?.inputSchema.properties as { text: { type: string } }).text.type, "string");
    assert.equal(Object.isFrozen(stored), true);
  });
});
