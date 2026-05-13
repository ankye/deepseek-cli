import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const ignored = new Set(["node_modules", ".git", "dist", "参考", "coverage"]);
const extensions = new Map([
  [".ts", "ts"],
  [".tsx", "ts"],
  [".mjs", "mjs"],
  [".cjs", "mjs"],
  [".js", "mjs"],
  [".json", "json"],
  [".md", "md"]
]);

const roots = ["src", "tests", "scripts", "openspec", "docs"];

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
    } else {
      const dot = entry.name.lastIndexOf(".");
      if (dot < 0) continue;
      const ext = entry.name.slice(dot).toLowerCase();
      if (extensions.has(ext)) files.push({ path, ext });
    }
  }
  return files;
}

function classifyLine(line, inBlock, ext) {
  let state = { inBlock, blank: false, comment: false };
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    state.blank = true;
    return state;
  }
  if (ext === "json") return state;
  if (ext === "md") return state;
  if (inBlock) {
    state.comment = true;
    if (trimmed.includes("*/")) state.inBlock = false;
    return state;
  }
  if (trimmed.startsWith("//")) {
    state.comment = true;
    return state;
  }
  if (trimmed.startsWith("/*")) {
    state.comment = true;
    if (!trimmed.includes("*/")) state.inBlock = true;
    return state;
  }
  return state;
}

async function measure(file) {
  const content = await readFile(file.path, "utf8");
  const lines = content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  let total = lines.length;
  let blank = 0;
  let comment = 0;
  let inBlock = false;
  for (const line of lines) {
    const r = classifyLine(line, inBlock, extensions.get(file.ext));
    inBlock = r.inBlock;
    if (r.blank) blank += 1;
    else if (r.comment) comment += 1;
  }
  const code = total - blank - comment;
  return { total, blank, comment, code, bytes: Buffer.byteLength(content, "utf8") };
}

function bucketFor(path) {
  const parts = relative(process.cwd(), path).split(sep);
  if (parts[0] === "src" && parts[1] === "packages" && parts[2]) return { group: "packages", name: parts[2] };
  if (parts[0] === "src" && parts[1] === "apps" && parts[2]) return { group: "apps", name: parts[2] };
  if (parts[0] === "src") return { group: "src-other", name: parts.slice(0, 2).join("/") || "src" };
  if (parts[0] === "tests") return { group: "tests", name: parts[1] ?? "tests" };
  if (parts[0] === "scripts") return { group: "scripts", name: "scripts" };
  if (parts[0] === "openspec") return { group: "openspec", name: parts[1] ?? "openspec" };
  if (parts[0] === "docs") return { group: "docs", name: parts[1] ?? "docs" };
  return { group: "other", name: parts[0] ?? "other" };
}

function empty() {
  return { files: 0, total: 0, blank: 0, comment: 0, code: 0, bytes: 0, byExt: {} };
}

function add(target, m, ext) {
  target.files += 1;
  target.total += m.total;
  target.blank += m.blank;
  target.comment += m.comment;
  target.code += m.code;
  target.bytes += m.bytes;
  const key = extensions.get(ext);
  const slot = target.byExt[key] ?? (target.byExt[key] = { files: 0, total: 0, code: 0 });
  slot.files += 1;
  slot.total += m.total;
  slot.code += m.code;
}

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : " ".repeat(width - text.length) + text;
}

function padRight(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function printTable(title, rows) {
  if (rows.length === 0) return;
  console.log(`\n== ${title} ==`);
  const nameWidth = Math.max(4, ...rows.map((r) => r.name.length));
  console.log(
    `${padRight("name", nameWidth)}  ${pad("files", 6)}  ${pad("total", 8)}  ${pad("code", 8)}  ${pad("blank", 6)}  ${pad("comment", 8)}`
  );
  for (const row of rows) {
    console.log(
      `${padRight(row.name, nameWidth)}  ${pad(row.files, 6)}  ${pad(row.total, 8)}  ${pad(row.code, 8)}  ${pad(row.blank, 6)}  ${pad(row.comment, 8)}`
    );
  }
}

const asJson = process.argv.includes("--json");
const allFiles = [];
for (const root of roots) {
  try {
    const info = await stat(root);
    if (!info.isDirectory()) continue;
  } catch {
    continue;
  }
  await walk(root, allFiles);
}

const buckets = new Map();
const overall = empty();
const byExtOverall = {};

for (const file of allFiles) {
  const m = await measure(file);
  const b = bucketFor(file.path);
  const groupKey = `${b.group}/${b.name}`;
  const entry = buckets.get(groupKey) ?? { group: b.group, name: b.name, ...empty() };
  add(entry, m, file.ext);
  buckets.set(groupKey, entry);
  overall.files += 1;
  overall.total += m.total;
  overall.blank += m.blank;
  overall.comment += m.comment;
  overall.code += m.code;
  overall.bytes += m.bytes;
  const key = extensions.get(file.ext);
  const slot = byExtOverall[key] ?? (byExtOverall[key] = { files: 0, total: 0, code: 0 });
  slot.files += 1;
  slot.total += m.total;
  slot.code += m.code;
}

const groups = ["packages", "apps", "src-other", "scripts", "tests", "openspec", "docs", "other"];
const grouped = new Map(groups.map((g) => [g, []]));
for (const entry of buckets.values()) {
  grouped.get(entry.group)?.push(entry);
}
for (const list of grouped.values()) {
  list.sort((a, b) => b.code - a.code || b.total - a.total || a.name.localeCompare(b.name));
}

if (asJson) {
  const payload = {
    overall,
    byExtension: byExtOverall,
    groups: Object.fromEntries(
      Array.from(grouped.entries()).map(([group, list]) => [
        group,
        list.map((r) => ({ name: r.name, files: r.files, total: r.total, code: r.code, blank: r.blank, comment: r.comment, bytes: r.bytes }))
      ])
    )
  };
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`roots scanned: ${roots.join(", ")}`);
  console.log(
    `overall        files=${overall.files}  total=${overall.total}  code=${overall.code}  blank=${overall.blank}  comment=${overall.comment}  bytes=${overall.bytes}`
  );
  const extRows = Object.entries(byExtOverall)
    .map(([name, v]) => ({ name, files: v.files, total: v.total, code: v.code, blank: 0, comment: 0 }))
    .sort((a, b) => b.code - a.code);
  printTable("by extension", extRows);
  for (const group of groups) {
    const list = grouped.get(group) ?? [];
    if (list.length === 0) continue;
    printTable(group, list);
  }
}
