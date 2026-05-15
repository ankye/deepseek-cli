import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { PromptSectionProviderRegistration } from "../assembler.js";
import { createPromptSection } from "../sections.js";

export function createTaskOutputContractProvider(): PromptSectionProviderRegistration {
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

export function requestedWebpageDirectory(prompt: string): string {
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
