import type { AgentLoopToolProjection, CapabilityManifest } from "@deepseek/platform-contracts";
import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";

export function createToolPolicyProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.tool-policy",
    version: "1.0.0",
    kind: "tools.policy",
    source: "capability-registry",
    priority: 300,
    budgetClass: "optional",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      if (input.availableTools.length === 0) return [];
      const projection = toolVisibilityProjection(input.availableTools, input.toolPolicy);
      return [createPromptSection({
        id: "section.tool-policy",
        providerId: "core.tool-policy",
        kind: "tools.policy",
        source: "capability-registry",
        role: "system",
        content: [
          `Tool visibility policy: ${input.toolPolicy}. Visible tools: ${projection.visible.length}; excluded tools: ${projection.excluded}.`,
          `Use only these exact model-visible tool function names: ${projection.visible.map((tool) => `${tool.safeName} (capability ${tool.capabilityId})`).join(", ")}.`,
          "Do not invent tool aliases. For text search use core_search_text, not core_file_search."
        ].join("\n"),
        priority: 300,
        budgetClass: "optional",
        trust: "system",
        required: false,
        provenance: {
          policy: input.toolPolicy,
          visibleToolCount: projection.visible.length,
          excludedToolCount: projection.excluded,
          visibleToolNames: projection.visible.map((tool) => tool.safeName)
        }
      })];
    }
  };
}

function toolVisibilityProjection(tools: readonly CapabilityManifest[], policy: AgentLoopToolProjection): {
  readonly visible: readonly { readonly safeName: string; readonly capabilityId: string }[];
  readonly excluded: number;
} {
  const visible: Array<{ readonly safeName: string; readonly capabilityId: string }> = [];
  let excluded = 0;
  for (const tool of tools) {
    if (isToolVisible(tool, policy)) visible.push({ safeName: toSafeToolName(String(tool.id)), capabilityId: String(tool.id) });
    else excluded += 1;
  }
  return { visible, excluded };
}

function isToolVisible(tool: CapabilityManifest, policy: AgentLoopToolProjection): boolean {
  if (policy === "all") return true;
  if (policy === "read-write") return tool.sideEffect === "none" || tool.sideEffect === "read" || tool.sideEffect === "write";
  return tool.sideEffect === "none" || tool.sideEffect === "read";
}

function toSafeToolName(capabilityId: string): string {
  return /^[a-zA-Z0-9_-]+$/.test(capabilityId) ? capabilityId : capabilityId.replace(/[^a-zA-Z0-9_-]/g, "_");
}
