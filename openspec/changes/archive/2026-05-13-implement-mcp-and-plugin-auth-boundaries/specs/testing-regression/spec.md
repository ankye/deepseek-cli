## ADDED Requirements

### Requirement: MCP Plugin Auth Boundary Regression / MCP 插件认证边界回归

The regression suite SHALL cover scoped credential grants, MCP/plugin authorization denial, permission/auth diffs, CLI structured output, redaction, and replay fingerprints for R3 extension auth boundaries.

Regression suite 必须覆盖 R3 extension auth boundaries 的 scoped credential grants、MCP/plugin authorization denial、permission/auth diffs、CLI structured output、redaction 与 replay fingerprints。

#### Scenario: Scope denial is tested / 作用域拒绝被测试

- **WHEN** deterministic MCP or plugin fixtures request credentials outside declared scope
- **THEN** tests assert typed denial, no raw credential resolver call, redacted evidence, pit fixture ids, and stable replay fingerprints
- **中文** 当 deterministic MCP 或 plugin fixtures 请求超出 declared scope 的 credentials 时，测试必须断言 typed denial、不调用 raw credential resolver、redacted evidence、pit fixture ids 与 stable replay fingerprints。

#### Scenario: CLI auth evidence parity is tested / CLI 认证证据一致性被测试

- **WHEN** CLI extension/auth commands render plugin or MCP auth readiness, missing grant, or denial records
- **THEN** text and JSONL outputs are derived from the same structured evidence and contain no raw secret values
- **中文** 当 CLI extension/auth commands 渲染 plugin 或 MCP auth readiness、missing grant 或 denial records 时，text 与 JSONL outputs 必须来自同一 structured evidence，且不包含 raw secret values。

### Requirement: Plugin Auth Diff Regression / 插件认证 Diff 回归

Regression tests SHALL cover plugin updates that add or remove credential requirements in addition to permission changes.

Regression tests 必须覆盖 plugin updates 增加或移除 credential requirements 以及 permission changes 的情况。

#### Scenario: Auth requirement expansion is explicit / 认证需求扩张显式化

- **WHEN** a plugin update adds a credential requirement compared with a lockfile baseline
- **THEN** tests assert lifecycle evidence reports the exact auth requirement diff, permission diff remains exact, and audit metadata cites the relevant pit fixtures
- **中文** 当 plugin update 相比 lockfile baseline 增加 credential requirement 时，测试必须断言 lifecycle evidence 报告精确 auth requirement diff、permission diff 保持精确，并且 audit metadata 引用相关 pit fixtures。
