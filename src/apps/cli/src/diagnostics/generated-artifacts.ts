import { extname } from "node:path";
import type { PlatformRuntime } from "@deepseek/platform-contracts";

export interface GeneratedArtifactMetrics {
  readonly fileCount: number;
  readonly htmlFileCount: number;
  readonly cssFileCount: number;
  readonly jsFileCount: number;
  readonly byteTotal: number;
  readonly largestFileBytes: number;
  readonly structureScore: number;
}

export async function generatedArtifactMetrics(platform: PlatformRuntime, root: string): Promise<GeneratedArtifactMetrics> {
  const files = await platform.findFiles("", root).catch(() => []);
  const sizes = await Promise.all(files.map(async (file) => Buffer.byteLength(await platform.readFile(file).catch(() => ""), "utf8")));
  const byteTotal = sizes.reduce((sum, value) => sum + value, 0);
  const largestFileBytes = sizes.reduce((max, value) => Math.max(max, value), 0);
  const htmlFileCount = files.filter((file) => extname(file).toLowerCase() === ".html").length;
  const cssFileCount = files.filter((file) => extname(file).toLowerCase() === ".css").length;
  const jsFileCount = files.filter((file) => extname(file).toLowerCase() === ".js").length;
  const largestRatio = byteTotal > 0 ? largestFileBytes / byteTotal : 1;
  const structureScore = roundRatio(
    (htmlFileCount > 0 ? 0.25 : 0) +
    (cssFileCount > 0 ? 0.2 : 0) +
    (jsFileCount > 0 ? 0.2 : 0) +
    (files.length >= 3 ? 0.2 : files.length >= 2 ? 0.1 : 0) +
    (byteTotal > 0 && largestRatio <= 0.85 ? 0.15 : 0)
  );
  return {
    fileCount: files.length,
    htmlFileCount,
    cssFileCount,
    jsFileCount,
    byteTotal,
    largestFileBytes,
    structureScore
  };
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}
