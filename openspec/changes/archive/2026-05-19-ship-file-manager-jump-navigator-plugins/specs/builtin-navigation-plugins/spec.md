## ADDED Requirements

### Requirement: File manager built-in plugin
The built-in plugin pack SHALL include a read-only file manager plugin that contributes file list, file preview, and file reference workflows through declarative plugin metadata.

Built-in plugin pack 必须包含一个只读 file manager plugin，通过声明式 plugin metadata 贡献 file list、file preview 与 file reference workflows。

#### Scenario: File manager commands produce file targets
- **WHEN** `file.manager.list`, `file.manager.preview`, or `file.manager.references` executes through an owner route
- **THEN** the result includes typed file targets, result-list metadata when applicable, reference targets, diagnostics, and redaction metadata without plugin-private handlers
- **中文** 当 `file.manager.list`、`file.manager.preview` 或 `file.manager.references` 通过 owner route 执行时，结果必须包含 typed file targets、适用时的 result-list metadata、reference targets、diagnostics 与 redaction metadata，且不得使用 plugin-private handlers。

### Requirement: Jump navigator built-in plugin
The built-in plugin pack SHALL include a jump navigator plugin that contributes quick file and text jumps and exposes symbol jump as a deferred code-intelligence route.

Built-in plugin pack 必须包含 jump navigator plugin，贡献快速 file/text jumps，并将 symbol jump 暴露为 deferred code-intelligence route。

#### Scenario: Jump navigator routes are explicit
- **WHEN** jump navigator command routes are inspected
- **THEN** file and text routes are dispatchable, symbol routes are marked deferred, and all routes carry fallback guidance
- **中文** 当 jump navigator command routes 被检查时，file 与 text routes 必须可 dispatch，symbol routes 必须标记为 deferred，并且所有 routes 都携带 fallback guidance。

### Requirement: Navigation plugins stay native in the workbench
File manager and jump navigator plugin executions SHALL appear in palette, TUI workbench, plugin shelf, activity feed, and extension inspection surfaces like other built-in plugins.

File manager 与 jump navigator plugin executions 必须像其他 built-in plugins 一样出现在 palette、TUI workbench、plugin shelf、activity feed 与 extension inspection surfaces。

#### Scenario: Navigation plugin execution attaches active results
- **WHEN** an implemented navigation plugin route returns a result list
- **THEN** the interactive plugin workbench attaches it as the active result list and projects the plugin's last execution status
- **中文** 当 implemented navigation plugin route 返回 result list 时，interactive plugin workbench 必须将其作为 active result list 附加，并投影该插件最近 execution status。
