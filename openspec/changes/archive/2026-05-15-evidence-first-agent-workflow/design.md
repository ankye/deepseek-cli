## Context

DeepSeek CLI is being built as a contract-first agent platform, but the live webpage generation incident showed a core reliability gap: the agent can produce polished output that is structurally valid yet factually ungrounded. A page can pass HTML/CSS/JS checks while inventing `npx deepseek-cli init`, claiming "no registration", or describing product capabilities without reading the repository.

DeepSeek CLI 正在构建为契约先行的 agent platform，但 live webpage generation 暴露了核心可靠性缺口：agent 可以生成结构上有效、事实却未接地的精美输出。一个页面可能通过 HTML/CSS/JS 检查，却虚构 `npx deepseek-cli init`、声称“无需注册”，或在没有读取仓库的情况下描述产品能力。

This is not a webpage-only bug. It is a general agent workflow problem. For repository, product, code, architecture, roadmap, command, release, or evaluation tasks, the agent must default to evidence-first behavior: gather evidence, classify certainty, ground claims, mark assumptions, then answer, edit, generate, or evaluate.

这不是网页专属 bug，而是通用 agent 工作流问题。对于 repository、product、code、architecture、roadmap、command、release 或 evaluation tasks，agent 必须默认 evidence-first：搜集证据、分类确定性、为声明接地、标注假设，然后再回答、编辑、生成或评估。

## Goals / Non-Goals

**Goals:**

- Make evidence-first behavior the default for fact-sensitive tasks without requiring users to write "please verify first".
- Add task-intent classification that detects when evidence is required.
- Define evidence plans, evidence manifests, claim grounding, unsupported-claim handling, and assumption labeling.
- Ensure generated artifacts and reports can be checked for evidence grounding, not only syntax or visual structure.
- Feed evidence quality into prompt assembly, runtime events, diagnostics, evaluation, and regression replay.
- Keep evidence local, bounded, redacted, and governed by existing context/projection/privacy rules.

- 让 evidence-first 成为 fact-sensitive tasks 的默认行为，不要求用户额外写“请先验证”。
- 增加 task-intent classification，用来检测何时必须搜证。
- 定义 evidence plans、evidence manifests、claim grounding、unsupported-claim handling 与 assumption labeling。
- 确保生成产物和报告可以检查 evidence grounding，而不只是检查语法或视觉结构。
- 将 evidence quality 接入 prompt assembly、runtime events、diagnostics、evaluation 与 regression replay。
- evidence 保持本地、有界、脱敏，并受现有 context/projection/privacy 规则治理。

**Non-Goals:**

- Do not require exhaustive repository indexing before every casual or creative task.
- Do not block explicitly fictional, brainstorming, or user-provided hypothetical work when it is labeled as assumption-based.
- Do not expose raw private files, secrets, provider reasoning, or unbounded transcripts in evidence manifests.
- Do not replace context-engine retrieval, PageIndex, code intelligence, or prompt assembly; this change coordinates them under an evidence-first policy.
- Do not make external network search required for local project facts.

- 不要求每个闲聊或创意任务都做全仓库索引。
- 对明确为虚构、头脑风暴或用户提供假设的任务，不阻断，但必须标注为 assumption-based。
- 不在 evidence manifests 中暴露 raw private files、secrets、provider reasoning 或无界 transcripts。
- 不替代 context-engine retrieval、PageIndex、code intelligence 或 prompt assembly；本变更是在 evidence-first policy 下协调它们。
- 本地项目事实不要求外部联网搜索。

## Decisions

### 1. Add an evidence-required task classifier

Runtime will classify each turn before model dispatch. Evidence is required when the user asks about or acts on:

- current repository facts
- product positioning, feature lists, commands, installation, release state, roadmap, or comparison claims
- code changes, bug fixes, refactors, tests, architecture, package boundaries, or generated artifacts
- documentation, OpenSpec, release notes, acceptance evidence, evaluation reports, or competitive conclusions
- any output that users may treat as factual product/project material

Runtime 会在 model dispatch 前分类每个 turn。当用户询问或操作以下对象时，必须搜证：

