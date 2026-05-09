## ADDED Requirements

### Requirement: Minimal Interactive CLI Regression / 最小交互式 CLI 回归

The testing framework SHALL include deterministic unit, integration, golden, e2e, and lint coverage for the minimal interactive CLI.

testing framework 必须为 minimal interactive CLI 提供 deterministic unit、integration、golden、e2e 和 lint 覆盖。

#### Scenario: Interactive unit tests cover parser and controls / 交互单测覆盖解析与控制

- **WHEN** package-local CLI tests run
- **THEN** they cover interactive command parsing, plain prompt detection, help output, unknown command errors, exit behavior, and non-TTY no-arg behavior
- **中文** 当 package-local CLI tests 运行时，必须覆盖 interactive command parsing、plain prompt detection、help output、unknown command errors、exit behavior 和 non-TTY no-arg behavior。

#### Scenario: Interactive integration test uses runtime events / 交互集成测试使用 runtime events

- **WHEN** integration tests run a scripted interactive prompt
- **THEN** assertions prove the output is derived from kernel-backed runtime events and not from a separate CLI execution state machine
- **中文** 当 integration tests 运行脚本化 interactive prompt 时，assertions 必须证明输出来自 kernel-backed runtime events，而不是单独的 CLI execution state machine。

#### Scenario: Interactive e2e covers prompt, help, cancel, and exit / 交互 e2e 覆盖 prompt、help、cancel 与 exit

- **WHEN** e2e tests execute the CLI interactive shell with deterministic scripted input
- **THEN** prompt submission, `/help`, `/cancel`, `/exit` or EOF complete without live provider access and without raw secret output
- **中文** 当 e2e tests 使用确定性脚本输入执行 CLI interactive shell 时，prompt submission、`/help`、`/cancel`、`/exit` 或 EOF 必须在不访问 live provider 且不输出 raw secret 的情况下完成。

### Requirement: Interactive Golden Replay / 交互式 Golden Replay

The regression harness SHALL capture and replay normalized minimal interactive CLI traces.

regression harness 必须捕获并回放 normalized minimal interactive CLI traces。

#### Scenario: Golden trace proves headless parity / golden trace 证明 headless parity

- **WHEN** a minimal prompt is executed through interactive mode and headless mode with deterministic fakes
- **THEN** normalized runtime event semantics match except for declared host input/output wrapper events
- **中文** 当使用 deterministic fakes 分别通过 interactive mode 与 headless mode 执行最小 prompt 时，normalized runtime event semantics 必须匹配，除了声明过的 host input/output wrapper events。

#### Scenario: Golden trace covers cancellation / golden trace 覆盖取消

- **WHEN** an active interactive turn is cancelled in a deterministic fixture
- **THEN** the replayed trace includes request correlation, cancellation control, terminal cancellation or structured failure event, and runtime shutdown evidence
- **中文** 当 active interactive turn 在 deterministic fixture 中被取消时，replayed trace 必须包含 request correlation、cancellation control、terminal cancellation 或 structured failure event，以及 runtime shutdown evidence。

### Requirement: Interactive Architecture Lint / 交互式架构 Lint

Architecture lint SHALL prevent the interactive CLI from bypassing governed runtime, command, policy, platform, or capability boundaries.

architecture lint 必须防止 interactive CLI 绕过 governed runtime、command、policy、platform 或 capability boundaries。

#### Scenario: Interactive bypass fails lint / 交互绕过触发 lint

- **WHEN** CLI interactive code directly invokes model providers, core tool executors, policy internals, scheduler internals, sandbox internals, platform primitives outside approved host adapter APIs, or app-to-app imports
- **THEN** lint fails with stable rule ids before default tests pass
- **中文** 当 CLI interactive code 直接调用 model providers、core tool executors、policy internals、scheduler internals、sandbox internals、approved host adapter APIs 之外的 platform primitives，或 app-to-app imports 时，lint 必须在默认测试通过前以 stable rule ids 失败。
