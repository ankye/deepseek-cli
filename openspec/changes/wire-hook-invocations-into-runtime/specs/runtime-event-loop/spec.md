## ADDED Requirements

### Requirement: Runtime Invokes Lifecycle Hooks / Runtime 触发生命周期 Hook

The runtime SHALL invoke `deps.hooks.invokeHooks` at canonical lifecycle points during each agent turn and SHALL interpret the hook invocation result to gate model dispatch, tool execution, and turn termination according to the hook failure policy.

runtime 必须在每个 agent turn 的规范生命周期点调用 `deps.hooks.invokeHooks`,并根据 hook failure policy 处理 invocation 结果,以此门控 model 分发、tool 执行与 turn 终止。

#### Scenario: Runtime fires hooks at the five wired points / 五个接线点触发

- **WHEN** `runAgentLoop` executes a turn
- **THEN** it SHALL invoke hooks at `user-input.before` once per turn, at `model-call.before` and `model-call.after` once per model iteration, and at `tool-execution.before` / `tool-execution.after` once per tool call, using the hook invocation schemaVersion, trace, and sessionId consistent with the current turn
- **中文** 当 `runAgentLoop` 执行 turn 时,必须在 `user-input.before`(每 turn 一次)、`model-call.before` / `model-call.after`(每次 model iteration 各一次)、`tool-execution.before` / `tool-execution.after`(每次 tool call 各一次)调用 hooks,使用与当前 turn 一致的 invocation schemaVersion、trace、sessionId。

#### Scenario: Blocking hook at user-input causes blocked turn / user-input block 产生被阻塞 turn

- **WHEN** a user-input.before hook returns blocked status
- **THEN** the runtime SHALL emit `agent.loop.failed` with `reason: "blocked-by-hook"` and SHALL NOT call `deps.models.stream` for that turn
- **中文** 当 user-input.before 的 hook 返回 blocked 时,runtime 必须发 `agent.loop.failed`(`reason: "blocked-by-hook"`)且不得为该 turn 调用 `deps.models.stream`。

#### Scenario: Blocking hook at model-call emits model.blocked / model-call block 发 model.blocked

- **WHEN** a model-call.before hook returns blocked status
- **THEN** the runtime SHALL emit a `model.blocked` event and a terminal `agent.loop.failed` with `reason: "blocked-by-hook"`, without issuing the model stream call
- **中文** 当 model-call.before 的 hook 返回 blocked 时,runtime 必须发 `model.blocked` 事件和终态 `agent.loop.failed`(`reason: "blocked-by-hook"`),且不发起 model stream 调用。

#### Scenario: Blocking hook at tool-execution denies the tool / tool-execution block 拒绝工具

- **WHEN** a tool-execution.before hook returns blocked status
- **THEN** the runtime SHALL skip that tool's `kernel.execute` call, synthesize a `model.tool.result` with feedback status `denied`, and continue executing subsequent iterations within the same turn
- **中文** 当 tool-execution.before 的 hook 返回 blocked 时,runtime 必须跳过该 tool 的 `kernel.execute`,合成一条 feedback status 为 `denied` 的 `model.tool.result`,并继续该 turn 的后续迭代。

#### Scenario: Default continue policy does not gate the turn / 默认 continue 策略不门控 turn

- **WHEN** hooks with `failurePolicy` other than `block` fail, time out, or are absent
- **THEN** the runtime proceeds past the lifecycle point, records diagnostics in the `hooks.invoked` event, and does not alter turn termination
- **中文** 当 `failurePolicy` 非 `block` 的 hook 失败、超时或不存在时,runtime 必须继续跨过该生命周期点,把诊断记在 `hooks.invoked` 事件里,不改变 turn 终态。
