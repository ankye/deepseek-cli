## Why

PageIndex and lossless context solve recall and preservation, but they do not create a governed permanent memory. PageIndex can point back to bounded turn evidence. Lossless context can preserve redacted originals and expandable summaries. Neither one decides which facts, preferences, project decisions, or workflow habits should become durable future guidance.

PageIndex 与 lossless context 解决的是 recall 与 preservation，但它们不会形成受治理的永久记忆。PageIndex 可以指回有界的 turn evidence。lossless context 可以保存脱敏后的原文与可展开摘要。二者都不会判断哪些 facts、preferences、project decisions 或 workflow habits 应该沉淀为未来持续生效的 guidance。

The current runtime also has a `memory.read-write` style capability and an in-memory manager for deterministic tests, but that is not enough for real delivery. It lacks durable storage, provenance, approval or policy gating, delete/export controls, conflict handling, and prompt injection rules.

当前 runtime 也有 `memory.read-write` 类能力和用于确定性测试的 in-memory manager，但这不足以支撑真实交付。它缺少持久存储、provenance、approval 或 policy gating、delete/export controls、conflict handling，以及 prompt injection rules。

## What Changes

- Add a first-class Permanent Memory layer that is separate from PageIndex and lossless context.
- 新增一等 Permanent Memory layer，并明确它独立于 PageIndex 与 lossless context。
- Define durable memory records for stable user preferences, standing instructions, project facts, project decisions, workflow habits, and environment facts.
- 定义持久 memory records，用于稳定的 user preferences、standing instructions、project facts、project decisions、workflow habits 与 environment facts。
- Require every memory record to carry scope, provenance, confidence, freshness, source evidence, redaction status, and lifecycle metadata.
- 要求每条 memory record 携带 scope、provenance、confidence、freshness、source evidence、redaction status 与 lifecycle metadata。
- Add candidate extraction from lossless context, PageIndex, and runtime events, but require policy or user approval before durable promotion when the record can influence future behavior.
- 从 lossless context、PageIndex 与 runtime events 中提取候选记忆，但当该记录会影响未来行为时，必须先经过 policy 或 user approval 才能持久提升。
- Add user-facing inspect, approve, reject, edit, delete, disable, export, and explain flows.
- 增加面向用户的 inspect、approve、reject、edit、delete、disable、export 与 explain 流程。
- Make the memory provider pluggable so local JSONL, SQLite, encrypted stores, MCP-backed memory, vector memory, or other general-purpose memory systems can be swapped behind the same contract.
- 将 memory provider 设计为可插拔，使 local JSONL、SQLite、encrypted stores、MCP-backed memory、vector memory 或其他通用记忆系统都能在同一 contract 后替换。
- Provide lifecycle hooks so external memory systems can observe or participate in capture, candidate extraction, retrieval, prompt injection, promotion, deletion, export, migration, and scoring evidence without importing runtime internals.
- 提供 lifecycle hooks，使外部记忆系统可以观察或参与 capture、candidate extraction、retrieval、prompt injection、promotion、deletion、export、migration 与 scoring evidence，而不需要导入 runtime internals。
- Allow long-term memory to be disabled globally, per workspace, and per session/thread, including separate controls for reading existing memories and generating new memories.
- 允许长期记忆按 global、workspace 与 session/thread 维度关闭，并区分读取既有记忆与生成新记忆的控制。
- Make prompt assembly retrieve and inject only relevant permanent memories, with explicit lower priority than current user, developer, system, and repository instructions.
- prompt assembly 只检索并注入相关 permanent memories，并明确其优先级低于当前 user、developer、system 与 repository instructions。
- Keep delivery scoring honest: PageIndex, lossless context, cache hits, or in-memory fakes must not satisfy the permanent-memory capability gate.
- 保持交付评分诚实：PageIndex、lossless context、cache hits 或 in-memory fakes 不得满足 permanent-memory capability gate。

## Current Product Comparison / 当前产品对比

