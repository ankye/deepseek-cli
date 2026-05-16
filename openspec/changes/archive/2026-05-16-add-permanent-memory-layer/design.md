## Layer Model

Permanent memory is a third layer, not a rename of existing recall features.

永久记忆是第三层，不是现有 recall 功能的改名。

- PageIndex: deterministic page-level recall of bounded turn previews, freshness evidence, and provenance.
- PageIndex：确定性的 page-level recall，记录有界 turn previews、freshness evidence 与 provenance。
- Lossless context: durable redacted source records and expandable summary pointers, optimized for recovery and audit.
- Lossless context：持久的脱敏 source records 与可展开 summary pointers，面向 recovery 与 audit。
- Permanent memory: distilled durable knowledge that may proactively influence future sessions.
- Permanent memory：提炼后的持久知识，可以主动影响未来 sessions。

The system must be able to cite a permanent memory back to PageIndex pages, lossless context node ids, runtime event ids, or source hashes. If the source evidence is gone or expired, the memory must become stale or unverifiable rather than silently authoritative.

系统必须能将 permanent memory 回溯到 PageIndex pages、lossless context node ids、runtime event ids 或 source hashes。如果 source evidence 消失或过期，该 memory 必须变为 stale 或 unverifiable，而不是静默保持权威。

## Memory Record Shape

A permanent memory record should be structured enough to retrieve, inspect, merge, and delete safely.

永久记忆记录需要足够结构化，以便安全地 retrieve、inspect、merge 与 delete。

- `id`, `schemaVersion`, `kind`, `scope`, `status`, `content`, and bounded `summary`.
- `id`、`schemaVersion`、`kind`、`scope`、`status`、`content` 与有界 `summary`。
- `provenance` with source node ids, page ids, event ids, content hashes, and created-by actor.
- `provenance` 包含 source node ids、page ids、event ids、content hashes 与 created-by actor。
- `confidence`, `freshness`, `validFrom`, optional `expiresAt`, and conflict links.
- `confidence`、`freshness`、`validFrom`、可选 `expiresAt` 与 conflict links。
- `redaction` and `sensitivity` metadata that prove raw secrets were not persisted.
- `redaction` 与 `sensitivity` metadata，用于证明没有持久化 raw secrets。
- `lastAccessedAt`, `lastInjectedAt`, `accessCount`, and audit entries for user-visible explainability.
- `lastAccessedAt`、`lastInjectedAt`、`accessCount` 与 audit entries，用于用户可见 explainability。

## Candidate Extraction

The runtime may generate memory candidates from repeated user corrections, explicit remember requests, accepted project decisions, recurring build/test facts, and stable workflow preferences. Candidate extraction should use lossless context and PageIndex as evidence sources, but candidate creation does not equal durable memory write.

runtime 可以从重复的 user corrections、显式 remember requests、已接受 project decisions、重复出现的 build/test facts 与稳定 workflow preferences 中生成 memory candidates。候选提取可以使用 lossless context 与 PageIndex 作为证据来源，但 candidate creation 不等于 durable memory write。

Promotion to permanent memory requires one of:

提升为永久记忆必须满足以下之一：

- Explicit user request, such as "remember this" or "把这个记住".
- 显式用户请求，例如 "remember this" 或 "把这个记住"。
- A configured workspace or organization policy that allows automatic promotion for the memory kind and scope.
- 已配置的 workspace 或 organization policy 允许该 memory kind 与 scope 自动提升。
- A review queue approval in the CLI.
- CLI review queue 中的 approval。

Sensitive, ambiguous, or high-impact records must be proposed instead of silently stored.

敏感、模糊或高影响记录必须进入 proposal，而不是静默存储。

## Retrieval And Prompt Injection

Permanent memories should be retrieved just in time by scope, task relevance, confidence, freshness, and conflict status. They should be injected as bounded context blocks with source pointers and explicit priority rules.

永久记忆应按 scope、task relevance、confidence、freshness 与 conflict status 即时检索。注入时应作为有界 context blocks，包含 source pointers 与明确 priority rules。

Priority order:

优先级顺序：

