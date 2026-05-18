import type {
  CapabilityExecutionContext,
  CoreCodingToolName,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { processResultToEvidence, requireDeps, resolveToolPath } from "../../../shared/workspace.js";

const TOOL_NAME = "package.manager" as CoreCodingToolName;
type PackageManager = "npm" | "pnpm" | "yarn";
type PackageOperation = "scripts" | "list" | "outdated" | "install" | "run-script";

interface PackageManagerInput extends JsonObject {
  readonly manager?: PackageManager;
  readonly operation: PackageOperation;
  readonly packages?: readonly string[];
  readonly script?: string;
  readonly cwd?: string;
  readonly workspaceRoot?: string;
  readonly dryRun?: boolean;
  readonly timeoutMs?: number;
  readonly limitBytes?: number;
}

export function definePackageManagerTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.packageManager,
    "Package Manager",
    "process",
    ["process:package"],
    objectSchema(["operation"], {
      manager: { type: "string" },
      operation: { type: "string" },
      packages: { type: "array" },
      script: { type: "string" },
      cwd: { type: "string" },
      workspaceRoot: { type: "string" },
      dryRun: { type: "boolean" },
      timeoutMs: { type: "number" },
      limitBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => packageManagerTool(input, context, ready))
  );
}

async function packageManagerTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as PackageManagerInput;
  const manager = parsed.manager ?? "npm";
  if (!["npm", "pnpm", "yarn"].includes(manager)) return failure(TOOL_NAME, "PACKAGE_MANAGER_UNSUPPORTED", "Supported package managers are npm, pnpm, and yarn.", []);
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, parsed.cwd ?? ".");
  if (!cwdPath.ok || !cwdPath.value) return failure(TOOL_NAME, "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.cwd ?? ".")]);
  const cwd = cwdPath.value.path;

  if (parsed.operation === "scripts") {
    const packageJson = await readPackageJson(deps, cwd);
    if (packageJson instanceof Error) return failure(TOOL_NAME, "PACKAGE_JSON_READ_FAILED", packageJson.message, [cwd]);
    const scripts = packageJson.scripts && typeof packageJson.scripts === "object" && !Array.isArray(packageJson.scripts) ? packageJson.scripts as Record<string, unknown> : {};
    const scriptLines = Object.keys(scripts).sort().map((name) => `${name}: ${String(scripts[name])}`);
    return success(TOOL_NAME, [cwd], {
      preview: boundedText(scriptLines.join("\n"), parsed.limitBytes),
      metadata: { operation: "scripts", manager, scriptCount: scriptLines.length, scripts: Object.fromEntries(Object.entries(scripts).sort()) as JsonObject },
      replay: replay(context)
    });
  }

  const args = packageArgs(parsed, manager);
  if (args instanceof Error) return failure(TOOL_NAME, "PACKAGE_OPERATION_REJECTED", args.message, [cwd], { operation: parsed.operation, manager });
  const mutating = parsed.operation === "install" || parsed.operation === "run-script";
  const dryRun = parsed.dryRun ?? mutating;
  if (dryRun) {
    return success(TOOL_NAME, [cwd], {
      preview: boundedText(`${manager} ${args.join(" ")}`, parsed.limitBytes),
      metadata: { operation: parsed.operation, manager, dryRun: true, command: manager, args, mutatesWorkspace: mutating, applied: false },
      replay: replay(context)
    });
  }

  const processProvider = await deps.platform.resolveProcessProvider();
  if (!processProvider.available) return failure(TOOL_NAME, "PROCESS_UNAVAILABLE", processProvider.diagnostics[0]?.message ?? "Process unavailable.", [cwd], { processProvider });
  const result = await deps.platform.runProcess(manager, args, {
    cwd,
    timeoutMs: parsed.timeoutMs ?? 30_000,
    executionProfile: "noninteractive",
    stdin: "ignore",
    outputLimitBytes: parsed.limitBytes ?? 16_000
  });
  return processResultToEvidence(TOOL_NAME, result, cwd, context, parsed.limitBytes, { operation: parsed.operation, manager, dryRun: false });
}

function packageArgs(parsed: PackageManagerInput, manager: PackageManager): readonly string[] | Error {
  const packages = (parsed.packages ?? []).filter((item) => typeof item === "string" && item.length > 0);
  if (packages.some((item) => !/^(?:@[\w.-]+\/)?[\w.-]+(?:@[\w.^~*-]+)?$/.test(item))) return new Error("Package names must be simple npm package specifiers.");
  if (parsed.operation === "list") return manager === "yarn" ? ["list", "--depth=0"] : ["ls", "--depth=0"];
  if (parsed.operation === "outdated") return ["outdated"];
  if (parsed.operation === "install") return manager === "yarn" ? ["add", ...packages] : ["install", ...packages];
  if (parsed.operation === "run-script") {
    if (!parsed.script || !/^[\w:.-]+$/.test(parsed.script)) return new Error("Script name is required and must be alphanumeric with dash, colon, underscore, or dot.");
    return manager === "npm" ? ["run", parsed.script] : [parsed.script];
  }
  return new Error(`Unsupported package operation: ${String(parsed.operation)}`);
}

async function readPackageJson(deps: CoreCodingToolsDependencies, cwd: string): Promise<JsonObject | Error> {
  const text = await deps.platform.readFile(`${cwd.replace(/\\/g, "/")}/package.json`).catch((error: unknown) => error instanceof Error ? error : new Error("package.json read failed."));
  if (text instanceof Error) return text;
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as JsonObject : new Error("package.json must contain an object.");
  } catch (error) {
    return error instanceof Error ? error : new Error("package.json parse failed.");
  }
}
