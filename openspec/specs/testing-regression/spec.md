# testing-regression Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Deterministic Test Infrastructure

The framework SHALL provide deterministic fakes for protocol, runtime message bus, runtime dependencies, model gateway, workflow, concurrency, platform, workspace state, session store, memory/cache, credentials, usage, policy, sandbox, code intelligence, extension/plugin/skill/hook/MCP loading, and clocks.

框架必须为 protocol、runtime message bus、runtime dependencies、model gateway、workflow、concurrency、platform、workspace state、session store、memory/cache、credentials、usage、policy、sandbox、code intelligence、extension/plugin/skill/hook/MCP loading 和 clocks 提供 deterministic fakes。

#### Scenario: Runtime test does not require live provider

- **WHEN** runtime tests execute a turn
- **THEN** they can use deterministic fake dependencies without live model credentials, real filesystem mutations, or host UI

### Requirement: Contract and Type Tests

The framework SHALL include contract and type-level tests for platform contracts, dependency direction, serializability, and fake substitutability.

框架必须包含 platform contracts、dependency direction、serializability 和 fake substitutability 的 contract/type-level tests。

#### Scenario: Contract package has no implementation dependency

- **WHEN** contract tests inspect `platform-contracts`
- **THEN** no imports from apps, implementation packages, host APIs, or model SDKs are allowed

### Requirement: Golden Trace Replay

The regression harness SHALL support golden traces for protocol messages, runtime bus events, runtime events, workflow events, task events, model events, capability events, command events, skill events, hook events, MCP events, plugin events, workspace events, session events, usage events, policy decisions, sandbox events, and audit events.

regression harness 必须支持 protocol messages、runtime bus events、runtime events、workflow events、task events、model events、capability events、command events、skill events、hook events、MCP events、plugin events、workspace events、session events、usage events、policy decisions、sandbox events 和 audit events 的 golden traces。

#### Scenario: Replay headless smoke trace

- **WHEN** the minimal `deepseek -p` smoke trace is replayed
- **THEN** normalized events match the stored golden trace except for declared nondeterministic fields

### Requirement: Self-Regression Scenario Suites

The framework SHALL define self-regression scenario suites with stable semantic assertions and optional live-provider suites.

框架必须定义 self-regression scenario suites，使用稳定语义断言，并支持可选 live-provider suites。

#### Scenario: Live provider suite is opt-in

- **WHEN** default regression tests run
- **THEN** they do not call live model providers unless explicitly enabled

#### Scenario: Semantic assertion checks outcome

- **WHEN** a self-regression scenario completes
- **THEN** the harness evaluates declared semantic assertions rather than brittle raw text equality when appropriate

### Requirement: Compatibility Regression

The regression system SHALL check compatibility for protocol versions, runtime bus schemas, persisted sessions, golden traces, plugin manifests, extension manifests, capability manifests, command manifests, skill manifests, hook manifests, MCP connector schemas, workspace edit schemas, memory/cache schemas, credential references, usage schemas, distribution metadata, and migration plans.

regression system 必须检查 protocol versions、runtime bus schemas、persisted sessions、golden traces、plugin manifests、extension manifests、capability manifests、command manifests、skill manifests、hook manifests、MCP connector schemas、workspace edit schemas、memory/cache schemas、credential references、usage schemas、distribution metadata 和 migration plans 的兼容性。

#### Scenario: Breaking schema change requires migration

- **WHEN** a persisted schema changes incompatibly
- **THEN** regression fails unless an evolution migration or compatibility rejection path is declared

### Requirement: Test Directory and Ownership Map

The framework SHALL define a test directory and ownership map that separates package-local tests, shared test utilities, contract tests, integration tests, golden traces, scenario suites, compatibility fixtures, and CI gates.

框架必须定义 test directory and ownership map，区分 package-local tests、shared test utilities、contract tests、integration tests、golden traces、scenario suites、compatibility fixtures 和 CI gates。

#### Scenario: Package owns local unit tests

- **WHEN** a package implements runtime behavior
- **THEN** it owns package-local unit tests under its package test directory using shared fakes only through public contracts

#### Scenario: Cross-package behavior uses integration test area

