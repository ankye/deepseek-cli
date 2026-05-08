## ADDED Requirements

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
