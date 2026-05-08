## ADDED Requirements

### Requirement: Local Readiness Command Roadmap / 本地可用性命令路线图

The command system SHALL place first-run and local readiness commands into R1 launch scope, including init, config/settings validation, credential setup or login, logout, doctor diagnostics, privacy settings, and install/package verification.

command system 必须把 first-run 与 local readiness commands 放入 R1 发布范围，包括 init、config/settings validation、credential setup 或 login、logout、doctor diagnostics、privacy settings 和 install/package verification。

#### Scenario: R1 readiness command uses platform contracts / R1 可用性命令使用平台契约

- **WHEN** a local readiness command runs
- **THEN** it uses shared command, platform, credential, policy, protocol, and diagnostic contracts rather than direct host-specific state mutation
- **中文** 当 local readiness command 运行时，必须使用共享 command、platform、credential、policy、protocol 和 diagnostic contracts，而不是直接修改 host-specific state。

#### Scenario: Readiness command is testable without live provider / 可用性命令无需 live provider 可测试

- **WHEN** R1 readiness smoke tests run
- **THEN** init, config validation, credential reference setup, doctor diagnostics, privacy settings, and install verification complete with deterministic fakes and redacted evidence
- **中文** 当 R1 readiness smoke tests 运行时，init、config validation、credential reference setup、doctor diagnostics、privacy settings 和 install verification 必须通过 deterministic fakes 与 redacted evidence 完成。