- **WHEN** a test verifies behavior across protocol, runtime, workflow, concurrency, session, policy, or host adapters
- **THEN** it lives in the shared integration test area and imports packages through public exports

### Requirement: Test Framework Directory Layout

The repository SHALL reserve a test framework layout for `src/packages/testing-regression`, `tests/contracts`, `tests/integration`, `tests/golden`, `tests/scenarios`, `tests/compatibility`, `tests/fixtures`, `tests/matrix`, and `tests/e2e`.

repository 必须预留 test framework layout，包含 `src/packages/testing-regression`、`tests/contracts`、`tests/integration`、`tests/golden`、`tests/scenarios`、`tests/compatibility`、`tests/fixtures`、`tests/matrix` 和 `tests/e2e`。

#### Scenario: Golden trace has stable location

- **WHEN** a protocol, bus, runtime, workflow, or session golden trace is recorded
- **THEN** it is stored under `tests/golden` with schema version, fixture id, redaction metadata, and nondeterministic field declarations

#### Scenario: Scenario suite has stable location

- **WHEN** a self-regression scenario is added
- **THEN** it is stored under `tests/scenarios` with input, expected semantic assertions, required fakes, allowed nondeterminism, and replay metadata

### Requirement: Test Data Governance

The testing framework SHALL govern fixtures, golden traces, snapshots, recordings, and generated artifacts with schema version, provenance, redaction class, update policy, and review requirements.

testing framework 必须治理 fixtures、golden traces、snapshots、recordings 和 generated artifacts，并包含 schema version、provenance、redaction class、update policy 和 review requirements。

#### Scenario: Golden update requires explicit workflow

- **WHEN** a golden trace or compatibility fixture changes
- **THEN** the update must be explicit, reviewed, redacted, and tied to a contract/evolution decision

#### Scenario: Secret is blocked from test artifact

- **WHEN** a fixture, trace, snapshot, recording, or artifact contains raw credentials or secrets
- **THEN** the test framework rejects or redacts it before it can be committed as a regression artifact

### Requirement: Test Matrix and CI Gates

The testing framework SHALL define CI gates for type checks, lint, unit tests, contract tests, integration tests, golden replay, compatibility checks, platform matrix tests, host adapter smoke tests, and optional live-provider tests.

testing framework 必须定义 CI gates，覆盖 type checks、lint、unit tests、contract tests、integration tests、golden replay、compatibility checks、platform matrix tests、host adapter smoke tests 和 optional live-provider tests。

#### Scenario: Default CI avoids live providers

- **WHEN** default CI runs
- **THEN** it uses deterministic fakes and does not require live model providers, real plugin marketplaces, real MCP servers, real credentials, network access, or real editor hosts

#### Scenario: Platform matrix uses fake adapters first

- **WHEN** platform matrix tests run in default CI
- **THEN** they use fake macOS, Windows, Linux, filesystem, process, shell, and clock adapters before optional real OS suites

### Requirement: Test Harness APIs

The testing-regression package SHALL expose harness APIs for fake dependency assembly, trace normalization, replay execution, semantic assertions, compatibility checks, fake clock control, fake platform matrix execution, and artifact redaction.

`testing-regression` package 必须暴露 harness APIs，支持 fake dependency assembly、trace normalization、replay execution、semantic assertions、compatibility checks、fake clock control、fake platform matrix execution 和 artifact redaction。

#### Scenario: Runtime smoke test uses harness

- **WHEN** the minimal headless smoke test runs
- **THEN** it constructs runtime dependencies through the test harness, records normalized protocol/bus/runtime/session events, and replays them through the regression harness

#### Scenario: Host adapter smoke test uses harness

- **WHEN** CLI or VSCode host adapter smoke tests run
- **THEN** they use protocol fixtures and fake runtime transports rather than live runtime internals or stdout parsing

### Requirement: Test Promotion Ladder

The framework SHALL define a promotion ladder from unit tests to contract tests, integration tests, golden replay, scenario suites, matrix tests, e2e smoke tests, and optional live suites.

框架必须定义 test promotion ladder，从 unit tests 到 contract tests、integration tests、golden replay、scenario suites、matrix tests、e2e smoke tests 和 optional live suites。

