## 1. Contracts And Evidence Factories / 契约与证据工厂

- [x] 1.1 Add bounded memory candidate fingerprint and compact boundary evidence factories in `memory-cache-management`. / 在 `memory-cache-management` 增加有界 memory candidate fingerprint 与 compact boundary evidence 工厂。
- [x] 1.2 Add or reuse implementation-free DTO shapes for memory, compact, and tool-result evidence in platform contracts. / 在 platform contracts 中新增或复用 memory、compact 与 tool-result evidence 的无实现 DTO 形态。

## 2. Runtime Main Path / Runtime 主路径

- [x] 2.1 Convert eligible working/session/project memory entries into `ContextGraphNode` candidates before projection. / 在 projection 前将 eligible working/session/project memory entries 转换为 `ContextGraphNode` candidates。
- [x] 2.2 Emit structured memory collection evidence and compact boundary events before model dispatch when thresholds are reached. / 在达到阈值时，于 model dispatch 前发出结构化 memory collection evidence 与 compact boundary events。
- [x] 2.3 Record bounded redacted tool-result evidence from runtime tool execution outcomes. / 从 runtime tool execution outcomes 记录有界脱敏 tool-result evidence。

## 3. Code Intelligence Context Evidence / 代码智能上下文证据

- [x] 3.1 Convert references/definitions returned by code intelligence into bounded context candidates with provenance and fallback diagnostics. / 将 code intelligence 返回的 references/definitions 转换为带 provenance 与 fallback diagnostics 的有界 context candidates。
- [x] 3.2 Ensure analyzer misses degrade without failing context projection or model dispatch. / 确保 analyzer 未命中时降级，不使 context projection 或 model dispatch 失败。

## 4. Tests And Acceptance / 测试与验收

- [x] 4.1 Add contract tests for memory candidate fingerprints, compact boundary fingerprints, and bounded tool-result evidence. / 增加 memory candidate fingerprints、compact boundary fingerprints 与 bounded tool-result evidence 的 contract tests。
- [x] 4.2 Add runtime integration/golden tests for memory projection, compact boundary replay, code reference fallback, and redaction. / 增加 memory projection、compact boundary replay、code reference fallback 与 redaction 的 runtime integration/golden tests。
- [x] 4.3 Run focused validation: OpenSpec strict validation, typecheck for touched packages, and focused test files. / 运行聚焦验证：OpenSpec strict validation、受影响 packages typecheck 与聚焦测试文件。
