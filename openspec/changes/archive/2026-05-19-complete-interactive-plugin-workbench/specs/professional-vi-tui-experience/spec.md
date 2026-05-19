## ADDED Requirements

### Requirement: TUI plugin actions execute owner routes
The professional TUI SHALL provide host-governed execution for implemented built-in plugin command actions without granting direct host access to plugin code.

Professional TUI 必须为 implemented built-in plugin command actions 提供 host-governed execution，同时不得向插件代码授予 direct host access。

#### Scenario: Leader plugin action executes route
- **WHEN** a user selects a built-in plugin command action from a TUI plugin action surface
- **THEN** the TUI requests host dispatch through the owner route and updates recent executions, result lists, activity feed, and inspector targets
- **中文** 当用户从 TUI plugin action surface 选择 built-in plugin command action 时，TUI 必须通过 owner route 请求 host dispatch，并更新 recent executions、result lists、activity feed 与 inspector targets。

#### Scenario: Deferred action is explained in place
- **WHEN** a TUI plugin action points at a deferred route
- **THEN** the TUI records and renders the route as recognized but not directly dispatchable, including fallback guidance
- **中文** 当 TUI plugin action 指向 deferred route 时，TUI 必须记录并渲染该 route 为“已识别但不可直接 dispatch”，并包含 fallback guidance。

### Requirement: TUI keeps command-system dry-runs inert
The professional TUI SHALL keep command-system action resolution dry-run and perform real plugin execution only through host-owned execution helpers.

Professional TUI 必须保持 command-system action resolution dry-run 惰性，并且只通过 host-owned execution helpers 执行真实插件。

#### Scenario: Plugin dry-run does not execute process or filesystem work
- **WHEN** the TUI resolves a plugin action through command-system dry-run
- **THEN** no process, filesystem, model, MCP, or hook execution occurs until the host execution helper is called
- **中文** 当 TUI 通过 command-system dry-run 解析 plugin action 时，在 host execution helper 被调用前不得发生 process、filesystem、model、MCP 或 hook execution。
