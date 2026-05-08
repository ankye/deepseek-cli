import { runArchitectureLint } from "./lint-framework/index.mjs";

const result = await runArchitectureLint();

if (result.failures.length > 0) {
  console.error(result.failures.map((failure) => failure.format()).join("\n"));
  process.exit(1);
}

console.log(`ast lint passed (${result.fileCount} files, ${result.ruleCount} rules)`);
