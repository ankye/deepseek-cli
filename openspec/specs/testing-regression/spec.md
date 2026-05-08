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

