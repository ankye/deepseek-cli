## ADDED Requirements

### Requirement: Built-in plugin projections carry execution metadata
First-party built-in plugin TUI and palette projections SHALL carry owner route metadata sufficient for host execution while remaining declarative and inert.

First-party built-in plugin TUI 与 palette projections 必须携带足够 host execution 使用的 owner route metadata，同时保持声明式与惰性。

#### Scenario: Projection includes execution request metadata
- **WHEN** first-party built-in plugin command contributions are projected into TUI or palette surfaces
- **THEN** implemented routes include command id, route id, dispatch availability, owner subsystem, permissions, side effects, and plugin/contribution identifiers
- **中文** 当 first-party built-in plugin command contributions 投影到 TUI 或 palette surfaces 时，implemented routes 必须包含 command id、route id、dispatch availability、owner subsystem、permissions、side effects 与 plugin/contribution identifiers。

#### Scenario: Projection remains handler-free
- **WHEN** first-party built-in plugin projections are listed or inspected
- **THEN** no handler, callback, execute, host function, process primitive, filesystem primitive, model client, MCP client, or hook callback is exposed or executed
- **中文** 当 first-party built-in plugin projections 被列出或 inspect 时，不得暴露或执行 handler、callback、execute、host function、process primitive、filesystem primitive、model client、MCP client 或 hook callback。