#### Scenario: Bug fix adds appropriate regression level

- **WHEN** a bug is fixed
- **THEN** the regression level is selected by blast radius: package-local unit test for local logic, contract test for boundary behavior, golden trace for event sequence, scenario suite for workflow behavior, or matrix test for platform behavior

### Requirement: Execution Governance Regression

The regression harness SHALL capture and replay governed execution envelopes, policy decisions, approval decisions, scheduler events, bus records, audit summaries, outputs, errors, cancellations, retries, and rollback markers.

regression harness 必须捕获并回放 governed execution envelopes、policy decisions、approval decisions、scheduler events、bus records、audit summaries、outputs、errors、cancellations、retries 和 rollback markers。

#### Scenario: Direct execution bypass is tested

- **WHEN** architecture lint is run
- **THEN** regression tests prove direct governed primitive calls outside approved owners, tests, deterministic fakes, or owning packages fail with stable rule ids

#### Scenario: Governed replay compares decisions

- **WHEN** a governed capability scenario is replayed
- **THEN** the harness compares normalized invocation metadata, policy decisions, scheduler decisions, events, results, and redacted failures without live external services

### Requirement: Runtime Kernel Test Matrix

The test framework SHALL include contract, integration, e2e, regression, and lint tests for the runtime execution kernel.

测试框架必须包含 runtime execution kernel 的 contract、integration、e2e、regression 和 lint tests。

#### Scenario: Contract tests cover kernel interfaces

- **WHEN** contract tests run
- **THEN** they validate kernel construction, envelope validation, registry lookup, scheduler task handles, message bus events, and policy decisions

#### Scenario: Integration tests cover full invocation path

- **WHEN** integration tests invoke the deterministic built-in capability
- **THEN** they assert registry, envelope, workflow, policy, scheduler, bus, execution, result, and replay metadata are connected

#### Scenario: E2E tests cover CLI host adapter

- **WHEN** e2e tests run the CLI kernel-backed command
- **THEN** the command exits successfully and outputs events or results derived from the runtime event stream

### Requirement: Runtime Kernel Regression Replay

The regression harness SHALL capture and compare normalized kernel invocation traces.

regression harness 必须捕获并比较 normalized kernel invocation traces。

#### Scenario: Golden replay detects event drift

- **WHEN** a golden kernel invocation is replayed
- **THEN** normalized envelopes, policy decisions, scheduler events, bus events, outputs, terminal results, and audit summaries match the expected trace

### Requirement: Hardening Regression Tests

The test framework SHALL include hardening regression tests for runtime kernel single-entry execution, abort cancellation, timeout, scheduler event order, strict envelope validation, registry projection immutability, event persistence failure, direct bypass lint, and legacy path lint.

测试框架必须包含 runtime kernel single-entry execution、abort cancellation、timeout、scheduler event order、strict envelope validation、registry projection immutability、event persistence failure、direct bypass lint 和 legacy path lint 的 hardening regression tests。

#### Scenario: Reviewed risks have tests

- **WHEN** a hardening risk is identified during architecture review
- **THEN** a unit, contract, integration, e2e, golden, or lint test exists that fails if the risk regresses

#### Scenario: Tests catch issue before review

- **WHEN** code reintroduces direct legacy execution, shallow envelope validation, missing abort propagation, missing scheduler stream events, mutable projections, or swallowed bus failures
- **THEN** the default test or lint suite fails without relying on manual review

### Requirement: Kernel Event Golden Order

Golden replay SHALL cover strict runtime kernel event order including scheduler events and terminal workflow closure.

Golden replay 必须覆盖 strict runtime kernel event order，包括 scheduler events 和 terminal workflow closure。

#### Scenario: Golden event order includes scheduler states

- **WHEN** a deterministic built-in capability is replayed
- **THEN** normalized events match the expected order from request accepted through scheduler queued, scheduler started, capability terminal event, scheduler terminal event, and workflow closed

### Requirement: Deterministic Provider Regression

The testing framework SHALL include deterministic DeepSeek provider fixtures and tests for request construction, text normalization, reasoning normalization, tool-call normalization, usage/cache normalization, provider errors, missing credentials, missing transport, and no default network access.

