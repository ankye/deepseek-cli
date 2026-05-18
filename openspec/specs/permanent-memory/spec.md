# permanent-memory Specification

## Purpose
TBD - created by archiving change add-permanent-memory-layer. Update Purpose after archive.
## Requirements
### Requirement: Permanent Memory Is Separate From Recall / 永久记忆独立于 Recall

The system SHALL define permanent memory as durable distilled knowledge that can influence future sessions, and SHALL NOT count PageIndex recall, lossless context preservation, provider cache hits, or in-memory fakes as permanent memory by themselves.

系统必须将永久记忆定义为可影响未来 sessions 的持久提炼知识，并且不得将 PageIndex recall、lossless context preservation、provider cache hits 或 in-memory fakes 单独计为 permanent memory。

#### Scenario: PageIndex and lossless context do not satisfy the gate / PageIndex 与 Lossless Context 不满足门禁

- **WHEN** delivery scoring evaluates permanent-memory capability
- **AND** the runtime has PageIndex and lossless context but no durable promoted memory records
- **THEN** the permanent-memory gate reports incomplete
- **中文** 当 delivery scoring 评估 permanent-memory capability，且 runtime 只有 PageIndex 与 lossless context、没有持久 promoted memory records 时，permanent-memory gate 必须报告 incomplete。

### Requirement: Memory Records Carry Provenance And Lifecycle / 记忆记录携带 Provenance 与 Lifecycle

Permanent memory records SHALL include scope, kind, status, content summary, provenance, confidence, freshness, redaction, sensitivity, and lifecycle metadata.

永久记忆记录必须包含 scope、kind、status、content summary、provenance、confidence、freshness、redaction、sensitivity 与 lifecycle metadata。

#### Scenario: Promoted memory cites source evidence / 已提升记忆引用来源证据

- **WHEN** a candidate is promoted to permanent memory
- **THEN** the stored record includes source evidence such as lossless context node ids, PageIndex page ids, runtime event ids, or content hashes
- **AND** an explain operation can show bounded source pointers without leaking raw secrets
- **中文** 当 candidate 被提升为 permanent memory 时，stored record 必须包含 lossless context node ids、PageIndex page ids、runtime event ids 或 content hashes 等 source evidence；explain operation 必须能展示有界 source pointers 且不泄漏 raw secrets。

### Requirement: Durable Promotion Requires Governance / 持久提升需要治理

The runtime SHALL require explicit user intent, configured policy, or review approval before promoting a candidate memory that can influence future behavior.

runtime 必须在提升可影响未来行为的 candidate memory 前，要求 explicit user intent、configured policy 或 review approval。

#### Scenario: Automatic candidate is proposed first / 自动候选先进入提案

- **WHEN** the extractor detects a possible long-lived preference from repeated corrections
- **AND** no policy permits automatic promotion for that kind and scope
- **THEN** the runtime creates a reviewable memory candidate instead of writing approved permanent memory
- **中文** 当 extractor 从重复 correction 中发现可能长期有效的 preference，且没有 policy 允许该 kind 与 scope 自动提升时，runtime 必须创建可 review 的 memory candidate，而不是写入 approved permanent memory。

### Requirement: Permanent Memory Is User Controllable / 永久记忆可由用户控制

The CLI SHALL expose controls to inspect, approve, reject, edit, delete, disable, export, and explain permanent memories and candidates.

CLI 必须暴露 inspect、approve、reject、edit、delete、disable、export 与 explain permanent memories/candidates 的 controls。

#### Scenario: Deleted memory stops affecting prompts / 删除记忆后不再影响 Prompt

- **WHEN** a user deletes or disables a memory
- **THEN** future prompt assembly does not inject that memory
- **AND** diagnostics can show the deletion or disabled status without re-promoting it from stale evidence
- **中文** 当用户删除或禁用某条 memory 后，后续 prompt assembly 不得注入该 memory；diagnostics 必须能显示 deletion 或 disabled status，并且不得从 stale evidence 中再次自动提升它。

#### Scenario: Long-term memory can be disabled by scope / 长期记忆可按 Scope 关闭

- **WHEN** long-term memory is disabled globally, for the current workspace, or for the current session/thread
- **THEN** runtime skips memory retrieval, prompt injection, candidate extraction, and promotion for that disabled scope
- **AND** diagnostics report memory as intentionally disabled rather than missing implementation
- **中文** 当长期记忆在 global、current workspace 或 current session/thread 层级被关闭时，runtime 必须跳过该 disabled scope 的 memory retrieval、prompt injection、candidate extraction 与 promotion；diagnostics 必须将其报告为 intentionally disabled，而不是 missing implementation。

