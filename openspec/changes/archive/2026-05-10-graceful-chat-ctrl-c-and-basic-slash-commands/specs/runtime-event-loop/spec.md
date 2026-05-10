## MODIFIED Requirements

### Requirement: Runtime Interruption Contract

The runtime SHALL expose an interruption mechanism that can cancel an in-progress turn via an `AbortSignal` on `AgentLoopRequest` and SHALL emit a terminal `agent.loop.cancelled` event when the signal fires.

runtime 必须通过 `AgentLoopRequest.signal`（`AbortSignal`）暴露取消机制，信号触发时必须发出终端事件 `agent.loop.cancelled`。

#### Scenario: Interrupt active turn via signal

- **WHEN** a caller passes an `AbortSignal` that is aborted while `runAgentLoop` is mid-turn
- **THEN** the active turn stops at the next yield boundary, any in-flight model stream or tool execution is aborted, and the loop emits a single terminal `agent.loop.cancelled` event with `status: "cancelled"`, `reason: "user-cancelled"`, plus the accumulated `iterations`, `toolCalls`, and `assistantText`
- **中文** 当调用者传入的 `AbortSignal` 在 `runAgentLoop` 运行中被 abort 时，活跃 turn 必须在下一个 yield 边界停止，进行中的 model stream 或 tool execution 必须取消，并在最后发出一个终态事件 `agent.loop.cancelled`，字段包含 `status: "cancelled"`、`reason: "user-cancelled"`、累计的 `iterations`、`toolCalls` 与 `assistantText`。

#### Scenario: Cancelled turn persists partial events

- **WHEN** an abort terminates a turn after some events have been emitted
- **THEN** every event up to and including `agent.loop.cancelled` is recorded via the runtime adapter so session resume sees the partial turn, no `agent.loop.completed` or `agent.loop.failed` is emitted for the same turn
- **中文** 当 abort 在部分事件已发出后终止一个 turn 时，包括 `agent.loop.cancelled` 在内的所有事件必须经 runtime adapter 记录，session resume 能看到该半截 turn；同一 turn 不得再发 `agent.loop.completed` 或 `agent.loop.failed`。

#### Scenario: Signal already aborted before first iteration

- **WHEN** `runAgentLoop` is called with a signal that is already aborted
- **THEN** the loop emits `agent.loop.started`, then `agent.loop.cancelled` with zero iterations and empty `assistantText`, and returns without dispatching to the model
- **中文** 当 `runAgentLoop` 被调用时传入已经 abort 的 signal，loop 必须发 `agent.loop.started`，再发 iterations=0 且 `assistantText` 为空的 `agent.loop.cancelled`，且不得派发给 model。
