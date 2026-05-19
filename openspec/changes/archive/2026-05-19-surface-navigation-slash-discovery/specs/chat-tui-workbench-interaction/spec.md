## ADDED Requirements

### Requirement: Navigation slash commands are searchable in the TUI command bar
The chat TUI command bar SHALL expose file manager and jump navigator slash commands as built-in searchable suggestions.

Chat TUI command bar 必须将 file manager 与 jump navigator slash commands 暴露为 built-in searchable suggestions。

#### Scenario: File command search returns file workflows
- **WHEN** the command bar query contains `file`
- **THEN** suggestions include file manager slash workflows such as `/file list` and `/file preview`
- **中文** 当 command bar query 包含 `file` 时，suggestions 必须包含 `/file list` 与 `/file preview` 等 file manager slash workflows。

#### Scenario: Jump command search returns jump workflows
- **WHEN** the command bar query contains `jump`
- **THEN** suggestions include jump navigator slash workflows such as `/jump file`, `/jump text`, and `/jump symbol`
- **中文** 当 command bar query 包含 `jump` 时，suggestions 必须包含 `/jump file`、`/jump text` 与 `/jump symbol` 等 jump navigator slash workflows。

#### Scenario: Startup command bar remains bounded
- **WHEN** the command bar opens with an empty query
- **THEN** the default suggestions remain bounded and still include existing core guidance for help, context, history, and reasoning
- **中文** 当 command bar 以空 query 打开时，默认 suggestions 必须保持有界，并继续包含 help、context、history 与 reasoning 等既有 core guidance。
