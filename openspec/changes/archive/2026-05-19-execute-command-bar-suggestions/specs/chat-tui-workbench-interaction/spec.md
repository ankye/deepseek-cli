## ADDED Requirements

### Requirement: Command bar query editing is local and deterministic
The chat TUI workbench SHALL update command bar query text from local keyboard input without dispatching to the model.

Chat TUI workbench 必须通过本地键盘输入更新 command bar query text，且不得 dispatch 到模型。

#### Scenario: Printable input filters suggestions
- **WHEN** the command bar is focused and open and the user types printable characters
- **THEN** the workbench updates `commandBar.query`, re-projects filtered suggestions, and keeps the active suggestion deterministic
- **中文** 当 command bar focused 且 open，用户输入 printable characters 时，workbench 必须更新 `commandBar.query`、重新投影 filtered suggestions，并保持 active suggestion 确定性。

#### Scenario: Backspace edits query
- **WHEN** the command bar is focused and open and the user presses Backspace
- **THEN** the workbench removes one trailing query character and re-projects suggestions locally
- **中文** 当 command bar focused 且 open，用户按下 Backspace 时，workbench 必须移除 query 末尾一个字符，并在本地重新投影 suggestions。

### Requirement: Command bar suggestions are navigable
The chat TUI workbench SHALL support local keyboard navigation through visible command bar suggestions.

Chat TUI workbench 必须支持通过本地键盘在 visible command bar suggestions 中导航。

#### Scenario: Downward selection moves active suggestion
- **WHEN** the command bar is focused and open and the user presses ArrowDown, Ctrl+N, or Tab
- **THEN** the active suggestion moves to the next visible suggestion and wraps at the end
- **中文** 当 command bar focused 且 open，用户按下 ArrowDown、Ctrl+N 或 Tab 时，active suggestion 必须移动到下一个 visible suggestion，并在末尾 wrap。

#### Scenario: Upward selection moves active suggestion
- **WHEN** the command bar is focused and open and the user presses ArrowUp, Ctrl+P, Shift+Tab, BackTab, or S-Tab
- **THEN** the active suggestion moves to the previous visible suggestion and wraps at the start
- **中文** 当 command bar focused 且 open，用户按下 ArrowUp、Ctrl+P、Shift+Tab、BackTab 或 S-Tab 时，active suggestion 必须移动到上一个 visible suggestion，并在开头 wrap。

#### Scenario: Panel cycling remains outside command bar
- **WHEN** the command bar is not focused or not open
- **THEN** Tab and Shift+Tab retain existing panel cycling behavior
- **中文** 当 command bar 未 focused 或未 open 时，Tab 与 Shift+Tab 必须保留既有 panel cycling 行为。

### Requirement: Command bar suggestion acceptance is descriptor-only
The chat TUI workbench SHALL accept the active command bar suggestion as a local descriptor without executing the command, plugin action, shell command, or model request.

Chat TUI workbench 必须将 active command bar suggestion 接受为 local descriptor，且不得执行 command、plugin action、shell command 或 model request。

#### Scenario: Accepting a built-in suggestion returns a command preview
- **WHEN** the command bar is focused and open and the user presses Enter on a built-in slash suggestion
- **THEN** dispatch returns a local command result with the selected command name and preview text
- **中文** 当 command bar focused 且 open，用户在 built-in slash suggestion 上按 Enter 时，dispatch 必须返回包含 selected command name 与 preview text 的 local command result。

#### Scenario: Accepting a plugin suggestion returns a governed descriptor
- **WHEN** the command bar is focused and open and the user presses Enter on a plugin suggestion
- **THEN** dispatch returns a local command result that references the plugin command descriptor without granting direct host execution
- **中文** 当 command bar focused 且 open，用户在 plugin suggestion 上按 Enter 时，dispatch 必须返回引用 plugin command descriptor 的 local command result，且不得授予 direct host execution。

#### Scenario: Empty suggestions do not execute
- **WHEN** the command bar is focused and open and no visible suggestions match the query
- **THEN** Enter returns a local diagnostic and keeps the command bar open
- **中文** 当 command bar focused 且 open 且没有 visible suggestions 匹配 query 时，Enter 必须返回 local diagnostic 并保持 command bar open。
