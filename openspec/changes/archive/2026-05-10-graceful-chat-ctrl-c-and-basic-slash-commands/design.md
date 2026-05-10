## Context

The current chat REPL in `src/apps/cli/src/index.ts` looks like:

```ts
for await (const line of readCliLines(input)) {
  const prompt = line.trim();
  if (!prompt) continue;
  if (prompt === "/exit" || prompt === "/quit") break;
  // otherwise, call runAgentLoop and forward every event to the writer
}
```

Three consequences:

1. Any other `/` input (e.g. `/help`) is sent to the model as if it were a user question, wasting a live-API round-trip.
2. The loop has no awareness of SIGINT. Hitting Ctrl+C mid-turn kills the Node process. The persistent session store is mid-append at that instant, so the last JSONL record is often half-written and the CLI leaves no exit message.
3. The `@deepseek/command-system` package already ships `invokeInteractiveCommand` and a help projection — we are not using them. The minimal-chat-cli spec already mandates `/help`, `/exit`, `/quit`, `/clear`, `/cancel`. We are finishing the wiring.

当前 `src/apps/cli/src/index.ts` 里的 chat REPL 只识别 `/exit`、`/quit`，其他斜杠输入送给模型浪费请求；SIGINT 没有处理，持久化 session 被写一半；`@deepseek/command-system` 已有 `invokeInteractiveCommand` 但 CLI 没调。

Runtime side: `runAgentLoop` is an async generator. It does not accept an `AbortSignal`, so cancellation is only achievable by breaking out of the `for-await` consumer. That works when the cancel source is the consumer itself, but does not propagate into `deps.models.stream`, which keeps the HTTP request alive until the provider finishes. We need an explicit signal threaded into the request so the model client can abort mid-stream.

Runtime 侧：`runAgentLoop` 是异步生成器，不收 `AbortSignal`。只能通过 `for-await` 消费者 `break` 退出，但这样 `deps.models.stream` 的 HTTP 请求不会中断。需要显式把信号穿到请求里，让 model client 能中途 abort。

## Goals / Non-Goals

**Goals:**

- Unrecognized `/x` never reaches the model.
- `/help`, `/clear`, `/exit`, `/quit`, `/cancel`, `/cost`, `/model` all resolve locally and render deterministic text.
- First Ctrl+C during an active turn cancels the HTTP stream and emits a `agent.loop.cancelled` event. REPL stays open.
- Second Ctrl+C within 2 seconds (or any Ctrl+C when idle) exits with the same resume hint as a clean shutdown.
- `/cancel` is a typed alias for the same cancellation path as Ctrl+C; both emit identical events.
- Cancelled turns still persist every event emitted up to the cancel point, so `session resume` sees the partial turn.
- Deterministic tests do not rely on real SIGINT delivery — they inject an AbortController and drive cancellation via a stub signal.

- 未识别的 `/x` 永远不进 model。
- `/help`、`/clear`、`/exit`、`/quit`、`/cancel`、`/cost`、`/model` 都在本地解析，输出确定性文本。
- 活跃 turn 的第一次 Ctrl+C 取消 HTTP stream，发 `agent.loop.cancelled` 事件，REPL 保持。
- 2 秒内第二次 Ctrl+C（或空闲时的任何一次）按正常关闭方式退出，带 resume 提示。
- `/cancel` 与 Ctrl+C 走同一路径，事件相同。
- 被取消的 turn 仍把取消前的每个事件写入 session，`session resume` 能看到半截 turn。
- 确定性测试不依赖真实 SIGINT，用注入的 AbortController + stub signal 驱动取消。

**Non-Goals:**

- No new slash commands beyond the five in spec plus `/cost` and `/model`. `/compact`, `/save`, `/load`, `/new` are separate follow-ups.
- No key-binding customisation. Ctrl+C is hardcoded.
- No Windows-specific SIGINT vs SIGBREAK semantics beyond what Node already handles.
- No readline re-implementation. We keep `readCliLines`-style stdin reading.
- No `/model` switching; this release only prints the current model. Switching needs config mutation and is a separate change pack.

- 规范 5 个加 `/cost`、`/model` 之外不再加新斜杠命令；`/compact`、`/save`、`/load`、`/new` 另外做。
- 不做快捷键自定义，Ctrl+C 写死。
- 不处理 Windows SIGINT vs SIGBREAK 的额外细节，用 Node 默认行为。
- 不重写 readline，仍用 `readCliLines` 风格读 stdin。
- `/model` 本次只打印当前 model，不做切换；切换需要改 config，属于下个 change pack。

