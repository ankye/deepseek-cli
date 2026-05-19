## ADDED Requirements

### Requirement: Navigation slash results project into TUI result lists
The chat TUI SHALL project local `/file` and `/jump` result lists into the active composition so vi-style result navigation and reference actions can continue from those results.

Chat TUI 必须将本地 `/file` 与 `/jump` result lists 投影到 active composition，使 vi-style result navigation 与 reference actions 可以继续作用于这些结果。

#### Scenario: File slash result enters result-list mode
- **WHEN** `/file list <query>`, `/file preview <path|query>`, or `/file refs <query>` returns a result list
- **THEN** the chat TUI enters result-list mode with that list active and available to navigation/reference actions
- **中文** 当 `/file list <query>`、`/file preview <path|query>` 或 `/file refs <query>` 返回 result list 时，chat TUI 必须进入 result-list mode，并将该 list 设为 active 且可被 navigation/reference actions 使用。

#### Scenario: Jump slash result enters result-list mode
- **WHEN** `/jump file <query>` or `/jump text <query>` returns a result list
- **THEN** the chat TUI enters result-list mode with the returned jump result active
- **中文** 当 `/jump file <query>` 或 `/jump text <query>` 返回 result list 时，chat TUI 必须进入 result-list mode，并激活返回的 jump result。

#### Scenario: Deferred jump remains inspectable
- **WHEN** `/jump symbol <query>` returns a deferred diagnostic result list
- **THEN** the chat TUI keeps the deferred diagnostic visible as the active result without claiming semantic symbol navigation completed
- **中文** 当 `/jump symbol <query>` 返回 deferred diagnostic result list 时，chat TUI 必须将 deferred diagnostic 作为 active result 保持可见，但不得声称 semantic symbol navigation 已完成。