测试框架必须包含 deterministic DeepSeek provider fixtures 和 tests，覆盖 request construction、text normalization、reasoning normalization、tool-call normalization、usage/cache normalization、provider errors、missing credentials、missing transport 和 no default network access。

#### Scenario: Provider tests use fake transport

- **WHEN** default tests exercise the DeepSeek provider
- **THEN** they use injected fake transport fixtures and never require a live DeepSeek API key or network access

#### Scenario: Golden provider trace is stable

- **WHEN** a DeepSeek provider fixture is replayed
- **THEN** normalized model events match a stable golden trace except for declared nondeterministic provider ids when present

#### Scenario: Lint covers provider boundaries

- **WHEN** architecture lint runs
- **THEN** it includes negative tests for direct credential access and direct governed execution from provider code

### Requirement: Roadmap Regression Levels / 路线图回归等级

The testing framework SHALL require every roadmap node to declare the minimum regression level needed for implementation and launch.

测试框架必须要求每个 roadmap node 声明 implementation 和 launch 所需的 minimum regression level。

#### Scenario: Node declares test ladder / 节点声明测试阶梯

- **WHEN** a roadmap node is planned
- **THEN** it declares required unit, contract, integration, golden, e2e, matrix, compatibility, and optional live-provider tests
- **中文** 当规划路线图节点时，必须声明必需的 unit、contract、integration、golden、e2e、matrix、compatibility 和可选 live-provider 测试。

#### Scenario: Product node adds scenario coverage / 产品节点增加场景覆盖

- **WHEN** a node introduces user-visible product workflow
- **THEN** a scenario or e2e smoke test covers the host-visible workflow before beta launch
- **中文** 当节点引入用户可见产品流程时，必须在 beta 发布前用 scenario 或 e2e smoke test 覆盖 host 可见流程。

#### Scenario: Readiness and governance fixtures are declared / 声明可用性与治理 fixtures

- **WHEN** a roadmap node includes local readiness, credentials, observability/privacy, code intelligence, SDK/API, or model capability governance
- **THEN** it declares fixtures for no-live-provider execution, redacted diagnostics, credential references, compatibility schemas, fallback decisions, and deterministic replay as applicable
- **中文** 当路线图节点包含 local readiness、credentials、observability/privacy、code intelligence、SDK/API 或 model capability governance 时，必须按需声明 no-live-provider execution、redacted diagnostics、credential references、compatibility schemas、fallback decisions 和 deterministic replay fixtures。

### Requirement: Optional Live Provider Test Gate / 可选 Live Provider 测试门禁

The testing framework SHALL keep live provider tests outside default test commands and SHALL expose them through an explicit optional script and environment gate.

testing framework 必须把 live provider tests 排除在默认 test commands 之外，并通过明确的 optional script 和 environment gate 暴露。

#### Scenario: Default tests do not run live provider / 默认测试不运行 live provider

- **WHEN** `npm test` runs
- **THEN** it does not require network access, DeepSeek credentials, provider availability, or account balance
- **中文** 当 `npm test` 运行时，它不得要求 network access、DeepSeek credentials、provider availability 或 account balance。

#### Scenario: Live smoke has structural assertions / Live smoke 使用结构断言

- **WHEN** optional live smoke runs against DeepSeek
- **THEN** it asserts normalized event structure, non-empty assistant text, redacted credential handling, and terminal completion without snapshotting exact model text
- **中文** 当 optional live smoke 针对 DeepSeek 运行时，它必须断言 normalized event structure、non-empty assistant text、redacted credential handling 和 terminal completion，而不是 snapshot 精确模型文本。

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

### Requirement: Expanded Platform Matrix Regression / 扩展平台矩阵回归

The testing framework SHALL include deterministic fake platform matrix coverage for macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell modes.

testing framework 必须为 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell modes 提供 deterministic fake platform matrix coverage。

#### Scenario: Matrix covers degraded hosts / 矩阵覆盖降级 host

- **WHEN** matrix tests run
- **THEN** they cover hosts with unavailable native features, unavailable secure storage, unavailable shell, and provider fallback behavior
- **中文** 当 matrix tests 运行时，必须覆盖 native features unavailable、secure storage unavailable、shell unavailable 和 provider fallback behavior 的 host。

