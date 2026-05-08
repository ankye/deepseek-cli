# policy-sandbox Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Pure Policy Decision

The policy engine SHALL evaluate capability execution requests and return allow, ask, deny, rewrite, or require-sandbox decisions without directly prompting users or executing tools.

#### Scenario: Policy allows safe request

- **WHEN** a capability request matches an allow policy
- **THEN** the policy engine returns an allow decision

#### Scenario: Policy asks for uncertain request

- **WHEN** a capability request requires user approval
- **THEN** the policy engine returns an ask decision without rendering UI

### Requirement: Approval Broker Boundary

The system SHALL define an approval broker interface responsible for obtaining user or host decisions when policy returns ask.

#### Scenario: Headless approval request

- **WHEN** policy returns ask in a headless caller
- **THEN** the runtime emits a structured permission requested event or uses the configured approval broker

### Requirement: Sandbox Runtime Boundary

The system SHALL define a sandbox runtime interface for executing side-effecting capabilities with filesystem, process, network, environment, and timeout controls.

#### Scenario: Execute through sandbox adapter

- **WHEN** a capability requires sandbox enforcement
- **THEN** the tool orchestrator executes it through the sandbox runtime boundary

### Requirement: Audit Records

The system SHALL create audit records for policy decisions, approval outcomes, sandbox mode, capability id, and redacted input summaries.

#### Scenario: Record denied request

- **WHEN** policy denies a capability request
- **THEN** an audit record is created with the decision and redacted request summary

### Requirement: Policy Evaluates Execution Envelopes

The policy engine, approval broker, sandbox runtime, and audit sink SHALL evaluate governed execution envelopes instead of ad hoc tool-specific request shapes.

policy engine、approval broker、sandbox runtime 和 audit sink 必须评估 governed execution envelopes，而不是零散的 tool-specific request shapes。

#### Scenario: Policy has complete caller and resource context

- **WHEN** policy evaluates an executable capability
- **THEN** it receives caller, source, trust boundary, permissions, side-effect level, agent scope, session scope, resource locks, sandbox profile, redaction class, and trace metadata

#### Scenario: Sandbox execution is envelope-linked

- **WHEN** sandbox runtime executes a side-effecting capability
- **THEN** sandbox events and audit records reference the invocation id and trace context from the execution envelope

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

