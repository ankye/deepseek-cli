## ADDED Requirements

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
