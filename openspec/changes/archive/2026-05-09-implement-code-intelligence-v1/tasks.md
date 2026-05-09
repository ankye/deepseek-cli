## 1. Contracts And Analyzer Model / 契约与分析器模型

- [x] 1.1 Add versioned diagnostics, symbols, references, provider status, index metadata, and context-node DTOs to `platform-contracts`. / 在 `platform-contracts` 增加版本化 diagnostics、symbols、references、provider status、index metadata 和 context-node DTO。
- [x] 1.2 Extend `CodeIntelligenceService` with index, references, provider status, and context-node projection methods while preserving existing methods. / 扩展 `CodeIntelligenceService`，增加 index、references、provider status 和 context-node projection methods，同时保留现有方法。

## 2. Deterministic Local Analyzer / 确定性本地分析器

- [x] 2.1 Implement `DeterministicCodeIntelligenceService` using platform file discovery and reads. / 使用 platform file discovery 与 reads 实现 `DeterministicCodeIntelligenceService`。
- [x] 2.2 Extract stable diagnostics, symbols, definitions, references, index metadata, provider status, and bounded degradation diagnostics. / 提取稳定 diagnostics、symbols、definitions、references、index metadata、provider status 和有界降级 diagnostics。
- [x] 2.3 Implement path-scoped invalidation and deterministic re-indexing. / 实现 path-scoped invalidation 与确定性 re-indexing。

## 3. Context And Regression Integration / 上下文与回归集成

- [x] 3.1 Convert diagnostic and symbol evidence into redacted `ContextGraphNode` values. / 将 diagnostic 与 symbol evidence 转为脱敏 `ContextGraphNode`。
- [x] 3.2 Wire deterministic runtime test dependencies to use the local analyzer where safe. / 将 deterministic runtime test dependencies 在安全范围内接入 local analyzer。

## 4. Tests And Validation / 测试与校验

- [x] 4.1 Add unit and contract tests for DTOs, diagnostics, symbols, references, invalidation, and redaction. / 增加 unit 与 contract tests，覆盖 DTO、diagnostics、symbols、references、invalidation 和 redaction。
- [x] 4.2 Add integration, golden, and matrix tests for context-node projection and no-live-IDE behavior. / 增加 integration、golden 和 matrix tests，覆盖 context-node projection 与 no-live-IDE behavior。
- [x] 4.3 Run targeted validation gates: typecheck, lint, relevant tests, and OpenSpec strict validation. / 运行目标校验门禁：typecheck、lint、相关 tests 和 OpenSpec strict validation。
