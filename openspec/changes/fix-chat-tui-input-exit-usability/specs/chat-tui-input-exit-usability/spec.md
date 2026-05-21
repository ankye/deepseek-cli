# chat-tui-input-exit-specification

## Purpose
Define deterministic fixes for raw TUI command-bar interactions, panel navigation, and interactive rendering clarity in chat mode.

定义 chat 模式中 raw TUI command-bar 交互、面板导航与交互渲染清晰度的确定性修复要求。

## Requirements
### Requirement: Command-bar open only when input buffer is empty
When pending prompt text is empty, pressing `/` in prompt mode opens the command bar without buffering `/` in raw prompt text. When pending is non-empty, `/` is buffered as normal text.

当提示文本 pending 为空时，在 prompt 模式按 `/` 打开命令栏且不入池；当 pending 非空时，`/` 作为普通文本写入。

### Requirement: Command-bar editable text is local-first
While the command bar is open, printable characters update command suggestions deterministically and must not leak into `pending` prompt output unless explicitly converted by local command bridge output.

命令栏打开时，可打印字符必须本地更新可见建议，不应泄漏到 `pending` 的 prompt 文本，除非被明确转换为 `submitText`/`insertText`。

### Requirement: Unmatched command-bar Enter remains local
Pressing Enter with a non-empty command query that has no actionable command suggestion must not submit raw model input and must keep command-bar context intact.

当命令栏查询无可执行建议时，按 Enter 不应提交模型输入，命令栏上下文应保持。

### Requirement: Tab semantics respect active panel
When command-bar is open, Tab and Shift+Tab navigate suggestions; when command-bar is not open, Tab and Shift+Tab cycle focus panels (without switching model pages).

命令栏打开时，Tab/Shift+Tab 在建议中导航；未打开时，Tab/Shift+Tab 仅在面板间切换焦点。

### Requirement: Command preview rendering is bounded and sectioned
Interactive text-rendered workbench summaries (compact/line mode) must be bounded and include explicit section labels for easy panel boundary recognition.

line 模式下的 workbench 摘要渲染应有有界输出，并包含明显区域标签，便于识别边界。

### Requirement: Exit remains visible and raw Ctrl+C exits
The first interactive TUI screen must show a clear input anchor and exit affordance. In raw TUI prompt mode, Ctrl+C must produce an explicit local `/exit` command so the chat loop can terminate even when terminal raw mode consumes the usual process signal.

首屏必须明显展示输入位置和退出方式。在 raw TUI prompt 模式下，Ctrl+C 必须转换为明确的本地 `/exit` 命令，即使终端 raw mode 吞掉常规进程信号也能退出 chat loop。

### Requirement: Raw input has visible live feedback
Raw TUI prompt input must repaint the visible input anchor after printable input, Backspace, slash command entry, and command-bar query updates. Users must be able to see where text is being entered without waiting for Enter. Command-bar suggestions must render in a stable reserved line above the input anchor, not appended after the input text. The input line and input box must contain only the current input text; no hints or help text may appear after or below the input anchor.

raw TUI prompt 输入必须在普通字符、Backspace、slash 命令入口以及命令栏查询更新后重绘可见输入锚点。用户不应等到回车后才知道文字输入到了哪里。命令栏建议必须渲染在输入锚点上方的稳定预留行中，而不是追加到输入文字后面。输入行和输入框只能包含当前输入文本；输入锚点后方或下方不得出现提示或帮助文字。

### Requirement: Long mixed-language input keeps cursor-visible tail
Raw TUI prompt rendering must keep long input bounded by the available input area. When the input contains more display cells than fit, the visible text must prefer the tail nearest the cursor and preserve mixed Chinese, English, and punctuation characters without appending hints below the input anchor.

raw TUI prompt 渲染必须把超长输入限制在可用输入区域内。当输入内容超出可显示宽度时，可见文本必须优先展示靠近光标的尾部，并保留中英文与标点符号，不得在输入锚点下方追加提示。

### Requirement: Log-shaped input is display-safe
Raw TUI prompt rendering must sanitize pasted or buffered log-shaped text before drawing it into the input anchor. Raw newlines, carriage returns, tabs, ANSI escape bytes, and control bytes must not be allowed to move the cursor, recolor the terminal, create extra input-area rows, or obscure the current input anchor.

raw TUI prompt 渲染必须在把粘贴或缓冲的日志形状文本画入输入锚点前进行显示安全处理。原始换行、回车、制表符、ANSI escape 字节和控制字节不得移动光标、改变终端颜色、创建额外输入区域行，或遮挡当前输入锚点。

### Requirement: Bracketed paste keeps multiline text in one prompt
When raw input receives bracketed paste start and end events, newline characters inside the paste must be appended to the prompt buffer instead of submitting intermediate prompts. Slash-prefixed pasted text must remain literal prompt text and must not open the command bar.

当 raw input 收到 bracketed paste 开始与结束事件时，粘贴内容内部的换行必须追加到 prompt 缓冲区，而不是提交中间 prompt。以 slash 开头的粘贴文本必须作为普通 prompt 文本保留，不得打开命令栏。

