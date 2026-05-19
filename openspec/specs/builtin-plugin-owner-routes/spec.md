# builtin-plugin-owner-routes Specification

## Purpose
TBD - created by archiving change wire-builtin-plugin-owner-routes. Update Purpose after archive.
## Requirements
### Requirement: Built-in plugin commands have owner routes
Every built-in plugin command contribution SHALL map to a deterministic host-owned owner route descriptor.

每个 built-in plugin command contribution 都必须映射到确定性的 host-owned owner route descriptor。

#### Scenario: Command route coverage is complete
- **WHEN** the built-in plugin pack is validated
- **THEN** every command contribution commandId is reported as `implemented`, `deferred`, or `unsupported` with plugin id, contribution id, owner subsystem, command id, permissions, and side effects
- **中文** 当 built-in plugin pack 被校验时，每个 command contribution commandId 都必须报告为 `implemented`、`deferred` 或 `unsupported`，并包含 plugin id、contribution id、owner subsystem、command id、permissions 与 side effects。

### Requirement: Implemented routes dispatch through owners
Implemented built-in plugin command routes SHALL dispatch through CLI host adapters and owner subsystems, not plugin-private handlers.

已实现 built-in plugin command routes 必须通过 CLI host adapters 与 owner subsystems 调度，不得通过 plugin-private handlers。

#### Scenario: Repo navigator routes execute existing adapters
- **WHEN** `repo.navigator.files` or `repo.navigator.grep` is dispatched through the owner route registry
- **THEN** the route returns the same typed repo navigator result produced by the existing repo adapter
- **中文** 当 `repo.navigator.files` 或 `repo.navigator.grep` 通过 owner route registry 调度时，route 必须返回现有 repo adapter 产生的同一类 typed repo navigator result。

#### Scenario: Process routes stay governed
- **WHEN** a dev-check route is dispatched
- **THEN** execution uses the fixed predeclared dev-check descriptor and rejects extra shell arguments
- **中文** 当 dev-check route 被调度时，执行必须使用固定预声明 dev-check descriptor，并拒绝额外 shell arguments。

### Requirement: Deferred routes are visible
Deferred built-in plugin owner routes SHALL be visible to diagnostics and TUI/plugin inspection surfaces.

Deferred built-in plugin owner routes 必须对 diagnostics 与 TUI/plugin inspection surfaces 可见。

#### Scenario: Deferred route is explicit
- **WHEN** `repo.navigator.recall` or `repo.navigator.project-index` is inspected
- **THEN** diagnostics report that the route is recognized but deferred and no plugin-private handler is executed
- **中文** 当 `repo.navigator.recall` 或 `repo.navigator.project-index` 被检查时，diagnostics 必须报告该 route 已识别但 deferred，并且不会执行 plugin-private handler。

### Requirement: TUI plugin actions use route readiness
TUI plugin shelves, keymaps, and palette entries SHALL include owner route readiness for built-in plugin command contributions.

TUI plugin shelves、keymaps 与 palette entries 必须包含 built-in plugin command contributions 的 owner route readiness。

#### Scenario: Contribution projection includes readiness
- **WHEN** built-in plugin TUI contributions are projected
- **THEN** command contribution metadata includes commandId, owner route status, route label, and whether dispatch is available
- **中文** 当 built-in plugin TUI contributions 被投影时，command contribution metadata 必须包含 commandId、owner route status、route label 与 dispatch 是否可用。

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
