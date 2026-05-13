import type { JsonObject, PlatformRuntime } from "@deepseek/platform-contracts";
import { SESSION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { ChatPageIndexPage } from "./pageindex.js";
import {
  CHAT_PAGEINDEX_STORAGE_PAGE_LIMIT,
  normalizeChatPageIndexPages,
  workspaceChatPageIndexPagesFromSessionPages
} from "./pageindex.js";

export interface WorkspacePageIndexPayload extends JsonObject {
  readonly kind: "chat.pageindex.workspace";
  readonly schemaVersion: string;
  readonly workspaceRootHash: string;
  readonly pageCount: number;
  readonly pages: readonly ChatPageIndexPage[];
  readonly redaction: JsonObject;
}

export interface WorkspacePageIndexDiagnostic extends JsonObject {
  readonly kind: "palette.recall.workspace.failure";
  readonly code:
    | "CLI_PAGEINDEX_WORKSPACE_PATH_UNAVAILABLE"
    | "CLI_PAGEINDEX_WORKSPACE_READ_FAILED"
    | "CLI_PAGEINDEX_WORKSPACE_WRITE_FAILED";
  readonly message: string;
  readonly redaction: JsonObject;
}

export type WorkspacePageIndexReadResult =
  | { readonly ok: true; readonly pages: readonly ChatPageIndexPage[]; readonly path: string }
  | { readonly ok: false; readonly diagnostic: WorkspacePageIndexDiagnostic };

export type WorkspacePageIndexWriteResult =
  | { readonly ok: true; readonly pageCount: number; readonly path: string }
  | { readonly ok: false; readonly diagnostic: WorkspacePageIndexDiagnostic };

export class CliWorkspacePageIndexStore {
  constructor(
    private readonly platform: PlatformRuntime,
    private readonly workspaceRoot: string
  ) {}

  async read(): Promise<WorkspacePageIndexReadResult> {
    const path = this.path();
    if (!path.ok) return path;
    let raw = "";
    try {
      raw = await this.platform.readFile(path.path);
    } catch (error) {
      if (isMissingFileError(error)) return { ok: true, pages: [], path: path.path };
      return {
        ok: false,
        diagnostic: diagnostic("CLI_PAGEINDEX_WORKSPACE_READ_FAILED", error instanceof Error ? error.message : "Workspace PageIndex read failed.")
      };
    }
    if (!raw) return { ok: true, pages: [], path: path.path };
    const parsed = parsePayload(raw);
    return { ok: true, pages: parsed, path: path.path };
  }

  async append(
    sessionPages: readonly ChatPageIndexPage[],
    input: { readonly workspaceCheckpointWatermark?: number } = {}
  ): Promise<WorkspacePageIndexWriteResult> {
    if (sessionPages.length === 0) {
      const path = this.path();
      if (!path.ok) return path;
      return { ok: true, pageCount: 0, path: path.path };
    }
    const path = this.path();
    if (!path.ok) return path;
    const existing = await this.read();
    if (!existing.ok) return existing;
    const workspacePages = workspaceChatPageIndexPagesFromSessionPages(sessionPages, {
      workspaceRoot: this.workspaceRoot,
      ...(input.workspaceCheckpointWatermark !== undefined ? { workspaceCheckpointWatermark: input.workspaceCheckpointWatermark } : {})
    });
    const pages = mergePages(existing.pages, workspacePages);
    const payload: WorkspacePageIndexPayload = {
      kind: "chat.pageindex.workspace",
      schemaVersion: SESSION_SCHEMA_VERSION,
      workspaceRootHash: stableId(this.workspaceRoot),
      pageCount: pages.length,
      pages,
      redaction: {
        class: "internal",
        fields: ["pages.promptPreview", "pages.assistantPreview", "pages.traceId", "pages.evidenceQuality", "workspaceRootHash"]
      }
    };
    const write = await this.platform.atomicWriteFile(path.path, `${JSON.stringify(payload)}\n`);
    if (!write.ok) {
      return {
        ok: false,
        diagnostic: diagnostic("CLI_PAGEINDEX_WORKSPACE_WRITE_FAILED", write.error?.message ?? "Workspace PageIndex write failed.")
      };
    }
    return { ok: true, pageCount: pages.length, path: path.path };
  }

  private path(): { readonly ok: true; readonly path: string } | { readonly ok: false; readonly diagnostic: WorkspacePageIndexDiagnostic } {
    const metadata = this.platform.workspaceMetadataPath(this.workspaceRoot, "deepseek");
    if (!metadata.ok || !metadata.value) {
      return {
        ok: false,
        diagnostic: diagnostic("CLI_PAGEINDEX_WORKSPACE_PATH_UNAVAILABLE", metadata.error?.message ?? "Workspace metadata path is unavailable.")
      };
    }
    return { ok: true, path: this.platform.resolvePath(this.platform.resolvePath(metadata.value, ".."), "pageindex.json") };
  }
}

export function renderWorkspacePageIndexFailure(
  diagnosticRecord: WorkspacePageIndexDiagnostic,
  output: "text" | "json" | "jsonl"
): readonly string[] {
  if (output === "json" || output === "jsonl") return [JSON.stringify(diagnosticRecord)];
  return [`palette recall: workspace unavailable code=${diagnosticRecord.code}`];
}

function mergePages(existing: readonly ChatPageIndexPage[], incoming: readonly ChatPageIndexPage[]): readonly ChatPageIndexPage[] {
  const byKey = new Map<string, ChatPageIndexPage>();
  for (const page of [...existing, ...incoming]) {
    byKey.set(`${page.sessionId}:${page.turnId}:${page.scope}`, page);
  }
  return normalizeChatPageIndexPages([...byKey.values()]
    .sort((a, b) => {
      if (a.sequence !== b.sequence) return a.sequence - b.sequence;
      return a.pageId.localeCompare(b.pageId);
    })
    .slice(-CHAT_PAGEINDEX_STORAGE_PAGE_LIMIT));
}

function parsePayload(raw: string): readonly ChatPageIndexPage[] {
  try {
    const parsed = JSON.parse(raw) as JsonObject;
    if (parsed.kind !== "chat.pageindex.workspace" || parsed.schemaVersion !== SESSION_SCHEMA_VERSION || !Array.isArray(parsed.pages)) return [];
    return normalizeChatPageIndexPages(parsed.pages.filter(isPageIndexPage));
  } catch {
    return [];
  }
}

function isPageIndexPage(value: unknown): value is ChatPageIndexPage {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.kind === "pageindex.page" && record.scope === "workspace" && typeof record.pageId === "string" && typeof record.sessionId === "string" && typeof record.turnId === "string";
}

function diagnostic(code: WorkspacePageIndexDiagnostic["code"], message: string): WorkspacePageIndexDiagnostic {
  return {
    kind: "palette.recall.workspace.failure",
    code,
    message,
    redaction: { class: "internal", fields: ["message"] }
  };
}

function isMissingFileError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("ENOENT") || error.message.includes("Fake file not found");
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
