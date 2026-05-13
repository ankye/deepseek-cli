# code-intelligence-local-analyzer Specification

## Purpose
TBD - created by archiving change implement-code-intelligence-v1. Update Purpose after archive.
## Requirements
### Requirement: Deterministic Local Analyzer / 确定性本地分析器

The platform SHALL provide a deterministic local code intelligence analyzer that reads workspace files through the platform abstraction and produces diagnostics, symbols, definitions, references, provider metadata, and index metadata without requiring a live IDE or language server.

平台必须提供确定性的本地 code intelligence analyzer，通过 platform abstraction 读取 workspace files，并产出 diagnostics、symbols、definitions、references、provider metadata 和 index metadata，且不要求 live IDE 或 language server。

#### Scenario: Analyzer indexes supported files / analyzer 索引受支持文件

- **WHEN** a workspace contains supported source files
- **THEN** the analyzer returns stable diagnostics, symbols, references, index metadata, and provider status
- **中文** 当 workspace 包含受支持 source files 时，analyzer 必须返回稳定的 diagnostics、symbols、references、index metadata 和 provider status。

#### Scenario: Analyzer reports bounded degradation / analyzer 报告有界降级

- **WHEN** files exceed v1 size or count limits
- **THEN** the analyzer returns degraded provider metadata and diagnostics instead of unbounded scanning
- **中文** 当 files 超出 v1 size 或 count limits 时，analyzer 必须返回 degraded provider metadata 和 diagnostics，而不是无限制扫描。

### Requirement: Code Intelligence Context Nodes / 代码智能上下文节点

The analyzer SHALL convert diagnostic and symbol evidence into governed `ContextGraphNode` values with `source: "code-intelligence"`, redaction metadata, provenance, dependency fingerprints, and compatibility metadata.

analyzer 必须将 diagnostic 与 symbol evidence 转换为受治理的 `ContextGraphNode`，包含 `source: "code-intelligence"`、redaction metadata、provenance、dependency fingerprints 和 compatibility metadata。

#### Scenario: Diagnostic becomes context node / diagnostic 转为 context node

- **WHEN** analyzer diagnostics are projected for a session
- **THEN** each diagnostic context node includes path, range, severity, source, content preview, and redaction metadata
- **中文** 当 analyzer diagnostics 被投影到 session 时，每个 diagnostic context node 必须包含 path、range、severity、source、content preview 和 redaction metadata。

#### Scenario: Secret-like evidence is redacted / 疑似 secret 证据被脱敏

- **WHEN** diagnostic or symbol content contains secret-like text
- **THEN** context node content and serialized evidence contain redacted markers and never raw secret values
- **中文** 当 diagnostic 或 symbol content 包含疑似 secret 文本时，context node content 与序列化 evidence 必须包含 redacted markers，绝不包含 raw secret values。

### Requirement: Path-Scoped Invalidation / 路径级失效

The analyzer SHALL support path-scoped invalidation so edits can mark cached file evidence stale and future queries re-index affected files deterministically.

analyzer 必须支持 path-scoped invalidation，使 edits 可以将 cached file evidence 标记为 stale，并让后续 queries 确定性地重新索引受影响文件。

#### Scenario: Invalidation refreshes diagnostics / invalidation 刷新 diagnostics

- **WHEN** a file is invalidated after an edit
- **THEN** the next diagnostics or symbol query reflects the updated file content and records invalidation metadata
- **中文** 当文件在编辑后被 invalidated 时，下一次 diagnostics 或 symbol query 必须反映更新后的文件内容，并记录 invalidation metadata。

### Requirement: Projection Auto-Enrichment / 投影自动富化

The deterministic local analyzer SHALL expose `contextNodes` and `invalidate` with idempotent, safe-fallback semantics so context-engine projection can auto-enrich candidate nodes without risking projection failure. `contextNodes` SHALL return `{ ok: true, value: { nodes: [] } }` for non-existent roots (never throw, never return `ok: false`), and `invalidate` SHALL resolve without error for unknown paths, enabling runtime consumers to call both methods unconditionally.

deterministic local analyzer 必须以幂等、安全回退的语义暴露 `contextNodes` 与 `invalidate`，让 context-engine projection 能够安全地自动富化 candidate nodes 而不引入投影失败风险。`contextNodes` 对不存在的 root 必须返回 `{ ok: true, value: { nodes: [] } }`（不抛错、不返回 `ok: false`），`invalidate` 对未知 path 必须静默 resolve，使 runtime 消费方可以无条件地调用这两个方法。

#### Scenario: contextNodes on missing root / contextNodes 对不存在的 root

- **WHEN** `contextNodes` is invoked with a `root` that does not exist on the platform file system
- **THEN** the analyzer returns `{ ok: true, value: { nodes: [], ... } }` without throwing
- **中文** 当 `contextNodes` 以一个在 platform file system 上不存在的 `root` 被调用时，analyzer 必须返回 `{ ok: true, value: { nodes: [], ... } }` 且不抛错。

#### Scenario: invalidate on unknown path / invalidate 对未知 path

- **WHEN** `invalidate` is invoked with a path that is not currently tracked in the `CachedIndex`
- **THEN** the analyzer resolves idempotently with no side effects and no error
- **中文** 当 `invalidate` 以一个当前未被 `CachedIndex` 追踪的 path 被调用时，analyzer 必须幂等地 resolve，不产生副作用、不报错。

#### Scenario: Auto-enriched candidates surface diagnostics / 自动富化 candidate 浮现 diagnostics

- **WHEN** the analyzer is injected into the context engine and a file containing diagnostic-worthy content (e.g., a `// TODO` marker) is written, then `projectGraph` is invoked
- **THEN** the projection result includes at least one `source: "code-intelligence"` node derived from the analyzer's diagnostics, even if the caller passed no `candidateNodes`
- **中文** 当 analyzer 被注入到 context engine，写入包含可诊断内容（例如 `// TODO` 标记）的文件后调用 `projectGraph` 时，投影结果必须至少包含一个由 analyzer 的 diagnostics 派生、`source: "code-intelligence"` 的节点，即便调用方未传入 `candidateNodes`。
