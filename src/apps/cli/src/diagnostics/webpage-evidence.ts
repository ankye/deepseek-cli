import { join } from "node:path";
import type {
  CliEvaluationDiagnostic,
  EvidenceManifestStatus,
  JsonObject,
  PlatformRuntime
} from "@deepseek/platform-contracts";

export interface WebpageCheckerOutput extends JsonObject {
  readonly ok?: boolean;
  readonly diagnostics?: readonly string[];
  readonly evidence?: {
    readonly manifestStatus?: string;
    readonly evidenceItemCount?: number;
    readonly sourceCoverageRate?: number;
    readonly claimGroundingRate?: number;
    readonly unsupportedClaimCount?: number;
    readonly assumptionCount?: number;
    readonly hallucinatedCommandCount?: number;
  };
}

export async function webpageProjectEvidence(platform: PlatformRuntime): Promise<string> {
  const packageJsonPath = join(process.cwd(), "src/apps/cli/package.json");
  const commandIndexPath = join(process.cwd(), "docs/reference/command-index.md");
  const readmePath = join(process.cwd(), "README.md");
  const [packageJson, commandIndex, readme] = await Promise.all([
    platform.readFile(packageJsonPath).catch(() => ""),
    platform.readFile(commandIndexPath).catch(() => ""),
    platform.readFile(readmePath).catch(() => "")
  ]);
  const parsedPackage = parsePackageEvidence(packageJson);
  return [
    "# Project Evidence For Webpage Generation",
    "",
    "This file is runtime-owned evidence context. Use it to ground product copy and strict command/package claims.",
    "",
    "## Canonical package metadata",
    "",
    "Source: src/apps/cli/package.json",
    `Package name: ${parsedPackage.name}`,
    `CLI bin executable: ${parsedPackage.binName}`,
    `Package version in repository: ${parsedPackage.version}`,
    "",
    "## Supported local CLI examples",
    "",
    "Source: README.md and docs/reference/command-index.md",
    "",
    fenced("bash", extractCommandEvidence([readme, commandIndex]).join("\n")),
    "",
    "## Product positioning evidence",
    "",
    "Source: README.md",
    "",
    boundedPreview(readme, 2200),
    "",
    "## Evidence rules for generated-webpage/evidence.json",
    "",
    "- Include README.md, src/apps/cli/package.json, and docs/reference/command-index.md in sourceCoverage.",
    "- Use verified claimGroundings for any package name, executable name, feature, product-copy, or command shown in the page.",
    "- unsupportedClaimCount must be 0 for a factual product page.",
    "- Do not claim `npx deepseek-cli init`; that command is not present in the repository evidence."
  ].join("\n");
}

export function parseCheckerOutput(stdout: string): WebpageCheckerOutput | undefined {
  try {
    return JSON.parse(stdout) as WebpageCheckerOutput;
  } catch {
    return undefined;
  }
}

export function evidenceManifestStatus(checkerOutput: WebpageCheckerOutput | undefined): EvidenceManifestStatus {
  const status = checkerOutput?.evidence?.manifestStatus;
  if (status === "present" || status === "missing" || status === "malformed" || status === "incomplete" || status === "failed" || status === "passed") return status;
  return checkerOutput ? "malformed" : "missing";
}

export function checkerDiagnostics(
  checkerOutput: WebpageCheckerOutput | undefined,
  diagnostic: (code: string, severity: CliEvaluationDiagnostic["severity"], message: string) => CliEvaluationDiagnostic
): readonly CliEvaluationDiagnostic[] {
  return (checkerOutput?.diagnostics ?? [])
    .filter((code) => code.startsWith("missing-evidence") || code.startsWith("malformed-evidence") || code.startsWith("unsupported-") || code.startsWith("missing-source-coverage"))
    .map((code) => diagnostic(`CLI_EVALUATION_WEBPAGE_${code.toUpperCase().replace(/-/g, "_")}`, "warn", `Webpage evidence check reported ${code}.`));
}

function parsePackageEvidence(raw: string): { readonly name: string; readonly version: string; readonly binName: string } {
  try {
    const parsed = JSON.parse(raw) as JsonObject;
    const bin = parsed.bin;
    const binName = isPlainObject(bin) ? Object.keys(bin)[0] ?? "unknown" : "unknown";
    return {
      name: typeof parsed.name === "string" ? parsed.name : "unknown",
      version: typeof parsed.version === "string" ? parsed.version : "unknown",
      binName
    };
  } catch {
    return { name: "unknown", version: "unknown", binName: "unknown" };
  }
}

function extractCommandEvidence(values: readonly string[]): readonly string[] {
  const commands = new Set<string>();
  for (const value of values) {
    for (const match of value.matchAll(/^(?:npm|npx|node|openspec|DEEPSEEK_[A-Z0-9_]+=)[^\r\n]+/gm)) {
      const command = match[0]?.trim();
      if (command) commands.add(command);
    }
  }
  return [...commands].slice(0, 32);
}

function fenced(language: string, value: string): string {
  return ["```" + language, value, "```"].join("\n");
}

function boundedPreview(value: string, maxLength: number): string {
  const normalized = value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
