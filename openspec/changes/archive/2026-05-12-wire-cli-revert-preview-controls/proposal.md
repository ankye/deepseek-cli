## Why

The platform already records checkpoint and request/turn revert contracts, and the vi-inspired action model already treats `revert` as a composable dry-run action. CLI users need a safe, discoverable preview surface before any real restore path is exposed.

平台已经记录 checkpoint 与 request/turn revert contracts，vi-inspired action model 也已经把 `revert` 作为可组合 dry-run action。CLI 用户需要一个安全、可发现的 preview surface，然后才应该暴露真实 restore path。

## What Changes

- Add scriptable `deepseek revert preview ...` controls for request, turn, session, and optional path scopes. / 增加可脚本化 `deepseek revert preview ...` controls，支持 request、turn、session 与可选 path scopes。
- Add chat-local `/revert preview ...` controls with the same target parsing and structured output. / 增加 chat-local `/revert preview ...` controls，使用同一 target parsing 与结构化输出。
- Use workspace-state `revertRequest({ dryRun: true })` when workspace checkpoint state is available. / 当 workspace checkpoint state 可用时，使用 workspace-state `revertRequest({ dryRun: true })`。
- Return typed empty-preview failures when no checkpoints match, without mutating workspace files, sessions, or checkpoints. / 当没有匹配 checkpoints 时返回类型化 empty-preview failures，且不修改 workspace files、sessions 或 checkpoints。
- Update usage and chat help to advertise revert preview controls. / 更新 usage 与 chat help，展示 revert preview controls。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `checkpoint-undo`: expose request/turn/session revert preview through CLI controls before real restore. / 在真实 restore 前，通过 CLI controls 暴露 request/turn/session revert preview。
- `minimal-chat-cli`: add local `/revert preview` control that does not submit model/runtime requests. / 增加本地 `/revert preview` control，且不提交 model/runtime requests。
- `vi-inspired-cli-composition`: connect composable revert action to a CLI preview surface. / 将可组合 revert action 接到 CLI preview surface。
- `testing-regression`: cover scriptable and chat-local revert preview output, typed empty failures, and no mutation/model submission. / 覆盖可脚本化与 chat-local revert preview output、类型化 empty failures 和无 mutation/model submission。

## Impact

- Affects CLI parsing, usage output, chat slash handling, and a new revert command module. / 影响 CLI parsing、usage output、chat slash handling 和新的 revert command module。
- Reuses existing `WorkspaceStateManager.revertRequest` dry-run contract. / 复用现有 `WorkspaceStateManager.revertRequest` dry-run contract。
- Does not expose real restore/apply from CLI in this change. / 本变更不从 CLI 暴露真实 restore/apply。
