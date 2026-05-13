## Why

The CLI now exposes scriptable palette commands, but chat users still need to leave the REPL to inspect palette entries or vi keymaps. Wiring palette controls into chat keeps discovery and navigation local, typed, and model-safe while preparing for richer vi-style interaction later.

CLI 已经暴露可脚本化 palette commands，但 chat 用户仍需要离开 REPL 才能查看 palette entries 或 vi keymaps。把 palette controls 接进 chat，可以让发现与导航保持本地、类型化、模型安全，并为后续更丰富的 vi-style interaction 做准备。

## What Changes

- Add chat-local `/palette` and `/palette list` controls that render the current command palette without sending input to the model. / 增加 chat-local `/palette` 与 `/palette list` controls，渲染当前 command palette，且不发送给 model。
- Add chat-local `/keymap [core|vi-minimal]` controls that render keymap profiles inside chat. / 增加 chat-local `/keymap [core|vi-minimal]` controls，在 chat 内渲染 keymap profiles。
- Add chat-local `/palette action <action> <target-id>` dry-run resolution for typed palette targets. / 增加 chat-local `/palette action <action> <target-id>`，对 typed palette targets 做 dry-run resolution。
- Keep slash controls local in text, JSON, and JSONL modes; unknown palette targets return typed failures. / 在 text、JSON、JSONL 模式下保持 slash controls 本地化；未知 palette targets 返回类型化失败。
- Update chat help so `/help` advertises palette/keymap controls. / 更新 chat help，让 `/help` 展示 palette/keymap controls。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `minimal-chat-cli`: add local chat palette/keymap slash controls and help entries. / 增加本地 chat palette/keymap slash controls 与 help 条目。
- `command-palette-vi-actions`: allow chat to consume palette projection, keymap profile, and action resolution as local controls. / 允许 chat 将 palette projection、keymap profile 和 action resolution 作为本地 controls 消费。
- `testing-regression`: cover chat palette/keymap local controls, JSONL records, typed failures, and no model/runtime submission. / 覆盖 chat palette/keymap 本地 controls、JSONL records、类型化失败和不提交 model/runtime。

## Impact

- Affects `src/apps/cli/src/commands/chat.ts` and palette rendering helpers. / 影响 chat command 与 palette rendering helpers。
- May export focused helper functions from `commands/palette.ts` for chat reuse. / 可能从 `commands/palette.ts` 导出聚焦 helper functions 供 chat 复用。
- Adds CLI host tests for chat-local `/palette`, `/keymap`, and `/palette action`. / 增加 chat-local `/palette`、`/keymap` 和 `/palette action` 测试。
- Does not add full-screen UI, raw key handling, persistent palette state, or palette command execution. / 不增加 full-screen UI、raw key handling、持久 palette state 或 palette command execution。