### Requirement: Platform Bypass Lint Regression / 平台绕过 Lint 回归

The testing framework SHALL include architecture lint regression tests that reject direct OS branching, direct process execution, direct search binary invocation, direct secure-storage access, and direct native capability loading outside approved platform-owner packages.

testing framework 必须包含 architecture lint regression tests，拒绝 approved platform-owner packages 之外的 direct OS branching、direct process execution、direct search binary invocation、direct secure-storage access 和 direct native capability loading。

#### Scenario: Direct platform primitive fails lint / 直接平台 primitive 触发 lint

- **WHEN** a non-owner package imports process execution, OS detection, search binaries, secure storage APIs, or native modules directly
- **THEN** lint fails with stable rule ids and actionable messages
- **中文** 当非 owner package 直接 import process execution、OS detection、search binaries、secure storage APIs 或 native modules 时，lint 必须以 stable rule ids 和 actionable messages 失败。

### Requirement: Fail-Closed Platform Fixtures / 平台 Fail-Closed Fixtures

The testing framework SHALL provide fixtures for unsupported paths, unsafe path traversal, missing shell, missing search provider, missing native capability, missing secure storage, and WSL path translation.

testing framework 必须提供 unsupported paths、unsafe path traversal、missing shell、missing search provider、missing native capability、missing secure storage 和 WSL path translation 的 fixtures。

#### Scenario: Review finding becomes regression / Review finding 变为回归测试

- **WHEN** a platform boundary bug is found during review
- **THEN** a matrix or lint regression test is added before the change can be archived
- **中文** 当 review 中发现 platform boundary bug 时，必须在 archive 前增加 matrix 或 lint regression test。

### Requirement: Core Coding Tool Regression Suite / 核心 Coding Tool 回归套件

The testing framework SHALL include deterministic unit, contract, integration, golden, matrix, and e2e tests for core coding tools.

testing framework 必须为 core coding tools 提供 deterministic unit、contract、integration、golden、matrix 和 e2e tests。

#### Scenario: Minimal coding turn is covered / 最小 coding turn 被覆盖

- **WHEN** core tool regression tests run
- **THEN** they cover reading a fixture file, applying an exact edit, running a deterministic test command, and returning structured evidence through runtime events
- **中文** 当 core tool regression tests 运行时，必须覆盖读取 fixture file、应用 exact edit、运行 deterministic test command，并通过 runtime events 返回 structured evidence。

#### Scenario: Platform matrix covers core tools / 平台矩阵覆盖核心工具

- **WHEN** matrix tests run
- **THEN** read, edit, search, shell/test unavailable behavior, path rejection, provider fallback, and output bounding are covered across fake macOS, Windows, Linux, WSL, CI, and remote hosts
- **中文** 当 matrix tests 运行时，必须跨 fake macOS、Windows、Linux、WSL、CI 和 remote hosts 覆盖 read、edit、search、shell/test unavailable behavior、path rejection、provider fallback 和 output bounding。

#### Scenario: Architecture lint blocks bypass / 架构 lint 阻止绕过

- **WHEN** core tool implementation or a future package attempts direct filesystem, process, search binary, or platform primitive access outside approved owner packages
- **THEN** architecture lint fails with stable rule ids
- **中文** 当 core tool implementation 或未来 package 尝试在 approved owner packages 外直接访问 filesystem、process、search binary 或 platform primitive 时，architecture lint 必须以 stable rule ids 失败。

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

### Requirement: Context Projection Regression Suite / Context Projection 回归套件

The testing framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and e2e coverage for ContextGraph projection.

testing framework 必须为 ContextGraph projection 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 e2e 覆盖。

#### Scenario: Contract tests cover projection DTOs / 合同测试覆盖 Projection DTO

- **WHEN** projection contract tests run
- **THEN** they verify schema versions, serializability, fake substitutability, redaction metadata, budget metadata, and no implementation imports in `platform-contracts`
- **中文** 当 projection contract tests 运行时，必须验证 schema versions、serializability、fake substitutability、redaction metadata、budget metadata，以及 `platform-contracts` 不导入实现包。

