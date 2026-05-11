# hook-system Specification

## Purpose
Define DeepSeek's governed hook model for lifecycle extension points, deterministic ordering, observe-only invocation, failure policy, timeout containment, and replayable evidence.

定义 DeepSeek 受治理的 hook 模型，覆盖 lifecycle extension points、确定性排序、observe-only invocation、failure policy、timeout containment 和可 replay evidence。
## Requirements
### Requirement: Governed Hook System

The platform SHALL define a governed hook system for lifecycle extension points before and after user input, model calls, tool execution, skill activation, workflow steps, file edits, session changes, plugin lifecycle actions, and host rendering.

平台必须定义 governed hook system，覆盖 user input、model calls、tool execution、skill activation、workflow steps、file edits、session changes、plugin lifecycle actions 和 host rendering 的前后 lifecycle extension points。

#### Scenario: Register hook contribution

- **WHEN** an extension, plugin, workspace, or built-in package contributes a hook manifest
- **THEN** the hook system validates event point, input schema, output schema, permissions, timeout, ordering, isolation mode, compatibility metadata, schema version, redaction metadata, and failure policy before registration
- **中文** 当 extension、plugin、workspace 或 built-in package 贡献 hook manifest 时，hook system 必须在注册前校验 event point、input schema、output schema、permissions、timeout、ordering、isolation mode、compatibility metadata、schema version、redaction metadata 和 failure policy。

#### Scenario: Hook cannot bypass policy

- **WHEN** a hook requests side effects or modifies runtime-bound data
- **THEN** the request is rejected in hooks v1 or routed in a future change through policy, approval, sandbox, audit, scheduler, and runtime message bus boundaries
- **中文** 当 hook 请求 side effects 或修改 runtime-bound data 时，hooks v1 必须拒绝该请求，或在未来变更中通过 policy、approval、sandbox、audit、scheduler 和 runtime message bus boundaries 路由。

### Requirement: Hook Ordering, Isolation, and Failure Policy

The hook system SHALL define deterministic hook ordering, timeout behavior, concurrency limits, cancellation propagation, isolation modes, and failure policies.

hook system 必须定义 deterministic hook ordering、timeout behavior、concurrency limits、cancellation propagation、isolation modes 和 failure policies。

#### Scenario: Hook timeout is contained

- **WHEN** a hook exceeds its configured deadline
- **THEN** the hook system cancels or contains the hook, emits structured hook failure evidence, and applies the configured continue, block, disable, or rollback-requested policy
- **中文** 当 hook 超过配置 deadline 时，hook system 必须取消或隔离该 hook，发出 structured hook failure evidence，并应用 continue、block、disable 或 rollback-requested policy。

#### Scenario: Hook ordering is reproducible

- **WHEN** multiple hooks subscribe to the same lifecycle point
- **THEN** execution order is determined by declared priority/order, source trust, source kind, dependency metadata, name, id, and stable tie-breaking rules
- **中文** 当多个 hooks 订阅同一个 lifecycle point 时，执行顺序必须由 declared priority/order、source trust、source kind、dependency metadata、name、id 和 stable tie-breaking rules 决定。

### Requirement: Hook Output Contracts

Hook outputs SHALL be typed as observe-only records, context additions, policy suggestions, workflow suggestions, capability requests, or host render hints.

hook outputs 必须被类型化为 observe-only records、context additions、policy suggestions、workflow suggestions、capability requests 或 host render hints。

#### Scenario: Hook adds context node

- **WHEN** a hook contributes context
- **THEN** it returns a structured context suggestion with source, provenance, redaction, priority, lifecycle metadata, and replay fingerprint, and the context engine decides whether to include it
- **中文** 当 hook 贡献 context 时，它必须返回包含 source、provenance、redaction、priority、lifecycle metadata 和 replay fingerprint 的 structured context suggestion，并由 context engine 决定是否纳入。

#### Scenario: Hook suggestion is not automatic authority

- **WHEN** a hook returns a policy suggestion, workflow suggestion, capability request, or host render hint
- **THEN** the owning subsystem decides whether to apply it and records the decision outside the hook system
- **中文** 当 hook 返回 policy suggestion、workflow suggestion、capability request 或 host render hint 时，归属子系统必须决定是否应用，并在 hook system 之外记录决策。

### Requirement: Hook Invocation Governance

The hook system SHALL route hook invocations through governed execution when a hook can block, rewrite, mutate runtime state, call tools, access external resources, or produce side effects.

hook system 必须在 hook 能 block、rewrite、mutate runtime state、call tools、access external resources 或产生 side effects 时，通过 governed execution 路由 hook invocation。

#### Scenario: Observe-only hook is lightweight

- **WHEN** a hook only observes lifecycle data and returns no mutation, policy suggestion, workflow suggestion, capability request, or host render effect
- **THEN** it can execute inside hooks v1 with minimal envelope metadata, deterministic ordering, timeout, trace, redaction, and failure policy
- **中文** 当 hook 只观察 lifecycle data，且不返回 mutation、policy suggestion、workflow suggestion、capability request 或 host render effect 时，它可以在 hooks v1 内执行，并保留 minimal envelope metadata、deterministic ordering、timeout、trace、redaction 和 failure policy。

#### Scenario: Side-effect hook is governed

- **WHEN** a hook executes code, calls tools, mutates runtime state, touches filesystem/process/network, changes memory/cache/workspace, or requires sandbox controls
- **THEN** it creates or is rejected until it can create a governed execution envelope with policy, approval, sandbox, bus, audit, and replay metadata
- **中文** 当 hook 执行代码、调用工具、修改 runtime state、触碰 filesystem/process/network、改变 memory/cache/workspace 或需要 sandbox controls 时，它必须创建 governed execution envelope；如果当前不能创建，则必须被拒绝，并带有 policy、approval、sandbox、bus、audit 和 replay metadata 要求。

### Requirement: Canonical HookSystem V1 API

The platform SHALL expose only canonical hooks v1 APIs for manifest validation, hook registration, hook listing, dry-run order projection, and hook invocation.

平台必须只暴露 canonical hooks v1 APIs，用于 manifest validation、hook registration、hook listing、dry-run order projection 和 hook invocation。

#### Scenario: Generic legacy hook APIs are rejected

- **WHEN** platform contracts or hook implementations define generic `register` or `run` methods on `HookSystem` or `InMemoryHookSystem`
- **THEN** architecture lint and contract tests fail before the change can pass default verification
- **中文** 当 platform contracts 或 hook implementations 在 `HookSystem` 或 `InMemoryHookSystem` 上定义泛化的 `register` 或 `run` 方法时，architecture lint 与 contract tests 必须在默认验证通过前失败。

### Requirement: Hook Replay Fingerprints

The hook system SHALL include stable replay fingerprints for validation, ordering projection, invocation results, diagnostics, and output records.

hook system 必须为 validation、ordering projection、invocation results、diagnostics 和 output records 提供 stable replay fingerprints。

#### Scenario: Hook replay detects semantic drift

- **WHEN** hook ordering, failure policy, timeout classification, output typing, redaction, or diagnostics change
- **THEN** golden replay detects the drift unless fixtures are intentionally updated
- **中文** 当 hook ordering、failure policy、timeout classification、output typing、redaction 或 diagnostics 发生变化时，golden replay 必须检测 drift，除非 fixtures 被有意更新。

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