- 当前仓库事实
- 产品定位、功能列表、命令、安装、发布状态、路线图或对比声明
- 代码修改、bug fix、refactor、tests、architecture、package boundaries 或 generated artifacts
- docs、OpenSpec、release notes、acceptance evidence、evaluation reports 或 competitive conclusions
- 任何用户可能当成事实性项目/产品材料的输出

**Rationale:** The user should not need to say "read the repo first" when the task is obviously about the repo.

**Alternative considered:** Put evidence reminders only in the prompt. That fails because models can still skip the behavior and no system component can evaluate the missing step.

### 2. Represent evidence work as a plan and a manifest

Evidence-first turns will produce:

- `EvidencePlan`: why evidence is required, candidate sources, required fact classes, minimum source count, and stop/block conditions.
- `EvidenceItem`: inspected source path or runtime record, bounded preview, fingerprint, fact classes, freshness, and redaction metadata.
- `ClaimGrounding`: claim text or claim fingerprint, certainty (`verified`, `inferred`, `assumption`, `unsupported`), evidence references, and output scope.
- `EvidenceManifest`: final artifact/report manifest linking generated claims to evidence and assumptions.

Evidence-first turns 会产生：

- `EvidencePlan`：为什么需要 evidence、候选 sources、必要 fact classes、最小 source count 与 stop/block conditions。
- `EvidenceItem`：已检查 source path 或 runtime record、有界 preview、fingerprint、fact classes、freshness 与 redaction metadata。
- `ClaimGrounding`：claim text 或 claim fingerprint、确定性（`verified`、`inferred`、`assumption`、`unsupported`）、evidence references 与 output scope。
- `EvidenceManifest`：最终产物/报告 manifest，将 generated claims 连接到 evidence 与 assumptions。

**Rationale:** "I looked at files" is not enough. We need replayable structure that can be tested and used by evaluation.

### 3. Classify claims by certainty

Every factual claim used in answers, generated docs, product pages, evaluation reports, command recommendations, or code explanations must fall into one of four classes:

- `verified`: directly supported by evidence.
- `inferred`: derived from evidence and clearly marked as inference.
- `assumption`: allowed only when the output is explicitly speculative or the user asked for ideation.
- `unsupported`: must be removed, rewritten, marked as unknown, or cause the artifact/report to fail checks.

用于回答、生成文档、产品页、评估报告、命令建议或代码解释的每个事实声明必须属于四类之一：

- `verified`：由 evidence 直接支持。
- `inferred`：由 evidence 推导，且明确标注为 inference。
- `assumption`：仅在输出明确是 speculative 或用户要求 ideation 时允许。
- `unsupported`：必须移除、重写、标为 unknown，或导致产物/报告检查失败。

**Rationale:** This is the practical version of "distinguish known, inferred, and assumed".

### 4. Make generated artifacts evidence-checkable

Generated artifacts that make project/product claims must include an evidence manifest. For webpage generation, `generated-webpage/evidence.json` becomes part of the required artifact set. It should reference sources such as `README.md`, `src/apps/cli/package.json`, `docs/reference/command-index.md`, `docs/product/product-roadmap.md`, and relevant OpenSpec files.

任何包含项目/产品声明的生成产物都必须包含 evidence manifest。对网页生成来说，`generated-webpage/evidence.json` 将成为必需产物之一。它应引用 `README.md`、`src/apps/cli/package.json`、`docs/reference/command-index.md`、`docs/product/product-roadmap.md` 与相关 OpenSpec files 等来源。

The checker should reject unsupported project claims, nonexistent commands, unverified install commands, and missing evidence manifests. This is a concrete first implementation of the general workflow, not the whole capability.

checker 应拒绝 unsupported project claims、nonexistent commands、unverified install commands 与缺失 evidence manifest。这是通用工作流的第一个具体实现，不是能力的全部。

### 5. Prompt assembly receives evidence-first operating sections

Prompt assembly should include sections for:

- evidence-first operating rules
- evidence plan
- selected evidence items
- unsupported claim policy
- exact user prompt boundary
- output contract requiring evidence manifest or assumption labeling when applicable

Prompt assembly 应包含以下 sections：

- evidence-first operating rules
- evidence plan
- selected evidence items
- unsupported claim policy
- exact user prompt boundary
- 适用时要求 evidence manifest 或 assumption labeling 的 output contract

The user prompt remains exact and unmodified. Evidence is runtime-owned context.

