## MODIFIED Requirements

### Requirement: Agent CLI Output Modes / Agent CLI 输出模式

The command system SHALL support text, JSON, and JSONL output modes for agent loop commands with stable exit codes and redacted diagnostics. In text mode, `model.delta` chunks SHALL be rendered inline as one growing line per iteration, `model.reasoning` chunks SHALL coalesce into a single `[reasoning]` indicator per iteration with streamed thinking text appended, and any non-streaming event SHALL close the open streaming line with a newline before rendering its own status text. JSON and JSONL modes SHALL remain one-event-per-line with no change from today.

command system 必须支持 agent loop 命令的 text、JSON 和 JSONL 输出模式，并提供稳定退出码与脱敏 diagnostics。text 模式下，`model.delta` chunk 必须 inline 渲染为每 iteration 一条递增行；`model.reasoning` chunk 必须合并为每 iteration 单个 `[reasoning]` 指示并 inline 追加 thinking 文本；任何非流式事件必须先用一次换行关闭打开的流式行，再渲染自身状态文本。JSON 和 JSONL 模式保持一事件一行，与今天一致。

#### Scenario: JSONL output is stream-safe / JSONL 输出适合流式消费

- **WHEN** `deepseek run --output jsonl "inspect repo"` is executed
- **THEN** each runtime event is written as one JSON line and process exit code reflects terminal success, failure, cancellation, or usage error
- **中文** 当执行 `deepseek run --output jsonl "inspect repo"` 时，每个 runtime event 必须写成一行 JSON，且进程退出码反映 terminal success、failure、cancellation 或 usage error。

#### Scenario: JSON output summarizes final result / JSON 输出总结最终结果

- **WHEN** `deepseek run --output json "inspect repo"` completes
- **THEN** stdout contains a single JSON object with final status, assistant summary, trace id, session id, turn id, diagnostics, and redaction metadata
- **中文** 当 `deepseek run --output json "inspect repo"` 完成时，stdout 必须包含单个 JSON object，包含 final status、assistant summary、trace id、session id、turn id、diagnostics 和 redaction metadata。

#### Scenario: Text mode streams delta chunks inline / text 模式流式 inline 输出 delta

- **WHEN** `deepseek run --output text` receives three consecutive `model.delta` chunks within one iteration
- **THEN** the rendered output contains a single line with the concatenated delta text followed by exactly one newline when the iteration ends
- **中文** 当 `deepseek run --output text` 在一个 iteration 内连续收到三个 `model.delta` chunk 时，渲染输出必须是一条拼接了 delta 文本的行，iteration 结束时以一次换行收尾。

#### Scenario: Text mode coalesces reasoning per iteration / text 模式每 iteration 合并 reasoning

- **WHEN** `deepseek run --output text` receives multiple `model.reasoning` chunks within one iteration before any non-reasoning event
- **THEN** the rendered output contains exactly one `[reasoning]` indicator line that carries the concatenated thinking text, terminated by a newline when the next non-reasoning event renders
- **中文** 当 `deepseek run --output text` 在一个 iteration 内连续收到多个 `model.reasoning` chunk 而中间没有非 reasoning 事件时，渲染输出必须恰好包含一个 `[reasoning]` 指示行，携带拼接的 thinking 文本，在下一次非 reasoning 事件渲染时以换行收尾。
