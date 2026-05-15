import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";
import { requestedWebpageDirectory } from "./webpage.js";

export function createEvidenceFirstProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createEvidenceFirstOperatingRulesProvider(),
    createEvidenceFirstPlanProvider(),
    createEvidenceFirstSelectedEvidenceProvider(),
    createEvidenceFirstUnsupportedPolicyProvider()
  ];
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
