## ADDED Requirements

### Requirement: Context Stream Backpressure / 上下文流 Backpressure

The runtime message bus SHALL support bounded context stream and backpressure events for transferring or projecting context blocks, tool-result summaries, and pipeline manifests.

Runtime message bus 必须支持有界 context stream 与 backpressure events，用于传输或投影 context blocks、tool-result summaries 与 pipeline manifests。

#### Scenario: Large stream triggers backpressure / 大型流触发 Backpressure

- **WHEN** a producer emits context blocks or tool-result summaries faster than a subscriber or buffer policy can accept
- **THEN** the bus emits a structured backpressure event and applies the configured overflow policy instead of growing unbounded memory
- **中文** 当 producer 发出 context blocks 或 tool-result summaries 的速度超过 subscriber 或 buffer policy 可接受范围时，bus 必须发出结构化 backpressure event，并应用配置的 overflow policy，而不是无限增长内存。

#### Scenario: Backpressure is replayable / Backpressure 可 Replay

- **WHEN** backpressure changes which context blocks are delivered, summarized, or deferred
- **THEN** the bus record includes correlation id, stream id, affected block ids, overflow policy, and redaction metadata
- **中文** 当 backpressure 改变哪些 context blocks 被传递、摘要或延期时，bus record 必须包含 correlation id、stream id、affected block ids、overflow policy 与 redaction metadata。

### Requirement: Ordered Pipeline Stream Delivery / 有序管道流传递

The runtime message bus SHALL preserve declared pipeline order within a stream correlation.

Runtime message bus 必须在 stream correlation 内保持声明的 pipeline order。

#### Scenario: Block delivery order is stable / 块传递顺序稳定

- **WHEN** context blocks from the same pipeline manifest are published through the bus
- **THEN** subscribers observe blocks in manifest order or receive a structured stream-failed event
- **中文** 当同一 pipeline manifest 的 context blocks 通过 bus 发布时，subscribers 必须按 manifest order 观察 blocks，或者收到结构化 stream-failed event。
