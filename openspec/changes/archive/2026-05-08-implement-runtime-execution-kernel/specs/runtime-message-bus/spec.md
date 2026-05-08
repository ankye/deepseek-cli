## ADDED Requirements

### Requirement: In-Process Runtime Message Bus

The platform SHALL provide an in-process runtime message bus implementation for kernel events.

平台必须提供 in-process runtime message bus implementation，用于 kernel events。

#### Scenario: Publish and subscribe events

- **WHEN** kernel components publish lifecycle, envelope, policy, scheduler, execution, result, or error events
- **THEN** subscribers receive those events in publish order for the invocation stream

#### Scenario: Subscriber receives typed events

- **WHEN** CLI, tests, or future VSCode adapters subscribe to runtime events
- **THEN** each event includes a stable type, version, timestamp, trace context, and redaction metadata

### Requirement: Event Stream Projection

The message bus SHALL support host projection without transferring execution ownership to the host.

message bus 必须支持 host projection，但不得把 execution ownership 转移给 host。

#### Scenario: CLI projects stream-json output

- **WHEN** CLI runs a kernel-backed command with stream output enabled
- **THEN** it serializes canonical events without mutating kernel lifecycle state