Full-screen TUI entry must enable terminal bracketed paste mode and teardown must disable it.

full-screen TUI 进入时必须启用终端 bracketed paste mode，退出时必须关闭。

### Requirement: Full-screen TUI uses coherent full-frame repaint
When chat runs with `--tui full-screen`, raw prompt updates must repaint the full-screen frame instead of writing line-mode prompt fragments. The full-screen first screen must keep internals low density, show a stable input box, and render command suggestions above the input box.

当 chat 使用 `--tui full-screen` 运行时，raw prompt 更新必须重绘 full-screen frame，而不是写入 line-mode prompt 片段。full-screen 首屏必须降低内部信息密度，展示稳定输入框，并将命令建议渲染在输入框上方。

### Requirement: Full-screen raw repaint avoids per-key clear-screen flicker
When chat runs with `--tui full-screen`, the renderer may clear the alternate screen on entry, but raw prompt repaint updates must not clear the screen on every key press. Repaints must return to the frame origin and overwrite a padded full frame so large input does not visually flash or jump.

当 chat 使用 `--tui full-screen` 运行时，renderer 可以在进入 alternate screen 时清屏，但 raw prompt repaint 不得在每次按键时清屏。重绘必须回到 frame 原点并覆盖带 padding 的完整 frame，避免大文本输入时视觉闪烁或跳动。

## Scenarios
### Scenario: Slash opens command-bar and does not pollute prompt buffer
- Given prompt pending is `""`
- When the user presses `/`
- Then command-bar opens, `pending` remains `""`, and no immediate prompt output is emitted.

### Scenario: Real-time filtering while command-bar is open
- Given command-bar is open
- When the user types `h`
- Then `commandBar.query` becomes `"h"` and filtered suggestions update without model output.

### Scenario: Enter does not submit empty suggestions
- Given command-bar is open with query `"zzz"` and no suggestions match
- When Enter is pressed
- Then no raw prompt is yielded and command-bar state remains local.

### Scenario: Tab behavior in command-bar versus panel-mode
- Given command-bar is open and suggestions exist
- When Tab is pressed
- Then active suggestion changes.
- Given command-bar is not open
- When Tab is pressed
- Then focus cycles to another non-command-bar panel (for example `reasoning`).

### Scenario: Ctrl+C exits raw TUI prompt mode
- Given raw TUI prompt mode is waiting for input
- When the user presses Ctrl+C
- Then the prompt reader emits `/exit` as a local command.
- And the first screen advertises `Ctrl+C exit` and `/exit`.

### Scenario: Raw prompt text is echoed while typing
- Given raw TUI prompt mode is waiting for input
- When the user types `h`, `i`, Backspace, and `!`
- Then the screen shows `deepseek> h_`, `deepseek> hi_`, and `deepseek> h!_` before Enter.

### Scenario: Command-bar query is echoed while filtering
- Given raw TUI prompt mode is waiting for input
- When the user types `/` and `h`
- Then the screen shows `deepseek> /_` and `deepseek> /h_`.
- And matching suggestions such as `/help` are visible above the input line.

### Scenario: Full-screen command filtering repaints the frame
- Given chat is running with `--tui full-screen`
- When the user types `/` and `h`
- Then the repaint output contains a `Suggestions` region above an `Input` region.
- And the input region shows `deepseek> /h_`.
- And line-mode prompt fragments are not written into the full-screen frame.

### Scenario: Full-screen prompt text is echoed while typing
- Given chat is running with `--tui full-screen`
- When the user types `h` and `i` before pressing Enter
- Then the full-screen input box shows `deepseek> h_` and `deepseek> hi_`.
- And the input box is repainted through the same full-screen frame path.

### Scenario: Long mixed-language prompt keeps the tail visible
- Given raw TUI prompt mode is waiting for input
- When the user types long Chinese, English, and punctuation text that exceeds the input width
- Then the input anchor shows a bounded tail ending at the cursor.
- And the visible tail includes the final mixed-language characters and symbols.

### Scenario: Hundreds of log lines stay inside one input anchor
- Given raw TUI prompt rendering receives hundreds of log-like lines with paths, ANSI escapes, JSON fragments, Chinese text, emoji, tabs, and symbols
- When the input anchor is rendered
- Then the visible input anchor remains a single bounded display line.
- And raw control characters are escaped as visible text instead of being emitted to the terminal.

### Scenario: Bracketed multiline paste submits as one prompt
- Given raw TUI prompt mode is waiting for input
- When the terminal sends bracketed paste containing `/first`, newlines, and log text
- Then no command bar opens during the paste.
- And pressing Enter after paste end submits the whole pasted text as one prompt.

### Scenario: Full-screen raw typing does not clear the screen per key
- Given chat is running with `--tui full-screen`
- When the user types multiple prompt characters before submitting
- Then the alternate screen is cleared only when entering the full-screen view.
- And each prompt repaint moves to the frame origin without emitting another clear-screen sequence.
