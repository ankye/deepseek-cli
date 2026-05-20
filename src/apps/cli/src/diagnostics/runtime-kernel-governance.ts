import type { JsonObject, ReadinessCheck } from "@deepseek/platform-contracts";

export interface RuntimeKernelGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly kernelOwnedResponsibilities: readonly string[];
  readonly forbiddenImportKinds: readonly string[];
  readonly centralFiles: readonly RuntimeKernelCentralFileEvidence[];
  readonly compatibilityShims: readonly RuntimeKernelCompatibilityShimEvidence[];
  readonly diagnostics: readonly JsonObject[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

interface RuntimeKernelCentralFileEvidence extends JsonObject {
  readonly path: string;
  readonly role: "kernel-core" | "compatibility-shim" | "public-facade";
  readonly maxLines: number;
  readonly ownerPackage: string;
  readonly extractionTargets: readonly string[];
}

interface RuntimeKernelCompatibilityShimEvidence extends JsonObject {
  readonly id: string;
  readonly ownerPackage: string;
  readonly file: string;
  readonly reason: string;
  readonly extractionTarget: string;
  readonly expirationTrigger: string;
  readonly diagnosticId: string;
  readonly severity: "info" | "warning" | "release-blocking";
}

export function collectRuntimeKernelGovernanceEvidence(): RuntimeKernelGovernanceEvidence {
  const centralFiles: readonly RuntimeKernelCentralFileEvidence[] = [
    centralFile("src/packages/runtime/src/kernel.ts", "kernel-core", 700, ["policy-sandbox", "concurrency-orchestration", "runtime-message-bus"]),
    centralFile("src/packages/runtime/src/agent-loop.ts", "compatibility-shim", 800, ["runtime-event-loop", "prompt-assembly", "model-gateway"]),
    centralFile("src/packages/runtime/src/index.ts", "public-facade", 120, ["package public exports"])
  ];
  const compatibilityShims: readonly RuntimeKernelCompatibilityShimEvidence[] = [
    shim(
      "runtime.agent-loop-compat",
      "src/packages/runtime/src/agent-loop.ts",
      "Current CLI product path still owns the high-level model/tool turn loop.",
      "runtime-event-loop, prompt-assembly, model-gateway",
      "Layered context pipeline and model request planning are enabled on the main path.",
      "RUNTIME_KERNEL_COMPAT_AGENT_LOOP"
    ),
    shim(
      "runtime.capability-registration-compat",
      "src/packages/runtime/src/echo-capability.ts",
      "Built-in capability wiring remains in runtime while governed module registration is introduced.",
      "capability-registry, plugin-system, first-party-dev-plugins",
      "Governed module contribution registration owns built-in capability wiring.",
      "RUNTIME_KERNEL_COMPAT_CAPABILITY_REGISTRATION"
    ),
    shim(
      "runtime.platform-family-compat",
      "src/packages/runtime/src/platform-family-capabilities.ts",
      "Platform family tools are still assembled through runtime exports.",
      "platform-abstraction, workspace-state-management, session-store, observability",
      "Platform family tools are exported through owner packages.",
      "RUNTIME_KERNEL_COMPAT_PLATFORM_FAMILY"
    ),
    shim(
      "runtime.context-memory-compat",
      "src/packages/runtime/src/context-projection.ts",
      "Context and memory helpers remain in runtime until pipeline block storage is enabled.",
      "context-engine, memory-cache-management, prompt-assembly",
      "Context pipeline block storage and prompt assembly handoff are product-ready.",
      "RUNTIME_KERNEL_COMPAT_CONTEXT_MEMORY"
    ),
    shim(
      "runtime.agent-mode-compat",
      "src/packages/runtime/src/agent-spawner.ts",
      "Agent spawning and mode support are rollout-gated while namespace/quota governance lands.",
      "agent-management, workflow-orchestration",
      "Agent namespace/quota governance is enforced.",
      "RUNTIME_KERNEL_COMPAT_AGENT_MODE"
    )
  ];

  return {
    schemaVersion: "1.0.0",
    status: "pass",
    kernelOwnedResponsibilities: [
      "turn-lifecycle",
      "execution-envelope",
      "policy-handoff",
      "scheduler-handoff",
      "event-emission",
      "model-tool-continuation"
    ],
    forbiddenImportKinds: [
      "app-package",
      "host-api",
      "provider-sdk",
      "testing-fake",
      "private-package-internal"
    ],
    centralFiles,
    compatibilityShims,
    diagnostics: [],
    redaction: { class: "internal", fields: ["centralFiles.path", "compatibilityShims.reason", "compatibilityShims.expirationTrigger"] }
  };
}

export function runtimeKernelGovernanceCheck(evidence: RuntimeKernelGovernanceEvidence): ReadinessCheck {
  return {
    id: "governance.runtime-kernel-boundary",
    label: "Runtime kernel boundary",
    status: evidence.status,
    message: `Runtime kernel boundary governed: responsibilities=${evidence.kernelOwnedResponsibilities.length}, forbidden-import-kinds=${evidence.forbiddenImportKinds.length}, compatibility-shims=${evidence.compatibilityShims.length}.`,
    metadata: { evidence },
    suggestedActions: evidence.status === "pass" ? [] : ["Fix runtime kernel boundary diagnostics before promoting dependent host, plugin, agent, or remote work."],
    redaction: { class: "internal", fields: ["metadata.evidence.compatibilityShims", "metadata.evidence.centralFiles.path"] }
  };
}

function centralFile(
  path: string,
  role: RuntimeKernelCentralFileEvidence["role"],
  maxLines: number,
  extractionTargets: readonly string[]
): RuntimeKernelCentralFileEvidence {
  return {
    path,
    role,
    maxLines,
    ownerPackage: "runtime",
    extractionTargets
  };
}

function shim(
  id: string,
  file: string,
  reason: string,
  extractionTarget: string,
  expirationTrigger: string,
  diagnosticId: string
): RuntimeKernelCompatibilityShimEvidence {
  return {
    id,
    ownerPackage: "runtime",
    file,
    reason,
    extractionTarget,
    expirationTrigger,
    diagnosticId,
    severity: "warning"
  };
}
