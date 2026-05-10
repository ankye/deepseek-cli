## Context

The CLI accepts a `CliWrite = (line: string) => void | Promise<void>` signature and defaults to `console.log`. That signature was correct for JSON/JSONL output, where one event is one line, but wrong for text output where successive `model.delta` chunks should flow into one growing line and per-iteration reasoning should coalesce into a single indicator.

Today's `emitAgentLoop` routes every event through `renderText` then writes one line per event. For a single model.delta of "Hi" and a second delta of " there", the terminal shows two lines: `Hi` then ` there`. For twenty `model.reasoning` chunks before a tool call, the terminal shows twenty identical `[reasoning]` rows. The underlying event stream is fine; only the host rendering is wrong.

CLI 接受 `CliWrite = (line: string) => void | Promise<void>` 签名，默认 `console.log`。这个签名对 JSON/JSONL 输出合适（一事件一行），但对 text 输出不合适：连续的 `model.delta` chunk 应该流到同一条递增的行里，每 iteration 的 reasoning 应该合并成单个指示。

当前 `emitAgentLoop` 把每个事件送进 `renderText` 然后每事件一行。两个 model.delta `Hi` 和 ` there` 在终端显示为两行 `Hi` 和 ` there`。一个 tool call 之前的 20 个 reasoning chunk 在终端刷 20 行相同的 `[reasoning]`。底层事件流没问题，错的只是 host 渲染层。

## Goals / Non-Goals

**Goals:**

- A live run emits a single growing line of model text per iteration instead of one line per chunk.
- Reasoning produces one `[reasoning]` indicator per iteration, with streaming thinking text appended inline, terminated cleanly when the iteration transitions.
- JSON and JSONL output remain byte-identical.
- CLI test harness continues to capture structured output without TTY coupling.
- No new dependencies, no new npm scripts.

- Live run 每 iteration 显示一条逐字增长的模型文本，不是每个 chunk 一行。
- Reasoning 每 iteration 一个 `[reasoning]` 指示，thinking 文本 inline 追加，iteration 切换时干净结束。
- JSON 和 JSONL 输出字节级一致。
- CLI 测试 harness 继续捕获结构化输出，不与 TTY 耦合。
- 不引入新依赖或新 npm 脚本。

**Non-Goals:**

- Do not add ANSI colors, spinners, or cursor movement. That is a full TUI change and out of scope.
- Do not change the shape of runtime events. Only the CLI renderer changes.
- Do not change `deepseek chat` loop semantics. The user prompt UX (readline, history, Ctrl+C handling) is a separate later change.
- Do not introduce a new `--tty` flag. TTY detection via `process.stdout.isTTY` is already available and good enough.

- 不加 ANSI 颜色、spinner 或光标移动。那是完整 TUI 改动，不在本次范围。
- 不改 runtime event 形状。只改 CLI renderer。
- 不改 `deepseek chat` loop 语义。用户 prompt UX（readline、历史、Ctrl+C）是后续单独变更。
- 不引入 `--tty` flag。`process.stdout.isTTY` 已经够用。

## Decisions

### Decision 1: Inline writer is a second CLI channel, not a replacement

Keep the existing `CliWrite = (line: string) => void | Promise<void>` signature intact so every existing test and every JSON/JSONL path works without modification. Add an internal `writeInline(chunk)` that defaults to `process.stdout.write(chunk)` when the CLI is running through its real entry point (no harness override), and falls back to the provided `CliWrite` with no trailing newline when a harness is injected. Tests thus receive their concatenated output in a single captured string exactly as today, while the real CLI gets raw chunk flushing.

保留现有 `CliWrite = (line: string) => void | Promise<void>` 签名，所有现有测试和 JSON/JSONL 路径无需修改。新增内部 `writeInline(chunk)`：CLI 真实入口（无 harness override）时默认 `process.stdout.write(chunk)`，注入 harness 时 fallback 到 `CliWrite` 但不加换行。测试按今天的方式拿到拼接好的输出，真实 CLI 得到 raw chunk flush。

Rejected alternative: change `CliWrite` to `(chunk: string, options: { inline: boolean }) => ...`. This would touch every test that constructs a writer and break VSCode extension integration paths that already implement the current signature.

拒绝方案：把 `CliWrite` 改成 `(chunk, options)`。这样每个构造 writer 的测试都要改，也会破坏已实现当前签名的 VSCode extension 集成路径。

### Decision 2: Streaming state machine is iteration-scoped and channel-scoped

Track two booleans per iteration: `deltaStreamOpen` and `reasoningStreamOpen`. Opening either marks a channel as "currently flushing inline"; the next event of a different kind closes whichever stream was open by writing one newline. This keeps rendering local to the event loop, no cross-iteration memory, and predictable snapshots.

按 iteration 跟踪两个 bool：`deltaStreamOpen` 与 `reasoningStreamOpen`。打开任一标记该通道"正在 inline flush"；下一个不同 kind 的事件会用一次换行关闭打开的 stream。渲染保持在事件循环里，不跨 iteration 记忆，snapshot 可预测。

Rejected alternative: buffer a whole iteration and render at the end. That kills streaming, which is exactly the user benefit.

拒绝方案：整个 iteration 缓冲后一次性渲染。那就失去了流式，正是用户想要的。

### Decision 3: Reasoning indicator is one line prefix, not a boxed block

When the first reasoning chunk of an iteration arrives, print `[reasoning] ` (with trailing space) via the inline writer, then stream the reasoning text inline. This matches Claude CLI's convention and is cheap to review and revert if the UX later moves to a collapsed display.

第一个 reasoning chunk 到达时通过 inline writer 打印 `[reasoning] `（带尾空格），然后 inline 流 reasoning 文本。对齐 Claude CLI 惯例，好评审好回退。

Rejected alternative: hide reasoning entirely in text mode. That removes observable signal that the model is thinking. Users complain about silent 20-second pauses.

拒绝方案：text 模式完全隐藏 reasoning。那用户看不到模型在思考的信号，会抱怨 20 秒静默。

## Safety Model

- No new network calls, no new persistence, no new credential handling.
- Secrets cannot leak through this change because the CLI already redacts payloads upstream (`redactJsonSecrets` in runtime), and the only thing this change does is remove spurious newlines.
- TTY detection is read-only via `process.stdout.isTTY`.

- 不新增网络调用、持久化或 credential 处理。
- 本次变更不会泄露 secret：CLI 上游已经 redact（runtime `redactJsonSecrets`），这次改动只是去掉多余换行。
- TTY 检测只读 `process.stdout.isTTY`。

## Acceptance Strategy

- Unit: new `cli.test.ts` case injects a harness writer and drives a sequence of runtime events including 3 `model.delta` chunks and 2 `model.reasoning` chunks. Asserts (a) JSON/JSONL modes remain one-event-per-call, (b) text mode produces a concatenated delta line and a single reasoning line with both thinking chunks inside.
- Existing tests (CLI, golden, e2e, integration) stay green without modification. No test depends on per-delta line semantics today.
- Live gated smoke remains untouched and stays green (human observation of `npm run smoke:live:agent-tools` is not required for this change, because the smoke asserts structural event kinds and redaction, not rendering).
- Full verification: typecheck, lint, boundaries, 257+ tests, openspec validate both strict.
