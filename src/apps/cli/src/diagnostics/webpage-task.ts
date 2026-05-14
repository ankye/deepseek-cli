import type { CliEvaluationTaskDefinition } from "@deepseek/platform-contracts";

export function webpageTaskPrompt(task: CliEvaluationTaskDefinition): string {
  return [
    "Create a polished responsive product webpage for the DeepSeek CLI product. Use the available local file tools to write the files; do not only describe the solution or return code blocks.",
    "",
    "Evidence-first requirements:",
    "- Before writing product copy, inspect the local project evidence provided in PROJECT-EVIDENCE.md and any referenced local files available in the workspace.",
    "- Treat package names, executable names, install commands, run commands, feature claims, release state, and guarantees as strict factual claims.",
    "- Do not invent npm package names, npx commands, registration claims, launch state, benchmarks, or features that are not supported by the project evidence.",
    "- If a factual claim is not supported, remove it or label it as an assumption in the manifest; do not present it as verified product copy.",
    "- The exact user task is the webpage task below; evidence context is runtime-owned support material, not a replacement for the task.",
    "",
    "Write all artifacts under ./generated-webpage in the current working directory.",
    "Required files and behavior:",
    "- Include a local HTML entry, preferably generated-webpage/index.html.",
    "- Prefer separate generated-webpage/styles.css and generated-webpage/app.js files.",
    "- Include generated-webpage/evidence.json describing inspected sources, evidence items, claim groundings, assumptions, unsupported claim count, and redaction metadata.",
    "- Include viewport metadata.",
    "- Include local CSS via a .css file or inline style.",
    "- Include local JavaScript or an interaction hook such as a button, form, or event listener.",
    "- Include accessible structure such as h1, main, aria-label, or role=\"main\".",
    "- Do not use remote scripts, CDN URLs, external fonts, image hotlinks, or network dependencies.",
    "- Keep the code maintainable; prefer separate HTML, CSS, and JS files over dumping everything into one file.",
    "- Before finishing, ensure generated-webpage exists and contains the local files and evidence manifest required by the checker.",
    "",
    "Minimum evidence manifest coverage:",
    "- README.md for product positioning and local development examples.",
    "- src/apps/cli/package.json for canonical package name and bin executable.",
    "- docs/reference/command-index.md for supported local development commands.",
    "- Only use commands that are present in repository evidence or package metadata. For example, do not output `npx deepseek-cli init` unless evidence directly supports that exact command.",
    "",
    `Task id: ${task.taskId}`,
    `Prompt summary: ${task.promptSummary}`
  ].join("\n");
}
