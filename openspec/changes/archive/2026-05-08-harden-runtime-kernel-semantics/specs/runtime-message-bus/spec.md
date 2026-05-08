## ADDED Requirements

### Requirement: Explicit Bus Failure Semantics

The runtime message bus and kernel integration SHALL expose explicit failure semantics for publish, subscription, replay storage, and backpressure.

runtime message bus 与 kernel integration 必须为 publish、subscription、replay storage 和 backpressure 暴露明确 failure semantics。

#### Scenario: Backpressure fails replayable invocation

- **WHEN** bus backpressure prevents publishing a replayable kernel event
- **THEN** the kernel invocation fails with a typed event persistence error and the failure is covered by contract tests

#### Scenario: Subscriber queue is bounded

- **WHEN** a subscriber consumes events slowly
- **THEN** bus buffering remains bounded or emits a typed backpressure failure instead of growing unbounded