#### Scenario: Integration tests cover runtime projection / 集成测试覆盖 Runtime Projection

- **WHEN** runtime integration tests dispatch a model turn
- **THEN** they prove projection runs before provider request construction and model gateway receives only projected context
- **中文** 当 runtime integration tests 派发 model turn 时，必须证明 projection 在 provider request construction 前运行，且 model gateway 只收到 projected context。

### Requirement: Projection Golden Replay / Projection Golden Replay

Golden replay SHALL capture selected nodes, excluded nodes, budget decisions, cache metadata, redaction summaries, and projection terminal state.

golden replay 必须捕获 selected nodes、excluded nodes、budget decisions、cache metadata、redaction summaries 和 projection terminal state。

#### Scenario: Replay detects projection drift / Replay 检测 Projection 漂移

- **WHEN** projection ranking, filtering, redaction, cache, or budget behavior changes
- **THEN** golden replay detects the semantic drift unless the fixture is explicitly updated
- **中文** 当 projection ranking、filtering、redaction、cache 或 budget 行为变化时，golden replay 必须检测 semantic drift，除非 fixture 被显式更新。

### Requirement: Projection Compatibility Fixtures / Projection 兼容性 Fixtures

The testing framework SHALL include compatibility fixtures for projection request, result, event, and cache metadata schemas.

testing framework 必须包含 projection request、result、event 和 cache metadata schemas 的 compatibility fixtures。

#### Scenario: Unsupported projection schema fails closed / 不支持的 Projection Schema 安全失败

- **WHEN** persisted or replayed projection evidence uses an unsupported schema version
- **THEN** compatibility tests prove the system returns a typed compatibility failure instead of silently accepting incompatible state
- **中文** 当 persisted 或 replayed projection evidence 使用 unsupported schema version 时，compatibility tests 必须证明系统返回 typed compatibility failure，而不是静默接受 incompatible state。

### Requirement: Projection Matrix Fixtures / Projection 矩阵 Fixtures

Projection regression SHALL cover empty context, large session, stale cache, secret fixture, hard budget exceeded, memory unavailable, and degraded host scope.

projection regression 必须覆盖 empty context、large session、stale cache、secret fixture、hard budget exceeded、memory unavailable 和 degraded host scope。

#### Scenario: Secret fixture does not leak / Secret Fixture 不泄漏

- **WHEN** projection tests include secret-like context nodes
- **THEN** stdout, JSON, traces, snapshots, cache artifacts, golden fixtures, and assertion messages contain only redacted evidence
- **中文** 当 projection tests 包含 secret-like context nodes 时，stdout、JSON、traces、snapshots、cache artifacts、golden fixtures 和 assertion messages 只能包含 redacted evidence。

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

### Requirement: Checkpoint Undo Regression Coverage / Checkpoint Undo 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, and matrix coverage for checkpoint creation, restore, undo, stale rejection, and secret-safe evidence.

regression framework 必须为 checkpoint creation、restore、undo、stale rejection 和 secret-safe evidence 提供确定性的 unit、contract、integration、golden 和 matrix 覆盖。

#### Scenario: Golden replay covers undo / golden replay 覆盖 undo

- **WHEN** a replay fixture applies a file mutation and then undoes it
- **THEN** replay asserts stable checkpoint ids, restore status, hashes, diagnostics, and redaction fields without raw file content
- **中文** 当 replay fixture 应用 file mutation 后再 undo 时，replay 必须断言稳定的 checkpoint ids、restore status、hashes、diagnostics 和 redaction fields，且不包含 raw file content。

#### Scenario: Matrix covers stale restore rejection / matrix 覆盖 stale restore 拒绝

- **WHEN** fake platform modes modify the file after checkpoint creation
- **THEN** restore is rejected consistently and does not overwrite the newer content
- **中文** 当 fake platform modes 在 checkpoint 创建后修改文件时，restore 必须一致地拒绝，且不得覆盖较新的内容。

### Requirement: Code Intelligence Regression Coverage / 代码智能回归覆盖

The regression framework SHALL cover code intelligence local analyzer behavior with unit, contract, integration, golden, and matrix tests that do not require a live IDE, LSP server, or external network.

