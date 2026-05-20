## ADDED Requirements

### Requirement: Stream Pressure Metadata / Stream Pressure Metadata

Host/runtime protocol envelopes SHALL support additive stream metadata for pressure-aware transport.

Host/runtime protocol envelopes 必须支持 additive stream metadata，以承载 pressure-aware transport。

#### Scenario: Envelope carries stream identity / Envelope 携带 Stream Identity

- **WHEN** a protocol message belongs to a bounded runtime stream
- **THEN** the envelope can include stream id, sequence, pressure state, loss policy, and replay impact without breaking older consumers
- **中文** 当 protocol message 属于有界 runtime stream 时，envelope 可以包含 stream id、sequence、pressure state、loss policy 与 replay impact，且不破坏旧 consumer。
