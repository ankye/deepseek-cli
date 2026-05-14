import type { PromptSectionProviderRegistration } from "./assembler.js";
import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { contextMessageContent, createPromptSection, projectionSections, stableHash } from "./sections.js";

export function defaultPromptSectionProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createUserPromptProvider(),
    createEvidenceFirstOperatingRulesProvider(),
    createEvidenceFirstPlanProvider(),
    createEvidenceFirstSelectedEvidenceProvider(),
    createEvidenceFirstUnsupportedPolicyProvider(),
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

function createEvidenceFirstOperatingRulesProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.evidence-first-operating-rules",
    version: "1.0.0",
    kind: "system.operating-rules",
    source: "runtime",
    priority: 980,
    budgetClass: "required",
    trust: "system",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const evidence = input.evidenceFirst;
      if (!evidence?.classification.evidenceRequired) return [];
      return [createPromptSection({
        id: "section.evidence-first-operating-rules",
        providerId: "core.evidence-first-operating-rules",
        kind: "system.operating-rules",
        source: "runtime",
        role: "system",
        content: [
          "Evidence-first operating rules:",
          "- Treat current repository, product, package, command, code, release, roadmap, generated artifact, and evaluation claims as factual claims.",
          "- Use the selected evidence below before making those claims.",
          "- Do not invent package names, executable names, commands, feature status, release state, or guarantees.",
          "- If evidence is missing, write unknown, remove the claim, or label it as an assumption according to the task boundary.",
          "- Preserve the user's exact task. Evidence context is runtime-owned support material, not a replacement task."
        ].join("\n"),
        priority: 980,
        budgetClass: "required",
        trust: "system",
        required: true,
        provenance: {
          classificationId: evidence.classification.classificationId,
          summaryId: evidence.summary.summaryId
        }
      })];
    }
  };
}

function createEvidenceFirstPlanProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.evidence-first-plan",
    version: "1.0.0",
    kind: "system.operating-rules",
    source: "runtime",
    priority: 970,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const evidence = input.evidenceFirst;
      const plan = evidence?.plan;
      if (!evidence?.classification.evidenceRequired || !plan) return [];
      return [createPromptSection({
        id: "section.evidence-first-plan",
        providerId: "core.evidence-first-plan",
        kind: "system.operating-rules",
        source: "runtime",
        role: "system",
        content: [
          "Evidence plan:",
          `- Required fact classes: ${plan.requiredFactClasses.join(", ") || "none"}.`,
          `- Candidate source groups: ${plan.candidateSourceGroups.map((source) => `${source.sourceGroup}${source.required ? ":required" : ""}`).join(", ") || "none"}.`,
          `- Minimum source coverage: ${plan.minimumSourceCoverage}.`,
          `- Freshness policy: ${plan.freshnessPolicy}.`,
          `- Redaction policy: ${plan.redactionPolicy}.`,
          `- Stop conditions: ${plan.stopConditions.join("; ")}.`
        ].join("\n"),
        priority: 970,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          planId: plan.planId,
          classificationId: plan.classificationId
        }
      })];
    }
  };
}

function createEvidenceFirstSelectedEvidenceProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.evidence-first-selected",
    version: "1.0.0",
    kind: "context.projected",
    source: "runtime",
    priority: 960,
    budgetClass: "high",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const evidence = input.evidenceFirst;
      if (!evidence?.classification.evidenceRequired || evidence.selectedEvidence.length === 0) return [];
      return [createPromptSection({
        id: "section.evidence-first-selected",
        providerId: "core.evidence-first-selected",
        kind: "context.projected",
        source: "runtime",
        role: "system",
        content: [
          "Selected local project evidence:",
          ...evidence.selectedEvidence.map((item, index) => [
            `[#${index + 1}] ${item.sourceLabel}`,
            `Source: ${item.sourcePath}`,
            `Fact classes: ${item.factClasses.join(", ")}`,
            `Evidence id: ${item.evidenceId}`,
            item.preview
          ].join("\n"))
        ].join("\n\n"),
        priority: 960,
        budgetClass: "high",
        trust: "workspace",
        required: false,
        provenance: {
          summaryId: evidence.summary.summaryId,
          evidenceIds: evidence.selectedEvidence.map((item) => item.evidenceId),
          fingerprints: evidence.selectedEvidence.map((item) => item.fingerprint)
        }
      })];
    }
  };
}

function createEvidenceFirstUnsupportedPolicyProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.evidence-first-unsupported-policy",
    version: "1.0.0",
    kind: "task.output-contract",
    source: "runtime",
    priority: 940,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const evidence = input.evidenceFirst;
      if (!evidence?.classification.evidenceRequired) return [];
      const artifactLines = input.mode === "webpage-generation"
        ? [
            `- For generated webpages, create ${requestedWebpageDirectory(input.prompt)}/index.html, ${requestedWebpageDirectory(input.prompt)}/styles.css, ${requestedWebpageDirectory(input.prompt)}/app.js when useful, and ${requestedWebpageDirectory(input.prompt)}/evidence.json.`,
            "- evidence.json must list inspected sources, evidence item ids, source coverage, claim groundings, assumptions, unsupportedClaims, and unsupportedClaimCount.",
            "- Do not include unsupported commands such as npx deepseek-cli init unless direct evidence supports them.",
            "- Once the selected evidence already covers package metadata, README, command index, roadmap/OpenSpec, and parser/source, stop reading more files and write the artifact files."
          ]
        : ["- For reports or documents, separate verified evidence, inference, assumptions, and unsupported claims."];
      return [createPromptSection({
        id: "section.evidence-first-unsupported-policy",
        providerId: "core.evidence-first-unsupported-policy",
        kind: "task.output-contract",
        source: "runtime",
        role: "system",
        content: [
          "Unsupported claim policy:",
          "- Verified claims must cite or be directly traceable to selected local evidence.",
          "- Inferred claims must be phrased as inference.",
          "- Assumptions are allowed only when the task is explicitly speculative or evidence is unavailable and the assumption is labeled.",
          "- Unsupported strict claims must be removed, rewritten as unknown, or represented in unsupportedClaims.",
          ...artifactLines
        ].join("\n"),
        priority: 940,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          mode: input.mode,
          classificationId: evidence.classification.classificationId
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
      const outputDir = requestedWebpageDirectory(input.prompt);
      return [createPromptSection({
        id: "section.webpage-output-contract",
        providerId: "core.task-output-contract",
        kind: "task.output-contract",
        source: "runtime",
        role: "system",
        content: [
          "Task output contract:",
          `- Create the local ${outputDir} directory for this webpage task.`,
          "- Include an HTML entry file, styling, and JavaScript interaction when appropriate.",
          `- Include ${outputDir}/index.html, ${outputDir}/styles.css, ${outputDir}/app.js, and ${outputDir}/evidence.json.`,
          "- Avoid remote CDN or remote script dependencies unless explicitly requested.",
          "- If enough evidence is already present in selected local project evidence, do not keep browsing; write the files."
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

function requestedWebpageDirectory(prompt: string): string {
  const normalized = prompt.replace(/\\/g, "/");
  const explicitAtDir = normalized.match(/@([A-Za-z0-9._/-]*(?:website|webpage|generated-webpage)[A-Za-z0-9._/-]*)/i);
  if (explicitAtDir?.[1]) return stripRelativePrefix(explicitAtDir[1]);

  const toDir = normalized.match(/(?:to|into|under|in|到|至|目录|文件夹)\s+([A-Za-z0-9._/-]*(?:website|webpage|generated-webpage)[A-Za-z0-9._/-]*)/i);
  if (toDir?.[1]) return stripRelativePrefix(toDir[1]);

  const bareDir = normalized.match(/\b((?:website|webpage|generated-webpage)(?:[A-Za-z0-9._/-]*))\b/i);
  if (bareDir?.[1]) return stripRelativePrefix(bareDir[1]);

  return "generated-webpage";
}

function stripRelativePrefix(value: string): string {
  return value.trim().replace(/^\.\/+/, "").replace(/\/+$/, "") || "generated-webpage";
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

function toolVisibilityProjection(tools: readonly import("@deepseek/platform-contracts").CapabilityManifest[], policy: import("@deepseek/platform-contracts").AgentLoopToolProjection): {
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

function isToolVisible(tool: import("@deepseek/platform-contracts").CapabilityManifest, policy: import("@deepseek/platform-contracts").AgentLoopToolProjection): boolean {
  if (policy === "all") return true;
  if (policy === "read-write") return tool.sideEffect === "none" || tool.sideEffect === "read" || tool.sideEffect === "write";
  return tool.sideEffect === "none" || tool.sideEffect === "read";
}

function toSafeToolName(capabilityId: string): string {
  return /^[a-zA-Z0-9_-]+$/.test(capabilityId) ? capabilityId : capabilityId.replace(/[^a-zA-Z0-9_-]/g, "_");
}
