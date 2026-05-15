## ADDED Requirements

### Requirement: Tool Family Catalog Regression / 工具家族目录回归
The regression suite SHALL include stable fixtures for the 16-domain/64-family catalog and fail when family ids, domains, risk classes, or rubric ids change without intentional fixture updates.

regression suite 必须包含 16-domain/64-family catalog 的稳定 fixtures；当 family ids、domains、risk classes 或 rubric ids 未经有意更新而变化时必须失败。

#### Scenario: Catalog snapshot detects removed family / Catalog Snapshot 检测被移除 Family
- **WHEN** a first-version family such as `patch.apply` is removed from the catalog
- **THEN** regression tests fail unless the change includes an explicit migration
- **中文** 当 `patch.apply` 等第一版 family 被移出 catalog 时，regression tests 必须失败，除非该变更包含显式 migration。

### Requirement: Family Projection Regression / Family 投影回归
Regression tests SHALL cover projection filtering by family, risk, agent scope, host requirements, connector trust, and provider support.

regression tests 必须覆盖按 family、risk、agent scope、host requirements、connector trust 与 provider support 的投影过滤。

#### Scenario: Denied domain excluded from projection / 被拒绝 Domain 从投影排除
- **WHEN** an agent scope denies the browser domain
- **THEN** projection fixtures show all `browser.*` families excluded from model-visible tools
- **中文** 当 agent scope 拒绝 browser domain 时，projection fixtures 必须显示所有 `browser.*` families 从 model-visible tools 中排除。

### Requirement: Pipeline Regression / 管线回归
Regression tests SHALL verify that runtime pipelines record sequence, parallel, artifact routing, stream bounds, policy decisions, and direct executor-call denial.

regression tests 必须验证 runtime pipelines 记录 sequence、parallel、artifact routing、stream bounds、policy decisions，并拒绝 direct executor-call。

#### Scenario: Executor-to-executor call is caught / Executor 互调被捕获
- **WHEN** a fixture attempts private executor-to-executor chaining
- **THEN** lint or runtime validation returns a stable failure
- **中文** 当 fixture 尝试 executor-to-executor 私下衔接时，lint 或 runtime validation 必须返回稳定失败。

### Requirement: Live Family Coverage Fixtures / Live Family Coverage Fixtures
Acceptance evidence SHALL include live or replayed fixtures that exercise representative tasks for implemented families and mark missing families as unassessed or absent with zero credit.

acceptance evidence 必须包含 live 或 replayed fixtures，覆盖已实现 families 的代表性任务，并将缺失 families 标记为 unassessed 或 absent 且零分。

#### Scenario: Missing design fixtures reduce score / 缺少 Design Fixtures 降低分数
- **WHEN** no live or replayed design family fixture exists
- **THEN** design family criteria do not pass and reduce objective score
- **中文** 当不存在 live 或 replayed design family fixture 时，design family criteria 不得通过，并必须降低 objective score。
