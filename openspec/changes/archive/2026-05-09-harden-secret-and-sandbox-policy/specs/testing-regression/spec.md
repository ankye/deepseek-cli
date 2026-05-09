## ADDED Requirements

### Requirement: Secret And Sandbox Regression Suite / Secret 与 Sandbox 回归套件

The testing framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, lint, and e2e coverage for secret and sandbox hardening.

testing framework 必须为 secret 与 sandbox hardening 提供 deterministic unit、contract、integration、golden、compatibility、matrix、lint 和 e2e 覆盖。

#### Scenario: Secret fixtures never leak / Secret Fixtures 绝不泄漏

- **WHEN** tests run with API keys, bearer tokens, private key blocks, env-style credentials, or secret redaction classes
- **THEN** stdout, stream-json, traces, sessions, caches, snapshots, golden files, and assertion messages contain only redacted evidence
- **中文** 当 tests 使用 API keys、bearer tokens、private key blocks、env-style credentials 或 secret redaction classes 时，stdout、stream-json、traces、sessions、caches、snapshots、golden files 和 assertion messages 只能包含 redacted evidence。

#### Scenario: Sandbox matrix covers platform modes / Sandbox 矩阵覆盖平台模式

- **WHEN** sandbox matrix tests run
- **THEN** they cover fake Windows, macOS, Linux, WSL, remote/no-shell, read-only filesystem, missing secure storage, missing network, and missing native capability modes
- **中文** 当 sandbox matrix tests 运行时，必须覆盖 fake Windows、macOS、Linux、WSL、remote/no-shell、read-only filesystem、missing secure storage、missing network 和 missing native capability modes。

### Requirement: Secret And Sandbox Bypass Lint / Secret 与 Sandbox 绕过 Lint

Architecture lint SHALL reject direct secret, environment, filesystem, process, native, or sandbox primitive access outside approved owner packages and tests.

architecture lint 必须拒绝 approved owner packages 与 tests 之外的 direct secret、environment、filesystem、process、native 或 sandbox primitive access。

#### Scenario: Host bypass fails lint / Host 绕过触发 Lint

- **WHEN** CLI, VSCode, provider, plugin, or feature packages read raw environment secrets, execute processes, mutate files, or select sandbox profiles directly
- **THEN** lint fails with stable rule ids before default tests pass
- **中文** 当 CLI、VSCode、provider、plugin 或 feature packages 直接读取 raw environment secrets、执行 processes、修改 files 或选择 sandbox profiles 时，lint 必须在默认测试通过前以 stable rule ids 失败。
