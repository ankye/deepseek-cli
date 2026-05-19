## ADDED Requirements

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
