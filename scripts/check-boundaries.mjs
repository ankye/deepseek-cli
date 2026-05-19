import { relative } from "node:path";
import { runArchitectureLint } from "./lint-framework/index.mjs";
import { packages, plugins } from "./workspace-packages.mjs";

const result = await runArchitectureLint();

if (result.failures.length > 0) {
  console.error(result.failures.map((failure) => failure.format()).join("\n"));
  process.exit(1);
}

console.log(`dependency boundaries passed for ${packages.length + plugins.length} workspaces from ${relative(process.cwd(), "src")} (${result.ruleCount} rules)`);
