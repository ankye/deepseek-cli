# package-scorecard-evaluation Specification

## Purpose
TBD - created by archiving change add-package-scorecard-evaluation. Update Purpose after archive.
## Requirements
### Requirement: Package Scorecard Catalog Defines Shared And Role Criteria / Package Scorecard Catalog 定义共享与角色标准
The system SHALL provide a versioned package scorecard catalog that defines shared criteria for all workspace packages and role-specific criteria for selected package roles.

系统必须提供版本化 package scorecard catalog，为所有 workspace packages 定义 shared criteria，并为选定 package roles 定义 role-specific criteria。

#### Scenario: Catalog includes first-version package roles / Catalog 包含第一版包角色
- **WHEN** package scorecard evaluation loads the catalog
- **THEN** the catalog includes shared criteria for every package and role-specific criteria for `platform-contracts`, `model-gateway`, and `runtime`
- **中文** 当 package scorecard evaluation 加载 catalog 时，catalog 必须包含适用于每个包的 shared criteria，并包含 `platform-contracts`、`model-gateway` 与 `runtime` 的 role-specific criteria。

#### Scenario: Catalog is versioned / Catalog 具备版本
- **WHEN** scorecard results are emitted
- **THEN** every package scorecard result includes the scorecard catalog version and rubric identifiers used to compute the result
- **中文** 当输出 scorecard results 时，每个 package scorecard result 必须包含 scorecard catalog version 与用于计算结果的 rubric identifiers。

### Requirement: Criterion Results Preserve Status Score Weight And Evidence / Criterion Results 保留状态分数权重与证据
Each package criterion result SHALL include status, numeric score, weight, required flag, evidence references, diagnostics, and redaction metadata.

每个 package criterion result 必须包含 status、numeric score、weight、required flag、evidence references、diagnostics 与 redaction metadata。

#### Scenario: Criterion result distinguishes missing assessment / Criterion Result 区分未评估
- **WHEN** a criterion cannot be evaluated from available deterministic evidence
- **THEN** the criterion result status is `not_assessed`, the score is absent or excluded from weighted score math, and diagnostics explain the missing evidence
- **中文** 当某个 criterion 无法从可用 deterministic evidence 中评估时，criterion result status 必须为 `not_assessed`，score 必须缺省或不进入 weighted score 计算，并且 diagnostics 必须说明缺失证据。

#### Scenario: Criterion result excludes non-applicable criteria / Criterion Result 排除不适用标准
- **WHEN** a role-specific criterion does not apply to a package
- **THEN** the criterion result status is `not_applicable` and the criterion is excluded from weighted score, pass rate, and assessment coverage denominators
- **中文** 当某个 role-specific criterion 不适用于某个包时，criterion result status 必须为 `not_applicable`，且该 criterion 不进入 weighted score、pass rate 与 assessment coverage 的分母。

### Requirement: Package Scores Use Strict Objective Scoring / 包评分使用严格客观评分
The package scorecard summary SHALL report objective score, strict weighted score, strict pass rate, assessment coverage, rubric coverage, hard gate status, and package readiness separately.

Package scorecard summary 必须分别报告 objective score、strict weighted score、strict pass rate、assessment coverage、rubric coverage、hard gate status 与 package readiness。

#### Scenario: Strict score gives no credit for missing or partial evidence / 严格分数不给缺失或部分证据加分
- **WHEN** applicable criteria include `pass`, `partial`, `fail`, and `not_assessed` statuses
- **THEN** strict weighted score uses `1` for `pass`, `0` for `partial`, `0` for `fail`, `0` for `not_assessed`, and excludes only `not_applicable`
- **中文** 当适用 criteria 包含 `pass`、`partial`、`fail` 与 `not_assessed` 状态时，strict weighted score 必须对 `pass` 使用 `1`，对 `partial` 使用 `0`，对 `fail` 使用 `0`，对 `not_assessed` 使用 `0`，且只排除 `not_applicable`。

#### Scenario: Objective score includes rubric coverage and hard gates / 客观分数包含 Rubric 覆盖与硬门禁
- **WHEN** package scorecard evaluation computes objective score
- **THEN** objective score equals strict weighted score multiplied by rubric coverage, and hard gate failure or hard gate missing evidence forces objective score to `0`
- **中文** 当 package scorecard evaluation 计算 objective score 时，objective score 必须等于 strict weighted score 乘以 rubric coverage，且 hard gate failure 或 hard gate missing evidence 必须将 objective score 强制为 `0`。

#### Scenario: Pass rate is strict / Pass Rate 严格计算
- **WHEN** package scorecard evaluation computes pass rate
- **THEN** pass rate equals passed criterion count divided by all applicable criterion count, including `partial`, `fail`, and `not_assessed`
- **中文** 当 package scorecard evaluation 计算 pass rate 时，pass rate 必须等于 passed criterion count 除以所有 applicable criterion count，包括 `partial`、`fail` 与 `not_assessed`。

#### Scenario: Assessment coverage exposes measurement gaps / Assessment Coverage 暴露度量缺口
- **WHEN** applicable criteria include `not_assessed` results
- **THEN** assessment coverage decreases and objective score gives those missing criteria zero credit
- **中文** 当适用 criteria 包含 `not_assessed` 结果时，assessment coverage 必须下降，且 objective score 必须对这些缺失 criteria 计为零分。

### Requirement: Hard Gates Override Package Readiness / 硬门禁覆盖包就绪状态
Package readiness SHALL fail when any required hard gate fails, regardless of weighted score.

当任一 required hard gate 失败时，无论 weighted score 如何，package readiness 必须失败。