- Codex has two relevant mechanisms: `AGENTS.md` for required persistent instructions, and opt-in memories that can carry stable preferences, recurring workflows, project conventions, and known pitfalls across threads.
- Codex 有两个相关机制：`AGENTS.md` 用于必需的持久 instructions；opt-in memories 可跨 threads 携带 stable preferences、recurring workflows、project conventions 与 known pitfalls。
- ChatGPT product memory is a separate product feature with saved memories and chat-history reference controls.
- ChatGPT 的 product memory 是独立产品能力，包含 saved memories 与 chat-history reference controls。
- Claude Code has `CLAUDE.md` instructions and auto memory; Claude API exposes a memory-tool primitive where the client controls storage.
- Claude Code 有 `CLAUDE.md` instructions 与 auto memory；Claude API 暴露 memory-tool primitive，存储由 client 控制。
- DeepSeek CLI should treat those products as design references, not as copied implementation details.
- DeepSeek CLI 应将这些产品作为设计参考，而不是复制其实现细节。

## Cross-CLI Lessons To Carry Forward / 需要吸收的 CLI 经验

- Treat memory as context, not enforcement. Required rules belong in policy, `AGENTS.md`, or checked-in docs; memory can suggest but must not override higher-priority instructions.
- 将 memory 视为 context，而不是 enforcement。强制规则应放在 policy、`AGENTS.md` 或 checked-in docs 中；memory 可以提示，但不得覆盖更高优先级 instructions。
- Use scoped and lazy loading. User, workspace, path/subtree, agent, and thread memories should load only when relevant so large repos do not waste context.
- 使用 scoped 与 lazy loading。user、workspace、path/subtree、agent 与 thread memories 应只在相关时加载，避免大型仓库浪费 context。
- Put automatic extraction in a reviewable background pipeline with idle thresholds, locks, rate/budget limits, and an inbox.
- 将自动提炼放入可 review 的后台流水线，包含 idle thresholds、locks、rate/budget limits 与 inbox。
- Separate durable knowledge from reusable procedures. Repeated workflows may become skills/procedures instead of memory facts.
- 区分持久知识与可复用流程。重复 workflow 可以沉淀为 skills/procedures，而不是 memory facts。
- Treat external context as high risk for memory generation. MCP, web, connector, screen, customer data, or third-party content should not become memory unless policy explicitly allows it.
- 将 external context 视为高风险 memory generation 来源。MCP、web、connector、screen、customer data 或 third-party content 不应自动成为 memory，除非 policy 明确允许。
- Expose memory sources and adherence diagnostics. Users need to know which memory was used, skipped, stale, conflicted, or deleted.
- 暴露 memory sources 与 adherence diagnostics。用户需要知道哪些 memory 被使用、跳过、过期、冲突或删除。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/memory-cache-management`, `src/packages/runtime`, `src/packages/prompt-assembly`, `src/packages/testing-regression`, `src/packages/evaluation-harness`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/memory-cache-management`、`src/packages/runtime`、`src/packages/prompt-assembly`、`src/packages/testing-regression`、`src/packages/evaluation-harness` 与 `src/apps/cli`。
- Affected configuration: provider selection, provider capability diagnostics, global/workspace/session memory toggles, and migration/export contracts.
- 影响配置：provider selection、provider capability diagnostics、global/workspace/session memory toggles，以及 migration/export contracts。
- Affected extension points: external memory hooks, hook manifests, hook timeout/failure policy, redacted hook payloads, and deterministic replay evidence.
- 影响扩展点：external memory hooks、hook manifests、hook timeout/failure policy、redacted hook payloads 与 deterministic replay evidence。
- Existing PageIndex and lossless-context behavior should remain valid, but diagnostics must explain that they are source evidence, not permanent memory completion.
- 现有 PageIndex 与 lossless-context 行为应继续有效，但 diagnostics 必须说明它们是 source evidence，不是 permanent memory completion。
- This change is a discussion and contract track first. Implementation should follow only after the capability boundary and scoring gates are accepted.
- 本 change 先作为讨论与 contract track。只有 capability boundary 与 scoring gates 被接受后，再进入实现。

## Reference Docs / 参考文档

- OpenAI Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md
- OpenAI Codex Memories: https://developers.openai.com/codex/memories
- OpenAI Codex Chronicle: https://developers.openai.com/codex/memories/chronicle
- OpenAI ChatGPT Memory FAQ: https://help.openai.com/en/articles/8590148-memory-faq
- Claude Code memory: https://code.claude.com/docs/en/memory
- Claude chat search and memory: https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
- Claude API memory tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
