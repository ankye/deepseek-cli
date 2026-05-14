import type { CliEvaluationTaskDefinition } from "@deepseek/platform-contracts";

export function webpageTaskPrompt(task: CliEvaluationTaskDefinition): string {
  return [
    "Create a polished responsive product webpage for a developer CLI evaluation. Use the available local file tools to write the files; do not only describe the solution or return code blocks.",
    "",
    "Write all artifacts under ./generated-webpage in the current working directory.",
    "Required files and behavior:",
    "- Include a local HTML entry, preferably generated-webpage/index.html.",
    "- Prefer separate generated-webpage/styles.css and generated-webpage/app.js files.",
    "- Include viewport metadata.",
    "- Include local CSS via a .css file or inline style.",
    "- Include local JavaScript or an interaction hook such as a button, form, or event listener.",
    "- Include accessible structure such as h1, main, aria-label, or role=\"main\".",
    "- Do not use remote scripts, CDN URLs, external fonts, image hotlinks, or network dependencies.",
    "- Keep the code maintainable; prefer separate HTML, CSS, and JS files over dumping everything into one file.",
    "- Before finishing, ensure generated-webpage exists and contains the local files required by the checker.",
    "",
    `Task id: ${task.taskId}`,
    `Prompt summary: ${task.promptSummary}`
  ].join("\n");
}