## Decisions

### Decision 1: Thread AbortSignal via a sibling control object, not on AgentLoopRequest

Adding `signal` as an optional field on `AgentLoopRequest` is the natural instinct, but that interface `extends JsonObject`, which constrains every field to JSON-serializable types — `AbortSignal` is not. Two options: loosen the base type (ripples into every runtime event and persistence path), or introduce a sibling type. We chose the sibling: `AgentLoopControl { signal?: AbortSignal }` passed as an optional second argument to `runAgentLoop`. The alternative — putting a shared `AbortController` on `RuntimeDependencies` — would make cancellation a session-wide side channel and force every caller to reason about which controller is active. A per-request control object keeps semantics local: one call to `runAgentLoop`, one cancellation scope, no leakage across chat turns, and no contamination of the JSON event schema.

把 `signal` 直接塞到 `AgentLoopRequest` 是本能反应，但该接口 `extends JsonObject`，所有字段必须 JSON 可序列化，`AbortSignal` 不行。两个选项：放宽 base 类型（会波及所有 runtime event 与持久化路径），或新增一个同级类型。我们选后者：新增 `AgentLoopControl { signal?: AbortSignal }`，作为 `runAgentLoop` 的第二个可选参数。把共享 `AbortController` 放到 `RuntimeDependencies` 会让取消变成全局副作用，每个调用者都要担心当前是哪个 controller 生效。按请求传信号保持语义局部：一次 `runAgentLoop` 对应一次取消范围，不会跨 chat turn 泄露，也不污染 JSON event schema。

Rejected: signal-in-deps. Leaks across turns, makes testing harder.

拒绝：signal 放 deps。跨 turn 泄露，难测。

Rejected: signal on `AgentLoopRequest`. Breaks JsonObject constraint, forces a ripple through every consumer that serializes the request (bus, session store, replay).

拒绝：signal 放在 `AgentLoopRequest` 上。破坏 JsonObject 约束，迫使所有序列化该请求的消费者（bus、session store、replay）连锁修改。

### Decision 2: Cancellation observes at every yield point, no polling

`runAgentLoop` yields 10+ times per iteration. Checking `signal.aborted` once at the start of each iteration plus once before every `yield` keeps latency bounded without introducing a timer. The provider stream already takes `AbortSignal.timeout` today; we extend `countTokens`/`stream` callers to pass `signal` through so the fetch aborts promptly.

`runAgentLoop` 每次迭代 yield 十多次。每次 iteration 开头检查一次 `signal.aborted`，每次 yield 前再检查一次，不用 timer。provider stream 现在已经用 `AbortSignal.timeout`，扩展 `countTokens`/`stream` 调用者把 `signal` 穿过去，fetch 就能迅速 abort。

Rejected: polling every 100ms. Adds timers, complicates shutdown.

拒绝：100ms 轮询。增加定时器，关停更复杂。

### Decision 3: Double-tap Ctrl+C uses a 2-second window, not a confirmation prompt

Prompting "Press Ctrl+C again to exit" would require prompt redraw and break the readline input. A 2-second debounce window is what every modern REPL (node, python, ipython) does. The user sees `[cancelled] press Ctrl+C again within 2s to exit`; if they keep typing, the window expires silently and the next Ctrl+C starts the cycle over.

提示 "再按一次退出" 需要重绘 prompt，打断 readline。所有现代 REPL（node、python、ipython）都用 2 秒去抖窗口。取消后打印 `[cancelled] press Ctrl+C again within 2s to exit`；用户继续打字则窗口静默到期，下一次 Ctrl+C 从头开始。

Rejected: explicit "y/N" confirm. Breaks TTY, adds a mode.

拒绝：显式 y/N 确认。破坏 TTY，引入模式。

### Decision 4: `/cost` and `/model` are CLI-local renderers, not command manifests

Both are pure projections of already-emitted state: `/cost` sums `usage.updated` events the CLI already buffers per session, `/model` reads the `profile` field we already pass in the `AgentLoopRequest`. Adding them to `@deepseek/command-system` would force round-trip serialization for a local-only operation. Keeping them inside the CLI chat loop is one function each.

两个都是对已发状态的纯投影：`/cost` 汇总 CLI 每 session 已缓存的 `usage.updated`，`/model` 读已传给 `AgentLoopRequest` 的 `profile`。把它们塞进 `@deepseek/command-system` 会为纯本地操作引入序列化来回。放在 CLI chat 循环里各一个函数即可。

