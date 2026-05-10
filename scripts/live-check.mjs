import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Helper: exercise the CLI against the real DeepSeek API using credentials
// loaded from .env. With createLiveCliDependencies, --live now binds a real
// NodePlatformRuntime, so any core.file.* tool the model calls reads or
// writes real files under process.cwd(). Only run this from a throwaway
// workspace or a clean git tree because a model-driven edit is a real edit.

const content = readFileSync(".env", "utf8");
for (const line of content.split(/\r?\n/)) {
  const idx = line.indexOf("=");
  if (idx <= 0) continue;
  const k = line.slice(0, idx).trim();
  let v = line.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
}

const cliEntry = pathToFileURL(resolve(process.cwd(), "src/apps/cli/src/index.ts")).href;
const { runCli } = await import(cliEntry);
await runCli(["run", "Use the core.file.read tool to read README.md and then briefly summarise it.", "--live", "--output", "jsonl", "--timeout-ms", "90000"]);