1. Current system, developer, and host policy instructions.
2. Current user request and in-session corrections.
3. Repository instructions such as `AGENTS.md`.
4. Approved permanent memory relevant to the task.
5. PageIndex and lossless context retrieved evidence.

Current instructions always win over stale or conflicting memory. When memory conflicts with current instructions, the runtime should surface the conflict rather than making a hidden choice.

当前 instructions 始终优先于 stale 或 conflicting memory。当 memory 与当前 instructions 冲突时，runtime 应暴露冲突，而不是隐藏选择。

## Scope, Loading, And Budgets

Permanent memory should be scoped and loaded lazily. The runtime should support user, workspace, path/subtree, agent/subagent, and session/thread scopes. Scope matching should consider the current workspace, files being edited, active tools, target package, and user request. Path/subtree memories should not enter the prompt until the task actually touches that part of the repository.

永久记忆应支持 scope，并按需加载。runtime 应支持 user、workspace、path/subtree、agent/subagent 与 session/thread scopes。scope matching 应考虑当前 workspace、正在编辑的 files、active tools、target package 与 user request。path/subtree memories 不应在任务真正触达对应仓库区域前进入 prompt。

The active memory budget should be explicit. A compact index can be loaded first, while detailed memory records are retrieved on demand. Prompt assembly should track token cost, memory count, reason for inclusion, and reason for exclusion.

active memory budget 应明确。可以先加载 compact index，再按需检索详细 memory records。prompt assembly 应跟踪 token cost、memory count、inclusion reason 与 exclusion reason。

## Background Extraction And Inbox

Automatic memory extraction should be asynchronous, reviewable, and conservative. It should not block the interactive CLI loop. Extraction should run only for eligible sessions that are idle, non-trivial, and allowed by memory policy. A lock and processed-state record should prevent multiple CLI instances from extracting the same session repeatedly.

自动记忆提炼应异步、可 review 且保守。它不应阻塞交互式 CLI loop。提炼只应针对 idle、non-trivial 且 memory policy 允许的 eligible sessions 运行。lock 与 processed-state record 应避免多个 CLI instances 重复提炼同一 session。

Candidates should land in an inbox with source evidence, proposed scope, sensitivity, confidence, and a proposed action. The user can approve, edit, reject, or convert candidates into skills/procedures when the content describes a repeatable workflow instead of a fact.

candidates 应进入 inbox，并带 source evidence、proposed scope、sensitivity、confidence 与 proposed action。用户可以 approve、edit、reject；当内容描述的是可重复 workflow 而不是 fact 时，可以将 candidate 转为 skill/procedure。

## External Context Policy

Sessions that used external or high-risk context should not feed automatic memory generation by default. This includes MCP tools, web search, connectors, browser/screen context, pasted secrets, customer data, and third-party documents. Policy may allow specific sources, but extraction must record the source class and preserve deletion or retention semantics.

使用 external 或 high-risk context 的 sessions 默认不应进入 automatic memory generation。这包括 MCP tools、web search、connectors、browser/screen context、pasted secrets、customer data 与 third-party documents。policy 可以允许特定来源，但 extraction 必须记录 source class 并保留 deletion 或 retention semantics。

## Memory Versus Procedures

Permanent memory should store stable facts, preferences, decisions, and constraints. Repeated operational workflows should become skills, recipes, or procedure records with explicit invocation conditions. This keeps memory concise and keeps multi-step behavior testable.

永久记忆应存储稳定 facts、preferences、decisions 与 constraints。重复性的 operational workflows 应沉淀为 skills、recipes 或 procedure records，并带明确 invocation conditions。这样可以保持 memory 简洁，并让多步骤行为可测试。

## Storage And Security

The first durable backend should be local and deterministic enough for regression tests. JSONL can work for an initial append-only audit trail, while SQLite remains a reasonable upgrade path for query, conflict indexing, and compaction. The contract must not require a specific backend.

首个持久 backend 应本地化，并足够确定性以支持 regression tests。JSONL 可作为初始 append-only audit trail；SQLite 则是后续支持 query、conflict indexing 与 compaction 的合理升级路径。contract 不应绑定具体 backend。

