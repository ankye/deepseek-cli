## ADDED Requirements

### Requirement: Navigation plugin owner route coverage
Built-in plugin owner route readiness SHALL cover file manager and jump navigator command ids.

Built-in plugin owner route readiness 必须覆盖 file manager 与 jump navigator command ids。

#### Scenario: Navigation route coverage is complete
- **WHEN** built-in owner routes are listed
- **THEN** `file.manager.list`, `file.manager.preview`, `file.manager.references`, `jump.navigator.file`, `jump.navigator.text`, and `jump.navigator.symbol` are reported with deterministic status and owner subsystem metadata
- **中文** 当 built-in owner routes 被列出时，`file.manager.list`、`file.manager.preview`、`file.manager.references`、`jump.navigator.file`、`jump.navigator.text` 与 `jump.navigator.symbol` 必须以确定性 status 与 owner subsystem metadata 报告。

#### Scenario: Deferred symbol jump is non-executable
- **WHEN** `jump.navigator.symbol` is dispatched before code intelligence execution is wired
- **THEN** dispatch returns deferred diagnostics and does not execute plugin-private code
- **中文** 当 `jump.navigator.symbol` 在 code intelligence execution 接入前被 dispatch 时，dispatch 必须返回 deferred diagnostics，且不执行 plugin-private code。
