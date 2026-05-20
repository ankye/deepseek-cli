# interactive-plugin-workbench Specification

## Purpose
Define interactive plugin workbench requirements for inspecting plugin contributions, readiness, execution routes, and safe TUI interaction.

定义 interactive plugin workbench 对 plugin contributions、readiness、execution routes 与安全 TUI interaction 的检查要求。

## Requirements
### Requirement: Host-owned plugin executions
The CLI host SHALL execute interactive built-in plugin actions through owner routes and record every execution as a structured plugin workbench execution record.

CLI host 必须通过 owner routes 执行交互式 built-in plugin actions，并将每次执行记录为结构化 plugin workbench execution record。

#### Scenario: Implemented route produces execution record
- **WHEN** an implemented built-in plugin command route is executed from the interactive workbench
- **THEN** the host records command id, route id, plugin id, contribution id, route status, dispatch status, input preview, result summary, diagnostics, duration bucket, and redaction metadata
- **中文** 当 implemented built-in plugin command route 从 interactive workbench 执行时，host 必须记录 command id、route id、plugin id、contribution id、route status、dispatch status、input preview、result summary、diagnostics、duration bucket 与 redaction metadata。

#### Scenario: Deferred route is recorded without private execution
- **WHEN** a deferred built-in plugin command route is requested
- **THEN** the host records the deferred status, fallback command, and diagnostics without invoking plugin-private handler, callback, or execute metadata
- **中文** 当 deferred built-in plugin command route 被请求时，host 必须记录 deferred 状态、fallback command 与 diagnostics，且不得调用 plugin-private handler、callback 或 execute metadata。

### Requirement: Execution records attach result lists
Interactive plugin executions that produce result lists SHALL attach those lists to workbench composition state.

产生 result lists 的交互式插件执行必须把这些列表附加到 workbench composition state。

#### Scenario: Repo files execution attaches files result list
- **WHEN** `repo.navigator.files` executes successfully from the workbench
- **THEN** the resulting file list appears as the active result list and can be inspected by the workbench
- **中文** 当 `repo.navigator.files` 从 workbench 成功执行时，产生的 file list 必须作为 active result list 出现，并可被 workbench inspect。

#### Scenario: Repo grep execution attaches grep result list
- **WHEN** `repo.navigator.grep` executes successfully from the workbench
- **THEN** the resulting grep matches appear as a result list with file targets and reference handoff metadata
- **中文** 当 `repo.navigator.grep` 从 workbench 成功执行时，产生的 grep matches 必须作为带 file targets 与 reference handoff metadata 的 result list 出现。

### Requirement: Workbench exposes recent plugin activity
The interactive workbench SHALL expose recent plugin execution records in activity and plugin surfaces.

Interactive workbench 必须在 activity 与 plugin surfaces 展示最近的 plugin execution records。

#### Scenario: Activity feed shows plugin execution
- **WHEN** a plugin route execution completes, fails, is denied, or is deferred
- **THEN** the activity feed includes a plugin execution activity item with status and target panel metadata
- **中文** 当 plugin route execution 完成、失败、被拒绝或 deferred 时，activity feed 必须包含带 status 与 target panel metadata 的 plugin execution activity item。

#### Scenario: Plugin shelf shows last route status
- **WHEN** a plugin has recent executions
- **THEN** the plugin shelf includes last execution status, dispatch status, and result availability for that plugin
- **中文** 当某插件有最近执行记录时，plugin shelf 必须包含该插件最近 execution status、dispatch status 与 result availability。

### Requirement: Navigation plugin executions attach to workbench
Interactive plugin execution records SHALL support file manager and jump navigator result lists using the same host-owned execution record shape as other built-in plugins.

Interactive plugin execution records 必须支持 file manager 与 jump navigator result lists，并使用与其他 built-in plugins 相同的 host-owned execution record shape。

#### Scenario: File manager preview execution is inspectable
- **WHEN** `file.manager.preview` executes from palette or TUI
- **THEN** the execution record includes file target metadata, result summary, reference targets, and redaction metadata
- **中文** 当 `file.manager.preview` 从 palette 或 TUI 执行时，execution record 必须包含 file target metadata、result summary、reference targets 与 redaction metadata。

#### Scenario: Jump navigator text execution becomes active result list
- **WHEN** `jump.navigator.text` executes successfully
- **THEN** the result list is attached to the workbench and the jump navigator plugin shelf item reports the completed route
- **中文** 当 `jump.navigator.text` 成功执行时，result list 必须附加到 workbench，且 jump navigator plugin shelf item 必须报告 completed route。
