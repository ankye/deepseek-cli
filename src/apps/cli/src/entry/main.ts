import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function isCliEntryPoint(entryPath = process.argv[1], moduleUrl = import.meta.url): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === moduleUrl;
}
