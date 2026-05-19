## Context

Raw chat input currently delegates some keys to the TUI through `dispatchRawInputToTui`, but the callback is boolean-only. When the command bar accepts a suggestion, the raw input reader only knows the event was handled; it cannot insert a draft command or yield a submitted slash command to the chat loop.

Raw chat input 当前会通过 `dispatchRawInputToTui` 将部分按键委托给 TUI，但 callback 只有 boolean 语义。当 command bar 接受 suggestion 时，raw input reader 只知道事件已被处理；它无法插入 draft command，也无法向 chat loop yield 已提交的 slash command。

## Goals / Non-Goals

**Goals:**
- Extend local raw input dispatch with structured outcomes: handled-only, insert draft text, or submit text.
- Open the command bar with `/` only when the raw prompt buffer is empty.
- Convert accepted slash suggestions into either submitted prompts or editable draft prefixes.
- Close the command bar after slash suggestion bridging so subsequent typed characters go to the chat prompt buffer.
- Add tests at the raw input bridge level using real raw key decoding.

**目标：**
- 扩展 local raw input dispatch，支持 structured outcomes：仅处理、插入 draft text、或提交 text。
- 仅当 raw prompt buffer 为空时，`/` 才打开 command bar。
- 将 accepted slash suggestions 转成 submitted prompts 或 editable draft prefixes。
- slash suggestion bridge 后关闭 command bar，让后续输入进入 chat prompt buffer。
- 使用真实 raw key decoding 在 raw input bridge 层增加测试。

**Non-Goals:**
- Do not execute plugin suggestions from the command bar.
- Do not introduce a full prompt line editor or visual echo implementation.
- Do not change line-mode chat behavior.
- Do not change existing slash command handlers.

**非目标：**
- 不从 command bar 直接执行 plugin suggestions。
- 不引入完整 prompt line editor 或 visual echo implementation。
- 不改变 line-mode chat 行为。
- 不改变现有 slash command handlers。

## Decisions

### Decision: Local Dispatch Result Becomes Structured

`readCliChatPrompts` will accept a local dispatch callback that returns `false`, `true`, or a structured object. `insertText` replaces the pending raw prompt buffer, while `submitText` yields a prompt immediately and clears the buffer.

`readCliChatPrompts` 的 local dispatch callback 将支持返回 `false`、`true` 或 structured object。`insertText` 替换 pending raw prompt buffer；`submitText` 立即 yield prompt 并清空 buffer。

### Decision: Slash Completeness Is Derived From Preview Placeholders

Accepted suggestions with command names starting with `/` are bridgeable. If the accepted preview contains a placeholder such as `<query>`, the bridge inserts `${commandName} ` as an editable draft. Otherwise it submits `commandName` immediately.

以 `/` 开头的 accepted suggestions 可 bridge。若 accepted preview 包含 `<query>` 等 placeholder，bridge 插入 `${commandName} ` 作为 editable draft；否则立即提交 `commandName`。

### Decision: Plugin Descriptors Stay Descriptor-Only

Plugin and non-slash descriptors remain handled by the TUI but do not produce chat input. This keeps permissioned plugin execution behind explicit governed routes.

Plugin 与 non-slash descriptors 仍由 TUI 本地处理，但不产生 chat input。这能让需要权限的 plugin execution 继续停留在明确的 governed routes 后面。

## Risks / Trade-offs

- [Risk] Users who want to type a manual slash command in raw TUI may expect `/` to enter text. -> Mitigation: `/` only opens the command bar on an empty buffer; once text exists, it remains normal input.
- [风险] 想在 raw TUI 中手动输入 slash command 的用户可能预期 `/` 是文本。-> 缓解：只有 buffer 为空时 `/` 打开 command bar；已有文本时仍作为普通输入。
- [Risk] Draft insertion is invisible in minimal terminals. -> Mitigation: this change focuses on correctness of input flow; renderer echo can be improved separately without changing the bridge contract.
- [风险] draft insertion 在最小终端中可能不可见。-> 缓解：本变更聚焦 input flow 正确性；renderer echo 可在后续独立增强，不改变 bridge contract。
