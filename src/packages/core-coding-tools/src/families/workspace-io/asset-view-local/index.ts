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

const TOOL_NAME = "asset.view-local" as CoreCodingToolName;
const MAX_BINARY_BYTES = 5_000_000;

interface AssetViewLocalInput extends JsonObject {
  readonly path: string;
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
}

const MIME_BY_EXTENSION = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".json", "application/json"],
  [".md", "text/markdown"],
  [".txt", "text/plain"],
  [".csv", "text/csv"],
  [".html", "text/html"],
  [".css", "text/css"],
  [".js", "text/javascript"],
  [".ts", "text/typescript"]
]);

export function defineAssetViewLocalTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.assetViewLocal,
    "Asset View Local",
    "read",
    ["workspace:read", "asset:read"],
    objectSchema(["path"], {
      path: { type: "string" },
      workspaceRoot: { type: "string" },
      limitBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => assetViewLocalTool(input, context, ready))
  );
}

async function assetViewLocalTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as AssetViewLocalInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure(TOOL_NAME, "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);

  const mime = detectMime(path.value.path);
  if (mime.startsWith("text/") || mime === "application/json" || mime === "image/svg+xml") {
    const text = await deps.platform.readFile(path.value.path).catch((error: unknown) => error instanceof Error ? error : new Error("Read failed."));
    if (text instanceof Error) return failure(TOOL_NAME, "ASSET_READ_FAILED", text.message, [path.value.path]);
    return success(TOOL_NAME, [path.value.path], {
      preview: boundedText(text, parsed.limitBytes ?? 4_000),
      metadata: {
        path: path.value.path,
        relativePath: path.value.relativePath,
        kind: mime === "image/svg+xml" ? "image" : "text",
        mime,
        sizeBytes: Buffer.byteLength(text, "utf8"),
        binaryPreviewIncluded: false
      },
      replay: replay(context)
    });
  }

  const bytes = await readBinaryBytes(deps, path.value.path);
  if (bytes instanceof Error) return failure(TOOL_NAME, "ASSET_BINARY_UNAVAILABLE", bytes.message, [path.value.path], { mime });
  if (bytes.byteLength > MAX_BINARY_BYTES) {
    return failure(TOOL_NAME, "ASSET_TOO_LARGE", `Asset exceeds ${MAX_BINARY_BYTES} bytes (${bytes.byteLength}).`, [path.value.path], { mime, sizeBytes: bytes.byteLength });
  }
  return success(TOOL_NAME, [path.value.path], {
    preview: boundedText(`[asset] ${mime} ${bytes.byteLength}B`, parsed.limitBytes ?? 4_000),
    metadata: {
      path: path.value.path,
      relativePath: path.value.relativePath,
      kind: mime.startsWith("image/") ? "image" : "binary",
      mime,
      sizeBytes: bytes.byteLength,
      dimensions: imageDimensions(mime, bytes),
      binaryPreviewIncluded: false
    },
    replay: replay(context)
  });
}

async function readBinaryBytes(deps: CoreCodingToolsDependencies, path: string): Promise<Uint8Array | Error> {
  const platform = deps.platform as unknown as { readBinaryFile?: (path: string) => Promise<Uint8Array> };
  if (platform.readBinaryFile) {
    const bytes = await platform.readBinaryFile(path).catch((error: unknown) => error instanceof Error ? error : new Error("Binary read failed."));
    if (!(bytes instanceof Error)) return bytes;
  }
  const text = await deps.platform.readFile(path).catch((error: unknown) => error instanceof Error ? error : new Error("Binary read failed."));
  return text instanceof Error ? text : Buffer.from(text, "utf8");
}

function detectMime(path: string): string {
  const lower = path.toLowerCase();
  for (const [extension, mime] of MIME_BY_EXTENSION) {
    if (lower.endsWith(extension)) return mime;
  }
  return "application/octet-stream";
}

function imageDimensions(mime: string, bytes: Uint8Array): JsonObject {
  if (mime === "image/png" && bytes.byteLength >= 24) {
    return { width: readUint32(bytes, 16), height: readUint32(bytes, 20) };
  }
  if (mime === "image/gif" && bytes.byteLength >= 10) {
    return { width: bytes[6]! + (bytes[7]! << 8), height: bytes[8]! + (bytes[9]! << 8) };
  }
  return {};
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0;
}
