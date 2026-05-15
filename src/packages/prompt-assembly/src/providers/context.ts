import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { contextMessageContent, createPromptSection, projectionSections } from "../sections.js";

export function createContextProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createProjectedContextProvider(),
    createPageIndexRecallProvider(),
    createToolResultContinuityProvider(),
    createSkillContextProvider(),
    createCodeIntelligenceContextProvider(),
    createSemanticRecallProvider()
  ];
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
