## ADDED Requirements

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
