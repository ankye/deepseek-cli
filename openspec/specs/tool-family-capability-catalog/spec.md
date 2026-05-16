# tool-family-capability-catalog Specification

## Purpose
TBD - created by archiving change formalize-tool-family-capability-catalog. Update Purpose after archive.
## Requirements
### Requirement: Canonical Tool Family Catalog / 规范工具家族目录
The system SHALL define a versioned tool family catalog with exactly 16 first-version domains and 64 first-version scoring families.

系统必须定义版本化 tool family catalog，第一版包含且仅包含 16 个 domains 与 64 个 scoring families。

#### Scenario: Catalog exposes stable family ids / Catalog 暴露稳定 Family ID
- **WHEN** diagnostics, runtime, registry, or evaluation code loads the tool family catalog
- **THEN** the catalog includes stable ids for all first-version families, including `patch.apply`, `pipeline.artifact-routing`, `browser.screenshot`, `image.generate`, and `design.batch-edit`
- **中文** 当 diagnostics、runtime、registry 或 evaluation 代码加载 tool family catalog 时，catalog 必须包含所有第一版 family 的稳定 id，包括 `patch.apply`、`pipeline.artifact-routing`、`browser.screenshot`、`image.generate` 与 `design.batch-edit`。

### Requirement: Domains Are Not Scoring Denominators / Domain 不作为评分分母
The system SHALL use domains only for navigation and summary grouping; strict scores SHALL use family-level denominators.

系统必须只把 domains 用于导航与摘要分组；严格评分必须使用 family-level 分母。

#### Scenario: Domain cannot hide missing family / Domain 不能隐藏缺失 Family
- **WHEN** one family in a domain is implemented and another family in the same domain is absent
- **THEN** the absent family remains visible and contributes zero to family-level scoring
- **中文** 当同一 domain 中一个 family 已实现而另一个 family 缺失时，缺失 family 必须保持可见，并在 family-level scoring 中贡献零分。

### Requirement: Family Metadata Is Mandatory / Family 元数据必填
Each catalog family SHALL declare domain id, family id, title, maturity target, risk class, operation profiles, host requirements, connector profile, and scorecard rubric id.

每个 catalog family 必须声明 domain id、family id、title、maturity target、risk class、operation profiles、host requirements、connector profile 与 scorecard rubric id。

#### Scenario: Missing metadata invalidates catalog / 缺失元数据使 Catalog 无效
- **WHEN** a family entry lacks risk class, host requirements, operation profile, or scorecard rubric id
- **THEN** catalog validation fails with a typed diagnostic
- **中文** 当 family entry 缺少 risk class、host requirements、operation profile 或 scorecard rubric id 时，catalog validation 必须以 typed diagnostic 失败。

### Requirement: Family Implementation State Is Explicit / Family 实现状态显式化
Every first-version family SHALL be reported as `implemented`, `planned`, `absent`, `unavailable`, `deprecated`, or `not_applicable` for each host/product edition.

每个第一版 family 必须针对每个 host/product edition 报告为 `implemented`、`planned`、`absent`、`unavailable`、`deprecated` 或 `not_applicable`。

#### Scenario: Missing family is absent not invisible / 缺失 Family 是 Absent 而不是消失
- **WHEN** DeepSeek has no capability, connector, or planned implementation for a catalog family
- **THEN** diagnostics report the family as `absent` and scorecard collection gives it zero credit
- **中文** 当 DeepSeek 对某个 catalog family 没有 capability、connector 或规划实现时，diagnostics 必须报告该 family 为 `absent`，scorecard collection 必须给零分。

### Requirement: Tool Entries Are Concrete Implementations / Tool Entry 必须是真实实现
Catalog family tool entries SHALL represent concrete executable capabilities with capability ids, model-visible projection, and runnable executors; planned, absent, unavailable, or unassessed work SHALL NOT be represented as placeholder tools.

catalog family 的 tool entry 必须代表拥有 capability id、model-visible projection 与可运行 executor 的真实可执行能力；planned、absent、unavailable 或 unassessed 工作不得表示成占位工具。

#### Scenario: Planned family has no placeholder tool / Planned Family 没有占位工具
- **WHEN** `patch.apply` is planned but no executable patch capability exists
- **THEN** the family remains in the 64-family denominator with `implementationState: planned`, an empty tool list, and zero score
- **中文** 当 `patch.apply` 已规划但不存在可执行 patch capability 时，该 family 仍保留在 64-family 分母中，`implementationState` 为 `planned`，tool list 为空，并且得零分。

### Requirement: Shell Pipes And Tool Pipelines Are Distinct / Shell 管道与工具管线必须区分
The catalog SHALL distinguish shell-level pipes inside `shell.run` from governed tool pipelines under `pipeline.sequence`, `pipeline.parallel`, `pipeline.artifact-routing`, and `pipeline.stream`.

catalog 必须区分 `shell.run` 内部的 shell-level pipes 与 `pipeline.sequence`、`pipeline.parallel`、`pipeline.artifact-routing`、`pipeline.stream` 下的受治理工具管线。

#### Scenario: Shell pipe does not satisfy pipeline family / Shell 管道不满足 Pipeline Family
- **WHEN** a command uses `|` inside a shell process
- **THEN** it may count toward `shell.run` evidence but SHALL NOT satisfy any `pipeline.*` family criterion
- **中文** 当命令在 shell process 内使用 `|` 时，它可以计入 `shell.run` evidence，但不得满足任何 `pipeline.*` family criterion。

