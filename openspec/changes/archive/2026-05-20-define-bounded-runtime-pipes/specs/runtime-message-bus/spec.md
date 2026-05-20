## ADDED Requirements

### Requirement: Bounded Runtime Pipes / 有界 Runtime Pipes

Runtime message bus streams SHALL declare capacity, stream identity, ordering, backpressure behavior, overflow policy, and replay impact.

Runtime message bus streams 必须声明 capacity、stream identity、ordering、backpressure behavior、overflow policy 与 replay impact。

#### Scenario: Producer exceeds capacity / Producer 超过容量

- **WHEN** a producer writes beyond a stream capacity
- **THEN** the bus applies the declared overflow policy and emits a pressure diagnostic or event
- **中文** 当 producer 写入超过 stream capacity 时，bus 必须应用声明的 overflow policy，并发出 pressure diagnostic 或 event。

### Requirement: Replay-Safe Pressure Handling / Replay-safe Pressure 处理

Backpressure and overflow handling SHALL preserve deterministic replay or fail closed with stable diagnostics.

Backpressure 与 overflow handling 必须保留确定性 replay，或以稳定 diagnostics fail closed。

#### Scenario: Lossless stream cannot drop records / Lossless Stream 不能丢记录

- **WHEN** a lossless replay-affecting stream reaches capacity
- **THEN** the bus blocks, backpressures, or fails closed instead of silently dropping records
- **中文** 当 lossless 且影响 replay 的 stream 达到容量时，bus 必须 block、backpressure 或 fail closed，而不是静默丢弃记录。

### Requirement: Pressure Diagnostics / Pressure 诊断

The bus SHALL expose pressure state, blocked producers, overflow counts, compaction counts, and fail-closed stream ids to diagnostics.

Bus 必须向 diagnostics 暴露 pressure state、blocked producers、overflow counts、compaction counts 与 fail-closed stream ids。

#### Scenario: Diagnostics shows bus pressure / Diagnostics 显示 Bus 压力

- **WHEN** a runtime stream is under sustained pressure
- **THEN** diagnostics identifies the stream, producer, consumer, capacity, current depth, policy, and suggested action
- **中文** 当 runtime stream 持续处于 pressure 时，diagnostics 必须识别 stream、producer、consumer、capacity、current depth、policy 与建议动作。
