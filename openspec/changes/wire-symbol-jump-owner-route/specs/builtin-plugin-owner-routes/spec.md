## MODIFIED Requirements

### Requirement: Navigation plugin owner route coverage
Built-in plugin owner route readiness SHALL cover file manager and jump navigator command ids, including executable symbol navigation when code intelligence is available through the host.

Built-in plugin owner route readiness 必须覆盖 file manager 与 jump navigator command ids，并在 host 提供 code intelligence 时包含可执行的 symbol navigation。

#### Scenario: Navigation route coverage is complete
- **WHEN** built-in owner routes are listed
- **THEN** `file.manager.list`, `file.manager.preview`, `file.manager.references`, `jump.navigator.file`, `jump.navigator.text`, and `jump.navigator.symbol` are reported with deterministic status and owner subsystem metadata
- **中文** 当 built-in owner routes 被列出时，`file.manager.list`、`file.manager.preview`、`file.manager.references`、`jump.navigator.file`、`jump.navigator.text` 与 `jump.navigator.symbol` 必须以确定性 status 与 owner subsystem metadata 报告。

#### Scenario: Symbol jump dispatch uses code intelligence
- **WHEN** `jump.navigator.symbol` is dispatched with an injected code-intelligence service and a query
- **THEN** dispatch returns a completed host-owned result with symbol file targets and does not execute plugin-private code
- **中文** 当 `jump.navigator.symbol` 带 query 与注入的 code-intelligence service 被 dispatch 时，dispatch 必须返回 completed host-owned result，包含 symbol file targets，且不得执行 plugin-private code。
