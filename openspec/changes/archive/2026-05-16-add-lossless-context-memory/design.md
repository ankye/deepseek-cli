## Design

The implementation treats compaction summaries as indexes, not replacements. Every captured user, assistant, and tool-result message is stored as a lossless node with a content hash. Summary nodes contain bounded text plus `coversNodeIds`, and `expand` resolves those ids back to the original node contents.

实现将 compaction summary 视为索引，而不是替代品。每条捕获到的 user、assistant 与 tool-result message 都作为 lossless node 存储，并带有 content hash。Summary node 保存有界文本与 `coversNodeIds`，`expand` 通过这些 id 回到原始 node 内容。

## Storage

The first backend is JSONL, not SQLite. This keeps the npm CLI package free of native dependencies while preserving the core invariant: original redacted records survive process restarts and can be replayed into an in-memory DAG. A SQLite backend can be added later behind the same `LosslessContextManager` interface.

第一版 backend 是 JSONL，不是 SQLite。这样可以避免 npm CLI package 引入原生依赖，同时保留核心不变量：原始脱敏记录跨进程重启仍然存在，并能 replay 成内存 DAG。后续可以在同一 `LosslessContextManager` interface 后添加 SQLite backend。

## Safety

Durable context is not a place to store secrets. The manager recomputes content hashes after redaction and stores the redacted content. Runtime events only expose metadata and hashes, not full durable node content.

Durable context 不是 secret 存储位置。Manager 会在脱敏后重新计算 content hash，并存储脱敏内容。Runtime events 只暴露 metadata 与 hashes，不暴露完整 durable node content。

## Retrieval Protocol

Prompt assembly adds a rule when lossless context tools are visible: search durable context before answering about prior work, decisions, constraints, or tool results; describe nodes for DAG edges; expand summaries to originals before treating them as authoritative.

当 lossless context tools 可见时，prompt assembly 会加入规则：回答过去工作、决策、约束或 tool result 前先搜索 durable context；通过 describe 查看 DAG edges；将 summaries expand 回原文后再作为权威依据。

## Runtime Integration And Priority

Lossless context is useful only when runtime and prompt assembly can retrieve it at the right time. The runtime should expose evidence that a model-visible answer about old work either used current history, retrieved lossless context, or explicitly reported missing context. Lossless context must remain lower priority than current user instructions, developer/system instructions, host policy, and repository guidance.

只有 runtime 与 prompt assembly 能在正确时机检索它时，lossless context 才有价值。runtime 应暴露证据，说明模型关于旧工作的回答使用了 current history、检索了 lossless context，或明确报告 context missing。lossless context 的优先级必须低于当前 user instructions、developer/system instructions、host policy 与 repository guidance。

## Source Class And External Context

Captured nodes should carry bounded source-class metadata, such as user prompt, assistant output, model-facing tool result, MCP result, web result, connector result, browser/screen context, or imported transcript. Source class lets permanent-memory extraction and diagnostics apply different retention and promotion policies later. The LCM layer may preserve redacted source records, but it must not by itself promote external or third-party content into permanent memory.

捕获的 nodes 应携带有界 source-class metadata，例如 user prompt、assistant output、model-facing tool result、MCP result、web result、connector result、browser/screen context 或 imported transcript。source class 让后续 permanent-memory extraction 与 diagnostics 能应用不同 retention/promotion policies。LCM 层可以保存脱敏后的 source records，但不得自行将 external 或 third-party content 提升为 permanent memory。

## Recovery Evidence

The minimum "not lost" proof is a restart/reload path: write nodes, restart manager/runtime, grep for a known fact, describe its edges, expand a summary when present, and show bounded evidence that the recovered content can be used by a later prompt or tool call. Storage alone is not enough.

“不丢失”的最低证明是 restart/reload 路径：写入 nodes，重启 manager/runtime，grep 已知事实，describe 其 edges，在存在 summary 时 expand，并展示有界证据证明 recovered content 可用于后续 prompt 或 tool call。仅有 storage 不够。
