## Why

DeepSeek TUI already has a solid interaction kernel, visible reasoning records, vi-style actions, palette state, and plugin metadata, but the user-facing experience still reads like an engineering status stream instead of a coherent product workbench.

DeepSeek TUI 已经具备交互内核、可见推理记录、vi 风格动作、palette state 与插件 metadata，但用户可感知体验仍像工程状态流，而不是完整产品工作台。

## What Changes

- Add a first-class chat TUI workbench model with stable layout regions: status bar, transcript, reasoning rail, inspector, command bar, activity feed, and plugin shelf.
- 增加一等 chat TUI workbench model，包含稳定布局区域：status bar、transcript、reasoning rail、inspector、command bar、activity feed 与 plugin shelf。
- Add a deterministic focus model for moving among transcript, result lists, reasoning, inspector, command bar, activity, and plugin surfaces.
- 增加确定性 focus model，在 transcript、result lists、reasoning、inspector、command bar、activity 与 plugin surfaces 间移动。
- Upgrade visible reasoning from raw stream lines into a product rail with compact summaries, active step, evidence count, certainty/status markers, and inspector targets.
- 将 visible reasoning 从原始流式文本升级为产品化 rail，展示 compact summaries、active step、evidence count、certainty/status markers 与 inspector targets。
- Add command bar state that unifies slash commands, palette commands, context workflows, history/references, reasoning views, and plugin actions.
- 增加 command bar state，统一 slash commands、palette commands、context workflows、history/references、reasoning views 与 plugin actions。
- Add deterministic text-frame rendering for the current line renderer and future fullscreen/raw renderers, without breaking scripted, JSON, or JSONL output.
- 为当前 line renderer 与未来 fullscreen/raw renderers 增加确定性 text-frame rendering，同时不破坏 scripted、JSON 或 JSONL 输出。

## Capabilities

### New Capabilities

- `chat-tui-workbench-interaction`: Covers the product-grade TUI workbench model, focus/navigation, command bar, reasoning rail, inspector, activity feed, plugin shelf, renderer frame, and deterministic fallback behavior.

### Modified Capabilities

- `terminal-capability-rendering`: Clarify that interactive text terminals can render deterministic workbench frames while structured output remains terminal-metadata free.
- `vi-inspired-cli-composition`: Clarify that vi-style actions can drive panel focus and command-bar workflows, not only result-list navigation.

## Impact

- `src/apps/cli/src/commands/chat-tui.ts`: expands from a status snapshot into a workbench state/projector.
- `src/apps/cli/src/commands/chat.ts` and chat session state: consume the upgraded snapshot and render frame lines at startup/status boundaries.
- `src/packages/platform-contracts`: no provider dependency; only existing composition and visible reasoning DTOs are reused unless a small host-agnostic DTO is needed.
- `tests/contracts` and `src/apps/cli/test`: add product-interaction tests for layout, focus, command bar, reasoning rail, inspector, activity feed, terminal fallbacks, and plugin slots.
- Docs and acceptance index: document the TUI workbench as the default product direction.
