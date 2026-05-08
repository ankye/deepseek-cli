## ADDED Requirements

### Requirement: Implemented Execution Envelope Builder

The platform SHALL provide an implemented execution envelope builder that creates stable envelopes for runtime kernel invocations.

平台必须提供已实现的 execution envelope builder，为 runtime kernel invocations 创建稳定 envelopes。

#### Scenario: Build minimal envelope

- **WHEN** the kernel receives a read-only built-in capability invocation
- **THEN** the builder creates an envelope with invocation id, capability id, version, kind, caller, session id when available, workflow id when available, policy context, side-effect level, timeout, cancellation metadata, trace context, and replay policy

#### Scenario: Validate envelope before execution

- **WHEN** an envelope is missing required governance metadata
- **THEN** validation fails before policy evaluation or scheduler submission

### Requirement: Kernel Invocation Result Contract

The governed execution pipeline SHALL normalize capability execution results into typed success, failure, cancellation, and timeout outcomes.

governed execution pipeline 必须将 capability execution results 规范化为 typed success、failure、cancellation 和 timeout outcomes。

#### Scenario: Normalize successful result

- **WHEN** a built-in capability returns successfully
- **THEN** the kernel publishes a completed event containing normalized output metadata, redaction class, trace id, and replay snapshot reference when available

#### Scenario: Normalize timeout result

- **WHEN** scheduler timeout cancels an invocation
- **THEN** the kernel publishes a timeout or cancelled outcome with envelope id, timeout metadata, and no partial host-owned state
