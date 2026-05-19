## 1. Host Adapter Wiring

- [ ] 1.1 Extend jump navigator resolution to accept an injected `CodeIntelligenceService` while preserving existing file/text behavior.
- [ ] 1.2 Implement symbol result-list projection from `SymbolReference` records with file targets, line metadata, active target, diagnostics, and redaction metadata.
- [ ] 1.3 Update CLI jump command execution to pass `runtime.deps.codeIntelligence` into symbol jump resolution.

## 2. Owner Route And TUI Surfaces

- [ ] 2.1 Mark `jump.navigator.symbol` as an implemented built-in plugin owner route and dispatch it through the host-owned jump adapter.
- [ ] 2.2 Update chat slash/plugin execution paths so `/jump symbol <query>` and injected symbol aliases attach active symbol result lists.
- [ ] 2.3 Keep repo recall and project-index routes deferred with explicit diagnostics.

## 3. Verification

- [ ] 3.1 Update owner-route contract tests to assert symbol jump is executable and plugin-private code remains unused.
- [ ] 3.2 Update navigation/chat tests to assert CLI and chat symbol jumps return active code-intelligence result lists.
- [ ] 3.3 Run `openspec validate wire-symbol-jump-owner-route --strict` and relevant TypeScript/test checks before archive.
