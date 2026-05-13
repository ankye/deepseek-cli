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
const diagnostics = [];

if (!htmlFile) diagnostics.push("missing-html-entry");

const html = htmlFile ? await readFile(htmlFile, "utf8").catch(() => "") : "";
const cssText = (await Promise.all(cssFiles.map((file) => readFile(file, "utf8").catch(() => "")))).join("\n");
const jsText = (await Promise.all(jsFiles.map((file) => readFile(file, "utf8").catch(() => "")))).join("\n");
const combined = [html, cssText, jsText].join("\n");

if (!/<meta\s+name=["']viewport["']/i.test(html)) diagnostics.push("missing-viewport-meta");
if (!/(<link[^>]+rel=["']stylesheet["']|<style[\s>]|[.#][a-z0-9_-]+\s*\{)/i.test(combined)) diagnostics.push("missing-style");
if (!/(addEventListener|onclick=|data-action=|button|input|select|textarea)/i.test(combined)) diagnostics.push("missing-interaction-hook");
if (!/(<h1[\s>]|aria-label=|role=["']main["']|<main[\s>])/i.test(html)) diagnostics.push("missing-accessible-heading-or-label");
if (/https?:\/\/|\/\/cdn\.|unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com/i.test(combined)) diagnostics.push("remote-dependency-detected");

const result = {
  ok: diagnostics.length === 0,
  root,
  fileCount: files.length,
  htmlEntry: htmlFile ? htmlFile.slice(root.length + 1).replace(/\\/g, "/") : undefined,
  cssFileCount: cssFiles.length,
  jsFileCount: jsFiles.length,
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
