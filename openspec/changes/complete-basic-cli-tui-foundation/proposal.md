## Why

`deepseek chat` can already process line-based prompts, slash commands, session state, and result-list style controls, but the user-facing terminal experience still feels like a scripted stream rather than a minimal interactive TUI foundation. Before adding plugin-contributed interactions, the CLI needs a stable basic shell contract for prompts, status, degradation, and structured parity.

`deepseek chat` 已经能处理行式 prompt、slash commands、session state 与 result-list 风格 controls，但面向用户的终端体验仍更像脚本流，而不是最小可交互 TUI 基座。在添加 plugin-contributed interactions 之前，CLI 需要先稳定 prompt、status、降级与结构化等价的基础 shell 契约。

## What Changes

- Add a basic chat TUI foundation for text-mode TTY sessions: deterministic startup status, prompt rendering, turn separators, and prompt re-rendering after local commands or runtime turns.
- Keep JSON/JSONL and scripted/non-TTY behavior deterministic with no prompt control text, cursor movement, alternate screen, or plugin execution.
- Make terminal profile selection visible enough for users and tests to understand whether chat is running as interactive, ansi/plain, or scripted/degraded.
- Keep plugin, MCP, marketplace, and extension-contributed UI surfaces out of scope until the core shell surface is stable.

- 为 text-mode TTY sessions 增加基础 chat TUI 基座：确定性的启动状态、prompt 渲染、turn 分隔，以及 local commands 或 runtime turns 后的 prompt 重绘。
- 保持 JSON/JSONL 与 scripted/non-TTY 行为确定，不输出 prompt control text、cursor movement、alternate screen，也不执行 plugin。
- 让 terminal profile selection 对用户和测试足够可见，以判断 chat 正在以 interactive、ansi/plain 或 scripted/degraded 方式运行。
- 在核心 shell surface 稳定前，plugin、MCP、marketplace 与 extension-contributed UI surface 不进入本变更范围。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: define the basic interactive shell contract for prompts, status, and post-turn prompt rendering.
- `terminal-capability-rendering`: require prompt/status rendering to follow terminal profiles and stay absent from structured output.
- `cli-interaction-modes`: clarify that basic interactive chat can expose a lightweight status line without becoming a rich/full-screen TUI.
- `vi-inspired-cli-composition`: keep slash-driven navigation as the foundation and explicitly defer plugin-contributed keymaps/actions until the shell contract is stable.

## Impact

- Affected code: `src/apps/cli/src/commands/chat.ts`, terminal profile/rendering helpers, and chat/terminal tests.
- Affected behavior: `deepseek chat` in text TTY mode gains visible basic prompt/status UX; scripted and JSONL tests remain stable and prompt-free.
- No new runtime, plugin, MCP, or UI framework dependency.

- 影响代码：`src/apps/cli/src/commands/chat.ts`、terminal profile/rendering helpers，以及 chat/terminal tests。
- 行为影响：text TTY 模式的 `deepseek chat` 获得可见的基础 prompt/status UX；scripted 与 JSONL tests 保持稳定且不包含 prompt。
- 不新增 runtime、plugin、MCP 或 UI framework 依赖。
