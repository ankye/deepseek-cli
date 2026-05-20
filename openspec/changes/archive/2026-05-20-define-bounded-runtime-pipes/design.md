## Context

Linux pipes work because buffers are bounded and writers receive backpressure. DeepSeek needs the same discipline for context streams, tool results, plugin events, agent work, and protocol transport.

Linux pipe 可靠，是因为 buffer 有界且 writer 会收到 backpressure。DeepSeek 的 context streams、tool results、plugin events、agent work 与 protocol transport 也需要同样纪律。

## Goals / Non-Goals

**Goals:**

- Define pipe identity, sequence, capacity, pressure state, overflow policy, and replay semantics. / 定义 pipe identity、sequence、capacity、pressure state、overflow policy 与 replay semantics。
- Keep lossy behavior explicit and never silent. / 让有损行为显式化，绝不静默丢失。
- Make diagnostics show pressure before user-visible failures. / 让 diagnostics 在用户可见失败前暴露 pressure。

**Non-Goals:**

- Do not rewrite every transport in this proposal. / 本提案不重写所有 transport。
- Do not change model provider APIs directly. / 不直接改变模型 provider APIs。

## Decisions

1. Every pipe has capacity and an overflow policy. / 每条 pipe 都有 capacity 与 overflow policy。

   Policies may include block, drop-newest, drop-oldest, compact, summarize, or fail-closed, but the policy must be declared.

   policy 可包括 block、drop-newest、drop-oldest、compact、summarize 或 fail-closed，但必须声明。

2. Backpressure is an event, not just an internal boolean. / Backpressure 是事件，不只是内部布尔值。

   Pressure transitions should be visible to diagnostics and replay where relevant.

   Pressure transitions 应在相关场景中对 diagnostics 与 replay 可见。

3. Replay safety outranks throughput. / Replay safety 高于吞吐。

   If a stream affects deterministic replay, overflow must either preserve deterministic projection or fail closed with a stable diagnostic.

   如果 stream 影响确定性 replay，overflow 必须保留确定性投影，或以稳定 diagnostic fail closed。

## Rollout

1. Define pipe metadata and diagnostics. / 定义 pipe metadata 与 diagnostics。
2. Add bus-level capacity and pressure records. / 增加 bus-level capacity 与 pressure records。
3. Adapt protocol envelopes additively. / 以 additive 方式适配 protocol envelopes。

## Open Questions

- Which streams may compact or summarize under pressure, and which must fail closed? / 哪些 streams 可在 pressure 下 compact 或 summarize，哪些必须 fail closed？
