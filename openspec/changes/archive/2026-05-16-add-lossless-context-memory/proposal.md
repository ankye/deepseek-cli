## Why

Long-running agent sessions can fail in three different ways: a rule or decision is never stored durably, compaction rewrites detailed history into a lossy summary, or old tool results are pruned from the current model request. DeepSeek V4's larger context helps, but it does not remove the need for durable, searchable, reversible memory. The CLI needs lossless context management so compressed history becomes a pointer to original records instead of the only remaining source of truth.

长时间 agent session 会以三种方式失败：规则或决策从未持久存储；compaction 将详细历史改写成有损摘要；旧 tool result 被从当前 model request 中修剪掉。DeepSeek V4 的大上下文有帮助，但不能替代持久、可搜索、可逆的记忆。CLI 需要无损上下文管理，让压缩历史成为指向原始记录的索引，而不是唯一剩下的事实来源。

## What Changes

- Add a runtime-owned Lossless Context Manager contract with durable DAG nodes, edges, grep, describe, expand, and incremental summary operations.
- 新增 runtime 所有的 Lossless Context Manager contract，提供持久 DAG nodes、edges、grep、describe、expand 与增量 summary 操作。
- Record user prompts, assistant outputs, and model-facing tool results as lossless context nodes when the host configures a manager.
- 当 host 配置 manager 时，将 user prompts、assistant outputs 与面向模型的 tool results 记录为 lossless context nodes。
- Persist CLI/live lossless context records to a JSONL-backed local store, while keeping deterministic tests opt-in.
- 将 CLI/live lossless context records 持久化到本地 JSONL store，同时让 deterministic tests 保持显式启用。
- Expose model-visible tools for `lossless-context-grep`, `lossless-context-describe`, and `lossless-context-expand` only when the manager is available.
- 仅在 manager 可用时暴露 model-visible 的 `lossless-context-grep`、`lossless-context-describe` 与 `lossless-context-expand` 工具。
- Add prompt assembly guidance requiring durable context search before relying on compressed history for prior work, decisions, constraints, or old tool results.
- 在 prompt assembly 中加入指导：涉及过去工作、决策、约束或旧 tool result 时，必须先搜索 durable context，再依赖压缩历史。
- Preserve secret hardening: raw secrets are redacted before durable context storage.
- 保留 secret hardening：原始 secret 在写入 durable context storage 前必须脱敏。

## Codex/Claude Reference Lessons / Codex 与 Claude 参考经验

- Treat durable context as client-side context engineering, not provider memory. The model only benefits when the runtime retrieves, expands, and injects the right bounded evidence.
- 将 durable context 视为 client-side context engineering，而不是 provider memory。只有 runtime 检索、展开并注入正确的有界 evidence 时，模型才真正受益。
- Keep original records inspectable and recoverable. Summaries should be indexes or pointers, never the only remaining source of truth.
- 保持 original records 可审计、可恢复。summaries 应是 indexes 或 pointers，绝不能成为唯一事实来源。
- Keep memory/context lower priority than current instructions and repository guidance. Durable context can inform, but it must not silently override current user intent or policy.
- 让 memory/context 的优先级低于当前 instructions 与 repository guidance。durable context 可以提供信息，但不得静默覆盖当前 user intent 或 policy。
- Record source class and redaction evidence so external or high-risk context can be handled by policy before it becomes permanent memory.
- 记录 source class 与 redaction evidence，使 external 或 high-risk context 在成为 permanent memory 前可被 policy 治理。
- Make recovery observable. A "not lost" claim needs evidence that storage, reload, grep/describe/expand, and prompt/tool retrieval all work after process restart.
- 让 recovery 可观测。“不丢失”的声明需要证据证明 storage、reload、grep/describe/expand 与 prompt/tool retrieval 在进程重启后都有效。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/memory-cache-management`, `src/packages/runtime`, `src/packages/prompt-assembly`, `src/packages/testing-regression`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/memory-cache-management`、`src/packages/runtime`、`src/packages/prompt-assembly`、`src/packages/testing-regression` 与 `src/apps/cli`。
- CLI hosts gain a local durable context store under the user's DeepSeek data directory.
- CLI host 会在用户 DeepSeek 数据目录下获得本地 durable context store。
- This change does not claim semantic vector recall or SQLite storage yet; those can be added behind the same contract later.
- 本 change 暂不声称已提供 semantic vector recall 或 SQLite storage；这些可以后续在同一 contract 后面替换或扩展。
- This change does not claim permanent memory. It is source preservation and recovery; distilled long-term memory is handled by the separate permanent-memory change.
- 本 change 不声称提供 permanent memory。它负责 source preservation 与 recovery；提炼后的长期记忆由独立 permanent-memory change 处理。
