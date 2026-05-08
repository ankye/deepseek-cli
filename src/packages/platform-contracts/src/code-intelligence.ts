import type { JsonObject } from "./common.js";

export interface Diagnostic {
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning" | "info";
  readonly line?: number;
}

export interface SymbolReference {
  readonly name: string;
  readonly path: string;
  readonly line?: number;
}

export interface CodeIntelligenceService {
  diagnostics(root: string): Promise<readonly Diagnostic[]>;
  symbols(query: string): Promise<readonly SymbolReference[]>;
  definitions(symbol: string): Promise<readonly SymbolReference[]>;
  invalidate(path: string): Promise<void>;
}
