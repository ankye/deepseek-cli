import { readFile, readdir } from "node:fs/promises";
import { join, normalize, sep } from "node:path";

export async function collectSourceFiles({ roots, ignoredDirectoryNames, extensions }) {
  const files = [];
  for (const root of roots) {
    await walk(root, files, ignoredDirectoryNames, extensions);
  }
  return files;
}

async function walk(dir, files, ignoredDirectoryNames, extensions) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (ignoredDirectoryNames.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files, ignoredDirectoryNames, extensions);
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(path);
    }
  }
}

export async function readTextFile(file) {
  return readFile(file, "utf8");
}

export function normalizedPath(file) {
  return normalize(file).split(sep).join("/");
}

export function pathParts(file) {
  return normalize(file).split(sep);
}
