## ADDED Requirements

### Requirement: Runtime Main-Path Consumption / Runtime 主路径消费

Code intelligence SHALL be consumable from the runtime main path without requiring callers to pre-invoke `contextNodes` and splice the result into `candidateNodes` by hand. When a `CodeIntelligenceService` implementation is injected into the context engine, `projectGraph` SHALL automatically enrich candidate nodes with diagnostic and symbol evidence before selection, and SHALL fall back to caller-supplied candidates alone when enrichment fails.

code intelligence 必须可以从 runtime 主路径被消费，调用方无须手动先调 `contextNodes` 并把结果拼进 `candidateNodes`。当 `CodeIntelligenceService` 实现注入到 context engine 时，`projectGraph` 必须在选择前自动用 diagnostic 与 symbol evidence 富化 candidate nodes；富化失败时必须降级为仅使用调用方传入的 candidates。

#### Scenario: Injected service auto-enriches projection / 注入服务自动富化投影

- **WHEN** a `CodeIntelligenceService` implementation is passed to the context engine constructor and `projectGraph` is invoked with an empty or partial `candidateNodes`
- **THEN** the projection result includes context graph nodes with `source: "code-intelligence"` derived from current workspace diagnostics and symbols
- **中文** 当 `CodeIntelligenceService` 实现传入 context engine 构造函数，并以空或部分 `candidateNodes` 调用 `projectGraph` 时，投影结果必须包含来自当前 workspace diagnostics 与 symbols、`source: "code-intelligence"` 的 context graph nodes。

#### Scenario: No service injected preserves legacy behavior / 未注入时保持现行行为

- **WHEN** no `CodeIntelligenceService` is injected into the context engine
- **THEN** `projectGraph` returns results identical (byte-for-byte) to behavior prior to auto-enrichment, using only caller-supplied `candidateNodes`
- **中文** 当未向 context engine 注入 `CodeIntelligenceService` 时，`projectGraph` 必须返回与富化能力引入前逐字节一致的结果，仅使用调用方传入的 `candidateNodes`。

#### Scenario: Enrichment failure does not break projection / 富化失败不阻塞投影

- **WHEN** the injected `CodeIntelligenceService.contextNodes` throws, returns `ok: false`, or times out during `projectGraph`
- **THEN** the projection proceeds with caller-supplied `candidateNodes` only and records no auto-enrichment nodes, without failing the overall projection
- **中文** 当注入的 `CodeIntelligenceService.contextNodes` 抛错、返回 `ok: false` 或超时时，投影必须仅使用调用方传入的 `candidateNodes` 继续，不记录自动富化节点，且不让整体投影失败。

## MODIFIED Requirements

### Requirement: Language-Aware Edit Safety

The code intelligence service SHALL support optional pre-edit and post-edit diagnostics, symbol impact summaries, and regression hooks for workspace edits. The runtime main path SHALL trigger `codeIntelligence.invalidate(path)` after write-path tool executions so subsequent diagnostics and symbol queries reflect the updated file content.

code intelligence service 必须支持 workspace edits 的可选 pre-edit/post-edit diagnostics、symbol impact summaries 和 regression hooks。runtime 主路径必须在写路径工具执行完成后触发 `codeIntelligence.invalidate(path)`，确保后续的 diagnostics 与 symbol queries 反映更新后的文件内容。

#### Scenario: Post-edit diagnostics are attached

- **WHEN** an approved workspace edit is applied
- **THEN** updated diagnostics can be attached to the workflow, session, and runtime event stream as structured evidence

#### Scenario: Write-path tools trigger invalidation / 写路径工具触发失效

- **WHEN** a write-path tool (edit, patch, replace) completes execution against a workspace path
- **THEN** `codeIntelligence.invalidate(path)` is invoked non-blockingly so the next `diagnostics` or `symbols` query re-indexes the affected file
- **中文** 当写路径工具（edit、patch、replace）对某个 workspace path 完成执行时，必须非阻塞地调用 `codeIntelligence.invalidate(path)`，使下一次 `diagnostics` 或 `symbols` 查询重新索引受影响文件。
