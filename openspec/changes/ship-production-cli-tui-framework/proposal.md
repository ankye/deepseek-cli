## Why

The current `deepseek chat` TUI is a line prompt foundation, not a production-ready terminal interaction framework. Because the next milestone is release-oriented, the CLI needs a complete host-side TUI framework that can own modal interaction, deterministic rendering, keymap/action dispatch, and plugin-safe contribution boundaries before richer plugins are enabled.

当前 `deepseek chat` 的 TUI 只是行式 prompt 基座，不是可上线的终端交互框架。由于下一阶段面向上线，CLI 需要先具备完整的 host-side TUI framework，能够承载 modal interaction、确定性渲染、keymap/action dispatch 与 plugin-safe contribution boundaries，然后再接入更丰富的插件。

## What Changes

- Replace the basic chat TUI helper with a production TUI framework module for shell state, modal composition, keymap dispatch, viewport rendering, diagnostics, and degradation.
- Make the default interactive chat status expose the active vi-inspired framework, interaction mode, viewport profile, keymap profile, contribution count, conflict diagnostics, and plugin readiness state.
- Add a TUI contribution registry that accepts declarative core/user/plugin command, action, keymap, palette, result-list, and render-hint metadata, validates conflicts deterministically, and never executes plugin code during registration or rendering.
- Wire chat local controls to a shared TUI action dispatcher so slash controls and future raw-key controls update the same composition snapshot and diagnostics.
- Preserve JSON/JSONL, scripted, CI, and redirected IO behavior with no prompts, cursor controls, alternate-screen controls, or terminal-only records.
- Add deterministic contract tests for framework state, key dispatch, plugin contribution conflicts, viewport rendering, and chat integration.

- 用 production TUI framework module 替换基础 chat TUI helper，覆盖 shell state、modal composition、keymap dispatch、viewport rendering、diagnostics 与 degradation。
- 默认交互式 chat status 必须展示 active vi-inspired framework、interaction mode、viewport profile、keymap profile、contribution count、conflict diagnostics 与 plugin readiness state。
- 增加 TUI contribution registry，接收声明式 core/user/plugin command、action、keymap、palette、result-list 与 render-hint metadata，确定性校验冲突，且 registration/rendering 阶段绝不执行 plugin code。
- 将 chat local controls 接入共享 TUI action dispatcher，使 slash controls 与未来 raw-key controls 更新同一 composition snapshot 与 diagnostics。
- 保持 JSON/JSONL、scripted、CI 与 redirected IO 行为，不输出 prompts、cursor controls、alternate-screen controls 或 terminal-only records。
- 增加 framework state、key dispatch、plugin contribution conflicts、viewport rendering 与 chat integration 的确定性 contract tests。

## Capabilities

### New Capabilities

- `production-cli-tui-framework`: Defines the release-ready terminal UI framework surface, state model, rendering contract, vi-inspired dispatcher, contribution registry, and degradation rules.

### Modified Capabilities

- `minimal-chat-cli`: Upgrade chat TTY behavior from a basic line prompt to a framework-backed interactive shell while preserving runtime/event semantics.
- `terminal-capability-rendering`: Require viewport rendering and terminal-only affordances to derive from the terminal profile and remain absent from structured/scripted output.
- `vi-inspired-cli-composition`: Require the implemented framework to use the vi-inspired action/model contracts as its dispatch layer.
- `command-palette-vi-actions`: Require chat palette/result-list actions and keymap dispatch to share the same typed action resolution path.
- `cli-interaction-modes`: Require TUI mode/status state to be explicit, diagnosable, and safe to degrade.

## Impact

- Affected code: `src/apps/cli/src/commands/chat.ts`, chat TUI modules, palette/action helpers, terminal profile integration, command-system keymap helpers, and CLI tests.
- Affected contracts: OpenSpec TUI requirements, vi composition requirements, terminal rendering requirements, and chat interaction requirements.
- No new external runtime dependency is required for this change; the framework stays TypeScript-only and host-local.
- Plugin execution remains out of scope, but plugin contribution metadata becomes a first-class validated input to the TUI registry.

- 影响代码：`src/apps/cli/src/commands/chat.ts`、chat TUI modules、palette/action helpers、terminal profile integration、command-system keymap helpers 与 CLI tests。
- 影响契约：OpenSpec TUI requirements、vi composition requirements、terminal rendering requirements 与 chat interaction requirements。
- 本变更不需要新增外部 runtime dependency；framework 保持 TypeScript-only 且 host-local。
- Plugin execution 仍不在范围内，但 plugin contribution metadata 会成为 TUI registry 的一等校验输入。
