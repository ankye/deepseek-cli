import { basename, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function isCliEntryPoint(entryPath = process.argv[1], moduleUrl = import.meta.url): boolean {
  if (!entryPath) return false;
  const resolvedEntryPath = resolve(entryPath);
  if (pathToFileURL(resolvedEntryPath).href === moduleUrl) return true;

  const modulePath = fileURLToPath(moduleUrl);
  const modulePackagePath = normalizePath(modulePath);
  const entryName = basename(resolvedEntryPath).replace(/\.(cmd|ps1)$/i, "");
  return entryName === "deepseek" && modulePackagePath.endsWith("/deepseek-agent-cli/dist/index.js");
}

function normalizePath(path: string): string {
  return normalize(path).replace(/\\/g, "/");
}
