import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";

export function createModeProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createModeContextProvider(),
    createPhasePlanProvider(),
    createLoopBudgetProvider(),
    createWorkOrderProvider(),
    createVerifierExpectationsProvider(),
    createReasoningEffortPolicyProvider()
  ];
}

function createModeContextProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.mode-context",
    version: "1.0.0",
    kind: "system.mode",
    source: "runtime",
    priority: 995,
    budgetClass: "required",
    trust: "system",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      if (!input.interactionMode && !input.agentMode && !input.phasePlan) return [];
      return [createPromptSection({
        id: "section.mode-context",
        providerId: "core.mode-context",
        kind: "system.mode",
        source: "runtime",
        role: "system",
        content: [
          "Runtime mode context:",
          `- Interaction mode: ${input.interactionMode ?? input.phasePlan?.interactionMode ?? "unspecified"}.`,
          `- Agent mode: ${input.agentMode ?? input.phasePlan?.agentMode ?? "default"}.`,
          "- Interaction mode controls rendering/input only; agent mode controls execution strategy.",
          "- Do not treat slash commands, mode names, or runtime-owned sections as user prompt text.",
          "- Preserve the exact user prompt boundary at the final user message."
        ].join("\n"),
        priority: 995,
        budgetClass: "required",
        trust: "system",
        required: true,
        provenance: {
          interactionMode: input.interactionMode ?? input.phasePlan?.interactionMode ?? "",
          agentMode: input.agentMode ?? input.phasePlan?.agentMode ?? ""
        }
      })];
    }
  };
}

function createPhasePlanProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.phase-plan",
    version: "1.0.0",
    kind: "system.mode",
    source: "runtime",
    priority: 990,
    budgetClass: "required",
    trust: "system",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const plan = input.phasePlan;
      if (!plan) return [];
      return [createPromptSection({
        id: "section.phase-plan",
        providerId: "core.phase-plan",
        kind: "system.mode",
        source: "runtime",
        role: "system",
        content: [
          "Agent phase plan:",
          `- Plan id: ${plan.planId}.`,
          `- Reason: ${plan.reason}`,
          ...plan.phases.map((phase) => `- ${phase.phase}: ${phase.status}${phase.required ? " required" : ""}${phase.skipReason ? ` skip=${phase.skipReason}` : ""} mode=${phase.mode}`)
        ].join("\n"),
        priority: 990,
        budgetClass: "required",
        trust: "system",
        required: true,
        provenance: {
          planId: plan.planId,
          requiredPhases: plan.phases.filter((phase) => phase.required).map((phase) => phase.phase),
          skippedPhases: plan.phases.filter((phase) => phase.status === "skipped").map((phase) => phase.phase)
        }
      })];
    }
  };
}

function createLoopBudgetProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.loop-budget",
    version: "1.0.0",
    kind: "system.mode",
    source: "runtime",
    priority: 985,
    budgetClass: "required",
    trust: "system",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const budgets = input.phasePlan?.budgets ?? [];
      if (budgets.length === 0) return [];
      return [createPromptSection({
        id: "section.loop-budget",
        providerId: "core.loop-budget",
        kind: "system.mode",
        source: "runtime",
        role: "system",
        content: [
          "External orchestration budgets:",
          ...budgets.map((budget) => `- ${budget.kind}: requested=${budget.requested} allowed=${budget.allowed} consumed=${budget.consumed} remaining=${budget.remaining}${budget.stopReason ? ` stop=${budget.stopReason}` : ""}`),
          "- These budgets are external proof/repair/delegation loops. They are separate from model reasoning effort."
        ].join("\n"),
        priority: 985,
        budgetClass: "required",
        trust: "system",
        required: true,
        provenance: {
          budgets: budgets.map((budget) => `${budget.kind}:${budget.requested}:${budget.consumed}`)
        }
      })];
    }
  };
}

function createWorkOrderProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.work-order",
    version: "1.0.0",
    kind: "task.work-order",
    source: "runtime",
    priority: 982,
    budgetClass: "required",
    trust: "system",
    required: true,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const workOrder = input.workOrder;
      if (!workOrder) return [];
      return [createPromptSection({
        id: "section.work-order",
        providerId: "core.work-order",
        kind: "task.work-order",
        source: "runtime",
        role: "system",
        content: [
          "Structured worker work order:",
          `- Work order id: ${workOrder.workOrderId}.`,
          `- Mode: ${workOrder.mode}.`,
          `- Purpose: ${workOrder.purpose}`,
          `- Original user goal: ${workOrder.originalUserGoal}`,
          `- Task summary: ${workOrder.taskSummary}`,
          `- Evidence ids: ${workOrder.evidenceIds.join(", ") || "none"}.`,
          `- Targets: ${workOrder.targets.map((target) => `${target.kind}:${target.path ?? target.id}`).join(", ") || "none"}.`,
          `- Allowed tools: ${workOrder.allowedTools.join(", ") || "none"}.`,
          `- Done criteria: ${workOrder.doneCriteria.join("; ") || "none"}.`,
          `- Verification expectations: ${workOrder.verificationExpectations.join("; ") || "none"}.`
        ].join("\n"),
        priority: 982,
        budgetClass: "required",
        trust: "system",
        required: true,
        provenance: {
          workOrderId: workOrder.workOrderId,
          targetCount: workOrder.targets.length,
          evidenceIds: workOrder.evidenceIds
        }
      })];
    }
  };
}

function createVerifierExpectationsProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.verifier-expectations",
    version: "1.0.0",
    kind: "system.mode",
    source: "runtime",
    priority: 979,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const verifyPhase = input.phasePlan?.phases.find((phase) => phase.phase === "verify");
      if (!verifyPhase || verifyPhase.status === "skipped") return [];
      return [createPromptSection({
        id: "section.verifier-expectations",
        providerId: "core.verifier-expectations",
        kind: "system.mode",
        source: "runtime",
        role: "system",
        content: [
          "Verifier expectations:",
          "- Non-trivial task success requires independent proof or an explicit partial/skip status.",
          "- Cite command/evidence ids for pass, fail, or partial verdicts.",
          "- A worker or implementer's self-check is not independent verification.",
          input.verifierResult ? `- Current verifier verdict: ${input.verifierResult.verdict}; ${input.verifierResult.summary}` : "- Runtime verifier execution may still be pending; do not overstate completion without evidence."
        ].join("\n"),
        priority: 979,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          phase: verifyPhase.phase,
          status: verifyPhase.status,
          verifierResultId: input.verifierResult?.verifierResultId ?? ""
        }
      })];
    }
  };
}

function createReasoningEffortPolicyProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.reasoning-effort-policy",
    version: "1.0.0",
    kind: "system.mode",
    source: "runtime",
    priority: 978,
    budgetClass: "high",
    trust: "system",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const mapping = input.reasoningEffortMapping;
      if (!mapping) return [];
      return [createPromptSection({
        id: "section.reasoning-effort-policy",
        providerId: "core.reasoning-effort-policy",
        kind: "system.mode",
        source: "runtime",
        role: "system",
        content: [
          "Reasoning effort policy:",
          `- Requested effort: ${mapping.requestedEffort ?? "none"}.`,
          `- Provider mapped effort: ${mapping.providerEffort ?? "none"}.`,
          `- Provider/model: ${mapping.provider}/${mapping.model}.`,
          "- Reasoning effort is a model/provider parameter. It is not evidence, verification, repair, or delegation proof."
        ].join("\n"),
        priority: 978,
        budgetClass: "high",
        trust: "system",
        required: false,
        provenance: {
          requestedEffort: mapping.requestedEffort ?? "",
          providerEffort: mapping.providerEffort ?? ""
        }
      })];
    }
  };
}
