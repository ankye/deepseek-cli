## Why

The interactive plugin workbench is now functional, but `chat-tui.ts` and `chat-tui-workbench.ts` still act as central aggregation files. Keeping the new plugin execution and plugin shelf logic inside these files makes future TUI product work slower and keeps temporary split-plan debt in the architecture lint baseline.

交互式插件 workbench 已经可用，但 `chat-tui.ts` 与 `chat-tui-workbench.ts` 仍然承担中心聚合职责。继续把 plugin execution 与 plugin shelf 逻辑放在这些文件里，会拖慢后续 TUI 产品迭代，并让 architecture lint 的临时 split-plan debt 长期存在。

## What Changes

- Extract chat TUI plugin execution state attachment into a dedicated CLI host module.
- 将 chat TUI 的 plugin execution state attachment 拆入独立 CLI host 模块。
- Extract workbench plugin activity and plugin shelf projection into a dedicated projection module.
- 将 workbench 的 plugin activity 与 plugin shelf projection 拆入独立 projection 模块。
- Remove the temporary oversized-file baseline entries for the affected TUI files once they are below the central-file threshold.
- 当相关 TUI 文件低于 central-file threshold 后，移除临时 oversized-file baseline entries。
- Preserve public imports and existing user-visible TUI behavior.
- 保持 public imports 与现有用户可见 TUI 行为不变。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `architecture-scale-guardrails`: Temporary split-plan baseline entries for central files must be retired when the tracked responsibility is extracted.

## Impact

- Affected code: `src/apps/cli/src/commands/chat-tui.ts`, `src/apps/cli/src/commands/chat-tui-workbench.ts`, new private CLI command projection modules, and `scripts/lint-framework/conventions.mjs`.
- Affected tests: existing TUI, interactive plugin workbench, and architecture lint/boundary checks.
- No new runtime dependency and no public CLI behavior change.
