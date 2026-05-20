import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ignored = new Set(["node_modules", ".git", "dist", "\u53c2\u8003"]);
const roots = ["src", "tests", "scripts"];
const failures = [];

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
    } else if (/\.(ts|mjs|json|md)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

for (const root of roots) {
  for (const file of await walk(root)) {
    const content = await readFile(file, "utf8");
    if (content.includes("\t")) failures.push(`${file}: tabs are not allowed`);
    content.split(/\r?\n/).forEach((line, index) => {
      if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
    });
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const testFirstGate = spawnSync(process.execPath, ["scripts/check-test-first-governance.mjs"], { stdio: "inherit" });
if (testFirstGate.status !== 0) {
  process.exit(testFirstGate.status ?? 1);
}

const astLint = spawnSync(process.execPath, ["scripts/lint-ast.mjs"], { stdio: "inherit" });
if (astLint.status !== 0) {
  process.exit(astLint.status ?? 1);
}

console.log("lint passed");
