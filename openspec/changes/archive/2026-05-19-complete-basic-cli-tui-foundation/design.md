## Context

The CLI already owns a governed `chat` host adapter over runtime events, a terminal capability profile, local slash commands, palette/result-list state, PageIndex recall, and session resume/fork controls. Current text chat works for scripted and live terminal input, but its visible shell is minimal: startup text is generic, prompt visibility is implicit, and users do not get a compact indication of renderer/input/degradation before the first prompt.

CLI 已经拥有基于 runtime events 的受治理 `chat` host adapter、terminal capability profile、本地 slash commands、palette/result-list state、PageIndex recall，以及 session resume/fork controls。当前 text chat 可用于脚本化和真实终端输入，但可见 shell 仍很薄：启动文本较通用、prompt 可见性是隐式的，用户在第一条 prompt 前无法看到 renderer/input/degradation 的紧凑指示。

## Goals / Non-Goals

**Goals:**

- Provide a basic line-oriented TUI foundation for `deepseek chat` text TTY sessions.
- Render a compact startup status and prompt in interactive text mode.
- Re-render the prompt after local slash commands and completed runtime turns.
- Preserve existing deterministic behavior for JSON/JSONL, scripted input, redirected IO, and tests.
- Keep every new surface local to the CLI host and backed by terminal profiles or structured runtime/command events.

- 为 `deepseek chat` text TTY sessions 提供基础行式 TUI 基座。
- 在 interactive text mode 渲染紧凑启动状态与 prompt。
- 在本地 slash commands 和完成的 runtime turns 后重绘 prompt。
- 保持 JSON/JSONL、scripted input、redirected IO 和 tests 的现有确定性行为。
- 所有新增 surface 均保留在 CLI host，并由 terminal profiles 或 structured runtime/command events 支撑。

**Non-Goals:**

- No full-screen TUI, alternate screen, cursor-addressed layout, or terminal UI framework.
- No raw-key navigation implementation beyond existing slash-driven equivalents.
- No plugin, MCP, marketplace, extension-contributed command UI, or third-party keymap loading.
- No new model/runtime execution path.

- 不实现 full-screen TUI、alternate screen、cursor-addressed layout 或 terminal UI framework。
- 不实现超过现有 slash-driven 等价能力之外的 raw-key navigation。
- 不引入 plugin、MCP、marketplace、extension-contributed command UI 或第三方 keymap loading。
- 不新增 model/runtime execution path。

## Decisions

1. Keep the basic TUI as a renderer/input profile projection, not a new runtime mode.

   The existing interaction-mode contracts already distinguish chat, headless, result-list, approval, and future rich modes. The basic TUI should render from `CliTerminalCapabilityProfile` and local chat state. It must not create a separate execution engine or new runtime mode.

   基础 TUI 保持为 renderer/input profile 的投影，而不是新的 runtime mode。现有 interaction-mode contracts 已区分 chat、headless、result-list、approval 与未来 rich modes。基础 TUI 应从 `CliTerminalCapabilityProfile` 和本地 chat state 渲染，不得创建独立执行引擎或新的 runtime mode。

2. Use plain line prompts instead of raw mode.

   A simple prompt such as `deepseek> ` is enough to prove interactive readiness and keeps scripted/non-TTY paths stable. Raw-key handling remains optional future work over the same action model.

   使用普通行式 prompt，而不是 raw mode。`deepseek> ` 这样的简单 prompt 足以证明 interactive readiness，并保持 scripted/non-TTY 路径稳定。Raw-key handling 仍是同一 action model 之上的后续可选工作。

3. Render TTY-only affordances through the inline writer.

   The existing `createInlineWriter` path already gates direct stdout writes on terminal capability. Prompt text should use that path only when `output=text`, stdin/stdout are TTY, and input strategy is `line`; JSON/JSONL and scripted input must remain prompt-free.

   通过 inline writer 渲染仅 TTY 的交互提示。现有 `createInlineWriter` 已基于 terminal capability 门控 direct stdout writes。Prompt text 仅在 `output=text`、stdin/stdout 为 TTY 且 input strategy 为 `line` 时使用该路径；JSON/JSONL 与 scripted input 必须保持无 prompt。

4. Defer plugin UI until core shell evidence is stable.

   Plugin-contributed commands, actions, keymaps, and render hints depend on a stable shell contract. This change only records the deferral and protects current local command behavior.

   将 plugin UI 延后到核心 shell evidence 稳定之后。Plugin-contributed commands、actions、keymaps 与 render hints 依赖稳定 shell contract。本变更只记录延后并保护当前本地 command 行为。

## Risks / Trade-offs

- Prompt text can pollute scripted tests or JSONL output -> Gate prompts on text TTY line input and add regression tests.
- Startup status may become noisy -> Keep it one compact line and do not emit it in structured modes.
- Users may expect full Vim/TUI behavior from the word TUI -> README/help should continue to frame this as a basic line-oriented foundation, with rich TUI planned.
- Prompt redraw during streaming can interleave with model deltas -> Render prompt only before reading the next line and after terminal events/local commands, never during a streaming turn.

- Prompt text 可能污染脚本化测试或 JSONL output -> 只在 text TTY line input 下开启 prompt，并增加回归测试。
- 启动状态可能变吵 -> 保持单行紧凑，并且不在 structured modes 输出。
- 用户可能因 TUI 一词期待完整 Vim/TUI 行为 -> README/help 应继续将其表述为基础行式基座，rich TUI 仍 planned。
- Prompt redraw 可能与 model deltas 交错 -> 只在读取下一行前和 terminal events/local commands 后渲染 prompt，不在 streaming turn 中渲染。
