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
import { requireDeps, resolveToolPath } from "../../../shared/workspace.js";

const TOOL_NAME = "notebook.read" as CoreCodingToolName;

interface NotebookReadInput extends JsonObject {
  readonly path: string;
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
  readonly maxCells?: number;
  readonly maxSourceBytes?: number;
}

interface NotebookCell {
  readonly cell_type?: unknown;
  readonly source?: unknown;
  readonly outputs?: unknown;
  readonly execution_count?: unknown;
  readonly metadata?: unknown;
}

export function defineNotebookReadTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.notebookRead,
    "Notebook Read",
    "read",
    ["workspace:read"],
    objectSchema(["path"], {
      path: { type: "string" },
      workspaceRoot: { type: "string" },
      limitBytes: { type: "number" },
      maxCells: { type: "number" },
      maxSourceBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => notebookReadTool(input, context, ready))
  );
}

async function notebookReadTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as NotebookReadInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure(TOOL_NAME, "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  if (!path.value.path.toLowerCase().endsWith(".ipynb")) return failure(TOOL_NAME, "NOTEBOOK_EXTENSION_UNSUPPORTED", "Notebook reader only accepts .ipynb files.", [path.value.path]);

  const raw = await deps.platform.readFile(path.value.path).catch((error: unknown) => error instanceof Error ? error : new Error("Notebook read failed."));
  if (raw instanceof Error) return failure(TOOL_NAME, "NOTEBOOK_READ_FAILED", raw.message, [path.value.path]);
  const parsedNotebook = parseNotebook(raw);
  if (parsedNotebook instanceof Error) return failure(TOOL_NAME, "NOTEBOOK_MALFORMED", parsedNotebook.message, [path.value.path], { byteLength: Buffer.byteLength(raw, "utf8") });

  const cells = Array.isArray(parsedNotebook.cells) ? parsedNotebook.cells as NotebookCell[] : [];
  const maxCells = boundedCount(parsed.maxCells, 20, 200);
  const maxSourceBytes = boundedCount(parsed.maxSourceBytes, 1_200, 8_000);
  const summaries = cells.slice(0, maxCells).map((cell, index) => summarizeCell(cell, index, maxSourceBytes));
  const preview = summaries.map((cell) => `#${cell.index} ${cell.cellType} lines=${cell.lineCount}${cell.sourceTruncated ? " truncated" : ""}\n${cell.sourcePreview}`).join("\n\n");
  return success(TOOL_NAME, [path.value.path], {
    preview: boundedText(preview, parsed.limitBytes ?? 8_000),
    metadata: {
      path: path.value.path,
      relativePath: path.value.relativePath,
      nbformat: typeof parsedNotebook.nbformat === "number" ? parsedNotebook.nbformat : undefined,
      nbformatMinor: typeof parsedNotebook.nbformat_minor === "number" ? parsedNotebook.nbformat_minor : undefined,
      cellCount: cells.length,
      returnedCells: summaries.length,
      truncatedCells: cells.length > summaries.length,
      cells: summaries
    },
    replay: replay(context)
  });
}

function parseNotebook(raw: string): JsonObject | Error {
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null || !Array.isArray((value as { cells?: unknown }).cells)) {
      return new Error("Notebook JSON must contain a cells array.");
    }
    return value as JsonObject;
  } catch (error) {
    return error instanceof Error ? error : new Error("Notebook JSON parse failed.");
  }
}

function summarizeCell(cell: NotebookCell, index: number, maxSourceBytes: number): JsonObject {
  const source = sourceToText(cell.source);
  const preview = boundedText(source, maxSourceBytes);
  return {
    index,
    cellType: typeof cell.cell_type === "string" ? cell.cell_type : "unknown",
    executionCount: typeof cell.execution_count === "number" ? cell.execution_count : undefined,
    lineCount: source.length === 0 ? 0 : source.split(/\r?\n/).length,
    sourcePreview: preview.text,
    sourceByteLength: preview.byteLength,
    sourceTruncated: preview.truncated,
    outputCount: Array.isArray(cell.outputs) ? cell.outputs.length : 0,
    metadataKeys: metadataKeys(cell.metadata)
  };
}

function sourceToText(source: unknown): string {
  if (typeof source === "string") return source;
  if (Array.isArray(source)) return source.map((item) => typeof item === "string" ? item : String(item)).join("");
  return "";
}

function metadataKeys(metadata: unknown): readonly string[] {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return [];
  return Object.keys(metadata).filter((key) => !/token|secret|password|credential/i.test(key)).sort().slice(0, 20);
}

function boundedCount(value: number | undefined, fallback: number, max: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value ?? fallback))) : fallback;
}
