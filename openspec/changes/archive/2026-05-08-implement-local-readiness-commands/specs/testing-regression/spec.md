## ADDED Requirements

### Requirement: Local Readiness Regression / 本地可用性回归

The testing framework SHALL include deterministic unit, contract, integration, and CLI smoke tests for R1 local readiness commands.

testing framework 必须为 R1 local readiness commands 提供 deterministic unit、contract、integration 和 CLI smoke tests。

#### Scenario: Readiness smoke covers all commands / readiness smoke 覆盖所有命令

- **WHEN** readiness smoke tests run
- **THEN** init, config, auth, doctor, privacy, and verify-install commands complete without live provider access and emit structured redacted results
- **中文** 当 readiness smoke tests 运行时，init、config、auth、doctor、privacy 和 verify-install commands 必须在不访问 live provider 的情况下完成，并输出 structured redacted results。

#### Scenario: Secret fixture is not leaked / secret fixture 不泄漏

- **WHEN** tests provide fake DeepSeek credentials
- **THEN** stdout, JSON output, traces, snapshots, and assertion messages contain only redacted references and never raw secret values
- **中文** 当 tests 提供 fake DeepSeek credentials 时，stdout、JSON output、traces、snapshots 和 assertion messages 只能包含 redacted references，绝不能包含 raw secret values。
