## Why

Running `deepseek run --live "summarize README"` now produces a usable answer, but the text-mode output is jarring: every `model.delta` event (one per provider chunk, typically 10-80 per turn) is written via `console.log`, so the terminal shows each token on its own line instead of a single streaming line that grows as the model types. Reasoning fares worse: every `reasoning_content` chunk renders as a separate `[reasoning]` line, so a single thinking turn leaves 20+ identical `[reasoning]` rows in the scrollback before the real answer starts. Users perceive the product as broken or glitchy even though the underlying runtime works correctly.

`deepseek run --live "summarize README"` 现在已经能回出可用答案，但 text 模式输出很扎眼：每个 `model.delta` 事件（provider 每个 chunk 一个，通常 10-80 个一轮）都通过 `console.log` 输出，终端把每个 token 独立成行，而不是在单行里随模型打字增长。Reasoning 更糟：每个 `reasoning_content` chunk 单独渲染成一行 `[reasoning]`，一轮 thinking 会在 scrollback 里刷 20+ 行相同的 `[reasoning]`。用户会觉得产品是坏的或卡顿，尽管底层 runtime 工作正常。

## What Changes

- Split the CLI writer into two channels: a line writer (existing behaviour, used for status events and JSON/JSONL modes) and an inline writer for streaming text (no trailing newline, flushed per chunk). JSON/JSONL output is unaffected.
- In text mode, `model.delta` is written via the inline writer so successive chunks concatenate into one growing line.
- In text mode, the first `model.reasoning` chunk per iteration prints a single `[reasoning]` indicator followed by streamed reasoning text through the inline writer; subsequent chunks append to that same line. Terminate the reasoning line with one newline when the iteration transitions to content, tool, or finish events.
- When text mode finishes a turn (model.finished, turn.completed, or agent.loop.completed), flush a final newline so prompt returns to a clean column.
- Preserve every existing test by routing `CliWrite` to the inline channel when stdout is not a TTY; a passthrough writer receives the final concatenated string rather than per-chunk slices. This keeps captured test output identical to today byte-for-byte.
- Add a small unit test verifying that given a TTY-like sink, multiple `model.delta` events produce one concatenated line, and given a non-TTY sink (test harness), behaviour is a byte-for-byte passthrough.

- 把 CLI writer 拆成两个通道：现有的行写入（状态事件、JSON/JSONL 模式沿用）与流式 inline writer（不带换行，按 chunk flush）。JSON/JSONL 输出不受影响。
- text 模式下 `model.delta` 通过 inline writer 输出，连续 chunk 在同一行里累积。
- text 模式下每个 iteration 的首个 `model.reasoning` chunk 打一个 `[reasoning]` 指示符，之后的 reasoning 文本通过 inline writer 串流；后续 chunk 拼接到同一行。当 iteration 切换到 content、tool 或 finish 事件时，用一次换行结束 reasoning 行。
- text 模式 turn 结束（model.finished、turn.completed、agent.loop.completed）时 flush 一个尾部换行，让 prompt 回到干净列。
- 保留所有现有测试：stdout 不是 TTY 时把 `CliWrite` 路由到 inline 通道；透传 writer 收到的是最终拼接好的字符串，而不是逐 chunk 切片。这样 captured test 输出与今天字节级相同。
- 新增小单元测试：TTY-like sink 下多个 `model.delta` 产生单条拼接行；非 TTY sink（测试 harness）下行为是 byte-for-byte 透传。

## Capabilities

### Modified Capabilities

- `command-system`: Require the CLI text output mode to stream `model.delta` inline (no newline per chunk) and coalesce per-iteration reasoning into a single indicator line, while preserving JSON/JSONL output as structured one-line-per-event.

## Impact

- `src/apps/cli/src/index.ts`: split write into `writeLine` and `writeInline`, introduce a small streaming state machine for reasoning and delta channels, wire TTY detection.
- `src/apps/cli/test/cli.test.ts`: add streaming coalescence case and keep the existing passthrough tests.
- `docs/development/testing-and-acceptance.md`: one short paragraph describing the text-mode streaming contract so future contributors do not accidentally revert it.
