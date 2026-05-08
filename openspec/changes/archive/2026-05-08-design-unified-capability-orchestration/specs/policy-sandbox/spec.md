## ADDED Requirements

### Requirement: Policy Evaluates Execution Envelopes

The policy engine, approval broker, sandbox runtime, and audit sink SHALL evaluate governed execution envelopes instead of ad hoc tool-specific request shapes.

policy engine、approval broker、sandbox runtime 和 audit sink 必须评估 governed execution envelopes，而不是零散的 tool-specific request shapes。

#### Scenario: Policy has complete caller and resource context

- **WHEN** policy evaluates an executable capability
- **THEN** it receives caller, source, trust boundary, permissions, side-effect level, agent scope, session scope, resource locks, sandbox profile, redaction class, and trace metadata

#### Scenario: Sandbox execution is envelope-linked

- **WHEN** sandbox runtime executes a side-effecting capability
- **THEN** sandbox events and audit records reference the invocation id and trace context from the execution envelope
