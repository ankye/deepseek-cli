import type {
  CapabilityExecutionContext,
  CoreCodingToolName,
  CoreToolDiagnostic,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, diag, failure, objectSchema, replay, success, undefinedError, isDiagnostic } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { editTransaction, invalidateCodeIntelligence, publicTransactionEvidence, requireDeps, resolveToolPath, toWorkspaceTransaction } from "../../../shared/workspace.js";

const TOOL_NAME = "patch.apply" as CoreCodingToolName;

interface PatchApplyInput extends JsonObject {
  readonly patch: string;
  readonly workspaceRoot?: string;
  readonly dryRun?: boolean;
  readonly limitBytes?: number;
}

interface ParsedPatchFile {
  readonly path: string;
  readonly hunks: readonly ParsedHunk[];
}

interface ParsedHunk {
  readonly oldStart: number;
  readonly oldCount: number;
  readonly newStart: number;
  readonly newCount: number;
  readonly lines: readonly string[];
}

interface PlannedPatch {
  readonly file: ParsedPatchFile;
  readonly absolutePath: string;
  readonly before: string;
  readonly after: string;
}

export function definePatchApplyTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.patchApply,
    "Patch Apply",
    "write",
    ["workspace:write"],
    objectSchema(["patch"], {
      patch: { type: "string" },
      workspaceRoot: { type: "string" },
      dryRun: { type: "boolean" },
      limitBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => patchApplyTool(input, context, ready))
  );
}

async function patchApplyTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as PatchApplyInput;
  const files = parseUnifiedPatch(parsed.patch);
  if (files instanceof Error) return failure(TOOL_NAME, "PATCH_PARSE_FAILED", files.message, [], { patchBytes: Buffer.byteLength(parsed.patch ?? "", "utf8") });
  const plans: PlannedPatch[] = [];
  const diagnostics: CoreToolDiagnostic[] = [];

  for (const file of files) {
    const path = resolveToolPath(deps, parsed.workspaceRoot, file.path);
    if (!path.ok || !path.value) return failure(TOOL_NAME, "PATH_REJECTED", path.error?.message ?? "Path rejected.", [file.path]);
    const before = await deps.platform.readFile(path.value.path).catch((error: unknown) => undefinedError(error, "PATCH_READ_FAILED"));
    if (isDiagnostic(before)) return failure(TOOL_NAME, before.code, before.message, [path.value.path]);
    const after = applyHunks(before, file.hunks);
    if (after instanceof Error) {
      diagnostics.push(diag("PATCH_PRECONDITION_FAILED", `${file.path}: ${after.message}`));
      continue;
    }
    plans.push({ file, absolutePath: path.value.path, before, after });
  }

  if (diagnostics.length > 0) {
    return failure(TOOL_NAME, diagnostics[0]?.code ?? "PATCH_PRECONDITION_FAILED", diagnostics[0]?.message ?? "Patch precondition failed.", plans.map((plan) => plan.absolutePath), {
      diagnostics: diagnostics.slice(0, 20),
      affectedFileCount: files.length,
      applied: false
    });
  }

  if (parsed.dryRun === true) {
    return success(TOOL_NAME, plans.map((plan) => plan.absolutePath), {
      preview: boundedText(plans.map((plan) => `${plan.file.path}: ${plan.file.hunks.length} hunks`).join("\n"), parsed.limitBytes),
      metadata: { dryRun: true, affectedFileCount: plans.length, hunkCount: plans.reduce((count, plan) => count + plan.file.hunks.length, 0), applied: false },
      replay: replay(context),
      status: "completed"
    });
  }

  const transactions: JsonObject[] = [];
  const checkpoints: JsonObject[] = [];
  for (const plan of plans) {
    await deps.platform.writeFile(plan.absolutePath, plan.after);
    const transaction = editTransaction(context, plan.absolutePath, "full-write", plan.before, plan.after, true, []);
    const workspaceTransaction = await deps.workspaceState.transact(toWorkspaceTransaction(transaction, plan.before));
    transactions.push(publicTransactionEvidence(transaction, workspaceTransaction));
    if (workspaceTransaction.checkpoints[0]) checkpoints.push(workspaceTransaction.checkpoints[0]);
    invalidateCodeIntelligence(deps, plan.absolutePath);
  }

  return success(TOOL_NAME, plans.map((plan) => plan.absolutePath), {
    preview: boundedText(plans.map((plan) => `${plan.file.path}: ${plan.file.hunks.length} hunks applied`).join("\n"), parsed.limitBytes),
    metadata: {
      dryRun: false,
      applied: true,
      affectedFileCount: plans.length,
      hunkCount: plans.reduce((count, plan) => count + plan.file.hunks.length, 0),
      transactions,
      checkpoints
    },
    replay: replay(context)
  });
}

