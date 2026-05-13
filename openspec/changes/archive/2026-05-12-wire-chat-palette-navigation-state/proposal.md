## Why

Chat can now render palette and keymap data locally, but each slash command is stateless. To make the CLI feel closer to vi's efficient result navigation, chat needs a small local composition state that can move focus, record jumps, and turn focused results into references without invoking the model.

Chat 现在已经可以本地渲染 palette 和 keymap 数据，但每条 slash command 仍是无状态的。为了让 CLI 更接近 vi 高效的结果导航体验，chat 需要一个小型本地 composition state，可以移动焦点、记录跳转，并把当前聚焦结果转成 references，且不调用 model。

## What Changes

- Add chat-local palette navigation controls `/palette next`, `/palette previous`, `/palette first`, and `/palette last`. / 增加 chat-local palette navigation controls：`/palette next`、`/palette previous`、`/palette first`、`/palette last`。
- Keep a per-chat local palette composition snapshot so navigation updates active target, result-list focus, and jump history. / 保留每个 chat 的本地 palette composition snapshot，使 navigation 能更新 active target、result-list focus 和 jump history。
- Add `/palette refs add <target-id|current>` for adding a result-list item to the active reference set. / 增加 `/palette refs add <target-id|current>`，把 result-list item 加入 active reference set。
- Add `/palette state` to render a compact structured summary of current focus, result-list focus, jump count, and reference count. / 增加 `/palette state`，渲染当前 focus、result-list focus、jump count 和 reference count 的紧凑结构化摘要。
- Preserve existing `/palette`, `/palette list`, `/palette action`, and `/keymap` behavior. / 保持现有 `/palette`、`/palette list`、`/palette action` 与 `/keymap` 行为不变。
- Keep all new controls local, dry-run, and model/runtime-safe. / 保持所有新增 controls 本地、dry-run、model/runtime 安全。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `minimal-chat-cli`: chat palette controls maintain local focus/reference/jump state. / chat palette controls 维护本地 focus/reference/jump state。
- `command-palette-vi-actions`: action resolution state updates are consumable by chat navigation and reference controls. / action resolution state updates 可被 chat navigation 与 reference controls 消费。
- `vi-inspired-cli-composition`: result-list navigation and reference-set updates are exposed through bounded local slash controls before raw-mode key handling. / 在 raw-mode key handling 之前，通过有边界的本地 slash controls 暴露 result-list navigation 与 reference-set updates。
- `testing-regression`: cover stateful chat palette navigation, jump history, reference-set updates, and no model/runtime submission. / 覆盖有状态 chat palette navigation、jump history、reference-set updates 和不提交 model/runtime。

## Impact

- Affects `src/apps/cli/src/commands/chat.ts` and palette helper exports. / 影响 chat command 与 palette helper exports。
- Adds a small host-local composition state helper under `src/apps/cli/src/commands/`. / 在 CLI commands 下增加小型 host-local composition state helper。
- Adds CLI host tests for JSONL/text state records and locality guarantees. / 增加 CLI host tests，覆盖 JSONL/text state records 和本地性保证。
- Does not add full-screen terminal UI, raw keyboard mode, persistent state across process restarts, or command execution from palette. / 不增加 full-screen terminal UI、raw keyboard mode、跨进程持久 state 或从 palette 执行命令。
