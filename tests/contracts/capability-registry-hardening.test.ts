import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { asId } from "@deepseek/platform-contracts";
import type { CapabilityManifest } from "@deepseek/platform-contracts";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision
} from "@deepseek/policy-sandbox";

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

  it("rejects executable model-visible projection without explicit tool family metadata", async () => {
    const registry = new InMemoryCapabilityRegistry();
    await assert.rejects(
      () => registry.register({
        ...manifest,
        id: asId<"capability">("registry.model-visible-without-family"),
        projection: { modelVisible: true }
      }, async () => ({ ok: true, value: {} })),
      /CAPABILITY_MODEL_PROJECTION_MISSING_TOOL_FAMILY/
    );
  });

  it("rejects incomplete model-visible family capability registrations with stable diagnostics", async () => {
    const registry = new InMemoryCapabilityRegistry();
    const missingTimeout = modelVisibleFamilyManifest("registry.family-missing-timeout");
    delete (missingTimeout as { timeoutMs?: number }).timeoutMs;

    await assert.rejects(
      () => registry.register(missingTimeout, async () => ({ ok: true, value: {} })),
      /CAPABILITY_MODEL_PROJECTION_MISSING_TIMEOUT/
    );
    await assert.rejects(
      () => registry.register(modelVisibleFamilyManifest("registry.family-missing-output-bound", {
        projection: { modelVisible: true }
      }), async () => ({ ok: true, value: {} })),
      /CAPABILITY_MODEL_PROJECTION_MISSING_OUTPUT_BOUND/
    );
    await assert.rejects(
      () => registry.register(modelVisibleFamilyManifest("registry.family-missing-security", {
        security: { modelVisible: true }
      }), async () => ({ ok: true, value: {} })),
      /CAPABILITY_MODEL_PROJECTION_MISSING_SECURITY/
    );
  });

  it("filters model-visible family projections by family, domain, risk, host, provider, policy, and agent scope", async () => {
    const registry = new InMemoryCapabilityRegistry();
    const read = modelVisibleFamilyManifest("registry.family-read");
    const web = modelVisibleFamilyManifest("registry.family-web", {
      id: asId<"capability">("registry.family-web"),
      sideEffect: "network",
      toolFamily: {
        schemaVersion: "1.0.0",
        catalogVersion: "test",
        domainId: "web-public-data",
        familyId: "web.search",
        toolId: "registry.web.search",
        implementationState: "implemented",
        maturity: "baseline",
        riskClass: "network",
        operationProfiles: ["network", "read"],
        hostRequirements: ["network"],
        connectorProfile: "provider",
        scorecardRubricId: "rubric.test.web.search",
        redaction: { class: "internal" }
      },
      projection: {
        modelVisible: true,
        outputBounded: true,
        connectorTrust: "trusted",
        providerSupport: "connector",
        policyTags: ["network", "web"],
        agentScopeIds: ["default", "researcher"]
      }
    });
    await registry.register(read, async () => ({ ok: true, value: {} }));
    await registry.register(web, async () => ({ ok: true, value: {} }));

    assert.deepEqual((await registry.listModelVisible({ deniedFamilyIds: ["file.read"] })).map((item) => item.id), [web.id]);
    assert.deepEqual((await registry.listModelVisible({ allowedDomainIds: ["workspace-io"] })).map((item) => item.id), [read.id]);
    assert.deepEqual((await registry.listModelVisible({ deniedRiskClasses: ["network"] })).map((item) => item.id), [read.id]);
    assert.deepEqual((await registry.listModelVisible({ requiredHostRequirements: ["network"] })).map((item) => item.id), [web.id]);
    assert.deepEqual((await registry.listModelVisible({ allowedProviderSupport: ["connector"] })).map((item) => item.id), [web.id]);
    assert.deepEqual((await registry.listModelVisible({ deniedPolicyTags: ["network"] })).map((item) => item.id), [read.id]);
    assert.deepEqual((await registry.listModelVisible({ allowedAgentScopeIds: ["researcher"] })).map((item) => item.id), [web.id]);
  });
});

function modelVisibleFamilyManifest(id: string, overrides: Partial<CapabilityManifest> = {}): CapabilityManifest {
  const resourceScope = analyzeResourceScope({}, "read");
  const sandboxRequirements = createSandboxRequirement({
    sideEffect: "read",
    resourceScope,
    timeoutMs: 10_000,
    permissions: ["read:workspace"]
  });
  return {
    ...manifest,
    id: asId<"capability">(id),
    timeoutMs: 10_000,
    projection: {
      modelVisible: true,
      outputBounded: true,
      connectorTrust: "trusted",
      providerSupport: "not_applicable",
      policyTags: ["workspace", "read"],
      agentScopeIds: ["default"]
    },
    toolFamily: {
      schemaVersion: "1.0.0",
      catalogVersion: "test",
      domainId: "workspace-io",
      familyId: "file.read",
      toolId: "registry.file.read",
      implementationState: "implemented",
      maturity: "baseline",
      riskClass: "read",
      operationProfiles: ["read"],
      hostRequirements: ["filesystem"],
      connectorProfile: "built-in",
      scorecardRubricId: "rubric.test.file.read",
      redaction: { class: "internal" }
    },
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "manifest",
      reasonCode: "test.capability-registry-family",
      subject: "test",
      resource: id,
      sandboxProfile: sandboxRequirements.profile
    }),
    security: {
      modelVisible: true,
      executorVisible: false,
      outputRedaction: "secret-aware"
    },
    ...overrides
  };
}