regression framework 必须用 unit、contract、integration、golden 和 matrix tests 覆盖 code intelligence local analyzer 行为，且不要求 live IDE、LSP server 或外部网络。

#### Scenario: Golden replay includes code evidence / golden replay 包含代码证据

- **WHEN** a golden trace includes diagnostic or symbol context nodes
- **THEN** replay asserts stable schema, redaction, provider metadata, and no raw secret-like content
- **中文** 当 golden trace 包含 diagnostic 或 symbol context nodes 时，replay 必须断言稳定 schema、redaction、provider metadata，以及没有 raw secret-like content。

### Requirement: Observability Privacy Regression Coverage / 观测隐私回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, and matrix coverage for observability records, privacy settings, export decisions, diagnostic bundles, and no-raw-secret evidence.

regression framework 必须为 observability records、privacy settings、export decisions、diagnostic bundles 和 no-raw-secret evidence 提供 deterministic unit、contract、integration、golden、compatibility 和 matrix 覆盖。

#### Scenario: Golden replay includes observability evidence / golden replay 包含观测证据

- **WHEN** a golden trace includes runtime events and observability records
- **THEN** replay asserts stable schema, privacy decision metadata, redaction summary, and no raw secret-like content
- **中文** 当 golden trace 包含 runtime events 与 observability records 时，replay 必须断言 stable schema、privacy decision metadata、redaction summary 和无 raw secret-like content。

#### Scenario: Matrix covers privacy modes / matrix 覆盖隐私模式

- **WHEN** matrix tests run
- **THEN** they cover default local diagnostics, telemetry disabled, external export denied, explicit local bundle generation, and secret fixtures
- **中文** 当 matrix tests 运行时，必须覆盖 default local diagnostics、telemetry disabled、external export denied、explicit local bundle generation 和 secret fixtures。

#### Scenario: Compatibility requires schemas / compatibility 要求 schema

- **WHEN** compatibility tests inspect observability records and diagnostic bundles
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 observability records 与 diagnostic bundles 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

### Requirement: Skill System Regression Coverage / Skill System 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, and matrix coverage for skills v1 without requiring live plugins, external catalogs, network access, or host-specific APIs.

regression framework 必须为 skills v1 提供 deterministic unit、contract、integration、golden、compatibility 和 matrix 覆盖，且不要求 live plugins、external catalogs、network access 或 host-specific APIs。

#### Scenario: Golden replay includes skill activation / golden replay 包含 skill activation

- **WHEN** a golden trace includes trusted skill activation and context segment projection
- **THEN** replay asserts stable manifest schema, loading metadata, context segment fingerprints, redaction metadata, and no raw secret-like content
- **中文** 当 golden trace 包含 trusted skill activation 与 context segment projection 时，replay 必须断言 stable manifest schema、loading metadata、context segment fingerprints、redaction metadata 和无 raw secret-like content。

#### Scenario: Matrix covers trust and loading modes / matrix 覆盖 trust 与 loading modes

- **WHEN** matrix tests run
- **THEN** they cover trusted built-in skills, untrusted workspace skills, disabled skills, malformed manifests, summary-only listing, explicit activation, and bounded projection
- **中文** 当 matrix tests 运行时，必须覆盖 trusted built-in skills、untrusted workspace skills、disabled skills、malformed manifests、summary-only listing、explicit activation 和 bounded projection。

#### Scenario: Compatibility requires skill schemas / compatibility 要求 skill schemas

- **WHEN** compatibility tests inspect skill manifests, activation results, summaries, or context segments
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 skill manifests、activation results、summaries 或 context segments 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

### Requirement: Hook System Regression Coverage / Hook System 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and lint coverage for hooks v1 without requiring live plugins, external marketplaces, network access, host-specific APIs, or nondeterministic timers.

regression framework 必须为 hooks v1 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 lint 覆盖，且不要求 live plugins、external marketplaces、network access、host-specific APIs 或 nondeterministic timers。

#### Scenario: Golden replay includes hook invocation / golden replay 包含 hook invocation

