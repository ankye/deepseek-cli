## ADDED Requirements

### Requirement: Deterministic Policy Decision Interface

The policy/sandbox package SHALL expose a deterministic first policy decision interface for kernel envelopes.

policy/sandbox package 必须为 kernel envelopes 暴露 deterministic first policy decision interface。

#### Scenario: Allow read-only built-in capability

- **WHEN** the kernel evaluates a read-only deterministic built-in capability envelope
- **THEN** policy returns an allow decision with audit metadata before scheduler submission

#### Scenario: Deny disallowed side effect

- **WHEN** an envelope declares a side effect that the current policy does not allow
- **THEN** policy returns a deny decision and the kernel emits a rejection event without scheduling the task

### Requirement: Explicit Sandbox Profile Selection

The policy/sandbox package SHALL select or stub a sandbox profile explicitly for each governed invocation.

policy/sandbox package 必须为每个 governed invocation 显式选择或 stub sandbox profile。

#### Scenario: Sandbox decision is evented

- **WHEN** policy selects a sandbox profile for an invocation
- **THEN** the kernel publishes the selected profile metadata in a redacted policy/sandbox event