Rejected: full manifest + handler. Over-engineered for read-only local data.

拒绝：完整 manifest + handler。对只读本地数据过度设计。

### Decision 5: Cancelled turns emit `agent.loop.cancelled` and persist

Consistent with existing terminal events (`agent.loop.completed`, `agent.loop.failed`). The cancel event includes `iterations`, `toolCalls`, `assistantText` (so partial output survives) and a `reason: "user-cancelled"` field. Contract tests on the session store already cover hydration — new kind slots in without schema bump.

与既有终端事件一致。取消事件带 `iterations`、`toolCalls`、`assistantText`（保留部分输出）和 `reason: "user-cancelled"`。session store 的契约测试已覆盖 hydrate，新 kind 插入无需 schema 升级。

Rejected: treat cancel as failure. Muddies diagnostics ("was it user cancel or provider failure?").

拒绝：把取消当失败。诊断混乱（用户取消还是 provider 失败？）。

## Safety Model

- Chat shell never mutates session or workspace state on Ctrl+C beyond what `runAgentLoop` already wrote. The existing `append` is already fire-and-forget, so a cancel after append does not corrupt disk; a cancel before a terminal event leaves the session without a terminal record, which `session resume` treats as "open session" — no corruption.
- `/clear` uses a bounded escape-code sequence (ESC `[2J` ESC `[H`) with one newline; it does not send user-supplied strings to the terminal.
- No network call is added: all slash commands are local; cancellation only aborts existing in-flight calls.
- The 2-second double-tap window uses `setTimeout` with a cleared reference to avoid leaking a Node timer when the REPL exits.

- chat shell 在 Ctrl+C 下除了 `runAgentLoop` 已经写入的内容外，不再改 session 或 workspace。`append` 是 fire-and-forget，append 之后取消不会写坏磁盘；终态事件之前取消则 session 没有 terminal 记录，`session resume` 视为「开放 session」，无损坏。
- `/clear` 用受限 escape code（ESC `[2J` ESC `[H` + 一个换行），不把用户串发送给终端。
- 不新增网络调用：所有斜杠命令本地解析，取消只中断已有请求。
- 2 秒双击窗口的 `setTimeout` 退出 REPL 前 clear 掉，避免 Node timer 泄露。

## Acceptance Strategy

- **Contract**: `tests/contracts/chat-slash-commands.test.ts` enumerates each command, invokes the chat router helper with a fake writer and fake runtime, and asserts the typed result and rendered text. No runtime call is made for slash inputs.
- **Runtime**: extend `tests/contracts/runtime-agent-loop.test.ts` with a case that passes a pre-aborted AbortSignal and asserts `agent.loop.cancelled` is the terminal event.
- **Integration**: `tests/integration/chat-sigint-cancel.test.ts` runs the chat loop with a deterministic runtime that blocks on a deferred model stream, fires `AbortController.abort()` through the SIGINT handler, asserts the cancel rendering, then sends a follow-up prompt to confirm the REPL stayed alive.
- **Regression**: existing chat e2e, golden replay, session persistence — all must stay green. Full suite run.
- **Docs**: `docs/user/cli-quickstart.md` gets a "Chat controls" section; `docs/development/testing-and-acceptance.md` adds a "Chat slash commands / 聊天斜杠命令" subsection with the test invocation.

- **Contract**: `tests/contracts/chat-slash-commands.test.ts` 枚举每个命令，用 fake writer + fake runtime 调聊天路由 helper，验证 typed result 和渲染文本。斜杠输入不走 runtime。
- **Runtime**: 在 `tests/contracts/runtime-agent-loop.test.ts` 增加一例，传预先 abort 的 AbortSignal，验证 `agent.loop.cancelled` 是终端事件。
- **Integration**: `tests/integration/chat-sigint-cancel.test.ts` 用一个 deferred model stream 的确定性 runtime 跑聊天循环，通过 SIGINT handler 触发 `AbortController.abort()`，验证取消渲染，再发后续 prompt 确认 REPL 仍活。
- **Regression**: chat e2e、golden replay、session 持久化测试全部保持绿色。
- **Docs**: `docs/user/cli-quickstart.md` 增加「Chat controls」；`docs/development/testing-and-acceptance.md` 加「Chat slash commands / 聊天斜杠命令」。