用户 prompt 保持精确不变。evidence 是 runtime-owned context。

### 6. Evaluation must score evidence quality

Evaluation records should include:

- evidence plan present
- evidence item count by source type
- required source coverage
- claim grounding rate
- unsupported claim count
- assumption count
- generated artifact evidence manifest status
- hallucinated command/package/feature count

Evaluation records 应包含：

- evidence plan present
- evidence item count by source type
- required source coverage
- claim grounding rate
- unsupported claim count
- assumption count
- generated artifact evidence manifest status
- hallucinated command/package/feature count

**Rationale:** A task that "looks good" but invents commands must not be scored as solved.

## Risks / Trade-offs

- [Risk] Evidence gathering can slow simple tasks. -> Mitigation: task classifier only requires evidence for fact-sensitive tasks; casual or explicitly speculative tasks can run with assumption labeling.
- [风险] 搜证会拖慢简单任务。-> 缓解：task classifier 只对 fact-sensitive tasks 强制搜证；闲聊或明确假设任务可用 assumption labeling。

- [Risk] Evidence manifests can leak private content. -> Mitigation: store bounded previews, fingerprints, source refs, redaction classes, and fact classes, not raw unbounded content.
- [风险] evidence manifests 可能泄漏私有内容。-> 缓解：存储 bounded previews、fingerprints、source refs、redaction classes 与 fact classes，而不是 raw unbounded content。

- [Risk] Claim extraction is hard to perfect. -> Mitigation: start with high-value structured claims: commands, package names, feature bullets, install instructions, release state, and evaluation conclusions.
- [风险] claim extraction 很难一次做到完美。-> 缓解：先覆盖高价值结构化声明：commands、package names、feature bullets、install instructions、release state 与 evaluation conclusions。

- [Risk] Agents may over-cite irrelevant files. -> Mitigation: evidence plan requires fact classes and source coverage; evaluation scores relevance and unsupported claims, not raw citation count.
- [风险] agent 可能堆无关引用。-> 缓解：evidence plan 要求 fact classes 与 source coverage；evaluation 评分 relevance 与 unsupported claims，而不是 citation 数量。

- [Risk] The first implementation may overfit webpage generation. -> Mitigation: webpage checker is only the first concrete gate; contracts and runtime events are generic.
- [风险] 第一版可能过拟合网页生成。-> 缓解：webpage checker 只是第一个具体门禁；contracts 与 runtime events 是通用的。

## Migration Plan

1. Add evidence-first contracts and event types.
2. Implement deterministic task-intent classification and evidence plan creation.
3. Add a minimal source discovery provider for repo facts, commands, package metadata, docs, OpenSpec, and task catalog.
4. Wire evidence plan and selected evidence into prompt assembly.
5. Add evidence manifest requirements to webpage generation and checker.
6. Extend evaluation metrics and tests for unsupported claims and hallucinated commands.
7. Gradually enable evidence-first by default for fact-sensitive `deepseek run`, then chat turns, then future hosts.

1. 增加 evidence-first contracts 与 event types。
2. 实现确定性 task-intent classification 与 evidence plan creation。
3. 增加最小 source discovery provider，覆盖 repo facts、commands、package metadata、docs、OpenSpec 与 task catalog。
4. 将 evidence plan 与 selected evidence 接入 prompt assembly。
5. 为 webpage generation 与 checker 增加 evidence manifest requirements。
6. 扩展 evaluation metrics 与测试，覆盖 unsupported claims 与 hallucinated commands。
7. 逐步对 fact-sensitive `deepseek run` 默认启用 evidence-first，再扩展到 chat turns 与未来 hosts。

## Open Questions

- How strict should evidence-first be for interactive chat when a user asks quick exploratory questions?
- interactive chat 中用户快速探索时，evidence-first 应该多严格？

- Should evidence manifests be persisted in session store, observability, generated artifacts, or all three depending on task type?
- evidence manifests 应按任务类型持久化到 session store、observability、generated artifacts，还是三者都用？

- Which claim classes should v1 extract deterministically beyond commands, packages, features, install instructions, release state, and evaluation conclusions?
- v1 除了 commands、packages、features、install instructions、release state 与 evaluation conclusions，还应确定性提取哪些 claim classes？
