import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ruleId = "test-first/implementation-without-coverage";
const jsonOutput = process.argv.includes("--json");
const verbose = process.argv.includes("--verbose") || jsonOutput;

const changedPaths = gitChangedPaths();
const implementationPaths = changedPaths.filter(isImplementationPath).sort();
const testPaths = changedPaths.filter(isFocusedTestPath).sort();
const exceptionPath = implementationPaths.length > 0 && testPaths.length === 0
  ? await findOpenSpecException(process.cwd())
  : undefined;

const result = evaluate();
emit(result);
process.exit(result.ok ? 0 : 1);

function evaluate() {
  if (implementationPaths.length === 0) {
    return {
      ok: true,
      ruleId,
      reason: "no-implementation-changes",
      implementationPaths,
      testPaths
    };
  }
  if (testPaths.length > 0) {
    return {
      ok: true,
      ruleId,
      reason: "focused-coverage-present",
      implementationPaths,
      testPaths
    };
  }
  if (exceptionPath) {
    return {
      ok: true,
      ruleId,
      reason: "openspec-verification-exception",
      implementationPaths,
      testPaths,
      exceptionPath
    };
  }
  return {
    ok: false,
    ruleId,
    reason: "missing-focused-coverage",
    message: "Implementation changes under src/** require focused test changes before implementation code, or an explicit OpenSpec test-first exception with substitute verification.",
    implementationPaths,
    testPaths
  };
}

function emit(result) {
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.ok) {
    if (verbose && result.exceptionPath) {
      console.log(`test-first governance gate passed via OpenSpec exception: ${result.exceptionPath}`);
    }
    return;
  }
  console.error(`${ruleId}: ${result.message}`);
  console.error(`implementation paths: ${result.implementationPaths.join(", ")}`);
  console.error("add or update focused tests under src/**/test, *.test.ts, tests/contracts, tests/integration, tests/golden, tests/matrix, tests/e2e, or tests/versioning.");
}

function gitChangedPaths() {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all"], { encoding: "utf8" });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map(parseStatusPath)
    .filter((path) => path.length > 0)
    .map(normalizePath);
}

function parseStatusPath(line) {
  const pathPart = line.length > 3 ? line.slice(3) : "";
  const renamed = pathPart.includes(" -> ") ? pathPart.split(" -> ").at(-1) ?? pathPart : pathPart;
  return unquoteGitPath(renamed.trim());
}

function unquoteGitPath(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return value;
}

function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isImplementationPath(path) {
  if (!path.startsWith("src/")) return false;
  if (isFocusedTestPath(path)) return false;
  return /\.(?:ts|tsx|mts|cts|js|mjs|cjs|json)$/.test(path);
}

function isFocusedTestPath(path) {
  if (path.startsWith("src/") && /(^|\/)(test|tests)\//.test(path) && /\.(?:ts|tsx|mts|cts|js|mjs|cjs|json)$/.test(path)) return true;
  if (/\.(?:test|spec)\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/.test(path)) return true;
  return /^(?:tests\/(?:contracts|integration|golden|matrix|e2e|versioning|scenarios)\/).*\.(?:ts|tsx|mts|cts|js|mjs|cjs|json)$/.test(path);
}

async function findOpenSpecException(root) {
  const changesRoot = join(root, "openspec", "changes");
  const files = await listOpenSpecArtifactFiles(changesRoot).catch(() => []);
  for (const file of files.sort()) {
    const content = await readFile(file, "utf8").catch(() => "");
    if (/Test-first exception\s*:/i.test(content) && /Substitute verification\s*:/i.test(content)) {
      return normalizePath(file.slice(root.length + 1));
    }
  }
  return undefined;
}

async function listOpenSpecArtifactFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "archive") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listOpenSpecArtifactFiles(path));
    } else if (/^(?:proposal|design|tasks)\.md$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}
