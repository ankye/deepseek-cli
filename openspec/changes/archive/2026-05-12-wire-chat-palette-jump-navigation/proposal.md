## Why

Palette result-list navigation already records jump history, but chat users cannot move back or forward through that history. This leaves the vi-inspired navigation model half-finished: focus can move, but users cannot return to a previous target without re-running or manually selecting commands.

Palette result-list navigation 已经记录 jump history，但 chat 用户还不能在该历史中 back/forward。这样 vi-inspired navigation model 只完成了一半：focus 可以移动，但用户无法在不重新运行或手动选择命令的情况下回到之前的 target。

## What Changes

- Add typed `back` and `forward` action kinds for CLI composition jump-history traversal.
- Resolve back/forward locally from `CliCompositionSnapshot.jumpHistory`, updating active target and result-list focus without executing command owners, model calls, runtime primitives, or workspace mutations.
- Expose chat-local `/palette back` and `/palette forward` slash controls that reuse the same typed action resolver and state update path as palette navigation.
- Render deterministic text, JSON, and JSONL state summaries including active target, focused item, jump count, jump cursor, and diagnostics.
- Update help and regression coverage for jump traversal.

- 为 CLI composition jump-history traversal 增加类型化 `back` 与 `forward` actions。
- 从 `CliCompositionSnapshot.jumpHistory` 本地解析 back/forward，更新 active target 与 result-list focus，不执行 command owners、model calls、runtime primitives 或 workspace mutations。
- 暴露 chat-local `/palette back` 与 `/palette forward` slash controls，复用与 palette navigation 相同的类型化 action resolver 与 state update path。
- 渲染确定性的 text、JSON、JSONL state summaries，包含 active target、focused item、jump count、jump cursor 与 diagnostics。
- 更新 help 与回归覆盖，验证 jump traversal。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `command-palette-vi-actions`: Add typed jump-history back/forward action resolution.
- `minimal-chat-cli`: Add chat-local palette jump back/forward slash controls.
- `testing-regression`: Add deterministic coverage for composition and chat jump traversal.

- `command-palette-vi-actions`：增加类型化 jump-history back/forward action resolution。
- `minimal-chat-cli`：增加 chat-local palette jump back/forward slash controls。
- `testing-regression`：增加 composition 与 chat jump traversal 的确定性覆盖。

## Impact

- Platform contracts: `src/packages/platform-contracts/src/cli-composition.ts`.
- Command action resolver: `src/packages/command-system/src/actions.ts`.
- CLI palette/chat host state: `src/apps/cli/src/commands/palette.ts`, `src/apps/cli/src/commands/palette-state.ts`, `src/apps/cli/src/commands/chat.ts`.
- Chat help projection: `src/packages/command-system/src/implementation.ts`.
- Regression tests: `tests/contracts/cli-palette-actions.test.ts`, `src/apps/cli/test/cli.test.ts`.
- No new dependencies, no runtime execution bypass, and no external reference implementation content.

- Platform contracts：`src/packages/platform-contracts/src/cli-composition.ts`。
- Command action resolver：`src/packages/command-system/src/actions.ts`。
- CLI palette/chat host state：`src/apps/cli/src/commands/palette.ts`、`src/apps/cli/src/commands/palette-state.ts`、`src/apps/cli/src/commands/chat.ts`。
- Chat help projection：`src/packages/command-system/src/implementation.ts`。
- 回归测试：`tests/contracts/cli-palette-actions.test.ts`、`src/apps/cli/test/cli.test.ts`。
- 不新增依赖，不绕过 runtime execution，不包含外部参考实现内容。