### Requirement: Permanent Memory Provider Is Pluggable / 永久记忆 Provider 可插拔

The system SHALL access permanent memory through a provider contract so built-in local storage, encrypted stores, MCP-backed memory, vector memory, graph memory, or enterprise memory systems can be swapped without changing runtime behavior.

系统必须通过 provider contract 访问永久记忆，使内置本地存储、加密存储、MCP-backed memory、vector memory、graph memory 或企业记忆系统可以替换，而不改变 runtime behavior。

#### Scenario: Provider manifest describes capability limits / Provider Manifest 描述能力限制

- **WHEN** a permanent memory provider is configured
- **THEN** diagnostics expose its supported scopes, durability, locality, encryption, provenance support, delete semantics, export/import support, and migration safety
- **AND** unsupported provider features are reported before runtime depends on them
- **中文** 当配置 permanent memory provider 时，diagnostics 必须暴露其 supported scopes、durability、locality、encryption、provenance support、delete semantics、export/import support 与 migration safety；runtime 依赖不支持的 provider feature 前必须先报告 unsupported。

#### Scenario: Provider switch preserves governed records / Provider 切换保留受治理记录

- **WHEN** a user switches from one memory provider to another
- **THEN** migration preserves approved records, disabled records, delete markers, provenance, redaction metadata, and audit evidence when both providers support those fields
- **AND** migration fails or requires explicit confirmation when the target provider would lose those semantics
- **中文** 当用户从一个 memory provider 切换到另一个 provider 时，如果两个 provider 都支持相关字段，migration 必须保留 approved records、disabled records、delete markers、provenance、redaction metadata 与 audit evidence；如果目标 provider 会丢失这些语义，migration 必须失败或要求明确确认。

### Requirement: External Memory Hooks Are Available / 提供外部记忆 Hook

The runtime SHALL expose stable external memory hooks for capture, candidate extraction, retrieval, prompt injection, promotion, deletion, export, import, migration, and scoring-evidence boundaries.

runtime 必须为 capture、candidate extraction、retrieval、prompt injection、promotion、deletion、export、import、migration 与 scoring-evidence boundaries 暴露稳定的外部记忆 hooks。

#### Scenario: Hook payloads are redacted and stable / Hook Payload 脱敏且稳定

- **WHEN** runtime dispatches an external memory hook
- **THEN** the payload uses platform-contract DTOs rather than internal runtime objects
- **AND** the payload includes scope, provenance identifiers, replay id, redaction metadata, and bounded content
- **AND** the payload does not include raw secrets, raw `.env` values, raw provider credentials, or private key material
- **中文** 当 runtime dispatch 外部 memory hook 时，payload 必须使用 platform-contract DTOs，而不是内部 runtime objects；payload 必须包含 scope、provenance identifiers、replay id、redaction metadata 与 bounded content；payload 不得包含 raw secrets、raw `.env` values、raw provider credentials 或 private key material。

#### Scenario: Hook failure is isolated unless policy enforces it / Hook 失败默认隔离

- **WHEN** a non-enforcement external memory hook times out or fails
- **THEN** runtime records a typed hook diagnostic and continues core memory behavior without corrupting local memory state
- **BUT** when policy marks the hook as an enforcement hook, runtime may block promotion or injection with a typed diagnostic
- **中文** 当 non-enforcement 外部 memory hook 超时或失败时，runtime 必须记录 typed hook diagnostic，并继续 core memory behavior，且不得破坏本地 memory state；但当 policy 将该 hook 标记为 enforcement hook 时，runtime 可以用 typed diagnostic 阻止 promotion 或 injection。

#### Scenario: Hook evidence cannot self-attest completion / Hook Evidence 不能自证完成

- **WHEN** an external hook reports scoring evidence
- **THEN** delivery scoring requires corroborating durable records, retrieval traces, prompt injection evidence, user controls, and regression tests before marking permanent memory complete
- **中文** 当外部 hook 报告 scoring evidence 时，delivery scoring 必须要求 durable records、retrieval traces、prompt injection evidence、user controls 与 regression tests 等佐证，才能将 permanent memory 标记为 complete。

### Requirement: Prompt Injection Respects Instruction Priority / Prompt 注入遵守指令优先级

Prompt assembly SHALL inject only relevant approved permanent memories, and SHALL treat them as lower priority than current system, developer, host policy, user, and repository instructions.

