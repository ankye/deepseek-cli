## Why

Recent webpage generation exposed a deeper product flaw: when the user asks for a DeepSeek CLI product page from inside this repository, the agent may still invent installation commands or positioning instead of first reading project evidence. Evidence-first behavior must become a default agent workflow for repository and product tasks, not a special webpage-generation rule or a burden on users to write longer prompts.

最近的网页生成暴露了更深的产品缺陷：用户已经在当前仓库内要求生成 DeepSeek CLI 产品页，agent 仍可能虚构安装命令或产品定位，而不是先读取项目证据。Evidence-first 行为必须成为 repository 与 product tasks 的默认 agent 工作流，而不是网页生成的特殊规则，也不能要求用户把 prompt 写得更长。

## What Changes

- Add a first-class `evidence-first-agent-workflow` capability that requires project/product/code facts to be grounded in explicit evidence before answers, edits, generated artifacts, command recommendations, or evaluation conclusions are produced.
- Teach the agent loop to classify task intent and automatically enter an evidence discovery phase when the task references the current project, repository facts, product claims, package commands, architecture, roadmap, generated website copy, or competitive/evaluation conclusions.
- Add evidence plans and evidence manifests so the runtime can record what was inspected, which facts were derived, which claims remain assumptions, and which outputs depend on which evidence.
- Require generated product artifacts, including but not limited to webpages, to carry local evidence manifests and avoid unsupported claims such as nonexistent package names, commands, features, guarantees, or launch states.
- Extend context and prompt assembly integration so project evidence is provided as bounded runtime-owned context while preserving the user prompt exactly.
- Extend CLI evaluation and regression tests to score evidence grounding, unsupported-claim detection, and hallucinated command/product-copy failures.
- Keep privacy and redaction boundaries: evidence manifests must use bounded previews, stable fingerprints, and source references without persisting secrets or unbounded private content.

- 新增一等能力 `evidence-first-agent-workflow`，要求涉及项目、产品、代码事实的回答、编辑、生成产物、命令建议或评估结论必须先基于显式证据。
- 让 agent loop 分类任务意图：当任务引用当前项目、仓库事实、产品声明、package commands、架构、路线图、生成网站文案或竞争/评估结论时，自动进入 evidence discovery phase。
- 增加 evidence plans 与 evidence manifests，使 runtime 可以记录检查了什么、推导出哪些事实、哪些声明仍是假设、输出依赖哪些证据。
- 要求生成的产品产物（包括但不限于网页）携带本地 evidence manifest，并避免不存在的 package names、commands、features、guarantees 或 launch states 等未支持声明。
- 扩展 context 与 prompt assembly 集成，把项目证据作为有界 runtime-owned context 提供，同时保持用户 prompt 精确不变。
- 扩展 CLI evaluation 与 regression tests，评分 evidence grounding、unsupported-claim detection 和 hallucinated command/product-copy failures。
- 保持隐私和脱敏边界：evidence manifests 必须使用有界 previews、稳定 fingerprints 与 source references，不持久化 secrets 或无界私有内容。

## Capabilities

### New Capabilities
- `evidence-first-agent-workflow`: Default task-intent classification, evidence discovery, evidence manifests, claim grounding, unsupported-claim handling, and evidence-first output rules for repository/product/code tasks.

### Modified Capabilities
- `agent-loop`: Runtime turns must support an evidence discovery phase before fact-sensitive output or mutation.
- `context-engine`: Context projection must expose evidence candidates and provenance suitable for claim grounding and replay.
- `cli-task-completion-evaluation`: Evaluation must measure evidence grounding quality and unsupported claims across generated artifacts and reports.
- `observability-privacy`: Observability must record evidence-first plans, manifests, claim grounding summaries, and redacted provenance safely.
- `testing-regression`: Regression suites must cover evidence-first behavior and prevent unsupported project/product claims from passing.

## Impact

- Affected runtime: `src/packages/runtime`, especially task-intent classification, pre-model evidence discovery, event emission, and model request context.
- Affected contracts: `src/packages/platform-contracts` for evidence plan, evidence item, claim grounding, evidence manifest, unsupported claim, and runtime summary DTOs.
- Affected context: `src/packages/context-engine`, code intelligence, PageIndex, file references, and prompt assembly integration as evidence sources.
- Affected evaluation: `src/apps/cli/src/diagnostics/evaluation.ts`, `src/apps/cli/src/diagnostics/webpage-task.ts`, `scripts/check-webpage-generation.mjs`, and task catalog scoring rubrics.
- Affected generated artifacts: product webpages, docs, reports, release notes, competitive comparisons, and future generators that make project/product claims.
- Affected tests: contract, integration, golden, CLI evaluation, webpage checker, and versioning tests for evidence manifests and unsupported-claim rejection.