#### Scenario: Boundary violation blocks readiness / 边界违规阻塞就绪
- **WHEN** package scorecard evidence contains a package boundary violation, forbidden implementation import, contract impurity, secret leak, unsafe host API usage, or invalid package manifest for a package
- **THEN** that package scorecard has hard gate status `fail` and readiness `fail`
- **中文** 当 package scorecard evidence 包含某个包的 package boundary violation、forbidden implementation import、contract impurity、secret leak、unsafe host API usage 或 invalid package manifest 时，该 package scorecard 的 hard gate status 必须为 `fail`，readiness 必须为 `fail`。

#### Scenario: Hard gate is reported separately from score / 硬门禁独立于分数报告
- **WHEN** a package has high weighted score but a hard gate failure
- **THEN** diagnostics report both the weighted score and the hard gate failure instead of hiding the failure inside the score
- **中文** 当某个包 weighted score 较高但存在 hard gate failure 时，diagnostics 必须同时报告 weighted score 与 hard gate failure，而不是把失败隐藏在分数中。

### Requirement: Tool Package Scores Require Live Model Tool Coverage / Tool 包评分必须依赖真实模型工具覆盖
The `core-coding-tools` and `tool-intent-preflight` package scorecards SHALL include one live coverage criterion for each model-visible core tool, and missing live coverage evidence SHALL score as zero.

`core-coding-tools` 与 `tool-intent-preflight` 的 package scorecard 必须为每个 model-visible core tool 包含一条 live coverage criterion；缺少 live coverage evidence 时必须计为零分。

#### Scenario: Missing live tool coverage prevents high tool scores / 缺少真实工具覆盖会阻止高分
- **WHEN** no DeepSeek live tool coverage evidence exists for a core tool
- **THEN** the corresponding tool criterion is `not_assessed`, contributes `0`, and prevents the tool package from scoring above the covered evidence.
- **中文** 当某个 core tool 没有 DeepSeek live tool coverage evidence 时，对应工具 criterion 必须为 `not_assessed`，贡献 `0`，并阻止 tool package 超过已覆盖证据对应的分数。

#### Scenario: Live tool coverage proves the full integration path / 真实工具覆盖证明完整集成链路
- **WHEN** live tool coverage evidence marks a tool as covered
- **THEN** the evidence proves a real DeepSeek model emitted the tool call, preflight accepted or repaired the intent, the kernel completed the capability execution, and the tool result was returned to the model without provider error.
- **中文** 当 live tool coverage evidence 标记某个工具已覆盖时，该证据必须证明真实 DeepSeek 模型发起了 tool call，preflight 接受或修复了 intent，kernel 完成了 capability execution，并且 tool result 已回灌给模型且没有 provider error。

#### Scenario: Tool package can reach ninety percent only through coverage / Tool 包只能通过覆盖达到 90%
- **WHEN** at least 18 of 20 live core tool criteria pass and shared package gates pass
- **THEN** `core-coding-tools` and `tool-intent-preflight` can reach an objective score greater than or equal to `0.9`; otherwise missing or failing tool criteria contribute zero.
- **中文** 当 20 个 live core tool criteria 中至少 18 个通过，且 shared package gates 通过时，`core-coding-tools` 与 `tool-intent-preflight` 才能达到大于等于 `0.9` 的 objective score；否则缺失或失败的工具 criterion 均贡献零分。

### Requirement: Every Workspace Package Receives A Scorecard / 每个 Workspace Package 都获得 Scorecard
Package scorecard evaluation SHALL produce a package scorecard summary for every package under `src/packages/*`.

Package scorecard evaluation 必须为 `src/packages/*` 下的每个 package 生成 package scorecard summary。

#### Scenario: All packages are discovered deterministically / 所有包被确定性发现
- **WHEN** package scorecard evaluation runs from the repository root
- **THEN** it discovers workspace packages from package manifests and emits exactly one scorecard summary per discovered package
- **中文** 当 package scorecard evaluation 从 repository root 运行时，它必须从 package manifests 确定性发现 workspace packages，并为每个发现的包输出且仅输出一个 scorecard summary。

#### Scenario: Unknown role falls back to shared rubric / 未知角色回退到共享 Rubric
- **WHEN** a package has no role-specific rubric in the catalog
- **THEN** scorecard evaluation applies the shared package rubric and marks role-specific criteria as `not_applicable`
- **中文** 当某个包在 catalog 中没有 role-specific rubric 时，scorecard evaluation 必须应用 shared package rubric，并将 role-specific criteria 标记为 `not_applicable`。

### Requirement: Platform Aggregate Summarizes Package Readiness / 平台聚合汇总包就绪状态
The system SHALL derive a platform package-readiness aggregate from package scorecard summaries without replacing the underlying per-package evidence.

系统必须从 package scorecard summaries 推导 platform package-readiness aggregate，但不得替代底层 per-package evidence。

#### Scenario: Aggregate includes package counts and rates / 聚合包含包数量与比率
- **WHEN** package scorecard evaluation emits a platform aggregate
- **THEN** the aggregate includes total package count, pass/warn/fail counts, average objective score, average strict weighted score, average pass rate, average assessment coverage, average rubric coverage, and hard gate failure count
- **中文** 当 package scorecard evaluation 输出 platform aggregate 时，aggregate 必须包含 total package count、pass/warn/fail counts、average objective score、average strict weighted score、average pass rate、average assessment coverage、average rubric coverage 与 hard gate failure count。

#### Scenario: Aggregate cites scorecard evidence / 聚合引用 Scorecard 证据
- **WHEN** diagnostics render the platform aggregate
- **THEN** the aggregate links to or embeds the package scorecard records that produced it
- **中文** 当 diagnostics 渲染 platform aggregate 时，aggregate 必须链接或嵌入生成该聚合的 package scorecard records。