prompt assembly 必须只注入相关且 approved 的 permanent memories，并将其优先级置于当前 system、developer、host policy、user 与 repository instructions 之下。

#### Scenario: Current request overrides stored memory / 当前请求覆盖已存记忆

- **WHEN** a stored memory conflicts with the current user request or repository instructions
- **THEN** runtime does not silently apply the conflicting memory
- **AND** diagnostics or prompt evidence mark the memory as conflicted, stale, or skipped
- **中文** 当 stored memory 与当前 user request 或 repository instructions 冲突时，runtime 不得静默应用冲突 memory；diagnostics 或 prompt evidence 必须将其标记为 conflicted、stale 或 skipped。

### Requirement: Memory Loading Is Scoped And Budgeted / 记忆加载按 Scope 与 Budget 控制

Prompt assembly SHALL select permanent memories by scope and relevance, and SHALL expose bounded inclusion and exclusion evidence.

prompt assembly 必须按 scope 与 relevance 选择 permanent memories，并暴露有界 inclusion 与 exclusion evidence。

#### Scenario: Path memory loads only when relevant / 路径记忆仅在相关时加载

- **WHEN** a workspace contains path/subtree-scoped memories for unrelated packages
- **AND** the current task does not touch those paths
- **THEN** prompt assembly does not inject those memories
- **AND** diagnostics may mark them as skipped due to scope mismatch
- **中文** 当 workspace 包含与当前任务无关 package 的 path/subtree-scoped memories，且当前任务未触达这些路径时，prompt assembly 不得注入这些 memories；diagnostics 可以将其标记为 skipped due to scope mismatch。

#### Scenario: Memory budget is explainable / 记忆预算可解释

- **WHEN** more relevant approved memories exist than the active prompt budget allows
- **THEN** prompt assembly injects the highest-ranked bounded set
- **AND** records which memories were omitted due to budget
- **中文** 当相关 approved memories 超过 active prompt budget 时，prompt assembly 必须注入排名最高的有界集合，并记录哪些 memories 因 budget 被省略。

### Requirement: Automatic Extraction Is Reviewable And Conservative / 自动提炼可 Review 且保守

Automatic memory extraction SHALL run as a background, policy-governed pipeline that proposes candidates for review instead of silently writing approved permanent memory.

自动记忆提炼必须作为后台、受 policy 治理的流水线运行，并提出可 review candidates，而不是静默写入 approved permanent memory。

#### Scenario: Background extractor respects eligibility and locks / 后台提炼遵守资格与锁

- **WHEN** multiple CLI instances exist for the same workspace
- **THEN** automatic extraction uses lock and processed-state evidence so each eligible idle session is processed at most once per version
- **AND** extraction does not block the interactive CLI loop
- **中文** 当同一 workspace 存在多个 CLI instances 时，automatic extraction 必须使用 lock 与 processed-state evidence，确保每个 eligible idle session 每个版本最多被处理一次；extraction 不得阻塞交互式 CLI loop。

#### Scenario: High-risk external context is not auto-memorized / 高风险外部上下文不自动记忆

- **WHEN** a session includes MCP, web, connector, browser/screen, customer-data, or third-party-document context
- **AND** no policy explicitly allows memory generation from that source class
- **THEN** automatic extraction skips that source for permanent memory candidates
- **中文** 当 session 包含 MCP、web、connector、browser/screen、customer-data 或 third-party-document context，且没有 policy 明确允许从该 source class 生成 memory 时，automatic extraction 必须跳过该来源的 permanent memory candidates。

### Requirement: Procedures Are Not Stored As Memory Facts / 流程不作为记忆事实存储

The system SHALL route repeated multi-step workflows to skills, recipes, or procedure records instead of storing them as ordinary permanent memory facts.

系统必须将重复出现的多步骤 workflow 路由到 skills、recipes 或 procedure records，而不是作为普通 permanent memory facts 存储。

#### Scenario: Workflow candidate becomes procedure proposal / Workflow 候选转为 Procedure Proposal

- **WHEN** extraction detects a repeatable multi-step workflow with invocation conditions
- **THEN** the candidate is labeled as a procedure or skill proposal
- **AND** it is not injected as a factual memory unless approved in the appropriate procedure channel
- **中文** 当 extraction 发现带 invocation conditions 的可重复多步骤 workflow 时，该 candidate 必须标记为 procedure 或 skill proposal；除非在适当 procedure channel 中批准，否则不得作为 factual memory 注入。

