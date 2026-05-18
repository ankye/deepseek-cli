import { basename, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const cliPackageEntrypointSuffix = "/deepseek-agent-cli/dist/index.js";
const cliWorkspaceEntrypointSuffix = "/src/apps/cli/dist/index.js";

export function isCliEntryPoint(entryPath = process.argv[1], moduleUrl = import.meta.url): boolean {
  if (!entryPath) return false;
  const resolvedEntryPath = resolve(entryPath);
  if (pathToFileURL(resolvedEntryPath).href === moduleUrl) return true;

  const modulePath = fileURLToPath(moduleUrl);
  const modulePackagePath = normalizePath(modulePath);
  const normalizedEntryPath = normalizePath(resolvedEntryPath);
  if (isKnownCliEntrypointPath(modulePackagePath) && isKnownCliEntrypointPath(normalizedEntryPath)) return true;

  const entryName = basename(resolvedEntryPath).replace(/\.(cmd|ps1)$/i, "");
  return entryName === "deepseek" && isKnownCliEntrypointPath(modulePackagePath);
}

function isKnownCliEntrypointPath(path: string): boolean {
  return path.endsWith(cliPackageEntrypointSuffix) || path.endsWith(cliWorkspaceEntrypointSuffix);
}

function normalizePath(path: string): string {
  return normalize(path).replace(/\\/g, "/");
}
