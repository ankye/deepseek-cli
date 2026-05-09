import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, SerializableResult } from "./common.js";
import type { ContextGraphNode } from "./context.js";
import type { SessionId } from "./ids.js";

export const CODE_INTELLIGENCE_SCHEMA_VERSION = "1.0.0";

export type CodeIntelligenceProviderKind = "none" | "local-analyzer" | "ide" | "lsp" | "fixture";
export type CodeIntelligenceProviderStatus = "available" | "degraded" | "unavailable";
export type CodeIntelligenceSeverity = "error" | "warning" | "info";
export type CodeIntelligenceSymbolKind = "function" | "class" | "interface" | "type" | "const" | "let" | "var" | "method" | "unknown";

export interface CodeRange extends JsonObject {
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface CodeIntelligenceProviderMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly provider: CodeIntelligenceProviderKind;
  readonly status: CodeIntelligenceProviderStatus;
  readonly indexedFileCount: number;
  readonly truncated: boolean;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface CodeIntelligenceIndexMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly root: string;
  readonly indexedAt: string;
  readonly fileCount: number;
  readonly indexedPaths: readonly string[];
  readonly invalidatedPaths: readonly string[];
  readonly dependencyFingerprints: readonly string[];
  readonly provider: CodeIntelligenceProviderMetadata;
  readonly redaction: RedactionMetadata;
}

export interface Diagnostic extends JsonObject {
  readonly schemaVersion?: string;
  readonly path: string;
  readonly message: string;
  readonly severity: CodeIntelligenceSeverity;
  readonly line?: number;
  readonly range?: CodeRange;
  readonly source?: string;
  readonly code?: string;
  readonly provenance?: JsonObject;
  readonly redaction?: RedactionMetadata;
}

export interface SymbolReference extends JsonObject {
  readonly schemaVersion?: string;
  readonly name: string;
  readonly path: string;
  readonly line?: number;
  readonly range?: CodeRange;
  readonly kind?: CodeIntelligenceSymbolKind;
  readonly containerName?: string;
  readonly source?: string;
  readonly provenance?: JsonObject;
  readonly redaction?: RedactionMetadata;
}

export interface CodeIntelligenceIndexResult extends JsonObject {
  readonly schemaVersion: string;
  readonly metadata: CodeIntelligenceIndexMetadata;
  readonly diagnostics: readonly Diagnostic[];
  readonly symbols: readonly SymbolReference[];
  readonly references: readonly SymbolReference[];
  readonly redaction: RedactionMetadata;
}

export interface CodeIntelligenceContextRequest extends JsonObject {
  readonly sessionId: SessionId;
  readonly root: string;
  readonly includeDiagnostics?: boolean;
  readonly includeSymbols?: boolean;
  readonly limit?: number;
}

export interface CodeIntelligenceContextResult extends JsonObject {
  readonly schemaVersion: string;
  readonly sessionId: SessionId;
  readonly nodes: readonly ContextGraphNode[];
  readonly metadata: CodeIntelligenceIndexMetadata;
  readonly redaction: RedactionMetadata;
}

export interface CodeIntelligenceService {
  status(root?: string): Promise<CodeIntelligenceProviderMetadata>;
  index(root: string): Promise<SerializableResult<CodeIntelligenceIndexResult>>;
  diagnostics(root: string): Promise<readonly Diagnostic[]>;
  symbols(query: string): Promise<readonly SymbolReference[]>;
  definitions(symbol: string): Promise<readonly SymbolReference[]>;
  references(symbol: string): Promise<readonly SymbolReference[]>;
  contextNodes(request: CodeIntelligenceContextRequest): Promise<SerializableResult<CodeIntelligenceContextResult>>;
  invalidate(path: string): Promise<void>;
}