## Pluggable Provider Boundary

Permanent memory must be a provider boundary, not a single storage implementation. The runtime should depend on a `PermanentMemoryManager` contract and a provider manifest that reports capability support, scopes, durability, encryption, export, delete semantics, provenance support, and whether the provider is local or remote.

永久记忆必须是 provider boundary，而不是单一 storage implementation。runtime 应依赖 `PermanentMemoryManager` contract 与 provider manifest，后者报告 capability support、scopes、durability、encryption、export、delete semantics、provenance support，以及 provider 是 local 还是 remote。

Provider examples:

provider 示例：

- Built-in local JSONL or SQLite storage.
- 内置 local JSONL 或 SQLite storage。
- Encrypted local storage.
- 加密本地存储。
- MCP-backed memory servers.
- MCP-backed memory servers。
- Vector or graph memory systems with a provenance bridge.
- 带 provenance bridge 的 vector 或 graph memory systems。
- Enterprise memory systems with policy-managed retention.
- 带 policy-managed retention 的企业 memory systems。

The provider boundary should include import/export and migration hooks so users can switch providers without losing approved memories when both providers support compatible export semantics. If a target provider cannot preserve provenance, redaction, delete markers, or disabled states, migration must fail or report explicit loss before proceeding.

provider boundary 应包含 import/export 与 migration hooks，使用户在两个 provider 都支持兼容 export semantics 时，可以切换 provider 而不丢失 approved memories。如果目标 provider 无法保留 provenance、redaction、delete markers 或 disabled states，migration 必须失败或在执行前明确报告损失。

## External Memory Hooks

External memory integration needs hooks in addition to provider replacement. A provider owns storage and query behavior; hooks let an external system observe or participate in runtime lifecycle points without becoming the primary provider.

外部记忆对接除了 provider replacement，还需要 hooks。provider 负责 storage 与 query behavior；hooks 允许外部系统在不成为主 provider 的情况下观察或参与 runtime lifecycle points。

Hook categories:

hook 类别：

- `memory.capture.before` and `memory.capture.after` for redacted source evidence captured from turns, tools, and runtime events.
- `memory.capture.before` 与 `memory.capture.after`：处理来自 turns、tools 与 runtime events 的脱敏 source evidence。
- `memory.candidate.propose` and `memory.candidate.review` for external extraction, ranking, dedupe, and approval queue enrichment.
- `memory.candidate.propose` 与 `memory.candidate.review`：用于外部 extraction、ranking、dedupe 与 approval queue enrichment。
- `memory.retrieve.before` and `memory.retrieve.after` for external reranking, federation, or fallback retrieval.
- `memory.retrieve.before` 与 `memory.retrieve.after`：用于外部 reranking、federation 或 fallback retrieval。
- `memory.inject.before` and `memory.inject.after` for final prompt-boundary inspection and evidence logging.
- `memory.inject.before` 与 `memory.inject.after`：用于最终 prompt-boundary inspection 与 evidence logging。
- `memory.promote.before` and `memory.promote.after` for governance checks and downstream synchronization.
- `memory.promote.before` 与 `memory.promote.after`：用于 governance checks 与 downstream synchronization。
- `memory.delete.before` and `memory.delete.after` for tombstone propagation and external purge coordination.
- `memory.delete.before` 与 `memory.delete.after`：用于 tombstone propagation 与 external purge coordination。
- `memory.export`, `memory.import`, and `memory.migrate` for external backup, migration, and compatibility checks.
- `memory.export`、`memory.import` 与 `memory.migrate`：用于 external backup、migration 与 compatibility checks。
- `memory.score.evidence` for delivery capability scoring evidence from external systems without allowing self-attested fake completion.
- `memory.score.evidence`：用于外部系统提供 delivery capability scoring evidence，但不得允许 self-attested fake completion。

Hook payloads must be stable platform-contract DTOs, never internal runtime objects. Payloads must be redacted before dispatch, include scope and provenance identifiers, and carry replay ids so tests can reproduce hook behavior. Hook results must be bounded and typed.

