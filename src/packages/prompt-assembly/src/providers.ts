import type { PromptSectionProviderRegistration } from "./assembler.js";
import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { contextMessageContent, createPromptSection, projectionSections, stableHash } from "./sections.js";

export function defaultPromptSectionProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createUserPromptProvider(),
    createProjectedContextProvider(),
    createPageIndexRecallProvider(),
    createToolResultContinuityProvider(),
    createSkillContextProvider(),
    createCodeIntelligenceContextProvider(),
    createSemanticRecallProvider(),
    createTaskOutputContractProvider(),
    createToolPolicyProvider()
  ];
}

function createUserPromptProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.user-prompt",
    version: "1.0.0",
    kind: "task.intent",
    source: "user",
    priority: 1000,
    budgetClass: "required",
    trust: "trusted",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return [createPromptSection({
        id: "section.user-prompt",
        providerId: "core.user-prompt",
        kind: "task.intent",
        source: "user",
        role: "user",
        content: input.prompt,
        priority: 1000,
        budgetClass: "required",
        trust: "trusted",
        required: true,
        provenance: { promptHash: stableHash(input.prompt) }
      })];
    }
  };
}

function createProjectedContextProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.projected-context",
    version: "1.0.0",
    kind: "context.projected",
    source: "context-engine",
    priority: 900,
    budgetClass: "high",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const content = contextMessageContent(input.contextProjection);
      if (!content) return [];
      return [createPromptSection({
        id: "section.projected-context",
        providerId: "core.projected-context",
        kind: "context.projected",
        source: "context-engine",
        role: "system",
        content,
        priority: 900,
        budgetClass: "high",
        trust: "workspace",
        required: false,
        provenance: {
          projectionFingerprint: input.contextProjection?.replayFingerprint ?? "",
          selectedNodeCount: input.contextProjection?.selectedNodes.length ?? 0,
          excludedNodeCount: input.contextProjection?.excludedNodes.length ?? 0
        }
      })];
    }
  };
}

function createPageIndexRecallProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.pageindex-recall",
    version: "1.0.0",
    kind: "context.pageindex-recall",
    source: "pageindex",
    priority: 850,
    budgetClass: "high",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return projectionSections(input.contextProjection, {
        providerId: "core.pageindex-recall",
        kind: "context.pageindex-recall",
        source: "pageindex",
        priority: 850,
        budgetClass: "high",
        trust: "workspace",
        predicate: (node) => node.source === "memory" && (node.provenance.pageId !== undefined || node.provenance.scope !== undefined),
        label: "PageIndex recall evidence"
      });
    }
  };
}

function createTaskOutputContractProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.task-output-contract",
    version: "1.0.0",
    kind: "task.output-contract",
    source: "runtime",
    priority: 800,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      if (input.mode !== "webpage-generation") return [];
      return [createPromptSection({
        id: "section.webpage-output-contract",
        providerId: "core.task-output-contract",
        kind: "task.output-contract",
        source: "runtime",
        role: "system",
        content: [
          "Task output contract:",
          "- Create a local generated-webpage directory when the task asks for a webpage.",
          "- Include an HTML entry file, styling, and JavaScript interaction when appropriate.",
          "- Avoid remote CDN or remote script dependencies unless explicitly requested."
        ].join("\n"),
        priority: 800,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: { mode: input.mode }
      })];
    }
  };
}

function createToolResultContinuityProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.tool-result-continuity",
    version: "1.0.0",
    kind: "context.tool-result",
    source: "tool-result",
    priority: 700,
    budgetClass: "normal",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return projectionSections(input.contextProjection, {
        providerId: "core.tool-result-continuity",
        kind: "context.tool-result",
        source: "tool-result",
        priority: 700,
        budgetClass: "normal",
        trust: "workspace",
        predicate: (node) => node.kind === "tool-result" || node.source === "tool",
        label: "Tool result continuity evidence"
      });
    }
  };
}

function createSkillContextProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.skill-context",
    version: "1.0.0",
    kind: "context.skill",
    source: "skill-system",
    priority: 650,
    budgetClass: "normal",
    trust: "trusted",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return projectionSections(input.contextProjection, {
        providerId: "core.skill-context",
        kind: "context.skill",
        source: "skill-system",
        priority: 650,
        budgetClass: "normal",
        trust: "trusted",
        predicate: (node) => node.source === "skill-system",
        label: "Skill context evidence"
      });
    }
  };
}

function createCodeIntelligenceContextProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.code-intelligence-context",
    version: "1.0.0",
    kind: "context.code-intelligence",
    source: "code-intelligence",
    priority: 600,
    budgetClass: "normal",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return projectionSections(input.contextProjection, {
        providerId: "core.code-intelligence-context",
        kind: "context.code-intelligence",
        source: "code-intelligence",
        priority: 600,
        budgetClass: "normal",
        trust: "workspace",
        predicate: (node) => node.source === "code-intelligence",
        label: "Code intelligence evidence"
      });
    }
  };
}

function createSemanticRecallProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.semantic-recall",
    version: "1.0.0",
    kind: "context.semantic-recall",
    source: "zvec",
    priority: 500,
    budgetClass: "low",
    trust: "semantic",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      return projectionSections(input.contextProjection, {
        providerId: "core.semantic-recall",
        kind: "context.semantic-recall",
        source: "zvec",
        priority: 500,
        budgetClass: "low",
        trust: "semantic",
        predicate: (node) => node.provenance.recallType === "semantic" || node.provenance.providerId === "zvec" || node.provenance.provider === "zvec",
        label: "Semantic recall evidence"
      });
    }
  };
}

function createToolPolicyProvider(): PromptSectionProviderRegistration {
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
      const counts = toolVisibilityCounts(input.availableTools, input.toolPolicy);
      return [createPromptSection({
        id: "section.tool-policy",
        providerId: "core.tool-policy",
        kind: "tools.policy",
        source: "capability-registry",
        role: "system",
        content: `Tool visibility policy: ${input.toolPolicy}. Visible tools: ${counts.visible}; excluded tools: ${counts.excluded}.`,
        priority: 300,
        budgetClass: "optional",
        trust: "system",
        required: false,
        provenance: { policy: input.toolPolicy, visibleToolCount: counts.visible, excludedToolCount: counts.excluded }
      })];
    }
  };
}

function toolVisibilityCounts(tools: readonly import("@deepseek/platform-contracts").CapabilityManifest[], policy: import("@deepseek/platform-contracts").AgentLoopToolProjection): { readonly visible: number; readonly excluded: number } {
  let visible = 0;
  let excluded = 0;
  for (const tool of tools) {
    if (isToolVisible(tool, policy)) visible += 1;
    else excluded += 1;
  }
  return { visible, excluded };
}

function isToolVisible(tool: import("@deepseek/platform-contracts").CapabilityManifest, policy: import("@deepseek/platform-contracts").AgentLoopToolProjection): boolean {
  if (policy === "all") return true;
  if (policy === "read-write") return tool.sideEffect === "none" || tool.sideEffect === "read" || tool.sideEffect === "write";
  return tool.sideEffect === "none" || tool.sideEffect === "read";
}
