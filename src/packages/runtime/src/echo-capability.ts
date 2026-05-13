import type {
  CapabilityExecutionContext,
  CapabilityManifest,
  JsonObject,
  RuntimeDependencies
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { registerCoreCodingToolsForRuntime } from "@deepseek/core-coding-tools";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision
} from "@deepseek/policy-sandbox";

export const runtimeEchoCapability: CapabilityManifest = {
  id: asId<"capability">("runtime.echo"),
  name: "Runtime Echo",
  source: "builtin",
  version: "1.0.0",
  trust: "trusted",
  sideEffect: "none",
  permissions: [],
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string" },
      prompt: { type: "string" }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      text: { type: "string" }
    }
  },
  enabled: true,
  secretExposure: createSecretRedactionDecision("", { class: "public" }),
  resourceScope: analyzeResourceScope({}, "none"),
  sandboxRequirements: createSandboxRequirement({
    sideEffect: "none",
    resourceScope: analyzeResourceScope({}, "none"),
    timeoutMs: 30_000,
    permissions: []
  }),
  audit: createSandboxAuditEvidence({
    decision: "manifest",
    reasonCode: "manifest.runtime-echo",
    subject: "runtime",
    resource: "runtime.echo",
    sandboxProfile: "none"
  }),
  security: {
    modelVisible: true,
    executorVisible: false,
    outputRedaction: "secret-aware"
  }
};

export async function registerRuntimeBuiltins(deps: Pick<RuntimeDependencies, "capabilities">): Promise<void> {
  if (await deps.capabilities.get(runtimeEchoCapability.id)) return;
  await deps.capabilities.register(runtimeEchoCapability, async (input: JsonObject, context: CapabilityExecutionContext) => {
    if (context.signal.aborted) {
      return {
        ok: false,
        error: {
          code: "CAPABILITY_ABORTED",
          message: context.cancellationReason ?? "Capability execution aborted",
          retryable: false,
          redaction: { class: "public" }
        }
      };
    }
    const text = typeof input.text === "string" ? input.text : typeof input.prompt === "string" ? input.prompt : "";
    return {
      ok: true,
      value: {
        text,
        envelopeId: context.envelope.invocationId,
        traceId: context.trace.traceId
      }
    };
  });
}

export async function registerRuntimeCoreTools(deps: Pick<RuntimeDependencies, "capabilities" | "platform" | "workspaceState" | "webFetch" | "webSearch" | "backgroundTasks" | "agentSpawner" | "hooks" | "skills" | "codeIntelligence">, workspaceRoot: string): Promise<void> {
  await registerCoreCodingToolsForRuntime(deps, workspaceRoot);
}
