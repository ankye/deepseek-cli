import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { CapabilityId, SessionId } from "./ids.js";
import type { PlatformProviderResultMetadata } from "./platform.js";

export type CoreCodingToolName =
  | "file.read"
  | "file.write"
  | "file.edit"
  | "file.list"
  | "search.text"
  | "shell.run"
  | "git.status"
  | "git.diff"
  | "test.run"
  | "todo.plan"
  | "web.fetch"
  | "web.search";

export type CoreCodingToolStatus = "completed" | "failed" | "rejected";
export type PlanItemStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface CoreToolDiagnostic extends RedactedError {
  readonly field?: string;
}

export interface BoundedText extends JsonObject {
  readonly text: string;
  readonly byteLength: number;
  readonly lineCount: number;
  readonly truncated: boolean;
  readonly limitBytes: number;
  readonly redaction: RedactionMetadata;
}

export interface CoreToolEvidence extends JsonObject {
  readonly tool: CoreCodingToolName;
  readonly status: CoreCodingToolStatus;
  readonly affectedPaths: readonly string[];
  readonly preview?: BoundedText;
  readonly provider?: PlatformProviderResultMetadata;
  readonly diagnostics: readonly CoreToolDiagnostic[];
  readonly metadata: JsonObject;
  readonly replay: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface CoreToolResult extends JsonObject {
  readonly evidence: CoreToolEvidence;
}

export interface FileReadInput extends JsonObject {
  readonly path: string;
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
}

export interface FileWriteInput extends JsonObject {
  readonly path: string;
  readonly content: string;
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
}

export interface FileEditInput extends JsonObject {
  readonly path: string;
  readonly expected: string;
  readonly replacement: string;
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
}

export interface FileListInput extends JsonObject {
  readonly pattern?: string;
  readonly path?: string;
  readonly workspaceRoot?: string;
  readonly limit?: number;
  readonly limitBytes?: number;
}

export interface SearchTextInput extends JsonObject {
  readonly pattern: string;
  readonly workspaceRoot?: string;
  readonly limit?: number;
  readonly limitBytes?: number;
}

export interface ShellRunInput extends JsonObject {
  readonly command: string;
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly workspaceRoot?: string;
  readonly timeoutMs?: number;
  readonly limitBytes?: number;
  readonly shellProfile?: string;
}

export interface GitEvidenceInput extends JsonObject {
  readonly workspaceRoot?: string;
  readonly limitBytes?: number;
}

export interface TestRunInput extends JsonObject {
  readonly command: string;
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly workspaceRoot?: string;
  readonly timeoutMs?: number;
  readonly limitBytes?: number;
  readonly intent?: string;
}

export interface TodoPlanItem extends JsonObject {
  readonly id: string;
  readonly title: string;
  readonly status: PlanItemStatus;
}

export interface TodoPlanInput extends JsonObject {
  readonly items: readonly TodoPlanItem[];
}

export interface WorkspaceEditTransactionEvidence extends JsonObject {
  readonly id: string;
  readonly sessionId?: SessionId;
  readonly capabilityId: CapabilityId;
  readonly path: string;
  readonly precondition: "exact-match" | "full-write";
  readonly beforeHash: string;
  readonly afterHash: string;
  readonly rollback: JsonObject;
  readonly metadata?: JsonObject;
  readonly applied: boolean;
  readonly diagnostics: readonly CoreToolDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface WebFetchInput extends JsonObject {
  readonly url: string;
  readonly prompt?: string;
  readonly summarize?: boolean;
  readonly limitBytes?: number;
  readonly followRedirects?: number;
}

export interface WebSearchInput extends JsonObject {
  readonly query: string;
  readonly limit?: number;
  readonly allowedDomains?: readonly string[];
  readonly blockedDomains?: readonly string[];
}

export interface WebSearchResultItem extends JsonObject {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
}

export interface WebFetchResponseMetadata extends JsonObject {
  readonly finalUrl: string;
  readonly status: number;
  readonly contentType: string;
  readonly truncated: boolean;
  readonly byteLength: number;
  readonly summarized: boolean;
  readonly redirects: number;
  readonly cached: boolean;
}

export interface WebFetchProvider {
  readonly name: string;
  fetch(input: WebFetchInput): Promise<{
    readonly metadata: WebFetchResponseMetadata;
    readonly markdown: string;
    readonly summary?: string;
  }>;
}

export interface WebSearchProvider {
  readonly name: string;
  search(input: WebSearchInput): Promise<readonly WebSearchResultItem[]>;
}
