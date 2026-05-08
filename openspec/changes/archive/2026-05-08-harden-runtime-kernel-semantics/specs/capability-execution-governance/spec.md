## ADDED Requirements

### Requirement: Strict Execution Envelope Validation

The execution envelope validator SHALL validate required fields, field types, enum values, timeout bounds, trace shape, schema metadata, policy metadata, cancellation metadata, replay metadata, and idempotency metadata before scheduling.

execution envelope validator 必须在 scheduling 前校验 required fields、field types、enum values、timeout bounds、trace shape、schema metadata、policy metadata、cancellation metadata、replay metadata 和 idempotency metadata。

#### Scenario: Invalid timeout is rejected before policy

- **WHEN** an envelope declares a non-positive, non-finite, or out-of-range timeout
- **THEN** validation fails before policy evaluation or scheduler submission

#### Scenario: Malformed trace is rejected before policy

- **WHEN** an envelope lacks trace id, span id, correlation id, or required session linkage
- **THEN** validation fails before policy evaluation or scheduler submission

### Requirement: Abort-Aware Capability Context

Governed capability executors SHALL receive a context that includes envelope, trace, abort signal, cancellation metadata, and immutable execution metadata.

governed capability executors 必须接收包含 envelope、trace、abort signal、cancellation metadata 和 immutable execution metadata 的 context。

#### Scenario: Capability observes cancellation

- **WHEN** a capability invocation is cancelled or timed out
- **THEN** the executor can observe the aborted signal and must not continue side-effecting work
