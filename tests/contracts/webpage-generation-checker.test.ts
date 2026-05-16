import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

describe("webpage generation checker", () => {
  it("accepts local responsive webpage artifacts with evidence manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-pass-"));
    try {
      await writeValidWebpage(dir, "npx tsx src/apps/cli/src/index.ts init");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[]; evidence?: { manifestStatus?: string; sourceCoverageRate?: number; claimGroundingRate?: number } };

      assert.equal(result.exitCode, 0);
      assert.equal(parsed.ok, true);
      assert.equal(parsed.evidence?.manifestStatus, "passed");
      assert.equal(parsed.evidence?.sourceCoverageRate, 1);
      assert.equal(parsed.evidence?.claimGroundingRate, 1);
      assert.deepEqual(parsed.diagnostics, []);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects remote dependencies and missing interaction", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-fail-"));
    try {
      await writeFile(join(dir, "index.html"), [
        "<!doctype html>",
        "<html>",
        "<head>",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "<script src=\"https://cdn.example.com/app.js\"></script>",
        "</head>",
        "<body><h1>Landing</h1></body>",
        "</html>"
      ].join("\n"), "utf8");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[] };

      assert.equal(result.exitCode, 1);
      assert.equal(parsed.ok, false);
      assert.equal(parsed.diagnostics?.includes("missing-style"), true);
      assert.equal(parsed.diagnostics?.includes("missing-interaction-hook"), true);
      assert.equal(parsed.diagnostics?.includes("remote-dependency-detected"), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects product webpages without evidence manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-no-evidence-"));
    try {
      await writeFile(join(dir, "index.html"), [
        "<!doctype html>",
        "<html>",
        "<head>",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "<link rel=\"stylesheet\" href=\"styles.css\">",
        "</head>",
        "<body>",
        "<main><h1>DeepSeek CLI</h1><button id=\"toggle\" aria-label=\"Toggle details\">Details</button></main>",
        "<script src=\"app.js\"></script>",
        "</body>",
        "</html>"
      ].join("\n"), "utf8");
      await writeFile(join(dir, "styles.css"), "main { display: grid; } button { padding: 8px; }\n", "utf8");
      await writeFile(join(dir, "app.js"), "document.getElementById('toggle')?.addEventListener('click', () => {});\n", "utf8");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[]; evidence?: { manifestStatus?: string } };

      assert.equal(result.exitCode, 1);
      assert.equal(parsed.ok, false);
      assert.equal(parsed.evidence?.manifestStatus, "missing");
      assert.equal(parsed.diagnostics?.includes("missing-evidence-manifest"), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects malformed evidence manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-bad-evidence-"));
    try {
      await writeValidWebpage(dir, "npx tsx src/apps/cli/src/index.ts init");
      await writeFile(join(dir, "evidence.json"), "{bad json", "utf8");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[] };

      assert.equal(result.exitCode, 1);
      assert.equal(parsed.ok, false);
      assert.equal(parsed.diagnostics?.includes("malformed-evidence-manifest"), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects hallucinated commands not backed by evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-hallucinated-command-"));
    try {
      await writeValidWebpage(dir, "npx deepseek-cli init", "npx tsx src/apps/cli/src/index.ts init");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[]; evidence?: { hallucinatedCommandCount?: number } };

      assert.equal(result.exitCode, 1);
      assert.equal(parsed.ok, false);
      assert.equal(parsed.evidence?.hallucinatedCommandCount, 1);
      assert.equal(parsed.diagnostics?.includes("unsupported-command:npx deepseek-cli init"), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("accepts visible commands backed by repository evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-backed-command-"));
    try {
      await writeValidWebpage(dir, "npm run typecheck", "npm run typecheck");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[] };

      assert.equal(result.exitCode, 0);
      assert.equal(parsed.ok, true);
      assert.deepEqual(parsed.diagnostics, []);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

async function writeValidWebpage(dir: string, pageCommand: string, evidenceCommand = pageCommand): Promise<void> {
  await writeFile(join(dir, "index.html"), [
    "<!doctype html>",
    "<html>",
    "<head>",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "<link rel=\"stylesheet\" href=\"styles.css\">",
    "</head>",
    "<body>",
    `<main><h1>DeepSeek CLI</h1><code>${pageCommand}</code><button id=\"toggle\" aria-label=\"Toggle details\">Details</button></main>`,
    "<script src=\"app.js\"></script>",
    "</body>",
    "</html>"
  ].join("\n"), "utf8");
  await writeFile(join(dir, "styles.css"), "main { display: grid; } button { padding: 8px; }\n", "utf8");
  await writeFile(join(dir, "app.js"), "document.getElementById('toggle')?.addEventListener('click', () => {});\n", "utf8");
  await writeFile(join(dir, "evidence.json"), JSON.stringify({
    schemaVersion: "1.0.0",
    manifestId: "evidence-manifest:test",
    artifactId: "generated-webpage",
    artifactKind: "webpage",
    status: "passed",
    generatedAt: "1970-01-01T00:00:00.000Z",
    sourceCoverage: [
      coverage("readme", ["product-copy", "command"]),
      coverage("package-metadata", ["package", "executable"]),
      coverage("command-index", ["command"])
    ],
    evidenceItems: [
      evidenceItem("evidence:readme", "readme", "README.md", ["product-copy", "command"], "DeepSeek CLI contract-first platform."),
      evidenceItem("evidence:package", "package-metadata", "src/apps/cli/package.json", ["package", "executable"], "name deepseek-agent-cli, bin deepseek"),
      evidenceItem("evidence:command-index", "command-index", "docs/reference/command-index.md", ["command"], evidenceCommand)
    ],
    claimGroundings: [
      claim("claim:product", "DeepSeek CLI contract-first platform.", "product-copy", ["evidence:readme"]),
      claim("claim:command", evidenceCommand, "command", ["evidence:command-index"])
    ],
    assumptions: [],
    unsupportedClaims: [],
    unsupportedClaimCount: 0,
    trace: {},
    compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" },
    redaction: { class: "internal", fields: ["evidenceItems.preview", "claimGroundings.claimPreview"] }
  }, null, 2), "utf8");
}

function coverage(sourceGroup: string, factClasses: readonly string[]) {
  return {
    schemaVersion: "1.0.0",
    sourceGroup,
    covered: true,
    itemCount: 1,
    factClasses,
    fingerprints: [`sha256:${sourceGroup}`],
    missingFactClasses: [],
    compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" },
    redaction: { class: "internal", fields: ["fingerprints"] }
  };
}

function evidenceItem(evidenceId: string, sourceGroup: string, sourcePath: string, factClasses: readonly string[], preview: string) {
  return {
    schemaVersion: "1.0.0",
    evidenceId,
    sourceGroup,
    sourcePath,
    sourceLabel: sourcePath,
    factClasses,
    preview,
    fingerprint: `sha256:${evidenceId}`,
    freshness: { status: "current", observedAt: "1970-01-01T00:00:00.000Z" },
    trace: {},
    compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" },
    redaction: { class: "internal", fields: ["preview"] }
  };
}

function claim(claimId: string, claimPreview: string, factClass: string, evidenceIds: readonly string[]) {
  return {
    schemaVersion: "1.0.0",
    claimId,
    claimPreview,
    claimFingerprint: claimId,
    factClass,
    certainty: "verified",
    evidenceIds,
    outputScope: "generated-webpage/index.html",
    compatibility: { schemaVersion: "1.0.0", minReaderVersion: "1.0.0" },
    redaction: { class: "internal", fields: ["claimPreview"] }
  };
}
