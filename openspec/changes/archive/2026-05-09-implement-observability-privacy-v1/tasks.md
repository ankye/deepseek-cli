## 1. Contracts And OpenSpec / 契约与 OpenSpec

- [x] 1.1 Add bilingual OpenSpec proposal, design, specs, and tasks for observability/privacy v1. / 为 observability/privacy v1 增加双语 OpenSpec proposal、design、specs 和 tasks。
- [x] 1.2 Add versioned observability DTOs for canonical records, privacy settings, export policy, diagnostic bundles, redaction summaries, and privacy decisions. / 增加 canonical records、privacy settings、export policy、diagnostic bundles、redaction summaries 和 privacy decisions 的版本化 observability DTO。

## 2. Implementation / 实现

- [x] 2.1 Upgrade `InMemoryObservabilitySink` to normalize events into privacy-aware canonical records before storage. / 升级 `InMemoryObservabilitySink`，在存储前将 events 归一化为 privacy-aware canonical records。
- [x] 2.2 Implement local diagnostic bundle generation with record limits, redaction, and privacy/export decisions. / 实现 local diagnostic bundle generation，包含 record limits、redaction 和 privacy/export decisions。
- [x] 2.3 Add deterministic redaction helpers for observability artifacts. / 为 observability artifacts 增加确定性 redaction helpers。

## 3. Tests And Regression / 测试与回归

- [x] 3.1 Add package and contract tests for DTOs, default privacy settings, redaction, export denial, and bundle generation. / 增加 package 与 contract tests，覆盖 DTO、default privacy settings、redaction、export denial 和 bundle generation。
- [x] 3.2 Add integration and golden tests proving runtime observability events become replayable redacted evidence. / 增加 integration 与 golden tests，证明 runtime observability events 会成为可 replay 的脱敏 evidence。
- [x] 3.3 Add compatibility and matrix tests for schema enforcement and privacy modes. / 增加 compatibility 与 matrix tests，覆盖 schema enforcement 与 privacy modes。

## 4. Docs, Validation, Archive / 文档、校验与归档

- [x] 4.1 Update product/reference docs and roadmap implementation markers. / 更新 product/reference docs 与 roadmap implementation markers。
- [x] 4.2 Run typecheck, lint, tests, dependency boundaries, and OpenSpec validation. / 运行 typecheck、lint、tests、dependency boundaries 和 OpenSpec validation。
- [x] 4.3 Archive the completed OpenSpec change. / 归档完成的 OpenSpec change。
