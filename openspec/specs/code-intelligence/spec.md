# code-intelligence Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
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

The code intelligence service SHALL support optional pre-edit and post-edit diagnostics, symbol impact summaries, and regression hooks for workspace edits.

code intelligence service 必须支持 workspace edits 的可选 pre-edit/post-edit diagnostics、symbol impact summaries 和 regression hooks。

#### Scenario: Post-edit diagnostics are attached

- **WHEN** an approved workspace edit is applied
- **THEN** updated diagnostics can be attached to the workflow, session, and runtime event stream as structured evidence

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

