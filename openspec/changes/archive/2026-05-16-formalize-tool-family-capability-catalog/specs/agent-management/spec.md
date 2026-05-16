## ADDED Requirements

### Requirement: Agent Scopes Include Tool Families / Agent Scope 包含工具家族
Agent definitions and active agent scopes SHALL allow and deny capabilities by tool family, domain, risk class, connector trust, host requirement, and individual capability id.

agent definitions 与 active agent scopes 必须支持按 tool family、domain、risk class、connector trust、host requirement 与单个 capability id 允许或拒绝 capabilities。

#### Scenario: Verifier scope allows tests but denies mutation / Verifier Scope 允许测试但拒绝修改
- **WHEN** verifier mode is active
- **THEN** it may allow `build.test-lint-typecheck` and `git.status-diff` while denying `file.write`, `file.edit`, and `patch.apply` unless explicitly elevated
- **中文** 当 verifier mode 激活时，它可以允许 `build.test-lint-typecheck` 与 `git.status-diff`，同时拒绝 `file.write`、`file.edit` 与 `patch.apply`，除非显式提权。

### Requirement: Delegation Work Orders Declare Family Scope / 委派工作单声明 Family Scope
Delegated work orders SHALL declare allowed and denied tool families in addition to specific files, targets, and done criteria.

delegated work orders 除 specific files、targets 与 done criteria 外，必须声明允许和拒绝的 tool families。

#### Scenario: Browser worker receives browser family scope / Browser Worker 获得 Browser Family Scope
- **WHEN** a coordinator delegates browser verification
- **THEN** the worker work order includes the required `browser.*` families and denies unrelated mutation families unless explicitly needed
- **中文** 当 coordinator 委派 browser verification 时，worker work order 必须包含所需 `browser.*` families，并拒绝无关 mutation families，除非明确需要。
