import type {
  CodeIntelligenceContextRequest,
  CodeIntelligenceContextResult,
  CodeIntelligenceIndexMetadata,
  CodeIntelligenceIndexResult,
  CodeIntelligenceProviderMetadata,
  CodeIntelligenceService,
  CodeIntelligenceSymbolKind,
  ContextGraphNode,
  Diagnostic,
  JsonObject,
  PlatformRuntime,
  RedactedError,
  SerializableResult,
  SymbolReference
} from "@deepseek/platform-contracts";
import { CODE_INTELLIGENCE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
export { createCodeIntelligenceFamilyCapabilities } from "./capabilities.js";
export type { CodeIntelligenceFamilyCapabilityOptions } from "./capabilities.js";

const deterministicTime = new Date(0).toISOString();
const supportedExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"] as const;

export class NullCodeIntelligenceService implements CodeIntelligenceService {
  async status(): Promise<CodeIntelligenceProviderMetadata> {
    return providerMetadata("none", "unavailable", 0, false, [diagnostic("CODE_INTELLIGENCE_UNAVAILABLE", "Code intelligence provider is not configured.")]);
  }

  async index(root: string): Promise<SerializableResult<CodeIntelligenceIndexResult>> {
    const metadata = indexMetadata(root, [], [], await this.status());
    return { ok: true, value: { schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION, metadata, diagnostics: [], symbols: [], references: [], redaction: { class: "internal" } } };
  }

  async diagnostics(_root: string): Promise<readonly Diagnostic[]> {
    return [];
  }

  async symbols(query: string): Promise<readonly SymbolReference[]> {
    return query ? [symbolReference(query, "<memory>", 1, "unknown")] : [];
  }

  async definitions(symbol: string): Promise<readonly SymbolReference[]> {
    return symbol ? [symbolReference(symbol, "<memory>", 1, "unknown")] : [];
  }

  async references(_symbol: string): Promise<readonly SymbolReference[]> {
    return [];
  }

  async contextNodes(request: CodeIntelligenceContextRequest): Promise<SerializableResult<CodeIntelligenceContextResult>> {
    const metadata = indexMetadata(request.root, [], [], await this.status());
    return { ok: true, value: { schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION, sessionId: request.sessionId, nodes: [], metadata, redaction: { class: "internal" } } };
  }

  async invalidate(_path: string): Promise<void> {}
}

export interface DeterministicCodeIntelligenceOptions {
  readonly maxFiles?: number;
  readonly maxFileBytes?: number;
}

interface CachedIndex {
  readonly root: string;
  readonly metadata: CodeIntelligenceIndexMetadata;
  readonly diagnostics: readonly Diagnostic[];
  readonly symbols: readonly SymbolReference[];
  readonly references: readonly SymbolReference[];
}

export class DeterministicCodeIntelligenceService implements CodeIntelligenceService {
  private readonly invalidatedPaths = new Set<string>();
  private readonly cache = new Map<string, CachedIndex>();
  private readonly maxFiles: number;
  private readonly maxFileBytes: number;

  constructor(
    private readonly platform: PlatformRuntime,
    options: DeterministicCodeIntelligenceOptions = {}
  ) {
    this.maxFiles = options.maxFiles ?? 200;
    this.maxFileBytes = options.maxFileBytes ?? 80_000;
  }

  async status(root = ""): Promise<CodeIntelligenceProviderMetadata> {
    const cached = root ? this.cache.get(root) : undefined;
    return providerMetadata("local-analyzer", "available", cached?.metadata.fileCount ?? 0, cached?.metadata.provider.truncated ?? false, []);
  }

  async index(root: string): Promise<SerializableResult<CodeIntelligenceIndexResult>> {
    const cached = this.cache.get(root);
    if (cached && !cached.metadata.indexedPaths.some((path) => this.invalidatedPaths.has(path))) {
      return {
        ok: true,
        value: {
          schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
          metadata: cached.metadata,
          diagnostics: cached.diagnostics,
          symbols: cached.symbols,
          references: cached.references,
          redaction: { class: "internal", fields: ["metadata.indexedPaths"] }
        }
      };
    }

    const allFiles = (await this.platform.findFiles("", root))
      .filter((path) => supportedExtensions.some((extension) => path.endsWith(extension)))
      .sort();
    const truncated = allFiles.length > this.maxFiles;
    const files = allFiles.slice(0, this.maxFiles);
    const providerDiagnostics = truncated ? [diagnostic("CODE_INTELLIGENCE_FILE_LIMIT", "Code intelligence indexed a bounded subset of files.")] : [];
    const diagnostics: Diagnostic[] = [];
    const symbols: SymbolReference[] = [];
    const references: SymbolReference[] = [];
    const dependencyFingerprints: string[] = [];

    for (const path of files) {
      const content = await this.platform.readFile(path).catch(() => "");
      const bounded = content.slice(0, this.maxFileBytes);
      const fileTruncated = content.length > bounded.length;
      if (fileTruncated) diagnostics.push(codeDiagnostic(path, "warning", "CODE_INTELLIGENCE_FILE_TRUNCATED", "File exceeded code intelligence byte limit.", 1));
      dependencyFingerprints.push(`${path}:${stableHash(bounded)}`);
      const lines = bounded.split(/\r?\n/);
      diagnostics.push(...extractDiagnostics(path, lines));
      symbols.push(...extractSymbols(path, lines));
    }
    for (const symbol of symbols) {
      references.push(...extractReferences(symbol, files, await readFiles(this.platform, files)));
    }

    const provider = providerMetadata("local-analyzer", providerDiagnostics.length > 0 ? "degraded" : "available", files.length, truncated, providerDiagnostics);
    const metadata = indexMetadata(root, files, [...this.invalidatedPaths].sort(), provider, dependencyFingerprints);
    const entry: CachedIndex = { root, metadata, diagnostics, symbols, references };
    this.cache.set(root, entry);
    for (const path of files) this.invalidatedPaths.delete(path);
    return {
      ok: true,
      value: {
        schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
        metadata,
        diagnostics,
        symbols,
        references,
        redaction: { class: "internal", fields: ["metadata.indexedPaths", "diagnostics.path", "symbols.path", "references.path"] }
      }
    };
  }

  async diagnostics(root: string): Promise<readonly Diagnostic[]> {
    return (await this.index(root)).value?.diagnostics ?? [];
  }

  async symbols(query: string): Promise<readonly SymbolReference[]> {
    const entries = [...this.cache.values()];
    return entries.flatMap((entry) => entry.symbols).filter((symbol) => !query || symbol.name.includes(query));
  }

  async definitions(symbol: string): Promise<readonly SymbolReference[]> {
    return (await this.symbols(symbol)).filter((entry) => entry.name === symbol);
  }

  async references(symbol: string): Promise<readonly SymbolReference[]> {
    return [...this.cache.values()].flatMap((entry) => entry.references).filter((reference) => reference.name === symbol);
  }

  /**
   * Produce context graph nodes (diagnostics + symbols) for the given root.
   *
   * Safe-fallback semantics: when the underlying index fails because the root
   * does not exist on the platform file system, this method returns
   * `{ ok: true, value: { nodes: [], ... } }` rather than throwing or
   * returning `ok: false`. This lets runtime consumers (e.g. the context
   * engine auto-enrichment path) call `contextNodes` unconditionally without
   * risking projection failure for uninitialized workspaces.
   */
  async contextNodes(request: CodeIntelligenceContextRequest): Promise<SerializableResult<CodeIntelligenceContextResult>> {
    const indexed = await this.index(request.root);
    if (!indexed.ok || !indexed.value) {
      const provider = await this.status(request.root);
      const metadata = indexMetadata(request.root, [], [...this.invalidatedPaths].sort(), provider);
      return {
        ok: true,
        value: {
          schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
          sessionId: request.sessionId,
          nodes: [],
          metadata,
          redaction: { class: "internal", fields: ["nodes.content", "metadata.indexedPaths"] }
        }
      };
    }
    const nodes = [
      ...(request.includeDiagnostics ?? true ? indexed.value.diagnostics.map((entry) => diagnosticNode(request, entry)) : []),
      ...(request.includeSymbols ?? true ? indexed.value.symbols.map((entry) => symbolNode(request, entry)) : [])
    ].slice(0, request.limit ?? 50);
    return {
      ok: true,
      value: {
        schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
        sessionId: request.sessionId,
        nodes,
        metadata: indexed.value.metadata,
        redaction: { class: "internal", fields: ["nodes.content", "metadata.indexedPaths"] }
      }
    };
  }

  /**
   * Mark a path as invalidated so the next `index`/`diagnostics`/`symbols`
   * call re-reads it from the platform file system.
   *
   * Idempotent: calling `invalidate` with an unknown path (not currently
   * tracked in any `CachedIndex`) produces no side effects beyond adding the
   * path to the invalidation set, and never throws. Callers can invoke it
   * freely from write-path tool post-execution hooks without first checking
   * whether the path has been indexed.
   */
  async invalidate(path: string): Promise<void> {
    this.invalidatedPaths.add(path);
  }
}

function extractDiagnostics(path: string, lines: readonly string[]): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  lines.forEach((line, index) => {
    if (/\bTODO\b/i.test(line)) diagnostics.push(codeDiagnostic(path, "info", "CODE_TODO", redactSecretText(line.trim()), index + 1));
    if (/\bFIXME\b/i.test(line)) diagnostics.push(codeDiagnostic(path, "warning", "CODE_FIXME", redactSecretText(line.trim()), index + 1));
    if (/\bthrow new Error\b/.test(line)) diagnostics.push(codeDiagnostic(path, "warning", "CODE_THROW", "Throw expression may need explicit error handling.", index + 1));
  });
  return diagnostics;
}

