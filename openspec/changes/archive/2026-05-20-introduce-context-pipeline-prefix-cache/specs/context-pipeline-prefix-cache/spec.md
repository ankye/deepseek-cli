## ADDED Requirements

### Requirement: Layered Context Pipeline / 分层上下文管道

The platform SHALL represent model-visible context as an ordered layered pipeline with canonical layers `kernel`, `project`, `session`, and `current-turn`.

平台必须将模型可见上下文表示为有序分层管道，规范层为 `kernel`、`project`、`session` 与 `current-turn`。

#### Scenario: Stable layers keep order / 稳定层保持顺序

- **WHEN** two consecutive turns share the same kernel and project inputs
- **THEN** the pipeline preserves identical layer order and prefix hashes for those stable layers even when session or current-turn content changes
- **中文** 当连续两个 turn 共享相同 kernel 与 project 输入时，即使 session 或 current-turn 内容变化，pipeline 也必须为这些稳定层保持相同层顺序与 prefix hashes。

#### Scenario: Current turn is last / 当前回合位于最后

- **WHEN** a model request is assembled from the pipeline
- **THEN** volatile user input, active selection, and full current-turn tool results appear after stable kernel, project, and session blocks
- **中文** 当模型请求从 pipeline 组装时，易变的用户输入、活动选择和完整 current-turn tool results 必须出现在稳定 kernel、project 与 session blocks 之后。

### Requirement: Immutable Context Blocks / 不可变上下文块

The platform SHALL represent reusable context as immutable content-addressed blocks with stable hashes, token estimates, dependency fingerprints, redaction metadata, cache hints, and replay metadata.

平台必须将可复用 context 表示为不可变 content-addressed blocks，包含稳定 hash、token estimate、dependency fingerprints、redaction metadata、cache hints 与 replay metadata。

#### Scenario: Block update creates new hash / 块更新产生新 Hash

- **WHEN** the content, provenance, dependency fingerprints, redaction class, or cache policy of a context block changes
- **THEN** a new block hash is produced instead of mutating the previous block identity
- **中文** 当 context block 的 content、provenance、dependency fingerprints、redaction class 或 cache policy 变化时，必须产生新的 block hash，而不是修改旧 block identity。

#### Scenario: Duplicate block is referenced once / 重复块只引用一次

- **WHEN** multiple pipeline stages reference the same content-addressed block
- **THEN** the manifest may reference the same block hash without duplicating raw content in replay or protocol metadata
- **中文** 当多个 pipeline stage 引用同一个 content-addressed block 时，manifest 可以引用同一个 block hash，而不得在 replay 或 protocol metadata 中重复 raw content。

### Requirement: Prefix Hash Manifest / 前缀 Hash Manifest

Each pipeline assembly SHALL produce a manifest containing ordered block ids, per-layer prefix hashes, an overall pipeline fingerprint, cache hint summary, token totals, and structured exclusions.

每次 pipeline assembly 都必须产生 manifest，包含有序 block ids、按层 prefix hashes、整体 pipeline fingerprint、cache hint summary、token totals 与结构化 exclusions。

#### Scenario: Prefix hash explains cache stability / Prefix Hash 解释缓存稳定性

- **WHEN** diagnostics compare two manifests from adjacent turns
- **THEN** they can identify the first layer or block where prefix stability changed without inspecting raw context content
- **中文** 当 diagnostics 比较相邻 turn 的两个 manifest 时，必须能在不检查 raw context content 的情况下识别 prefix stability 首次变化的 layer 或 block。

### Requirement: Volatile Tail Isolation / 易变尾部隔离

The pipeline SHALL keep volatile large outputs in the current-turn tail unless they are summarized into bounded, redacted, content-addressed evidence blocks.

Pipeline 必须将易变大型输出保留在 current-turn tail，除非它们被摘要为有界、脱敏、content-addressed evidence blocks。

#### Scenario: Large tool result is summarized / 大型工具结果被摘要

- **WHEN** a tool result exceeds the stable session-layer threshold
- **THEN** the session layer receives only bounded summary/evidence-reference blocks, while full raw output remains in current-turn tail or artifact storage
- **中文** 当 tool result 超过稳定 session-layer 阈值时，session layer 只能接收有界 summary/evidence-reference blocks，而完整 raw output 必须留在 current-turn tail 或 artifact storage。

### Requirement: Pipeline Cache Evidence / Pipeline 缓存证据

The pipeline SHALL emit replay-safe cache evidence that records prefix hash reuse, cache hint application, provider cache hit/miss usage when available, and reasons for cache opportunity loss.

Pipeline 必须发出可 replay 的缓存证据，记录 prefix hash reuse、cache hint application、可用时的 provider cache hit/miss usage，以及缓存机会丢失原因。

#### Scenario: Cache opportunity loss is diagnosable / 缓存机会丢失可诊断

- **WHEN** a previously stable prefix hash changes
- **THEN** diagnostics record the changed layer, changed block hash, reason when known, and affected token estimate
- **中文** 当此前稳定的 prefix hash 发生变化时，diagnostics 必须记录变化 layer、变化 block hash、已知原因和受影响 token estimate。

### Requirement: Statusline Telemetry Projection / 状态栏遥测投影

The pipeline SHALL provide a bounded statusline telemetry projection for CLI/TUI surfaces, including cache hit rate, cache hit/miss tokens when available, selected model, thinking mode, context size, budget pressure, and prefix stability.

Pipeline 必须为 CLI/TUI 表面提供有界 statusline telemetry projection，包括缓存命中率、可用时的 cache hit/miss tokens、当前模型、思考模式、上下文大小、预算压力与 prefix stability。

#### Scenario: Statusline receives bounded cache context / 状态栏获得有界缓存上下文

- **WHEN** a model request is assembled from a pipeline manifest and usage evidence is available
- **THEN** the statusline telemetry reports cache hit rate, hit/miss tokens when available, model id/profile, thinking mode, selected context tokens, hard/soft budget, and prefix stability without raw context content
- **中文** 当模型请求由 pipeline manifest 组装且 usage evidence 可用时，状态栏 telemetry 必须报告缓存命中率、可用时的 hit/miss tokens、model id/profile、思考模式、selected context tokens、hard/soft budget 与 prefix stability，且不包含 raw context content。

#### Scenario: Missing provider cache usage degrades gracefully / 缺失 Provider 缓存用量时优雅降级

- **WHEN** the provider does not report cache hit/miss token usage
- **THEN** telemetry still reports prefix hash reuse and context token budget while marking provider cache hit rate as unavailable rather than zero
- **中文** 当 provider 不报告 cache hit/miss token usage 时，telemetry 仍必须报告 prefix hash reuse 与 context token budget，并将 provider cache hit rate 标记为 unavailable，而不是零。
