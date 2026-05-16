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
      if (input.mode !== "webpage-generation") return fileMutationContractSections(input);
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

function fileMutationContractSections(input: Parameters<PromptSectionProviderRegistration["provide"]>[0]) {
  if (input.mode !== "coding" || !fileMutationRequested(input.prompt)) return [];
  const visibleToolNames = input.availableTools
    .filter((tool) => tool.enabled !== false && (input.toolPolicy === "all" || input.toolPolicy === "read-write" || tool.sideEffect === "none" || tool.sideEffect === "read"))
    .map((tool) => safeToolName(String(tool.id)));
  const preferredTools = ["core_file_read", "core_file_write", "core_file_edit", "core_shell_run"]
    .filter((toolName) => visibleToolNames.includes(toolName));
  return [createPromptSection({
    id: "section.file-mutation-output-contract",
    providerId: "core.task-output-contract",
    kind: "task.output-contract",
    source: "runtime",
    role: "system",
    content: [
      "File mutation output contract:",
      "- This task is only complete after the requested workspace files are changed on disk; a text-only answer is incomplete.",
      "- Inspect the relevant files first, then use governed file write/edit tools to update them.",
      ...(preferredTools.length > 0 ? [`- Prefer exact visible tool names for this flow: ${preferredTools.join(", ")}.`] : []),
      "- Remove placeholder markers such as TODO or TBD when the task asks to replace them.",
      "- Run the local checker after writing files when a checker is available. If it fails, make a bounded correction and rerun when possible."
    ].join("\n"),
    priority: 800,
    budgetClass: "high",
    trust: "system",
    required: false,
    provenance: { mode: input.mode, contract: "file-mutation" }
  })];
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

function fileMutationRequested(prompt: string): boolean {
  return /\b(update|write|edit|create|modify|fix|repair|refactor|add|remove|delete)\b/i.test(prompt)
    || /更新|写入|编辑|修改|修复|新增|创建|删除|补齐/.test(prompt);
}

function safeToolName(capabilityId: string): string {
  return capabilityId.replace(/[^A-Za-z0-9_]/g, "_");
}
