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

