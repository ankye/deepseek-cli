## Why

The command bar can accept a suggestion as a local descriptor, but raw chat input still consumes that descriptor without filling or submitting a prompt. The next product step is to make accepted slash suggestions become usable chat input while preserving the no-surprise execution boundary.

Command bar 现在可以把 suggestion 接受为 local descriptor，但 raw chat input 仍然只是消费该 descriptor，并不会填充或提交 prompt。下一步产品体验是让 accepted slash suggestions 变成可用的 chat input，同时保持无惊喜执行边界。

## What Changes

- Bridge accepted command bar slash suggestions into the raw chat input buffer.
- 将 accepted command bar slash suggestions 桥接到 raw chat input buffer。
- Submit complete slash suggestions such as `/help` immediately as local chat commands.
- 对 `/help` 这类完整 slash suggestion，立即作为 local chat command 提交。
- Fill incomplete slash suggestions with a trailing space, such as `/file list `, so users can type required arguments before pressing Enter.
- 对 `/file list ` 这类需要参数的 slash suggestion，填充到输入缓冲并保留尾随空格，让用户补参数后再按 Enter。
- Keep non-slash/plugin descriptors descriptor-only until governed plugin execution is explicitly wired.
- 非 slash/plugin descriptors 在 governed plugin execution 明确接入前继续保持 descriptor-only。
- Preserve normal raw prompt typing: `/` inside a non-empty prompt remains text, while `/` on an empty prompt opens the command bar.
- 保持正常 raw prompt 输入：非空 prompt 内的 `/` 仍是文本；空 prompt 上的 `/` 打开 command bar。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chat-tui-workbench-interaction`: Accepted command bar slash suggestions shall bridge into raw chat input as submitted commands or editable drafts.

## Impact

- Affected code: raw chat input reader, raw-input-to-TUI dispatcher, TUI command acceptance bridge, raw input integration tests.
- Affected product surfaces: full-screen/raw TUI command bar, slash command discovery-to-use flow.
- No model/provider behavior changes and no direct plugin execution changes.