hook payloads 必须是稳定的 platform-contract DTOs，不能是内部 runtime objects。payloads 必须在 dispatch 前脱敏，包含 scope 与 provenance identifiers，并携带 replay ids，使测试可复现 hook behavior。hook results 必须有界且类型化。

Hook safety rules:

hook 安全规则：

- Hooks are opt-in and declared through manifests with supported hook names, locality, timeout, side-effect class, and required permissions.
- Hooks 必须 opt-in，并通过 manifests 声明 supported hook names、locality、timeout、side-effect class 与 required permissions。
- Hooks must have timeouts, retries only when idempotent, and failure isolation so a remote memory outage cannot corrupt local memory state.
- Hooks 必须有 timeout；只有幂等时才允许 retry；并具备 failure isolation，使远程记忆故障不能破坏本地 memory state。
- Hooks may block promotion or injection only when policy explicitly marks them as enforcement hooks.
- 只有当 policy 明确将 hook 标记为 enforcement hook 时，hook 才可以阻止 promotion 或 injection。
- Hooks must not receive raw secrets, raw `.env` values, raw provider credentials, or unredacted private key material.
- Hooks 不得接收 raw secrets、raw `.env` values、raw provider credentials 或未脱敏 private key material。
- Hook diagnostics must distinguish external hook failure from core permanent-memory implementation failure.
- hook diagnostics 必须区分 external hook failure 与 core permanent-memory implementation failure。

## Disable And Consent Modes

Long-term memory must be controllable at multiple levels. Configuration should distinguish reading memories from generating or promoting new memories.

长期记忆必须可在多个层级控制。配置应区分读取记忆与生成/提升新记忆。

- Global off: no memory retrieval, injection, candidate extraction, or promotion.
- 全局关闭：不进行 memory retrieval、injection、candidate extraction 或 promotion。
- Workspace off: disable memory for a repository or project even when global memory is enabled.
- 工作区关闭：即使 global memory enabled，也为某个 repository 或 project 禁用 memory。
- Session/thread off: prevent the current conversation from using existing memories or generating future memory inputs.
- Session/thread 关闭：禁止当前对话使用既有 memories 或生成未来 memory inputs。
- Read-only mode: allow retrieval/injection of approved memories but block new candidates and promotion.
- 只读模式：允许 retrieval/injection approved memories，但阻止 new candidates 与 promotion。
- Generate-only review mode: create candidates for review but do not inject memories into prompts.
- 仅生成待审模式：创建 review candidates，但不向 prompts 注入 memories。

When memory is disabled for a scope, diagnostics should show that state plainly so delivery evidence cannot confuse an intentional privacy setting with an implementation gap.

当某个 scope 的 memory 被禁用时，diagnostics 应清楚显示该状态，避免 delivery evidence 将有意的隐私设置误判为实现缺口。

Secret handling requirements:

secret 处理要求：

- Never store raw API keys, tokens, passwords, cookies, private keys, or `.env` values.
- 绝不存储 raw API keys、tokens、passwords、cookies、private keys 或 `.env` values。
- Record redaction evidence and sensitivity classification.
- 记录 redaction evidence 与 sensitivity classification。
- Support delete, disable, export, and full wipe from CLI controls.
- 支持通过 CLI controls delete、disable、export 与 full wipe。
- Avoid automatic promotion from tool outputs that may contain third-party or customer data unless policy explicitly allows it.
- 避免从可能包含第三方或客户数据的 tool outputs 自动提升记忆，除非 policy 明确允许。

## Diagnostics And Scoring

Delivery capability scoring must treat permanent memory as incomplete until there is durable storage, governance, retrieval, prompt injection, tests, and user-visible controls. PageIndex recall, lossless context, DeepSeek cache hits, and in-memory fakes may be prerequisites or evidence sources, but they must not pass the permanent-memory gate by themselves.

交付能力评分必须将 permanent memory 视为 incomplete，直到 durable storage、governance、retrieval、prompt injection、tests 与 user-visible controls 全部具备。PageIndex recall、lossless context、DeepSeek cache hits 与 in-memory fakes 可以作为前置能力或 evidence sources，但不得单独通过 permanent-memory gate。
