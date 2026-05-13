import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

describe("webpage generation checker", () => {
  it("accepts local responsive webpage artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "deepseek-webpage-pass-"));
    try {
      await writeFile(join(dir, "index.html"), [
        "<!doctype html>",
        "<html>",
        "<head>",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "<link rel=\"stylesheet\" href=\"styles.css\">",
        "</head>",
        "<body>",
        "<main><h1>Product Dashboard</h1><button id=\"toggle\" aria-label=\"Toggle details\">Details</button></main>",
        "<script src=\"app.js\"></script>",
        "</body>",
        "</html>"
      ].join("\n"), "utf8");
      await writeFile(join(dir, "styles.css"), "main { display: grid; } button { padding: 8px; }\n", "utf8");
      await writeFile(join(dir, "app.js"), "document.getElementById('toggle')?.addEventListener('click', () => {});\n", "utf8");
      const result = await new NodePlatformRuntime().runProcess("node", ["scripts/check-webpage-generation.mjs", dir], { cwd: process.cwd() });
      const parsed = JSON.parse(result.stdout) as { ok?: boolean; diagnostics?: readonly string[] };

      assert.equal(result.exitCode, 0);
      assert.equal(parsed.ok, true);
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
});
