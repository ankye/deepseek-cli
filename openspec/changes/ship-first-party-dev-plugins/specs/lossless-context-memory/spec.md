## ADDED Requirements

### Requirement: Context Compactor Uses Lossless DAG / Context Compactor 使用无损 DAG

The context compactor plugin SHALL use the lossless context manager as its source of truth and SHALL treat summaries as reversible pointers to original redacted nodes.

context compactor plugin 必须以 lossless context manager 作为事实源，并必须将 summaries 视为指向原始脱敏 nodes 的可逆指针。

#### Scenario: Summary keeps originals recoverable / Summary 保持原文可恢复

- **WHEN** the context compactor creates or renders a summary
- **THEN** the summary preserves `coversNodeIds` or equivalent coverage metadata and expand operations can recover the covered redacted original nodes
- **AND** the original nodes are not deleted, overwritten, or replaced by the summary
- **中文** 当 context compactor 创建或渲染 summary 时，summary 必须保留 `coversNodeIds` 或等价 coverage metadata，且 expand operations 可以恢复被覆盖的脱敏原始 nodes；原始 nodes 不得被删除、覆盖或由 summary 替换。

#### Scenario: Grep before authority / 作为依据前先搜索

- **WHEN** the context compactor is asked about prior work, prior decisions, prior constraints, or old tool results
- **THEN** it searches durable lossless context before relying on compact summaries and marks summary-only answers as incomplete until relevant summaries are expanded
- **中文** 当 context compactor 被问到 prior work、prior decisions、prior constraints 或 old tool results 时，必须先搜索 durable lossless context，再依赖 compact summaries；仅有 summary 的回答必须标记为 incomplete，直到相关 summaries 被 expanded。

### Requirement: Context Command Redaction / Context 命令脱敏

Context compactor commands SHALL return bounded redacted results and SHALL NOT expose raw secret-like values through status, grep, describe, summarize, expand, budget, or pin workflows.

context compactor commands 必须返回有界脱敏结果，不得通过 status、grep、describe、summarize、expand、budget 或 pin workflows 暴露 raw secret-like values。

#### Scenario: Expand remains redacted / Expand 仍脱敏

- **WHEN** a user invokes `/context expand` or a scriptable equivalent for a summary, node id, or query
- **THEN** expanded nodes contain redacted original content, content hashes, source class, coverage/provenance metadata, and diagnostics without raw token, API key, password, or secret-like values
- **中文** 当用户对 summary、node id 或 query 调用 `/context expand` 或可脚本化等价命令时，expanded nodes 必须包含脱敏后的 original content、content hashes、source class、coverage/provenance metadata 与 diagnostics，不得包含 raw token、API key、password 或 secret-like values。

#### Scenario: Status avoids transcript dump / Status 不倾倒 Transcript

- **WHEN** a user invokes `/context status` or diagnostics render context compaction state
- **THEN** output includes only bounded counts, budget estimates, policy values, storage state, degraded reasons, and redaction metadata without dumping raw transcript text
- **中文** 当用户调用 `/context status` 或 diagnostics 渲染 context compaction state 时，输出只能包含有界 counts、budget estimates、policy values、storage state、degraded reasons 与 redaction metadata，不得 dump raw transcript text。

### Requirement: Context Budget and Pinning / Context 预算与固定引用

The context compactor SHALL expose budget and pin/reference workflows that help users select context for prompt assembly without automatically writing permanent memory.

context compactor 必须暴露 budget 与 pin/reference workflows，帮助用户为 prompt assembly 选择上下文，且不得自动写入 permanent memory。

#### Scenario: Budget reports compact pressure / Budget 报告压缩压力

- **WHEN** context budget status is requested
- **THEN** the result reports current node count, summary count, fresh-tail policy, projected budget pressure, excluded reason counts, and degraded state in a deterministic structured shape
- **中文** 当请求 context budget status 时，结果必须以确定性结构报告 current node count、summary count、fresh-tail policy、projected budget pressure、excluded reason counts 与 degraded state。

#### Scenario: Pin does not write permanent memory / Pin 不写长期记忆

- **WHEN** a user pins a lossless context node or summary for the current workflow
- **THEN** the plugin records a session or palette reference target only and does not write permanent memory unless a separate explicit governed memory command is invoked
- **中文** 当用户为当前 workflow pin 一个 lossless context node 或 summary 时，插件只能记录 session 或 palette reference target；除非调用单独的显式 governed memory command，否则不得写入 permanent memory。
