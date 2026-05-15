import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection, stableHash } from "../sections.js";

export function createUserPromptProvider(): PromptSectionProviderRegistration {
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
