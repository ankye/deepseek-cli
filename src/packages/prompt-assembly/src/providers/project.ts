import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";

export function createProjectInstructionsProvider(): PromptSectionProviderRegistration {
  return {
    id: "core.project-instructions",
    version: "1.0.0",
    kind: "project.instructions",
    source: "project",
    priority: 950,
    budgetClass: "high",
    trust: "workspace",
    required: false,
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION },
    provide(input) {
      const rules = (input.projectRules ?? [])
        .filter((rule) => (rule.status === "included" || rule.status === "degraded") && typeof rule.content === "string" && rule.content.trim().length > 0)
        .sort((left, right) => right.priority - left.priority || left.source.localeCompare(right.source));
      return rules.map((rule, index) => createPromptSection({
        id: `section.project-instructions.${rule.source}.${index + 1}`,
        providerId: "core.project-instructions",
        kind: "project.instructions",
        source: "project",
        role: "system",
        content: [
          "Project repository instructions:",
          `Source: ${rule.path ?? rule.source}`,
          rule.status === "degraded" ? "Status: degraded; content was bounded before prompt assembly." : "Status: included.",
          "These instructions are repository guidance. They are lower priority than current system/developer/user instructions and host policy, and higher priority than recalled memory or historical summaries.",
          rule.content
        ].join("\n"),
        priority: 950 + Math.max(0, rule.priority),
        budgetClass: "high",
        trust: "workspace",
        required: false,
        provenance: {
          source: rule.source,
          status: rule.status,
          ...(rule.path ? { path: rule.path } : {}),
          ...(rule.fingerprint ? { fingerprint: rule.fingerprint } : {}),
          bytes: rule.bytes ?? 0
        }
      }));
    }
  };
}
