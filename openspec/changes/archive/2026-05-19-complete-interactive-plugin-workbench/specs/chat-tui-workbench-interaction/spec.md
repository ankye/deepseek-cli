## ADDED Requirements

### Requirement: Workbench state carries plugin execution records
Chat TUI workbench state SHALL carry a bounded list of recent plugin execution records.

Chat TUI workbench state 必须携带有界 recent plugin execution records 列表。

#### Scenario: Recent executions are bounded
- **WHEN** multiple plugin executions are attached to TUI state
- **THEN** only the most recent bounded set is retained and rendered, preserving deterministic order
- **中文** 当多个 plugin executions 附加到 TUI state 时，只保留并渲染最近的有界集合，并保持确定性顺序。

### Requirement: Workbench result lists update from plugin executions
Chat TUI workbench composition SHALL include result lists produced by plugin executions.

Chat TUI workbench composition 必须包含 plugin executions 产生的 result lists。

#### Scenario: Plugin result list becomes active
- **WHEN** a plugin execution record contains a result list
- **THEN** that list is placed before stale lists and its active item becomes the workbench active target when available
- **中文** 当 plugin execution record 包含 result list 时，该列表必须置于旧列表之前，并在可用时将 active item 设为 workbench active target。

### Requirement: Workbench activity reflects plugin execution
Chat TUI workbench activity feed SHALL include recent plugin execution status alongside turns, diagnostics, reasoning, focus, command bar, and plugin readiness activity.

Chat TUI workbench activity feed 必须在 turns、diagnostics、reasoning、focus、command bar 与 plugin readiness activity 旁边展示最近 plugin execution status。

#### Scenario: Failed or denied plugin execution is visible
- **WHEN** a plugin execution fails, is denied, or is deferred
- **THEN** the activity feed reports a warning or blocked status and the inspector can surface diagnostics
- **中文** 当 plugin execution 失败、被拒绝或 deferred 时，activity feed 必须报告 warning 或 blocked status，并且 inspector 可以展示 diagnostics。
