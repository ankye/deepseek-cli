import type { CodeIntelligenceService, Diagnostic, SymbolReference } from "@deepseek/platform-contracts";

export class NullCodeIntelligenceService implements CodeIntelligenceService {
  async diagnostics(_root: string): Promise<readonly Diagnostic[]> {
    return [];
  }

  async symbols(query: string): Promise<readonly SymbolReference[]> {
    return query ? [{ name: query, path: "<memory>", line: 1 }] : [];
  }

  async definitions(symbol: string): Promise<readonly SymbolReference[]> {
    return symbol ? [{ name: symbol, path: "<memory>", line: 1 }] : [];
  }

  async invalidate(_path: string): Promise<void> {}
}
