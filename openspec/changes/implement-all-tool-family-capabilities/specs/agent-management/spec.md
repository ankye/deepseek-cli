## ADDED Requirements

### Requirement: Agent Scopes Cover All Implemented Families / Agent Scope 覆盖全部已实现 Families
Agent scopes and delegated work orders SHALL allow and deny every implemented family by family id, domain id, risk class, host requirement, connector trust, and individual capability id.

agent scopes 与 delegated work orders 必须支持按 family id、domain id、risk class、host requirement、connector trust 与单个 capability id 允许或拒绝每个已实现 family。

#### Scenario: Verifier denies mutation and media / Verifier 拒绝修改与媒体
- **WHEN** verifier mode is active
- **THEN** mutation, image edit, design batch edit, package manager write, and worktree write families are denied unless explicitly elevated
- **中文** 当 verifier mode 激活时，mutation、image edit、design batch edit、package manager write 与 worktree write families 必须被拒绝，除非显式提权。

### Requirement: Worker Orders Declare Required Families / Worker 任务单声明所需 Families
Delegated worker orders SHALL list required families, optional families, denied families, and evidence expectations for the assigned task.

delegated worker orders 必须列出 assigned task 所需 families、可选 families、拒绝 families 与 evidence expectations。

#### Scenario: Browser worker receives browser-only scope / Browser Worker 获得 Browser-Only Scope
- **WHEN** a coordinator delegates browser verification
- **THEN** the worker order allows `browser.navigate`, `browser.interact`, `browser.inspect`, and `browser.screenshot` while denying unrelated write families
- **中文** 当 coordinator 委派 browser verification 时，worker order 必须允许 `browser.navigate`、`browser.interact`、`browser.inspect` 与 `browser.screenshot`，同时拒绝无关 write families。
