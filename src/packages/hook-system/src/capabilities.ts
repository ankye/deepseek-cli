import type { CapabilityExecutorBinding, CapabilityManifest, HookLifecyclePoint, HookSystem, JsonObject } from "@deepseek/platform-contracts";
import { HOOK_SCHEMA_VERSION, TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";

const catalogVersion = "v1";

export function createHookSystemFamilyCapabilities(hooks: HookSystem): readonly CapabilityExecutorBinding[] {
  return [{
    manifest: hookListRunManifest(),
    execute: async (input) => {
      const point = (typeof input.point === "string" ? input.point : "user-input.before") as HookLifecyclePoint;
      const action = typeof input.action === "string" ? input.action : "list";
      if (action === "run") {
        const request = {
          schemaVersion: HOOK_SCHEMA_VERSION,
          point,
          input: isJsonObject(input.input) ? input.input : {},
          ...(typeof input.timeoutMs === "number" ? { timeoutMs: input.timeoutMs } : {})
        };
        const result = await hooks.invokeHooks(request);
        return { ok: true, value: { familyId: "hook.list-run", action, result, evidence: evidence("run") } };
      }
      const order = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point, includeInert: input.includeInert === true });
      return { ok: true, value: { familyId: "hook.list-run", action: "list", order, hooks: order.ordered, evidence: evidence("list") } };
    }
  }];
}

function hookListRunManifest(): CapabilityManifest {
  const resourceScope = analyzeResourceScope({}, "write");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "write", resourceScope, timeoutMs: 1_000, permissions: ["hook:read", "hook:run"] });
  return {
    id: asId<"capability">("hook-system.list-run"),
    name: "List and run governed hooks",
    description: "hook.list-run deterministic hook capability",
    source: "@deepseek/hook-system",
    version: "0.1.0",
    trust: "trusted",
    sideEffect: "write",
    permissions: ["hook:read", "hook:run"],
    inputSchema: { type: "object", additionalProperties: true },
    outputSchema: { type: "object", additionalProperties: true },
    enabled: true,
    timeoutMs: 1_000,
    projection: { modelVisible: true, outputBounded: true, connectorTrust: "trusted", providerSupport: "not_applicable", policyTags: ["hook-run"], agentScopeIds: ["default"] },
    toolFamily: {
      schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
      catalogVersion,
      domainId: "extensions-local-commands",
      familyId: "hook.list-run",
      toolId: "hook.list-run",
      implementationState: "implemented",
      maturity: "baseline",
      riskClass: "orchestration",
      operationProfiles: ["observe", "connector"],
      hostRequirements: ["hook-system"],
      connectorProfile: "host",
      scorecardRubricId: "rubric.hook.list-run.baseline",
      redaction: { class: "public" }
    },
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    ["sandboxRequirements"]: sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "manifest",
      reasonCode: "manifest.hook.list-run",
      subject: "@deepseek/hook-system",
      resource: "hook-system.list-run",
      ["sandboxProfile"]: sandboxRequirements.profile
    }),
    security: { modelVisible: true, outputRedaction: "internal", preflight: "hook-policy" }
  };
}

function evidence(action: string): JsonObject {
  return { mode: "fake", providerNativeSupport: "not_applicable", capabilityId: "hook-system.list-run", familyId: "hook.list-run", action, redaction: { class: "public" } };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