### Requirement: Secret-Hardened Memory Storage / Secret-Hardened 记忆存储

Permanent memory storage SHALL NOT persist raw secret-like values, including API keys, tokens, passwords, cookies, private keys, or `.env` values.

永久记忆存储不得持久化 raw secret-like values，包括 API keys、tokens、passwords、cookies、private keys 或 `.env` values。

#### Scenario: Secret-like candidate is blocked or redacted / Secret-like 候选被阻止或脱敏

- **WHEN** a candidate memory includes secret-like content
- **THEN** promotion either fails with a typed diagnostic or stores only redacted content with redaction evidence
- **AND** inspect, export, prompt injection, and audit outputs do not reveal the raw value
- **中文** 当 candidate memory 包含 secret-like content 时，promotion 必须以 typed diagnostic 失败，或仅存储带 redaction evidence 的脱敏内容；inspect、export、prompt injection 与 audit outputs 都不得暴露 raw value。

### Requirement: Permanent Memory Delivery Score Is Honest / 永久记忆交付评分诚实

Delivery capability scoring SHALL require durable storage, governed promotion, retrieval, prompt injection, user controls, and regression evidence before marking permanent memory complete.

交付能力评分必须要求 durable storage、governed promotion、retrieval、prompt injection、user controls 与 regression evidence 全部具备，才能将 permanent memory 标记为 complete。

#### Scenario: Fake or partial memory scores incomplete / Fake 或部分记忆评分为未完成

- **WHEN** permanent memory is backed only by deterministic fakes, in-memory test managers, or unapproved candidates
- **THEN** the capability score reports incomplete and applies the configured missing-capability penalty
- **中文** 当 permanent memory 仅由 deterministic fakes、in-memory test managers 或未批准 candidates 支撑时，capability score 必须报告 incomplete，并应用配置的 missing-capability penalty。

### Requirement: Memory Capabilities Are Layered And Separately Gated / 记忆能力分层且独立门禁

The system SHALL distinguish current conversation context, PageIndex or index recall, lossless context preservation, permanent promoted memory, provider cache, and external memory hooks as separate capabilities with separate diagnostics and delivery gates.

系统必须将 current conversation context、PageIndex 或 index recall、lossless context preservation、permanent promoted memory、provider cache 与 external memory hooks 区分为独立能力，并提供独立 diagnostics 与 delivery gates。

#### Scenario: Recall is not permanent memory / Recall 不等于永久记忆

- **WHEN** the runtime can recall PageIndex or lossless context records but has no approved durable promoted memory provider
- **THEN** diagnostics and delivery scoring report recall capability separately from permanent memory
- **中文** 当 runtime 能召回 PageIndex 或 lossless context records 但没有 approved durable promoted memory provider 时，diagnostics 与 delivery scoring 必须将 recall capability 与 permanent memory 分开报告。

#### Scenario: Disabled memory is explicit / 记忆关闭显式化

- **WHEN** long-term memory is disabled by user, workspace, session, policy, provider unavailability, or missing configuration
- **THEN** prompt assembly and delivery scoring report `disabled`, `unavailable`, or `missing` with scope metadata rather than silently omitting memory evidence
- **中文** 当长期记忆因 user、workspace、session、policy、provider unavailable 或 missing configuration 被关闭时，prompt assembly 与 delivery scoring 必须带 scope metadata 报告 `disabled`、`unavailable` 或 `missing`，而不是静默省略 memory evidence。

### Requirement: External Memory Hooks Fit The Main Workflow / 外部记忆 Hook 融入主流程

External memory hooks SHALL integrate through capture, retrieval, prompt injection, verification evidence, and scoring boundaries without bypassing prompt assembly priority or runtime policy.

外部 memory hooks 必须通过 capture、retrieval、prompt injection、verification evidence 与 scoring boundaries 融入主流程，不得绕过 prompt assembly priority 或 runtime policy。

#### Scenario: External memory cannot override current rules / 外部记忆不能覆盖当前规则

- **WHEN** an external memory provider returns memories or procedure suggestions
- **THEN** runtime treats them as governed context candidates below current user instructions, host policy, and repository rules
- **AND** prompt evidence records inclusion, exclusion, conflict, or degradation decisions
- **中文** 当外部 memory provider 返回 memories 或 procedure suggestions 时，runtime 必须将其作为受治理 context candidates，优先级低于当前 user instructions、host policy 与 repository rules；prompt evidence 必须记录 inclusion、exclusion、conflict 或 degradation decisions。