function parseUnifiedPatch(patch: string): readonly ParsedPatchFile[] | Error {
  if (typeof patch !== "string" || patch.trim().length === 0) return new Error("Patch input is empty.");
  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  const files: ParsedPatchFile[] = [];
  let index = 0;
  while (index < lines.length) {
    while (index < lines.length && !lines[index]!.startsWith("--- ")) index += 1;
    if (index >= lines.length) break;
    const oldHeader = lines[index++]!;
    if (index >= lines.length || !lines[index]!.startsWith("+++ ")) return new Error("Unified patch file header must contain +++ after ---.");
    const newHeader = lines[index++]!;
    const path = normalizePatchPath(newHeader.slice(4).trim()) || normalizePatchPath(oldHeader.slice(4).trim());
    if (!path || path === "/dev/null") return new Error("Patch target path is unsupported.");
    const hunks: ParsedHunk[] = [];
    while (index < lines.length && !lines[index]!.startsWith("--- ")) {
      if (!lines[index]!.startsWith("@@ ")) {
        index += 1;
        continue;
      }
      const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[index++]!);
      if (!header) return new Error("Patch hunk header is malformed.");
      const hunkLines: string[] = [];
      while (index < lines.length && !lines[index]!.startsWith("@@ ") && !lines[index]!.startsWith("--- ")) {
        const line = lines[index++]!;
        if (line === "") break;
        if (line.startsWith("\\ No newline")) continue;
        if (!/^[ +\-]/.test(line)) return new Error("Patch hunk line must start with space, +, or -.");
        hunkLines.push(line);
      }
      hunks.push({
        oldStart: Number(header[1]),
        oldCount: Number(header[2] ?? "1"),
        newStart: Number(header[3]),
        newCount: Number(header[4] ?? "1"),
        lines: hunkLines
      });
    }
    if (hunks.length === 0) return new Error(`Patch file ${path} does not contain hunks.`);
    files.push({ path, hunks });
  }
  return files.length > 0 ? files : new Error("No unified patch file entries were found.");
}

function applyHunks(content: string, hunks: readonly ParsedHunk[]): string | Error {
  const hadFinalNewline = content.endsWith("\n");
  const sourceLines = hadFinalNewline ? content.slice(0, -1).split("\n") : content.split("\n");
  const result: string[] = [];
  let cursor = 0;
  for (const hunk of hunks) {
    const start = Math.max(0, hunk.oldStart - 1);
    if (start < cursor) return new Error(`hunk at -${hunk.oldStart} overlaps a previous hunk`);
    const oldLines = hunk.lines.filter((line) => line.startsWith(" ") || line.startsWith("-")).map((line) => line.slice(1));
    const newLines = hunk.lines.filter((line) => line.startsWith(" ") || line.startsWith("+")).map((line) => line.slice(1));
    const actual = sourceLines.slice(start, start + oldLines.length);
    if (actual.join("\n") !== oldLines.join("\n")) return new Error(`hunk at -${hunk.oldStart},${hunk.oldCount} did not match target content`);
    result.push(...sourceLines.slice(cursor, start), ...newLines);
    cursor = start + oldLines.length;
  }
  result.push(...sourceLines.slice(cursor));
  return `${result.join("\n")}${hadFinalNewline ? "\n" : ""}`;
}

function normalizePatchPath(headerPath: string): string | undefined {
  const path = headerPath.split(/\s+/)[0] ?? "";
  if (path === "/dev/null") return path;
  return path.replace(/^[ab]\//, "").replace(/\\/g, "/");
}
