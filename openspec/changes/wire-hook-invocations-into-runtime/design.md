## Context

Hook 体系目前的状态：

- `InMemoryHookSystem` 在 deterministic runtime deps 里挂着(`deps.hooks`)。
- `registerHook` / `validateManifest` / `invokeHooks` / `listHooks` / `projectOrder` 都实现好了,单包测试跑绿。
- `HookLifecyclePoint` 枚举了 18 个 point。
- 运行期没有一处调用 `deps.hooks.invokeHooks`。

The hook-system is plumbed into `RuntimeDependencies`, its contract methods work in isolation, but nothing in the runtime invokes it. Wiring must happen inside `agent-loop.ts` because that's where the turn-level lifecycle events (model-call, tool-execution, user-input) actually flow.

## Goals / Non-Goals

**Goals:**

- 把 runtime 在每个 turn 里真实触发五个 hook point:user-input.before、model-call.before/after、tool-execution.before/after。
- 默认 `continue` 语义:hook 失败或不存在不影响主流程;hook 返回 `completed` / `failed` / `skipped` 都走下去。
- `block` policy 语义在三个位置明确:user-input.before block → turn 失败;model-call.before block → 跳这次 model 调用并使 turn 失败;tool-execution.before block → 跳这次 tool 并给 model 一个 `denied` tool result feedback,不让整个 turn 崩。
- CLI 支持从 `.deepseek/hooks.json` 加载 user hook(子进程 JSON stdio handler,复用 platform spawn 路径)。
- 新增 `core.hook.list` 让 agent 自检。

- Runtime fires hooks at the five points. Default semantics is continue. Block is well-defined for each of the three "before" points. CLI auto-loads `.deepseek/hooks.json`. Agents can self-discover enabled hooks via `core.hook.list`.

**Non-Goals:**

- `file-edit.*`、`session.*`、`skill-activation.*`、`workflow-step.*`、`plugin-lifecycle.*`、`host-render.*` 等 point 留到后续。
- Hook marketplace、schema 热重载、隔离进程沙箱 → 不做。
- Hook 级别的 cancellation propagation → 不做(只用 turn 的 AbortSignal)。

## Decisions

### Decision 1: hook invocation 出现在 agent-loop 内,不做 wrapper 层

`runAgentLoop` 已经是编排 user-input → model → tool → result 的核心。在它内部五个 yield 边界直接 `await deps.hooks.invokeHooks(...)` 最简单,不引入新的 decorator / middleware 层。每次 invocation 之后 emit 一个 `hooks.invoked` 事件,和其他 `recordRuntimeAdapterEvent` 一致,事件流保持 single-source-of-truth。

Hooks fire inside `runAgentLoop` at five yield boundaries, not in a wrapper / middleware layer. Each invocation emits `hooks.invoked` so the event stream remains the single source of truth.

Rejected: 独立 `HookAwareRuntime` wrapper。增加 decorator 层、破坏现有事件顺序。

### Decision 2: block 语义按 point 不同

三个不同语义:

| Point | Block 语义 |
|---|---|
| `user-input.before` | `agent.loop.failed` + `reason: "blocked-by-hook"`,整 turn 中止 |
| `model-call.before` | emit `model.blocked`,跳过这次 model 调用,进入 `agent.loop.failed` |
| `tool-execution.before` | synthesize `model.tool.result` 带 `status: "denied"`,让 agent 继续迭代 |

用户/合规 hook 拦截一次 tool 执行最常见,这个情况下直接炸 turn 太重 —— 让 agent 看见「这个工具被拒了」继续决策才对。只有整 turn 都不该跑(例如敏感 prompt 拦截)才在 `user-input.before` 炸 turn。

Block semantics vary by point because the natural recovery path differs. Tool-level block feeds a denied result back so the agent can adapt; user-input block kills the turn outright.

Rejected: 所有 block 都等效于杀 turn。让 tool-level compliance check 代价过大。

### Decision 3: hooks.invoked 事件,不是 18 个单独事件

每次 `invokeHooks` 完成发一条 `hooks.invoked`,payload 含 `{point, status, hookCount, terminal, traceId}`。如果某个 hook 有 `observation` 输出,单独走现有 `observability` sink 而不是污染 runtime event 流。

One `hooks.invoked` event per invocation keeps the event stream flat. Observation outputs flow to observability, not to the runtime bus.

### Decision 4: user hooks 用子进程 + JSON stdio

和 MCP 同样的启动方式:`platform.spawnMcpServer(command, args)` 得到 `{stdin, stdout}`,CLI 包装一个 handler:写一行 JSON input,读一行 JSON output。跟 MCP JSON-RPC 区别:hook 是一次性 request-response,没有 method / id / params 形状;直接写 `HookInvocationRequest.input`,读 `SerializableResult<HookOutputRecord[]>`。

User hooks are child processes talking JSON over stdio — same transport primitive as MCP but simpler protocol (single request-response, no JSON-RPC envelope).

### Decision 5: core.hook.list 是只读 tool,不是配置写入

Agent 调 `core.hook.list` 只拿到当前 hook 列表和 ordering,不能改。写入 hook 靠用户手工编辑 `.deepseek/hooks.json`。这避免 agent 自己悄悄禁掉 guardrail。

`core.hook.list` is read-only. Agents cannot modify the hook registry — that would defeat the purpose of hooks as guardrails.

## Safety Model

- Hook 执行有 `timeoutMs`(每个 manifest 自带,默认 5 秒);超时按 `failurePolicy` 处理。
- User hook 子进程用数组参数启动(无 shell expansion);stdout 截断 64KB,超出视为 failure。
- `.deepseek/hooks.json` 读失败不崩 —— 静默降级到「没有 user hook」。
- Block 事件明确 emit,审计 log(observability sink)有完整轨迹。
- 主 agent 的 AbortSignal 不 cascade 到 hook 子进程 —— hook 被认为是同步 observation,不应该中途被打断。超时是唯一退出路径。

- Per-hook `timeoutMs` enforced; blocked hook sub-processes killed on timeout.
- No shell expansion, truncated stdout, silent degradation on malformed `.deepseek/hooks.json`.
- Block events are first-class so audit logs see them.
- AbortSignal does not cascade into hook processes; timeout is the only exit.

## Acceptance Strategy

- **Contract**: `tests/contracts/hook-wiring.test.ts` ≥4 case:
  1. observation hook 在 tool-execution.before 被触发,payload 含 toolName。
  2. `failurePolicy: "block"` 的 hook 在 tool-execution.before 阻止 tool → agent 收到 `denied` feedback → 继续下一轮。
  3. `failurePolicy: "block"` 的 hook 在 user-input.before 阻止 turn → `agent.loop.failed` + `reason: "blocked-by-hook"`。
  4. `failurePolicy: "block"` 的 hook 在 model-call.before 阻止 → `model.blocked` event + `agent.loop.failed`。
- **Integration**: `tests/integration/hook-user-file-loading.test.ts` 用 tmp dir 写一个 `.deepseek/hooks.json`,启动 `runCli(["run", ...])`,断言指向的 stub hook 处理器被调用(子进程收到了 hook input,返回 output)。
- **Regression**: 原 300 pass 全绿(默认没有 hook 时,行为不变)。
- **Docs**: `docs/development/testing-and-acceptance.md` 新增「Hooks / 钩子」小节。
- **Spec**: `openspec validate --specs --strict` + `openspec validate wire-hook-invocations-into-runtime --strict` 过。
