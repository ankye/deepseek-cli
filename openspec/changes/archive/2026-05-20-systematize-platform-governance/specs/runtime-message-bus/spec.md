## ADDED Requirements

### Requirement: Pipe Semantics For Runtime Streams / Runtime Streams 的 Pipe 语义

The runtime message bus SHALL govern context, tool-result, plugin, MCP, agent, and runtime event streams as bounded ordered pipes with explicit backpressure and overflow policy.

Runtime message bus 必须将 context、tool-result、plugin、MCP、agent 与 runtime event streams 治理为有界有序 pipes，并具备显式 backpressure 与 overflow policy。

#### Scenario: Stream buffer is bounded / Stream Buffer 有界

- **WHEN** a producer emits stream records faster than a consumer can process them
- **THEN** the bus applies configured backpressure or overflow behavior and records a replayable diagnostic instead of allowing unbounded memory growth
- **中文** 当 producer 发出 stream records 的速度超过 consumer 处理能力时，bus 必须应用配置的 backpressure 或 overflow 行为，并记录可 replay diagnostic，而不是允许内存无界增长。

#### Scenario: Ordered stream failure is explicit / 有序流失败显式化

- **WHEN** ordered delivery within a correlation stream cannot be preserved
- **THEN** the bus emits a typed stream failure event and prevents subscribers from silently observing reordered execution facts
- **中文** 当 correlation stream 内的有序传递无法保持时，bus 必须发出 typed stream failure event，并防止 subscribers 静默观察到重排后的执行事实。

### Requirement: Backpressure Is Product Evidence / Backpressure 是产品证据

Backpressure events SHALL be included in diagnostics and regression replay when they affect context projection, tool-result continuation, plugin execution, or agent orchestration.

当 backpressure 影响 context projection、tool-result continuation、plugin execution 或 agent orchestration 时，backpressure events 必须纳入 diagnostics 与 regression replay。

#### Scenario: Backpressure affects context / Backpressure 影响 Context

- **WHEN** context stream backpressure causes a block to be summarized, deferred, excluded, or dropped
- **THEN** diagnostics record the affected block id, stream id, policy decision, and replay fingerprint
- **中文** 当 context stream backpressure 导致某 block 被摘要、延期、排除或丢弃时，diagnostics 必须记录 affected block id、stream id、policy decision 与 replay fingerprint。
