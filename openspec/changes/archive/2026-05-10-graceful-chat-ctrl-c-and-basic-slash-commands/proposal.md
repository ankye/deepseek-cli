## Why

The chat shell implementation in `src/apps/cli/src/index.ts` recognizes only `/exit` and `/quit` today — every other slash command (`/help`, `/clear`, `/cancel`, `/cost`, `/model`) is forwarded to the model as plain text and wastes tokens. There is no Ctrl+C handling either: hitting Ctrl+C during a running turn kills the Node process mid-stream, leaving the persistent session file half-written and dropping the user back to the shell with no feedback. The `@deepseek/command-system` package already exposes `invokeInteractiveCommand` with manifests for `/help`, `/exit`, `/quit`, `/clear`, `/cancel`, `/resume`, `/fork`, but the CLI does not call it. The minimal-chat-cli spec already requires the shell to support these controls; we are finishing the implementation the spec described.

`src/apps/cli/src/index.ts` 中的 chat shell 当前只识别 `/exit` 与 `/quit`，其他斜杠命令（`/help`、`/clear`、`/cancel`、`/cost`、`/model`）都会当作普通文本发给模型，浪费 token。Ctrl+C 也没有处理：运行中的一轮按 Ctrl+C 会当场杀掉 Node 进程，持久化 session 文件写一半，用户回到 shell 看不到任何反馈。`@deepseek/command-system` 已经通过 `invokeInteractiveCommand` 暴露 `/help`、`/exit`、`/quit`、`/clear`、`/cancel`、`/resume`、`/fork` 的 manifest，但 CLI 没有调用；minimal-chat-cli 规范已要求 shell 支持这些 control，本次是把规范描述的实现补完。

## What Changes

- Route every slash input in the chat loop through `invokeInteractiveCommand` before looking for exit markers, and render the `InteractiveControlResult` via deterministic renderers (`/help` dumps control manifests, `/clear` emits ANSI clear + separator, `/exit`/`/quit` flip the terminal flag). **BREAKING:** an unrecognized `/x` input no longer reaches the model — the shell prints a typed error and continues the REPL.
- Extend the chat shell with two CLI-owned additions that are rendered from already-emitted runtime events rather than new manifests: `/cost` summarizes usage totals accumulated from `usage.updated` events for the current session, and `/model` prints the active model profile name/id.
- Wire `process.on("SIGINT")` around the chat loop: the first Ctrl+C during an active turn aborts the in-flight `runAgentLoop` via an `AbortController`, emits a `turn.cancelled` line, and keeps the REPL open; the second Ctrl+C within 2 seconds (or any Ctrl+C when no turn is active) exits cleanly with a resume hint.
- Thread a `signal?: AbortSignal` through `AgentLoopRequest` so `runAgentLoop` observes cancellation at every `yield` point; on abort, emit a typed `agent.loop.cancelled` event with a stable diagnostic code and persist it to the session store so resume sees the cancellation.
- Print a first-launch hint line after the `DeepSeek chat` banner: `Type /help for commands, Ctrl+C to cancel a turn, Ctrl+C twice to exit.` so users discover the new surface without reading docs.

- 把 chat 循环里每个斜杠输入先经 `invokeInteractiveCommand`，再用确定性渲染器（`/help` 输出 control manifest，`/clear` 发 ANSI clear + 分隔符，`/exit`/`/quit` 翻转退出标志）处理 `InteractiveControlResult`。**破坏性变化**：未识别的 `/x` 不再送给模型，shell 打印 typed error 后继续 REPL。
- 给 chat shell 加两个纯 CLI 侧的扩展，不引入新 manifest，而是从已有 runtime events 渲染：`/cost` 汇总当前 session 所有 `usage.updated` 事件，`/model` 打印当前 model profile 名称/id。
- chat 循环期间注册 `process.on("SIGINT")`：活跃 turn 中第一次 Ctrl+C 通过 `AbortController` 中断 `runAgentLoop`，打印 `turn.cancelled` 并保留 REPL；2 秒内第二次 Ctrl+C（或无活跃 turn 时的任何一次）带 resume 提示正常退出。
- 在 `AgentLoopRequest` 增加 `signal?: AbortSignal`，`runAgentLoop` 在每次 yield 处检查；取消时发 typed `agent.loop.cancelled` 事件，带稳定诊断码并写入 session store，resume 时能看到取消记录。
- chat 启动 banner 之后加一行首次使用提示：`Type /help for commands, Ctrl+C to cancel a turn, Ctrl+C twice to exit.`，让用户不用读文档就发现新表面。

## Impact

- Affected specs: `minimal-chat-cli` (slash command set + SIGINT behavior + acceptance evidence), `command-system` (interactive control renderer contract), `runtime-event-loop` (agent-loop cancellation event + AbortSignal parameter).
- Affected packages: `@deepseek/runtime` (AbortSignal plumbing, new cancelled event), `@deepseek/platform-contracts` (add optional `signal` to `AgentLoopRequest`, new `agent.loop.cancelled` event kind), `@deepseek/command-system` (add deterministic renderer helpers for `/help`, `/clear`, `/cost`, `/model`), `src/apps/cli` (SIGINT wiring, slash router, usage tracker).
- Tests: new unit suite `tests/contracts/chat-slash-commands.test.ts` covers every manifest; new integration suite `tests/integration/chat-sigint-cancel.test.ts` drives two in-flight Ctrl+C signals through `runCli` and asserts the REPL survives the first and exits on the second. Existing chat e2e remains green.
- Docs: `docs/user/cli-quickstart.md` and `docs/development/testing-and-acceptance.md` get a "Chat controls / 聊天控制" subsection.

- 受影响规范：`minimal-chat-cli`（斜杠命令集 + SIGINT 行为 + 验收证据）、`command-system`（interactive control 渲染器契约）、`runtime-event-loop`（agent-loop cancellation 事件 + AbortSignal 参数）。
- 受影响包：`@deepseek/runtime`（AbortSignal 接线、新 cancelled 事件）、`@deepseek/platform-contracts`（`AgentLoopRequest` 可选 `signal`、新 `agent.loop.cancelled` event kind）、`@deepseek/command-system`（`/help`、`/clear`、`/cost`、`/model` 的确定性渲染助手）、`src/apps/cli`（SIGINT 接线、斜杠路由、usage 记录）。
- 测试：新 unit 套件 `tests/contracts/chat-slash-commands.test.ts` 覆盖每个 manifest；新 integration 套件 `tests/integration/chat-sigint-cancel.test.ts` 让两次 Ctrl+C 穿过 `runCli`，验证 REPL 在第一次之后存活、第二次之后正常退出。现有 chat e2e 保持绿色。
- 文档：`docs/user/cli-quickstart.md` 和 `docs/development/testing-and-acceptance.md` 增加「Chat controls / 聊天控制」小节。
