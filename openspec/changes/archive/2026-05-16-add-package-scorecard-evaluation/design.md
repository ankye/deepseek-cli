## Context

The repository already treats DeepSeek CLI as a contract-first TypeScript monorepo with host adapters under `src/apps/*` and shared platform packages under `src/packages/*`. Existing release and evaluation checks can say whether the repository passes broad gates, but they do not expose a package-by-package maturity view.

当前仓库已经把 DeepSeek CLI 作为 contract-first TypeScript monorepo 管理：host adapters 位于 `src/apps/*`，共享平台包位于 `src/packages/*`。现有 release 与 evaluation checks 可以判断仓库是否通过大范围门禁，但还不能提供逐包成熟度视图。

The current evaluation system has task catalogs, baseline aggregates, diagnostics output, and product operating metrics. It should be extended rather than replaced. Package scorecards should reuse existing evidence sources: package manifests, architecture lint, typecheck/lint/test outcomes, boundary checks, static file scans, and selected role-specific tests.

现有 evaluation system 已经具备 task catalogs、baseline aggregates、diagnostics output 与 product operating metrics。本设计应扩展它，而不是替代它。Package scorecards 应复用现有证据来源：package manifests、architecture lint、typecheck/lint/test outcomes、boundary checks、static file scans 与选定的 role-specific tests。

## Goals / Non-Goals

**Goals:**

- Define additive package scorecard contracts in `@deepseek/platform-contracts`.
- Score every workspace package with shared criteria in v1.
- Add role-specific sample rubrics for `platform-contracts`, `model-gateway`, and `runtime`.
- Output criterion-level results, package summaries, and platform aggregates through diagnostics.
- Keep hard gates separate from weighted scores.
- Represent unimplemented or unavailable checks honestly as `not_assessed` or `not_applicable`.

- 在 `@deepseek/platform-contracts` 中定义 additive package scorecard contracts。
- v1 用 shared criteria 覆盖每个 workspace package。
- 为 `platform-contracts`、`model-gateway` 与 `runtime` 增加 role-specific 样板 rubrics。
- 通过 diagnostics 输出 criterion-level results、package summaries 与 platform aggregates。
- 将 hard gates 与 weighted scores 分开。
- 对尚未实现或不可用的检查明确输出 `not_assessed` 或 `not_applicable`。

**Non-Goals:**

- Do not replace existing task-completion outcomes or baseline comparison metrics.
- Do not make package scorecards a release publish blocker in v1.
- Do not require perfect test coverage or automated proof for every role-specific criterion in the first version.
- Do not execute external baselines or live providers as part of package scorecard collection.

- 不替代现有 task-completion outcomes 或 baseline comparison metrics。
- v1 不把 package scorecards 作为 release publish blocker。
- 第一版不要求每个 role-specific criterion 都具备完美测试覆盖或自动证明。
- package scorecard collection 不执行 external baselines 或 live providers。

## Decisions

### Decision: Scorecards are additive evaluation evidence

Package scorecards will be additive fields in evaluation diagnostics and JSONL records. Existing consumers of `diagnostics evaluate` remain compatible, while new consumers can inspect `packageScorecards` and `packageAggregate`.

Package scorecards 将作为 evaluation diagnostics 与 JSONL records 的 additive fields。现有 `diagnostics evaluate` 消费方保持兼容，新消费方可以读取 `packageScorecards` 与 `packageAggregate`。

Alternative considered: create a separate `diagnostics packages` command first. That would keep the surface isolated, but it would split package readiness from existing evaluation evidence and delay integration with baseline/product metrics.

备选方案：先新增独立的 `diagnostics packages` 命令。它能隔离命令面，但会把 package readiness 与现有 evaluation evidence 分开，也会延迟与 baseline/product metrics 的集成。

### Decision: Criteria produce status, score, weight, and evidence

Each criterion result will include `status`, `score`, `weight`, `required`, `evidence`, diagnostics, and redaction metadata. Status values are `pass`, `partial`, `fail`, `not_assessed`, and `not_applicable`.

每个 criterion result 包含 `status`、`score`、`weight`、`required`、`evidence`、diagnostics 与 redaction metadata。状态值为 `pass`、`partial`、`fail`、`not_assessed` 与 `not_applicable`。

Strict scoring rules:

- `pass` contributes `1`.
- `partial` contributes `0`.
- `fail` contributes `0`.
- `not_assessed` contributes `0`.
- `not_applicable` is excluded because the criterion is outside the package role.
- `objectiveScore` multiplies strict weighted score by rubric coverage; hard-gate failure or missing hard-gate evidence forces objective score to `0`.