function extractSymbols(path: string, lines: readonly string[]): readonly SymbolReference[] {
  const symbols: SymbolReference[] = [];
  const pattern = /\b(?:export\s+)?(?:async\s+)?(function|class|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/;
  lines.forEach((line, index) => {
    const match = pattern.exec(line);
    if (!match) return;
    symbols.push(symbolReference(match[2] ?? "", path, index + 1, symbolKind(match[1] ?? "unknown")));
  });
  return symbols;
}

function extractReferences(symbol: SymbolReference, paths: readonly string[], files: ReadonlyMap<string, string>): readonly SymbolReference[] {
  const references: SymbolReference[] = [];
  for (const path of paths) {
    const content = files.get(path) ?? "";
    content.split(/\r?\n/).forEach((line, index) => {
      if (!line.includes(symbol.name)) return;
      references.push(symbolReference(symbol.name, path, index + 1, symbol.kind ?? "unknown", "reference"));
    });
  }
  return references;
}

async function readFiles(platform: PlatformRuntime, paths: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const result = new Map<string, string>();
  for (const path of paths) {
    result.set(path, await platform.readFile(path).catch(() => ""));
  }
  return result;
}

function codeDiagnostic(path: string, severity: Diagnostic["severity"], code: string, message: string, line: number): Diagnostic {
  return {
    schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
    path,
    message: redactSecretText(message),
    severity,
    line,
    range: { startLine: line, startColumn: 1, endLine: line, endColumn: 1 },
    source: "deterministic-local-analyzer",
    code,
    provenance: { provider: "local-analyzer" },
    redaction: { class: "internal", fields: ["path", "message"] }
  };
}

function symbolReference(name: string, path: string, line: number, kind: CodeIntelligenceSymbolKind, source = "definition"): SymbolReference {
  return {
    schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
    name,
    path,
    line,
    range: { startLine: line, startColumn: 1, endLine: line, endColumn: 1 },
    kind,
    source,
    provenance: { provider: "local-analyzer" },
    redaction: { class: "internal", fields: ["path"] }
  };
}

function diagnosticNode(request: CodeIntelligenceContextRequest, diagnosticEntry: Diagnostic): ContextGraphNode {
  const content = `${diagnosticEntry.severity.toUpperCase()} ${diagnosticEntry.path}:${diagnosticEntry.line ?? 1} ${diagnosticEntry.message}`;
  return contextNode(request, `diagnostic:${diagnosticEntry.path}:${diagnosticEntry.line ?? 1}:${diagnosticEntry.code ?? ""}`, "diagnostic", content, {
    diagnostic: diagnosticEntry
  }, 90);
}

function symbolNode(request: CodeIntelligenceContextRequest, symbol: SymbolReference): ContextGraphNode {
  const content = `${symbol.kind ?? "symbol"} ${symbol.name} at ${symbol.path}:${symbol.line ?? 1}`;
  return contextNode(request, `symbol:${symbol.name}:${symbol.path}:${symbol.line ?? 1}`, "file", content, { symbol }, 60);
}

function contextNode(request: CodeIntelligenceContextRequest, key: string, kind: ContextGraphNode["kind"], content: string, provenance: JsonObject, priority: number): ContextGraphNode {
  const safeContent = redactSecretText(content).slice(0, 2_000);
  return {
    schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
    id: asId<"contextNode">(`code-intelligence-${stableHash(key)}`),
    kind,
    source: "code-intelligence",
    lifecycle: "turn",
    scope: { sessionId: request.sessionId, workspaceRoot: request.root },
    priority,
    content: safeContent,
    estimatedTokens: Math.max(1, safeContent.split(/\s+/).length),
    redaction: { class: "internal", fields: ["content", "provenance"] },
    provenance,
    dependencyFingerprints: [stableHash(`${key}:${safeContent}`)],
    compatibility: { schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION },
    createdAt: deterministicTime
  };
}

function indexMetadata(
  root: string,
  indexedPaths: readonly string[],
  invalidatedPaths: readonly string[],
  provider: CodeIntelligenceProviderMetadata,
  dependencyFingerprints: readonly string[] = []
): CodeIntelligenceIndexMetadata {
  return {
    schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
    root,
    indexedAt: deterministicTime,
    fileCount: indexedPaths.length,
    indexedPaths,
    invalidatedPaths,
    dependencyFingerprints,
    provider,
    redaction: { class: "internal", fields: ["root", "indexedPaths", "invalidatedPaths"] }
  };
}

function providerMetadata(
  provider: CodeIntelligenceProviderMetadata["provider"],
  status: CodeIntelligenceProviderMetadata["status"],
  indexedFileCount: number,
  truncated: boolean,
  diagnostics: readonly RedactedError[]
): CodeIntelligenceProviderMetadata {
  return {
    schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION,
    provider,
    status,
    indexedFileCount,
    truncated,
    diagnostics,
    redaction: { class: "internal" },
    compatibility: { schemaVersion: CODE_INTELLIGENCE_SCHEMA_VERSION }
  };
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "public" }
  };
}

function symbolKind(value: string): CodeIntelligenceSymbolKind {
  if (value === "function" || value === "class" || value === "interface" || value === "type" || value === "const" || value === "let" || value === "var") return value;
  return "unknown";
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function redactSecretText(text: string): string {
  return text
    .replace(/\b(?:sk|ds)-[A-Za-z0-9_-]{8,}\b|\bdeepseek-[A-Za-z0-9_-]{24,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*=\s*["']?[^"'\s]+/gi, "[REDACTED:env-credential]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g, "[REDACTED:bearer-token]");
}
