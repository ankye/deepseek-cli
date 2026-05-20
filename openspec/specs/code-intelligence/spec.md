# code-intelligence Specification

## Purpose
Define code intelligence requirements for local analysis, diagnostics, symbol/reference enrichment, and governed pre-edit evidence.

定义 code intelligence 对本地分析、diagnostics、symbol/reference enrichment 与受治理 pre-edit evidence 的要求。

## Requirements
### Requirement: Code Intelligence Boundary

The platform SHALL define a code intelligence service for diagnostics, symbols, definitions, references, hover data, code actions, file indexes, and language-aware context from IDEs, LSP servers, and deterministic local analyzers.

平台必须定义 code intelligence service，用于从 IDEs、LSP servers 和 deterministic local analyzers 获取 diagnostics、symbols、definitions、references、hover data、code actions、file indexes 和 language-aware context。

#### Scenario: Diagnostics become context nodes

- **WHEN** an IDE, LSP server, or local analyzer provides diagnostics
- **THEN** the code intelligence service converts them into structured context nodes with URI, range, severity, source, version, and provenance metadata

#### Scenario: LSP-backed capability is registered

- **WHEN** a language server capability is available and allowed
- **THEN** the code intelligence service exposes it as a governed capability or context provider through shared contracts

### Requirement: Code Intelligence Provider Model

The code intelligence service SHALL support provider discovery, lifecycle, health checks, indexing, cache invalidation, workspace trust, permission checks, and host capability negotiation.

code intelligence service 必须支持 provider discovery、lifecycle、health checks、indexing、cache invalidation、workspace trust、permission checks 和 host capability negotiation。

#### Scenario: Provider unavailable falls back deterministically

- **WHEN** an IDE or language server provider is unavailable
- **THEN** the service reports capability unavailability and may use deterministic local analyzers or file indexes according to policy

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

### Requirement: Code Intelligence Roadmap Placement / 代码智能路线图落点

Code intelligence SHALL be placed in R2 Context And Safety with explicit diagnostics, symbols, references, language-aware context, pre-edit evidence, post-edit evidence, cache invalidation, and host fallback requirements.

code intelligence 必须放入 R2 Context And Safety，并明确 diagnostics、symbols、references、language-aware context、pre-edit evidence、post-edit evidence、cache invalidation 和 host fallback requirements。

#### Scenario: Code intelligence improves edit safety / 代码智能提升编辑安全

- **WHEN** a roadmap node introduces language-aware editing or review evidence
- **THEN** diagnostics and symbol evidence are attached to workspace edit, session, runtime event, and regression traces through shared code-intelligence contracts
- **中文** 当路线图节点引入 language-aware editing 或 review evidence 时，diagnostics 和 symbol evidence 必须通过共享 code-intelligence contracts 附加到 workspace edit、session、runtime event 和 regression traces。

#### Scenario: Code intelligence does not require live IDE / 代码智能不强依赖 live IDE

- **WHEN** R2 deterministic tests run
- **THEN** code intelligence providers use fakes, local analyzers, or recorded fixtures so the test path does not require a live editor or language server
- **中文** 当 R2 deterministic tests 运行时，code intelligence providers 必须使用 fakes、local analyzers 或 recorded fixtures，使测试路径不依赖 live editor 或 language server。

### Requirement: Versioned Code Intelligence DTOs / 版本化代码智能 DTO

Code intelligence SHALL expose versioned DTOs for diagnostics, symbols, references, provider status, index metadata, context node conversion, and redaction metadata.

code intelligence 必须暴露版本化 DTO，覆盖 diagnostics、symbols、references、provider status、index metadata、context node conversion 和 redaction metadata。

#### Scenario: DTOs are serializable / DTO 可序列化

- **WHEN** diagnostics, symbols, references, or context node conversion results are emitted
- **THEN** they are JSON-serializable, schema-versioned, redaction-aware, and host-neutral
- **中文** 当 diagnostics、symbols、references 或 context node conversion results 被输出时，它们必须 JSON-serializable、schema-versioned、redaction-aware 且 host-neutral。

### Requirement: Code Intelligence Context Projection / 代码智能上下文投影

Code intelligence SHALL provide a method to create context graph nodes from analyzer evidence for a given session and workspace scope.

code intelligence 必须提供方法，为指定 session 与 workspace scope 从 analyzer evidence 创建 context graph nodes。

#### Scenario: Context nodes use shared projection path / context node 使用共享投影路径

- **WHEN** code intelligence evidence is attached to model context
- **THEN** it is represented as normal context graph nodes consumed by context-engine projection
- **中文** 当 code intelligence evidence 附加到 model context 时，必须表示为由 context-engine projection 消费的普通 context graph nodes。

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

### Requirement: References And Definitions Context Evidence / 引用与定义上下文证据

Code intelligence SHALL expose references and definitions as bounded context evidence suitable for runtime projection, cache invalidation, and replay.

Code intelligence 必须将 references 与 definitions 暴露为有界 context evidence，适用于 runtime projection、cache invalidation 与 replay。

#### Scenario: Reference evidence carries provenance / 引用证据携带来源

- **WHEN** code intelligence returns references or definitions for a symbol relevant to a turn
- **THEN** each evidence item includes symbol name, relation kind, path metadata, line metadata, provider metadata, dependency fingerprints, and redaction metadata
- **中文** 当 code intelligence 为当前回合相关 symbol 返回 references 或 definitions 时，每个 evidence item 必须包含 symbol name、relation kind、path metadata、line metadata、provider metadata、dependency fingerprints 与 redaction metadata。

#### Scenario: Analyzer miss is degraded evidence / Analyzer 未命中作为降级证据

- **WHEN** the analyzer cannot resolve references or definitions for a requested symbol
- **THEN** code intelligence returns structured degraded evidence instead of throwing through the runtime projection path
- **中文** 当 analyzer 无法解析请求 symbol 的 references 或 definitions 时，code intelligence 必须返回结构化 degraded evidence，而不是沿 runtime projection path 抛出异常。
