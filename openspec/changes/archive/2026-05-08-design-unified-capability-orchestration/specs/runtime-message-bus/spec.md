## ADDED Requirements

### Requirement: Capability Invocation Event Topics

The runtime message bus SHALL define owned topics for capability invocation requested, policy checked, approval required, scheduled, started, progress, completed, failed, cancelled, rolled back, and replay recorded events.

runtime message bus 必须为 capability invocation requested、policy checked、approval required、scheduled、started、progress、completed、failed、cancelled、rolled back 和 replay recorded events 定义 owned topics。

#### Scenario: Invocation event includes envelope reference

- **WHEN** a governed capability emits a bus event
- **THEN** the event includes invocation id, producer, owner, session id when available, workflow id when available, task id when available, agent id when available, trace context, redaction class, trust boundary, and compatibility metadata

#### Scenario: Host observes projected events

- **WHEN** a host adapter subscribes to execution progress
- **THEN** it receives protocol-projected canonical runtime events rather than private subsystem state
