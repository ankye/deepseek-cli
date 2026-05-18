## 1. Contracts / 平台契约

- [x] 1.1 In `src/packages/platform-contracts/src/runtime.ts`, add `agent.loop.cancelled` to `RuntimeEventKind` and introduce `AgentLoopControl { signal?: AbortSignal }`. Kept `AgentLoopRequest` JSON-serializable (it `extends JsonObject`), so the signal lives in a sibling non-JSON type instead. No schema bump; `redacted` class stays `internal`.
- [x] 1.2 Extend `ModelRequest` with an optional `signal?: AbortSignal` (non-JsonObject) and add `ModelProviderTransportOptions { signal?: AbortSignal }` so transports can receive it as a second argument without polluting the JSON-only `ModelProviderRequest`.

## 2. Runtime Plumbing / Runtime 接线

- [x] 2.1 In `src/packages/runtime/src/agent-loop.ts`, accept `control.signal` as a second argument. Check `signal.aborted` at three points: immediately after `agent.loop.started` (pre-abort path), at the top of every iteration, and after each model event yield. On abort emit a single `agent.loop.cancelled` event with `status: "cancelled"`, `iterations`, `toolCalls`, `assistantText`, `reason: "user-cancelled"`, persist via `recordRuntimeAdapterEvent`, and return cleanly.
- [x] 2.2 Forward `signal` into the provider stream via `deps.models.stream({ ..., signal })`. `DeepSeekOpenAIProvider` forwards it to the transport as a second-arg option; `FetchModelProviderTransport` composes it with the existing timeout via `AbortSignal.any([timeout, signal])`; `OpenAIModelProviderTransport` passes it to `client.chat.completions.create(body, { signal })`.
- [x] 2.3 Kernel tool execution inherits cancellation implicitly: once the model stream aborts, no further `tool-call` events are yielded, so no in-flight `kernel.execute` remains. No new `capability.cancelled` plumbing needed.

## 3. Command-System Renderers / 命令系统渲染

- [x] 3.1 Added `renderInteractiveControlText(result: InteractiveControlResult): readonly string[]` to `@deepseek/command-system`, returning deterministic lines for `help`, `exit`, `clear`, `cancel`, and catch-all other actions.
- [x] 3.2 `help` rendering enumerates `interactiveHelpProjection()` with aliases and side-effect tags, appends CLI-local `/cost` and `/model`, and ends with the Ctrl+C hint.

## 4. CLI Chat Shell / CLI Chat Shell

- [x] 4.1 `runChatCommand` now routes every `/` prefixed trimmed prompt through `handleSlashCommand`, which calls `invokeInteractiveCommand` for registered names and prints `[chat] unknown command /x` otherwise. Slash inputs never reach `runAgentLoop`.
- [x] 4.2 Typed `InteractiveControlResult` handling: `action === "exit"` exits the loop, `"clear"` writes ANSI clear + blank via the renderer, `"help"` dumps renderer lines, `"cancel"` aborts the active turn or prints `[chat] nothing to cancel`.
- [x] 4.3 CLI-local `/cost` and `/model` short-circuit before `invokeInteractiveCommand`: `/cost` prints tokens in/out and elapsed from a `ChatSessionState.usage` accumulator updated by `usage.updated` events; `/model` prints `model=<profile.model> provider=<profile.providerId>`.
- [x] 4.4 `process.on("SIGINT", handler)` is registered once per chat session. First SIGINT with an active turn aborts the controller, prints `[chat] press Ctrl+C again within 2s to exit`, and starts a 2s debounce timer. Second SIGINT within the window (or any SIGINT while idle) sets `pendingExit=true` so the REPL breaks on next iteration. `process.off` in `finally`.
- [x] 4.5 Banner updated to `Type /help for commands, Ctrl+C to cancel a turn, Ctrl+C twice to exit.` in text mode.
- [x] 4.6 `renderText` handles `agent.loop.cancelled` as `[cancelled] trace=<id> session=<id>`; `finalAgentLoopEvent` includes the cancelled kind when computing session id and JSON summary.

## 5. Tests / 测试

- [x] 5.1 New contract test `tests/contracts/chat-slash-commands.test.ts`: exercises `/help`, `/clear`, `/cost` (pre- and post-turn), `/model`, `/unknown-x`, `/cancel`-idle, and a plain prompt. Tracks `modelCallCount` to prove slash inputs never hit the model. 8 cases, all pass.
- [x] 5.2 Extended `src/packages/runtime/test/runtime.test.ts` with "emits agent.loop.cancelled when the signal is already aborted" and "cancels mid-stream between model events when the signal aborts" using a deterministic `AbortAfterDeltaModelGateway`. Both assert `agent.loop.cancelled` terminal and absence of `agent.loop.completed`.
- [x] 5.3 New integration test `tests/integration/chat-sigint-cancel.test.ts`: uses a `CancellableModelGateway` that deferred-resolves on signal abort, drives `process.emit("SIGINT")` from a concurrent promise, and asserts the text-mode cancel hint, follow-up exit, and JSONL `agent.loop.cancelled` event kind. 3 cases, all pass.
- [x] 5.4 Full suite stays green (279 tests, 275 pass, 4 env-gated skip).

## 6. Docs / 文档

- [x] 6.1 ~~Append a "Chat controls" section to `docs/user/cli-quickstart.md`~~ — no `docs/user/` directory exists yet. Content instead folded into the bilingual "Chat slash commands / 聊天斜杠命令" subsection in `docs/development/testing-and-acceptance.md` so it ships with the other CLI behaviour docs.
- [x] 6.2 `docs/development/testing-and-acceptance.md` gained a "Chat slash commands / 聊天斜杠命令" subsection covering the local slash dispatch, `/cost` / `/model` semantics, Ctrl+C double-tap contract, and regression test entry points.

## 7. Verification / 验证

- [x] 7.1 `npm run typecheck`.
- [x] 7.2 `npm run lint`.
- [x] 7.3 `npm test` (expect existing suite + ~13 new cases, 0 fail).
- [x] 7.4 `node scripts/check-boundaries.mjs`.
- [x] 7.5 `npm run smoke:live:e2e` (env-gated; should skip without key).
- [x] 7.6 Refresh `tests/acceptance/latest/` evidence and regenerate `acceptance-index.md`.
- [x] 7.7 `openspec validate graceful-chat-ctrl-c-and-basic-slash-commands --strict` and `openspec validate --specs --strict`.
