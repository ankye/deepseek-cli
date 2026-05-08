## ADDED Requirements

### Requirement: Persistent Config And Auth Regression / 持久化配置与认证回归

The testing framework SHALL include deterministic unit, contract, integration, e2e, matrix, compatibility, redaction, and optional live tests for persistent config and credential reference behavior.

testing framework 必须为 persistent config 和 credential reference behavior 提供 deterministic unit、contract、integration、e2e、matrix、compatibility、redaction 和 optional live tests。

#### Scenario: Config precedence is tested / 配置优先级被测试

- **WHEN** tests provide defaults, user config, workspace config, environment values, and CLI overrides for the same key
- **THEN** the regression suite proves the resolved value follows the required precedence and records source metadata for winning and shadowed values
- **中文** 当 tests 为同一 key 提供 defaults、user config、workspace config、environment values 和 CLI overrides 时，regression suite 必须证明 resolved value 遵循要求的优先级，并记录 winning 和 shadowed values 的 source metadata。

#### Scenario: Credential redaction is tested across outputs / 凭证脱敏跨输出测试

- **WHEN** tests store fake DeepSeek credentials and run auth, config, doctor, live verification fakes, traces, snapshots, and assertion paths
- **THEN** raw fake credentials never appear in stdout, JSON, command results, runtime events, model events, logs, snapshots, or assertion messages
- **中文** 当 tests 存储 fake DeepSeek credentials 并运行 auth、config、doctor、live verification fakes、traces、snapshots 和 assertion paths 时，raw fake credentials 绝不能出现在 stdout、JSON、command results、runtime events、model events、logs、snapshots 或 assertion messages 中。

### Requirement: Persistence Matrix Regression / 持久化矩阵回归

The testing framework SHALL cover config and credential-adjacent persistence behavior across fake Windows, macOS, Linux, read-only filesystem, partial-write failure, missing secure storage, and corrupted config scenarios.

testing framework 必须覆盖 fake Windows、macOS、Linux、read-only filesystem、partial-write failure、missing secure storage 和 corrupted config scenarios 下的 config 与 credential-adjacent persistence behavior。

#### Scenario: Platform paths are matrix tested / 平台路径经过矩阵测试

- **WHEN** matrix tests run for config and auth persistence
- **THEN** they verify user config paths, workspace metadata paths, path normalization, traversal rejection, permission diagnostics, and atomic write behavior across fake platform adapters
- **中文** 当 config 和 auth persistence 的 matrix tests 运行时，必须跨 fake platform adapters 验证 user config paths、workspace metadata paths、path normalization、traversal rejection、permission diagnostics 和 atomic write behavior。

#### Scenario: Corrupted config fails safely / 损坏配置安全失败

- **WHEN** a persisted config document is corrupted, incompatible, partially written, or contains secret-like values
- **THEN** tests prove commands return structured diagnostics and do not silently use unsafe values
- **中文** 当 persisted config document 损坏、不兼容、部分写入或包含 secret-like values 时，tests 必须证明 commands 返回 structured diagnostics，且不会静默使用 unsafe values。

### Requirement: Optional Live Auth Verification Gate / 可选 Live Auth 验证门禁

The testing framework SHALL keep real `doctor --live` or equivalent DeepSeek verification outside default tests and expose it through an explicit script and environment gate.

testing framework 必须把真实 `doctor --live` 或等价 DeepSeek verification 排除在默认测试之外，并通过显式脚本和环境门禁暴露。

#### Scenario: Default tests remain offline / 默认测试保持离线

- **WHEN** `npm test`, `npm run lint`, `npm run typecheck`, and default e2e tests run
- **THEN** they do not require network access, account balance, real credentials, OS keychain access, or provider availability
- **中文** 当 `npm test`、`npm run lint`、`npm run typecheck` 和默认 e2e tests 运行时，不得要求 network access、account balance、real credentials、OS keychain access 或 provider availability。

#### Scenario: Live auth smoke is structural / live auth smoke 是结构化断言

- **WHEN** optional live auth verification runs with explicit credentials
- **THEN** it asserts provider-neutral structure, redacted credential handling, non-empty terminal response metadata, and typed failure semantics without snapshotting exact generated model text
- **中文** 当 optional live auth verification 使用显式 credentials 运行时，必须断言 provider-neutral structure、redacted credential handling、non-empty terminal response metadata 和 typed failure semantics，且不 snapshot 精确生成模型文本。
