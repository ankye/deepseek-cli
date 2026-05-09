## ADDED Requirements

### Requirement: Session Resume/Fork Regression / Session Resume/Fork 回归

The testing framework SHALL include deterministic contract, integration, golden, compatibility, matrix where applicable, and e2e coverage for session resume and fork-lite.

testing framework 必须为 session resume 与 fork-lite 提供 deterministic contract、integration、golden、compatibility、适用时的 matrix 和 e2e 覆盖。

#### Scenario: Contract tests cover store semantics / 合同测试覆盖 store 语义

- **WHEN** session-store contract tests run
- **THEN** they cover create, append, resume, fork-lite, lineage metadata, unknown session failure, redaction, and serialization for all supported deterministic stores
- **中文** 当 session-store contract tests 运行时，必须覆盖所有 supported deterministic stores 的 create、append、resume、fork-lite、lineage metadata、unknown session failure、redaction 和 serialization。

#### Scenario: Integration tests cover resumed runtime turn / 集成测试覆盖恢复后的 runtime turn

- **WHEN** integration tests submit a prompt after resume or fork-lite
- **THEN** runtime events use the selected session id and still include governed kernel, policy, scheduler, bus, and workflow evidence
- **中文** 当 integration tests 在 resume 或 fork-lite 后提交 prompt 时，runtime events 必须使用选定 session id，并仍包含 governed kernel、policy、scheduler、bus 和 workflow evidence。

#### Scenario: E2E tests cover CLI session commands / E2E 覆盖 CLI session 命令

- **WHEN** e2e tests run CLI session resume/fork commands
- **THEN** they complete with deterministic fakes, structured output, no live provider access, and no raw secret output
- **中文** 当 e2e tests 运行 CLI session resume/fork commands 时，必须使用 deterministic fakes 完成，输出 structured output，不访问 live provider，且不输出 raw secret。

### Requirement: Session Resume/Fork Golden Replay / Session Resume/Fork Golden Replay

The regression harness SHALL capture and replay normalized session resume and fork-lite traces.

regression harness 必须捕获并回放 normalized session resume 与 fork-lite traces。

#### Scenario: Golden replay covers resume / Golden replay 覆盖 resume

- **WHEN** a resumed session trace is replayed
- **THEN** normalized events include original session events, resume metadata, subsequent runtime events, and stable event ordering
- **中文** 当 resumed session trace 被 replay 时，normalized events 必须包含 original session events、resume metadata、subsequent runtime events 和 stable event ordering。

#### Scenario: Golden replay covers fork-lite / Golden replay 覆盖 fork-lite

- **WHEN** a forked session trace is replayed
- **THEN** normalized events include parent lineage, fork event, child session id, child runtime events, and replayable redacted metadata
- **中文** 当 forked session trace 被 replay 时，normalized events 必须包含 parent lineage、fork event、child session id、child runtime events 和 replayable redacted metadata。

### Requirement: Session Compatibility Fixtures / Session 兼容性 Fixtures

The testing framework SHALL include compatibility fixtures for persisted session metadata, resume results, fork results, and unknown schema rejection.

testing framework 必须包含 persisted session metadata、resume results、fork results 和 unknown schema rejection 的 compatibility fixtures。

#### Scenario: Persisted schema is required / Persisted schema 必须存在

- **WHEN** persisted session metadata, resume result, or fork result lacks a schema version
- **THEN** compatibility tests fail with a deterministic diagnostic
- **中文** 当 persisted session metadata、resume result 或 fork result 缺少 schema version 时，compatibility tests 必须以 deterministic diagnostic 失败。

#### Scenario: Unsupported schema fails closed / 不支持的 schema 安全失败

- **WHEN** session persistence contains an unsupported schema version
- **THEN** resume/fork tests prove the system returns a typed compatibility failure instead of silently accepting incompatible state
- **中文** 当 session persistence 包含 unsupported schema version 时，resume/fork tests 必须证明系统返回 typed compatibility failure，而不是静默接受 incompatible state。
