## ADDED Requirements

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
