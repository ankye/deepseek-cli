# Bounded Runtime Pipes / 有界 Runtime 管道

Runtime streams are bounded pipes. A producer cannot write unbounded events into memory, session replay, protocol transport, or host rendering without an explicit capacity and overflow policy.

Runtime streams 是有界管道。Producer 不能在没有显式 capacity 与 overflow policy 的情况下，把无限事件写入内存、session replay、protocol transport 或 host rendering。

## Pipe Metadata / 管道元数据

Every governed pipe declares:

每条受治理管道声明：

- stream id / stream id
- topic / topic
- owner / owner
- capacity and high watermark / capacity 与 high watermark
- overflow policy / overflow policy
- delivery class / delivery class
- replay impact / replay impact
- redaction metadata / redaction metadata

`BusEnvelope.pipe` and `ProtocolEnvelope.stream` carry additive metadata: sequence, pressure state, loss policy, delivery class, replay impact, dropped count, and compaction count.

`BusEnvelope.pipe` 与 `ProtocolEnvelope.stream` 携带增量 metadata：sequence、pressure state、loss policy、delivery class、replay impact、dropped count 与 compaction count。

## Stream Classes / 流分类

| Stream / 流 | Owner / 责任方 | Delivery / 投递 | Overflow / 溢出 | Replay impact / Replay 影响 |
| --- | --- | --- | --- | --- |
| `runtime.events` | `runtime-message-bus` | compactable | drop-oldest | diagnostic-only |
| `session.replay` | `session-store` | lossless | fail-closed | replay-affecting |
| `context.pipeline` | `context-engine` | compactable | compact | replay-affecting |
| `tool.results` | `runtime` | summarizable | summarize | diagnostic-only |
| `agent.stream` | `agent-management` | lossless | block | replay-affecting |
| `plugin.events` | `plugin-system` | fail-closed | fail-closed | replay-affecting |
| `mcp.events` | `mcp-gateway` | fail-closed | fail-closed | replay-affecting |

## Overflow Rules / 溢出规则

- Lossless replay-affecting streams must never silently drop records. / lossless 且 replay-affecting 的 stream 绝不能静默丢记录。
- Compactable streams must record compaction counts and replay fingerprints. / compactable stream 必须记录 compaction count 与 replay fingerprint。
- Summarizable streams may replace raw output with bounded evidence references. / summarizable stream 可以用有界证据引用替代 raw output。
- Fail-closed streams reject writes with stable diagnostics when capacity is exhausted. / fail-closed stream 在容量耗尽时用稳定 diagnostics 拒绝写入。
- Host renderers consume pressure metadata; they must not inspect runtime internals to infer queue health. / host renderer 消费 pressure metadata；不得检查 runtime internals 来推断队列健康。

## Diagnostics / 诊断

Bus diagnostics expose:

Bus diagnostics 暴露：

- stream id, topic, producer, consumer / stream id、topic、producer、consumer
- capacity and current depth / capacity 与 current depth
- pressure state / pressure state
- overflow policy and delivery class / overflow policy 与 delivery class
- dropped, compacted, blocked, and fail-closed counts / dropped、compacted、blocked 与 fail-closed count
- suggested action / 建议动作

This makes pressure a replayable runtime fact rather than an invisible memory condition.

这让 pressure 成为可 replay 的 runtime fact，而不是不可见的内存状态。
