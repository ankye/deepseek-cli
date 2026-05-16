import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("usage: node scripts/check-webpage-generation.mjs <generated-webpage-dir>");
  process.exit(2);
}

const root = resolve(targetDir);
const files = await listFiles(root).catch(() => []);
const htmlFile = files.find((file) => file.endsWith("index.html")) ?? files.find((file) => extname(file) === ".html");
const cssFiles = files.filter((file) => extname(file) === ".css");
const jsFiles = files.filter((file) => extname(file) === ".js");
const evidenceFile = files.find((file) => file.endsWith("evidence.json"));
const diagnostics = [];

if (!htmlFile) diagnostics.push("missing-html-entry");

const html = htmlFile ? await readFile(htmlFile, "utf8").catch(() => "") : "";
const cssText = (await Promise.all(cssFiles.map((file) => readFile(file, "utf8").catch(() => "")))).join("\n");
const jsText = (await Promise.all(jsFiles.map((file) => readFile(file, "utf8").catch(() => "")))).join("\n");
const combined = [html, cssText, jsText].join("\n");
const evidenceText = evidenceFile ? await readFile(evidenceFile, "utf8").catch(() => "") : "";
const evidence = validateEvidenceManifest(evidenceText, diagnostics);

if (!/<meta\s+name=["']viewport["']/i.test(html)) diagnostics.push("missing-viewport-meta");
if (!/(<link[^>]+rel=["']stylesheet["']|<style[\s>]|[.#][a-z0-9_-]+\s*\{)/i.test(combined)) diagnostics.push("missing-style");
if (!/(addEventListener|onclick=|data-action=|button|input|select|textarea)/i.test(combined)) diagnostics.push("missing-interaction-hook");
if (!/(<h1[\s>]|aria-label=|role=["']main["']|<main[\s>])/i.test(html)) diagnostics.push("missing-accessible-heading-or-label");
if (/https?:\/\/|\/\/cdn\.|unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com/i.test(combined)) diagnostics.push("remote-dependency-detected");
if (!evidenceFile) diagnostics.push("missing-evidence-manifest");

const commandDiagnostics = await unsupportedCommandDiagnostics(combined, evidence);
diagnostics.push(...commandDiagnostics);

const result = {
  ok: diagnostics.length === 0,
  root,
  fileCount: files.length,
  htmlEntry: htmlFile ? htmlFile.slice(root.length + 1).replace(/\\/g, "/") : undefined,
  cssFileCount: cssFiles.length,
  jsFileCount: jsFiles.length,
  evidenceEntry: evidenceFile ? evidenceFile.slice(root.length + 1).replace(/\\/g, "/") : undefined,
  evidence: evidenceMetrics(evidence, commandDiagnostics.length),
  diagnostics
};

console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);

async function listFiles(dir) {
  const info = await stat(dir);
  if (!info.isDirectory()) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(path));
    else result.push(path);
  }
  return result;
}

function validateEvidenceManifest(raw, diagnostics) {
  if (!raw) return undefined;
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    diagnostics.push("malformed-evidence-manifest");
    return undefined;
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    diagnostics.push("malformed-evidence-manifest");
    return undefined;
  }
  if (manifest.schemaVersion !== "1.0.0") diagnostics.push("malformed-evidence-schema-version");
  if (!Array.isArray(manifest.evidenceItems)) diagnostics.push("malformed-evidence-items");
  if (!Array.isArray(manifest.claimGroundings)) diagnostics.push("malformed-claim-groundings");
  if (!Array.isArray(manifest.sourceCoverage)) diagnostics.push("malformed-source-coverage");
  if (!manifest.redaction || typeof manifest.redaction !== "object") diagnostics.push("missing-evidence-redaction");

  const unsupportedCount = Number(manifest.unsupportedClaimCount ?? 0);
  const unsupportedClaims = Array.isArray(manifest.unsupportedClaims) ? manifest.unsupportedClaims : [];
  if (unsupportedCount > 0 || unsupportedClaims.length > 0) diagnostics.push("unsupported-claims-present");

  const evidenceItems = Array.isArray(manifest.evidenceItems) ? manifest.evidenceItems : [];
  for (const required of requiredEvidenceSources()) {
    if (!evidenceItems.some((item) => pathIncludes(item?.sourcePath, required.path))) {
      diagnostics.push(`missing-source-coverage:${required.path}`);
    }
  }

  const sourceCoverage = Array.isArray(manifest.sourceCoverage) ? manifest.sourceCoverage : [];
  for (const required of requiredEvidenceSources()) {
    if (!sourceCoverage.some((coverage) => coverage?.sourceGroup === required.group && coverage?.covered === true)) {
      diagnostics.push(`missing-source-coverage:${required.group}`);
    }
  }

  return manifest;
}

function requiredEvidenceSources() {
  return [
    { path: "README.md", group: "readme" },
    { path: "src/apps/cli/package.json", group: "package-metadata" },
    { path: "docs/reference/command-index.md", group: "command-index" }
  ];
}

function pathIncludes(value, required) {
  return typeof value === "string" && value.replace(/\\/g, "/").endsWith(required);
}

async function unsupportedCommandDiagnostics(text, manifest) {
  const commands = extractCommands(stripMarkup(text));
  const verifiedCommands = new Set([...verifiedCommandClaims(manifest), ...await repositoryCommandEvidence()]);
  const diagnostics = [];
  for (const command of commands) {
    const normalized = normalizeCommand(command);
    if (normalized === "npx deepseek-cli init") {
      diagnostics.push("unsupported-command:npx deepseek-cli init");
      continue;
    }
    if (!verifiedCommands.has(normalized)) diagnostics.push(`unsupported-command:${normalized}`);
  }
  return diagnostics;
}

async function repositoryCommandEvidence() {
  const values = await Promise.all([
    readFile(resolve("README.md"), "utf8").catch(() => ""),
    readFile(resolve("docs/reference/command-index.md"), "utf8").catch(() => ""),
    readFile(resolve("package.json"), "utf8").catch(() => ""),
    readFile(resolve("src/apps/cli/package.json"), "utf8").catch(() => "")
  ]);
  const commands = new Set(values.flatMap(extractCommands));
  for (const raw of values.filter(Boolean)) {
    try {
      const parsed = JSON.parse(raw);
      const scripts = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed.scripts : undefined;
      if (scripts && typeof scripts === "object" && !Array.isArray(scripts)) {
        for (const scriptName of Object.keys(scripts)) {
          commands.add(normalizeCommand(scriptName === "test" ? "npm test" : `npm run ${scriptName}`));
        }
      }
      const bin = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed.bin : undefined;
      if (bin && typeof bin === "object" && !Array.isArray(bin)) {
        for (const binName of Object.keys(bin)) commands.add(normalizeCommand(`${binName} run`));
      }
    } catch {
      // Non-JSON evidence files are handled by extractCommands above.
    }
  }
  return commands;
}

function verifiedCommandClaims(manifest) {
  const claims = Array.isArray(manifest?.claimGroundings) ? manifest.claimGroundings : [];
  const result = new Set();
  for (const claim of claims) {
    if (claim?.certainty !== "verified") continue;
    if (!["command", "install", "executable"].includes(String(claim.factClass))) continue;
    for (const command of extractCommands(String(claim.claimPreview ?? ""))) {
      result.add(normalizeCommand(command));
    }
  }
  return result;
}

function extractCommands(text) {
  const result = new Set();
  const pattern = /\b(?:npx|npm|node|openspec|deepseek)\b(?:[ \t]+[A-Za-z0-9_./:@'"=+-]+){1,10}/g;
  for (const match of text.matchAll(pattern)) {
    const command = normalizeCommand(match[0] ?? "");
    if (!command) continue;
    if (isCommandLike(command)) result.add(command);
  }
  return [...result];
}

function isCommandLike(command) {
  const [program, firstArg] = command.split(/\s+/);
  if (program === "npx") return Boolean(firstArg);
  if (program === "node") return Boolean(firstArg);
  if (program === "openspec") return Boolean(firstArg);
  if (program === "deepseek") return ["run", "chat", "diagnostics", "palette", "revert", "index-provider", "mcp", "extension", "readiness", "mode", "session", "tools-smoke", "help"].includes(firstArg ?? "");
  if (program === "npm") return ["install", "run", "test", "publish", "exec"].includes(firstArg ?? "");
  return false;
}

function normalizeCommand(value) {
  return value
    .replace(/[`"'<>]/g, "")
    .replace(/:\s+.*$/, "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

function stripMarkup(value) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(?:code|pre|kbd|p|li|div|section|main|button|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function evidenceMetrics(manifest, hallucinatedCommandCount) {
  const evidenceItems = Array.isArray(manifest?.evidenceItems) ? manifest.evidenceItems : [];
  const sourceCoverage = Array.isArray(manifest?.sourceCoverage) ? manifest.sourceCoverage : [];
  const claimGroundings = Array.isArray(manifest?.claimGroundings) ? manifest.claimGroundings : [];
  const assumptions = Array.isArray(manifest?.assumptions) ? manifest.assumptions : claimGroundings.filter((claim) => claim?.certainty === "assumption");
  const coveredRequired = requiredEvidenceSources().filter((required) =>
    evidenceItems.some((item) => pathIncludes(item?.sourcePath, required.path)) &&
    sourceCoverage.some((coverage) => coverage?.sourceGroup === required.group && coverage?.covered === true)
  ).length;
  const groundedClaims = claimGroundings.filter((claim) => claim?.certainty === "verified" || claim?.certainty === "inferred");
  const unsupportedClaimCount = Number(manifest?.unsupportedClaimCount ?? 0);
  return {
    manifestStatus: manifest ? diagnosticsStatus(manifest, unsupportedClaimCount, coveredRequired) : "missing",
    evidenceItemCount: evidenceItems.length,
    sourceCoverageRate: roundRatio(coveredRequired / requiredEvidenceSources().length),
    claimGroundingRate: claimGroundings.length > 0 ? roundRatio(groundedClaims.length / claimGroundings.length) : 0,
    unsupportedClaimCount,
    assumptionCount: assumptions.length,
    hallucinatedCommandCount
  };
}

function diagnosticsStatus(manifest, unsupportedClaimCount, coveredRequired) {
  if (!manifest || manifest.schemaVersion !== "1.0.0") return "malformed";
  if (unsupportedClaimCount > 0) return "failed";
  if (coveredRequired < requiredEvidenceSources().length) return "incomplete";
  return "passed";
}

function roundRatio(value) {
  return Math.round(value * 1000) / 1000;
}