评分规则：

- `pass` 贡献 `1`。
- `partial` 贡献 `0`。
- `fail` 贡献 `0`。
- `not_assessed` 贡献 `0`。
- `not_applicable` 被排除，因为该 criterion 不属于该 package role。
- `objectiveScore` 等于 strict weighted score 乘以 rubric coverage；hard-gate failure 或 missing hard-gate evidence 会强制 objective score 为 `0`。

Alternative considered: partial credit for `partial` and excluding `not_assessed` from weighted score. Rejected because it makes the headline score look high while missing evidence or undefined standards still represent real capability gaps.

备选方案：给 `partial` 部分分，并把 `not_assessed` 排除在 weighted score 外。拒绝原因是这会让 headline score 看起来偏高，而 missing evidence 或 undefined standards 仍然是真实能力缺口。

### Decision: Hard gates override readiness, not score math

Hard gates include architecture boundary violations, forbidden package imports, contract impurity, secret leakage, unsafe host API usage, and invalid package manifests. A hard-gate failure sets package readiness to `fail` even if weighted score is high.

Hard gates 包括 architecture boundary violations、forbidden package imports、contract impurity、secret leakage、unsafe host API usage 与 invalid package manifests。只要 hard-gate failure 存在，即使 weighted score 很高，package readiness 也为 `fail`。

Alternative considered: make hard gates high-weight criteria. That makes a security or architecture breach appear as a numerical trade-off, which is unsafe for this framework.

备选方案：把 hard gates 做成高权重 criteria。这会把安全或架构破坏变成数字权衡，不适合该框架。

### Decision: v1 uses shared criteria for all packages and role samples for core packages

The first implementation should score all workspace packages with shared criteria and add role-specific rubrics for three packages:

- `platform-contracts`: purity, host-agnostic DTOs, and implementation-free exports.
- `model-gateway`: provider normalization, tool-call protocol handling, and no runtime execution ownership.
- `runtime`: agent/tool loop closure, policy/preflight integration, and replayable runtime events.

第一版应使用 shared criteria 覆盖所有 workspace packages，并为三个核心包增加 role-specific rubrics：

- `platform-contracts`：purity、host-agnostic DTOs 与 implementation-free exports。
- `model-gateway`：provider normalization、tool-call protocol handling 与不拥有 runtime execution。
- `runtime`：agent/tool loop closure、policy/preflight integration 与 replayable runtime events。

Alternative considered: define every role-specific rubric for every package now. That would produce an impressive catalog, but many entries would be speculative and unassessed.

备选方案：现在就为每个包定义完整 role-specific rubric。这样目录看起来完整，但大量条目会变成推测性且未评估。

### Decision: tool package scores require live model/tool coverage

`core-coding-tools` and `tool-intent-preflight` cannot receive a high objective score from static package shape alone. Their role rubric includes one live criterion per model-visible core tool. A tool criterion passes only when acceptance evidence proves this chain:

1. DeepSeek live model emitted the tool call.
2. Tool intent preflight accepted or repaired the model intent.
3. Runtime kernel completed the capability execution.
4. Tool result feedback was sent back to the model without provider error.

Missing live evidence is `not_assessed` and scores `0`. A failed live tool path is `fail` and scores `0`. With 20 live tool criteria weighted alongside shared package gates, 18/20 live tools plus passing shared gates produces an objective score above `0.9`.

`core-coding-tools` 与 `tool-intent-preflight` 不能仅凭静态 package shape 获得高客观分。它们的 role rubric 为每个 model-visible core tool 包含一条 live criterion。只有 acceptance evidence 证明以下链路时，该工具 criterion 才能通过：

1. DeepSeek 真实模型发起 tool call。
2. Tool intent preflight 接受或修复模型 intent。
3. Runtime kernel 完成 capability execution。
4. Tool result feedback 回灌给模型且没有 provider error。

缺失 live evidence 时为 `not_assessed`，得 `0`。live tool path 失败时为 `fail`，得 `0`。20 条 live tool criteria 与 shared package gates 一起加权后，18/20 个 live tools 通过且 shared gates 通过时，objective score 可以超过 `0.9`。

### Decision: Package aggregate separates quality, strict pass rate, and coverage

Each package summary will report:

- `objectiveScore`: headline strict score after missing evidence, rubric coverage, and hard gates are applied.
- `weightedScore`: strict score across applicable criteria, where only `pass` receives credit.
- `passRate`: strict pass count divided by all applicable criteria.
- `assessmentCoverage`: assessed applicable criteria divided by applicable criteria.
- `rubricCoverage`: applicable criteria divided by all catalog criteria considered for scorecard v1.
- `readiness`: `pass`, `warn`, or `fail`.

每个 package summary 输出：

- `objectiveScore`：headline strict score，已经计入 missing evidence、rubric coverage 与 hard gates。
- `weightedScore`：适用 criteria 上的 strict score，只有 `pass` 得分。
- `passRate`：严格 pass 数除以所有 applicable criteria。
- `assessmentCoverage`：已评估适用 criteria 除以所有适用 criteria。
- `rubricCoverage`：适用 criteria 除以 scorecard v1 catalog 中参与评分的所有 criteria。
- `readiness`：`pass`、`warn` 或 `fail`。

Alternative considered: expose only one score. A single score is easier to chart, but it cannot distinguish a weak package from an unmeasured package.

备选方案：只暴露一个分数。单分数更容易画图，但无法区分“弱包”和“未测包”。

## Risks / Trade-offs

- [Risk] Scorecards may become vanity metrics. -> Mitigation: every criterion result MUST cite evidence or explicitly say `not_assessed`.
- [Risk] Package-specific rubrics may drift from architecture rules. -> Mitigation: shared criteria reuse lint-framework and package manifest policy where possible.
- [Risk] First version may look incomplete because many role criteria are not automated. -> Mitigation: publish assessment coverage and limit v1 role-specific rubrics to core packages.
- [Risk] Release diagnostics could start blocking publish unexpectedly. -> Mitigation: package scorecards are advisory in v1 and do not change publish readiness status.

- [风险] Scorecards 可能变成好看的虚荣指标。-> 缓解：每个 criterion result 必须引用 evidence，或明确标记为 `not_assessed`。
- [风险] Package-specific rubrics 可能与 architecture rules 漂移。-> 缓解：shared criteria 尽量复用 lint-framework 与 package manifest policy。
- [风险] 第一版因为很多 role criteria 尚未自动化而显得不完整。-> 缓解：公开 assessment coverage，并把 v1 role-specific rubrics 限制在核心包。
- [风险] Release diagnostics 可能意外阻塞 publish。-> 缓解：v1 package scorecards 仅作为 advisory，不改变 publish readiness status。

## Migration Plan

1. Add package scorecard contract types and exports.
2. Add a rubric catalog fixture with shared criteria and the three core role rubrics.
3. Implement deterministic package discovery and criterion evaluation from local repository evidence.
4. Add evaluation summary fields and JSONL records.
5. Render concise text output with package readiness and platform aggregate.
6. Add tests for scoring math, hard gates, `not_assessed`, JSON output, and release advisory behavior.

1. 新增 package scorecard contract types 与 exports。
2. 新增 rubric catalog fixture，包含 shared criteria 与三个核心 role rubrics。
3. 基于本地仓库证据实现 deterministic package discovery 与 criterion evaluation。
4. 新增 evaluation summary fields 与 JSONL records。
5. 渲染简洁 text output，包含 package readiness 与 platform aggregate。
6. 增加 scoring math、hard gates、`not_assessed`、JSON output 与 release advisory behavior 测试。

Rollback is additive: remove the new diagnostics fields and scorecard collector while leaving existing evaluation behavior untouched.

回滚路径是 additive 的：移除新增 diagnostics fields 与 scorecard collector，同时保持现有 evaluation 行为不变。

## Open Questions

- Should v1 expose a dedicated CLI flag such as `diagnostics evaluate --package-scorecards`, or should package scorecards appear automatically in full mode?
- Should package scorecard evidence be written under `tests/acceptance/latest/` during `diagnostics refresh`, or only emitted in diagnostics output for v1?
- What default readiness thresholds should v1 use: `weightedScore >= 0.8` and `assessmentCoverage >= 0.7`, or stricter thresholds for core packages?

- v1 是否应暴露专用 CLI flag，例如 `diagnostics evaluate --package-scorecards`，还是在 full mode 中自动出现？
- package scorecard evidence 在 v1 是否应由 `diagnostics refresh` 写入 `tests/acceptance/latest/`，还是只在 diagnostics output 中输出？
- v1 默认 readiness thresholds 应使用 `weightedScore >= 0.8` 与 `assessmentCoverage >= 0.7`，还是对核心包使用更严格阈值？
