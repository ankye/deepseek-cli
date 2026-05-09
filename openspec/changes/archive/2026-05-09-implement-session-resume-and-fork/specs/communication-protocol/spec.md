## ADDED Requirements

### Requirement: Session Operation Protocol Messages / Session 操作协议消息

The communication protocol SHALL define versioned request, result, event, and error semantics for session resume and fork-lite operations.

communication protocol 必须为 session resume 与 fork-lite operations 定义版本化 request、result、event 和 error 语义。

#### Scenario: Resume request is protocol-compatible / Resume request 兼容协议

- **WHEN** CLI, VSCode, tests, or future server transports request session resume
- **THEN** the request includes protocol version, correlation id, source host, session id, trace metadata, redaction metadata, and compatibility metadata
- **中文** 当 CLI、VSCode、tests 或未来 server transports 请求 session resume 时，request 必须包含 protocol version、correlation id、source host、session id、trace metadata、redaction metadata 和 compatibility metadata。

#### Scenario: Fork request is protocol-compatible / Fork request 兼容协议

- **WHEN** CLI, VSCode, tests, or future server transports request session fork-lite
- **THEN** the request includes parent session id, optional fork point sequence, reason metadata, trace metadata, redaction metadata, and compatibility metadata
- **中文** 当 CLI、VSCode、tests 或未来 server transports 请求 session fork-lite 时，request 必须包含 parent session id、optional fork point sequence、reason metadata、trace metadata、redaction metadata 和 compatibility metadata。

#### Scenario: Session operation failure is structured / Session 操作失败结构化

- **WHEN** a session operation fails because of unknown id, unsupported schema, corrupted event log, or policy denial
- **THEN** the protocol layer can return a typed, redacted, replayable error without invoking runtime execution
- **中文** 当 session operation 因 unknown id、unsupported schema、corrupted event log 或 policy denial 失败时，protocol layer 必须能够返回 typed、redacted、replayable error，且不调用 runtime execution。

### Requirement: Session Protocol Compatibility / Session 协议兼容性

Session operation schemas SHALL be compatibility-tested before archive.

session operation schemas 必须在 archive 前经过 compatibility tests。

#### Scenario: Additive schema change remains compatible / 增量 schema 变化保持兼容

- **WHEN** session resume or fork-lite result schemas add optional fields
- **THEN** compatibility tests prove existing readers can still parse required fields and ignore unknown optional fields
- **中文** 当 session resume 或 fork-lite result schemas 增加 optional fields 时，compatibility tests 必须证明 existing readers 仍能解析 required fields 并忽略 unknown optional fields。
