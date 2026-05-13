## ADDED Requirements

### Requirement: Runtime Events Carry CreatedAt / Runtime Events 携带 CreatedAt

Runtime events SHALL include a canonical ISO `createdAt` timestamp that is stable for replay and persistence correlation.

Runtime events 必须包含 canonical ISO `createdAt` timestamp，用于 replay 与 persistence correlation。

#### Scenario: Runtime event has createdAt / Runtime Event 有 CreatedAt

- **WHEN** runtime emits any canonical event
- **THEN** the event includes a parseable ISO `createdAt` timestamp
- **中文** 当 runtime 发出任意 canonical event 时，该 event 必须包含可解析的 ISO `createdAt` timestamp。

#### Scenario: Persisted event timestamp matches event / 持久化事件时间匹配

- **WHEN** runtime persists an emitted event to session records or bus envelopes
- **THEN** the persisted timestamp uses the event `createdAt` value rather than an unrelated host timestamp
- **中文** 当 runtime 将 emitted event 持久化到 session records 或 bus envelopes 时，持久化 timestamp 必须使用该 event 的 `createdAt` 值，而不是无关的 host timestamp。
