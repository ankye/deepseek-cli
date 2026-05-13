## ADDED Requirements

### Requirement: CLI-First Extension Auth Evidence / CLI 优先扩展认证证据

CLI-first extension/auth work SHALL produce CLI acceptance evidence for MCP/plugin scoped credential behavior before the same workflow is promoted to VSCode, server, SDK, marketplace, team, or enterprise hosts.

CLI-first extension/auth 工作必须先为 MCP/plugin scoped credential behavior 产出 CLI acceptance evidence，然后才能把同一 workflow 推广到 VSCode、server、SDK、marketplace、team 或 enterprise hosts。

#### Scenario: Extension auth change cites pits / 扩展认证变更引用坑位

- **WHEN** a CLI-facing change touches MCP/plugin credentials, grants, permission diffs, real transport opt-in, or auth diagnostics
- **THEN** it cites concrete reference pit fixture ids for credential scope denial, permission expansion, environment snapshotting, diagnostic redaction, and MCP/plugin precedence where applicable
- **中文** 当 CLI-facing change 触及 MCP/plugin credentials、grants、permission diffs、real transport opt-in 或 auth diagnostics 时，必须按需引用 credential scope denial、permission expansion、environment snapshotting、diagnostic redaction 与 MCP/plugin precedence 的具体 reference pit fixture ids。

#### Scenario: Host promotion waits for CLI auth proof / Host 推广等待 CLI 认证证明

- **WHEN** an MCP/plugin auth workflow is proposed for a non-CLI host
- **THEN** the proposal references CLI text/JSONL evidence, deterministic denial tests, redacted audit replay, and shared protocol-compatible DTOs
- **中文** 当 MCP/plugin auth workflow 被提议进入非 CLI host 时，proposal 必须引用 CLI text/JSONL evidence、deterministic denial tests、redacted audit replay 与 shared protocol-compatible DTOs。
