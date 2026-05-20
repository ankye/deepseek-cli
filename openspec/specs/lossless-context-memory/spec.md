# lossless-context-memory Specification

## Purpose
Define lossless context memory requirements for reversible summaries, redaction, expansion, provenance, and durable context records.

定义 lossless context memory 对可逆 summaries、redaction、expansion、provenance 与 durable context records 的要求。

## Requirements
### Requirement: Durable Lossless Context DAG / 持久无损上下文 DAG

The runtime SHALL support an optional lossless context manager that stores original redacted user, assistant, and tool-result content as durable DAG nodes, with edges that preserve turn relationships and summary coverage.

runtime 必须支持可选的 lossless context manager，将原始脱敏后的 user、assistant 与 tool-result 内容作为持久 DAG nodes 存储，并通过 edges 保留 turn 关系与 summary coverage。

#### Scenario: Runtime captures turn content / Runtime 捕获回合内容

- **WHEN** an agent loop runs with a configured lossless context manager
- **THEN** the runtime records the user prompt and final assistant output as durable lossless nodes
- **AND** emits `context.lcm.node-recorded` evidence containing node id, role, edge count, and content hash without raw content
- **中文** 当 agent loop 配置了 lossless context manager 并运行时，runtime 必须将 user prompt 与最终 assistant output 记录为 durable lossless nodes；并发出 `context.lcm.node-recorded` evidence，包含 node id、role、edge count 与 content hash，但不包含 raw content。

#### Scenario: Tool result pruning remains recoverable / Tool Result 修剪后仍可恢复

- **WHEN** a model-facing tool result is produced
- **THEN** the runtime records the model-facing result text as a lossless context node before later request-level pruning can hide it from the model window
- **中文** 当产生面向模型的 tool result 时，runtime 必须先将该结果文本记录为 lossless context node，使后续 request-level pruning 即使让模型窗口看不到它，也仍可通过 durable context 恢复。

#### Scenario: Captured nodes include source class / 捕获节点包含来源类别

- **WHEN** runtime records a lossless context node
- **THEN** the stored node includes bounded source-class metadata such as user prompt, assistant output, model-facing tool result, MCP result, web result, connector result, browser/screen context, or imported transcript
- **AND** source-class metadata is available to diagnostics and later permanent-memory policy without exposing raw content
- **中文** 当 runtime 记录 lossless context node 时，stored node 必须包含有界 source-class metadata，例如 user prompt、assistant output、model-facing tool result、MCP result、web result、connector result、browser/screen context 或 imported transcript；source-class metadata 必须可供 diagnostics 与后续 permanent-memory policy 使用，且不暴露 raw content。

### Requirement: Reversible Summary Expansion / 可逆摘要展开

The lossless context manager SHALL treat summaries as pointers to original nodes, not as replacements for the original content.

lossless context manager 必须将 summaries 视为指向原始 nodes 的指针，而不是原始内容的替代品。

#### Scenario: Summary expands to originals / Summary 展开回原文

- **WHEN** the manager records a summary node with `coversNodeIds`
- **AND** a caller expands that summary node
- **THEN** the result includes the covered original nodes and their redacted original content
- **中文** 当 manager 记录带 `coversNodeIds` 的 summary node，且调用者 expand 该 summary node 时，结果必须包含被覆盖的原始 nodes 及其脱敏后的原始内容。

#### Scenario: Search before relying on compressed history / 依赖压缩历史前先搜索

- **WHEN** lossless context grep, describe, and expand tools are model-visible
- **THEN** prompt assembly instructs the model to search durable context before answering about prior work, prior decisions, prior constraints, or old tool results
- **AND** instructs the model to expand summaries before treating them as authoritative
- **中文** 当 lossless context grep、describe 与 expand tools 对模型可见时，prompt assembly 必须要求模型在回答过去工作、过去决策、过去约束或旧 tool result 前先搜索 durable context，并在将 summaries 作为权威依据前先 expand。

#### Scenario: Restart recovery reaches later prompt context / 重启恢复进入后续 Prompt Context

- **WHEN** lossless context nodes are written, the CLI/runtime restarts, and a later task asks about prior work or old tool results
- **THEN** runtime can reload the durable store, grep or describe relevant nodes, expand summaries when needed, and provide bounded recovered evidence to the later prompt or tool flow
- **AND** diagnostics distinguish recovered lossless context from provider cache hits or permanent memory
- **中文** 当 lossless context nodes 已写入、CLI/runtime 重启，且后续任务询问 prior work 或 old tool results 时，runtime 必须能 reload durable store、grep 或 describe 相关 nodes、必要时 expand summaries，并向后续 prompt 或 tool flow 提供有界 recovered evidence；diagnostics 必须区分 recovered lossless context、provider cache hits 与 permanent memory。

### Requirement: Lossless Context Is Informational, Not Enforcement / 无损上下文是信息源而非强制规则

Lossless context SHALL inform retrieval and recovery, but SHALL NOT override current user instructions, developer/system instructions, host policy, or repository guidance.

lossless context 必须用于 retrieval 与 recovery，但不得覆盖当前 user instructions、developer/system instructions、host policy 或 repository guidance。

#### Scenario: Current instruction wins over old context / 当前指令优先于旧上下文

- **WHEN** recovered lossless context conflicts with current user instructions or repository guidance
- **THEN** prompt assembly or diagnostics marks the conflict and does not silently apply the older context as authoritative
- **中文** 当 recovered lossless context 与当前 user instructions 或 repository guidance 冲突时，prompt assembly 或 diagnostics 必须标记 conflict，且不得静默将旧 context 作为权威执行。

### Requirement: Secret-Hardened Persistence / Secret-Hardened 持久化

The lossless context store SHALL NOT persist raw secret-like values.

lossless context store 不得持久化原始 secret-like 值。

#### Scenario: Secret-like text is redacted before storage / Secret-like 文本存储前脱敏

- **WHEN** a lossless context node contains token, API key, secret, or password-like text
- **THEN** the stored node content replaces the raw value with a redaction marker
- **AND** grep, describe, and expand results do not expose the raw value
- **中文** 当 lossless context node 包含 token、API key、secret 或 password-like 文本时，存储后的 node content 必须用 redaction marker 替换原始值；grep、describe 与 expand 结果不得暴露原始值。

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