- **WHEN** a golden trace includes hook validation, order projection, invocation, output records, and failure policy evidence
- **THEN** replay asserts stable schema versions, ordered hook ids, terminal status, output kinds, diagnostics, redaction metadata, and replay fingerprints
- **中文** 当 golden trace 包含 hook validation、order projection、invocation、output records 和 failure policy evidence 时，replay 必须断言 stable schema versions、ordered hook ids、terminal status、output kinds、diagnostics、redaction metadata 和 replay fingerprints。

#### Scenario: Matrix covers ordering and failure modes / matrix 覆盖 ordering 与 failure modes

- **WHEN** matrix tests run
- **THEN** they cover trusted built-in hooks, untrusted workspace hooks, disabled hooks, malformed manifests, stable ordering, continue, block, disable, rollback-requested, timeout, and observe-only output modes
- **中文** 当 matrix tests 运行时，必须覆盖 trusted built-in hooks、untrusted workspace hooks、disabled hooks、malformed manifests、stable ordering、continue、block、disable、rollback-requested、timeout 和 observe-only output modes。

#### Scenario: Compatibility requires hook schemas / compatibility 要求 hook schemas

- **WHEN** compatibility tests inspect hook manifests, summaries, invocation requests, invocation results, output records, or diagnostics
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 hook manifests、summaries、invocation requests、invocation results、output records 或 diagnostics 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

#### Scenario: Lint rejects legacy hook APIs / lint 拒绝旧 hook APIs

- **WHEN** hook contracts or implementations reintroduce generic `register` or `run` APIs
- **THEN** architecture lint fails with a stable hook-system rule id
- **中文** 当 hook contracts 或 implementations 重新引入泛化 `register` 或 `run` APIs 时，architecture lint 必须以稳定的 hook-system rule id 失败。

### Requirement: MCP Gateway Regression Coverage / MCP Gateway 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and lint coverage for MCP gateway v1 without requiring real MCP servers, network access, process spawning, live credentials, plugin marketplaces, or host-specific APIs.

regression framework 必须为 MCP gateway v1 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 lint 覆盖，且不要求 real MCP servers、network access、process spawning、live credentials、plugin marketplaces 或 host-specific APIs。

#### Scenario: Golden replay includes MCP invocation / golden replay 包含 MCP invocation

- **WHEN** a golden trace includes MCP server connection, tool discovery, tool invocation, resource read, prompt listing, and failure isolation evidence
- **THEN** replay asserts stable schema versions, server ids, namespace, target ids, terminal status, diagnostics, redaction metadata, and replay fingerprints
- **中文** 当 golden trace 包含 MCP server connection、tool discovery、tool invocation、resource read、prompt listing 和 failure isolation evidence 时，replay 必须断言 stable schema versions、server ids、namespace、target ids、terminal status、diagnostics、redaction metadata 和 replay fingerprints。

#### Scenario: Matrix covers trust and transport modes / matrix 覆盖 trust 与 transport modes

- **WHEN** matrix tests run
- **THEN** they cover trusted fake server, workspace server, untrusted server, disabled server, malformed manifest, namespace collision, unsupported schema, unavailable real transport, timeout, unknown tool, unknown resource, and redaction behavior
- **中文** 当 matrix tests 运行时，必须覆盖 trusted fake server、workspace server、untrusted server、disabled server、malformed manifest、namespace collision、unsupported schema、unavailable real transport、timeout、unknown tool、unknown resource 和 redaction behavior。

#### Scenario: Compatibility requires MCP schemas / compatibility 要求 MCP schemas

- **WHEN** compatibility tests inspect MCP manifests, server summaries, tool summaries, resource summaries, prompt summaries, tool call results, resource read results, or diagnostics
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 MCP manifests、server summaries、tool summaries、resource summaries、prompt summaries、tool call results、resource read results 或 diagnostics 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

#### Scenario: Lint rejects legacy MCP APIs / lint 拒绝旧 MCP APIs

- **WHEN** MCP contracts or implementations reintroduce generic pre-v1 APIs
- **THEN** architecture lint fails with a stable MCP gateway rule id
- **中文** 当 MCP contracts 或 implementations 重新引入泛化 pre-v1 APIs 时，architecture lint 必须以稳定 MCP gateway rule id 失败。
