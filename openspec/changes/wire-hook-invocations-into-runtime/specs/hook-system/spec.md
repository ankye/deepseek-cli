## ADDED Requirements

### Requirement: Runtime Fires Canonical Hook Lifecycle Points / Runtime 触发规范 Hook 生命周期点

The runtime SHALL invoke the hook system at canonical lifecycle points during every agent turn, so that registered hooks observe model calls and tool executions in real time rather than remaining inert.

runtime 必须在每个 agent turn 的规范生命周期点触发 hook system,使注册的 hook 能实时观察 model 调用与 tool 执行,而不是保持 inert。

#### Scenario: Runtime invokes five hook points per turn / 每次 turn 触发五个 hook 点

- **WHEN** an agent turn executes via `runAgentLoop`
- **THEN** the runtime SHALL call `hooks.invokeHooks` at exactly these five points, in order: `user-input.before` (once before projecting context), `model-call.before` (before each model iteration), `model-call.after` (after each iteration completes), `tool-execution.before` (after preflight, before kernel execution), and `tool-execution.after` (after the tool terminal event)
- **中文** 当 agent turn 通过 `runAgentLoop` 执行时,runtime 必须在以下五个点依序调用 `hooks.invokeHooks`:`user-input.before`(在 context 投影前一次)、`model-call.before`(每次 model iteration 前)、`model-call.after`(每次 iteration 结束后)、`tool-execution.before`(preflight 通过后、kernel 执行前)、`tool-execution.after`(tool terminal 事件后)。

#### Scenario: Each invocation emits a hooks.invoked event / 每次调用发 hooks.invoked 事件

- **WHEN** the runtime completes a hook invocation at any of the five wired points
- **THEN** it emits a single `hooks.invoked` runtime event with `{point, status, hookCount, traceId}`, recorded through the normal observability / adapter channels so audits can reconstruct the turn
- **中文** 当 runtime 在任一已接线点完成一次 hook invocation 时,必须通过正常 observability / adapter 渠道发一条 `hooks.invoked` runtime event,字段含 `{point, status, hookCount, traceId}`,便于审计还原该 turn。

#### Scenario: user-input.before block aborts the turn / user-input.before block 中止 turn

- **WHEN** a hook with `failurePolicy: "block"` returns a blocked status at the `user-input.before` point
- **THEN** the runtime SHALL skip model dispatch, emit `agent.loop.failed` with summary `reason: "blocked-by-hook"`, and not issue any model or tool call for that turn
- **中文** 当 `failurePolicy: "block"` 的 hook 在 `user-input.before` 返回 blocked 状态时,runtime 必须跳过 model 分发,发出带 `reason: "blocked-by-hook"` 的 `agent.loop.failed`,该 turn 不得发起任何 model 或 tool 调用。

#### Scenario: model-call.before block stops the iteration / model-call.before block 跳过迭代

- **WHEN** a hook with `failurePolicy: "block"` returns blocked at the `model-call.before` point
- **THEN** the runtime SHALL emit a `model.blocked` event and then a terminal `agent.loop.failed` with `reason: "blocked-by-hook"`, without calling `deps.models.stream` for that iteration
- **中文** 当 `failurePolicy: "block"` 的 hook 在 `model-call.before` 返回 blocked 状态时,runtime 必须发 `model.blocked` 事件,随后发终态 `agent.loop.failed`(`reason: "blocked-by-hook"`),该 iteration 不得调用 `deps.models.stream`。

#### Scenario: tool-execution.before block denies the tool / tool-execution.before block 拒绝该工具

- **WHEN** a hook with `failurePolicy: "block"` returns blocked at the `tool-execution.before` point
- **THEN** the runtime SHALL skip `kernel.execute` for that tool call, synthesize a `model.tool.result` event with feedback status `"denied"` so the agent sees the refusal, and continue the turn loop for the next iteration rather than aborting the turn
- **中文** 当 `failurePolicy: "block"` 的 hook 在 `tool-execution.before` 返回 blocked 状态时,runtime 必须跳过该 tool 的 `kernel.execute`,合成一条 feedback status 为 `"denied"` 的 `model.tool.result` event 让 agent 看到被拒绝,并继续后续迭代,而不是中止整个 turn。

#### Scenario: Observe-only hook failure does not crash the turn / observe-only hook 失败不炸 turn

- **WHEN** a hook with `failurePolicy: "continue"` (the default) fails or times out
- **THEN** the runtime records the failure in the `hooks.invoked` event and via observability, and the turn proceeds to the next lifecycle point unchanged
- **中文** 当 `failurePolicy: "continue"`(默认)的 hook 失败或超时时,runtime 必须把失败记录到 `hooks.invoked` 事件与 observability,turn 继续进行到下一个生命周期点,不受影响。
