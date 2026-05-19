## Why

Built-in plugins can now declare owner routes and route readiness, but the TUI and palette still mostly explain or dry-run plugin actions. The next product leap is to make plugin actions executable from the workbench so the interface feels like a real agent console instead of a metadata browser.

内置插件已经可以声明 owner routes 与 route readiness，但 TUI 和 palette 目前主要还是解释或 dry-run 插件动作。下一步产品跃迁是让插件动作能从 workbench 直接执行，让界面像真正的 agent console，而不是 metadata browser。

## What Changes

- Add a host-owned interactive plugin execution plane for built-in owner routes.
- 增加 host-owned interactive plugin execution plane，用于调度 built-in owner routes。
- Record every interactive plugin execution as a structured, redacted, replayable record.
- 每次交互式插件执行都产出结构化、脱敏、可回放的 execution record。
- Allow TUI and palette projections to request implemented route dispatch, surface deferred routes, and attach result lists to the workbench.
- 允许 TUI 与 palette projection 请求 implemented route dispatch，展示 deferred route，并把 result lists 接入 workbench。
- Promote Repo Navigator into the first polished built-in plugin pattern for files, grep, deferred recall/project-index, result-list navigation, and reference workflow handoff.
- 将 Repo Navigator 打磨为第一个内置插件样板，覆盖 files、grep、deferred recall/project-index、result-list navigation 与 reference workflow handoff。
- Keep plugin code declarative; execution remains in CLI host adapters and owner subsystems.
- 插件代码继续保持声明式；执行仍归 CLI host adapters 与 owner subsystems。

## Capabilities

### New Capabilities
- `interactive-plugin-workbench`: Covers host-governed plugin execution records, route dispatch requests, workbench result attachment, and Repo Navigator interaction patterns.

### Modified Capabilities
- `professional-vi-tui-experience`: TUI plugin actions must execute implemented owner routes and explain deferred routes in-place.
- `command-palette-vi-actions`: Palette command entries must expose executable plugin action requests and route results.
- `chat-tui-workbench-interaction`: Workbench state must include recent plugin executions, active plugin result lists, and plugin action activity.
- `first-party-dev-plugins`: Built-in plugin projections must remain declarative while carrying enough route metadata for host dispatch.
- `command-system`: Plugin-action dry-runs must stay inert, while host execution records prove real execution only happens through owner routes.

## Impact

- Affected code: `src/apps/cli/src/plugins/*`, `src/apps/cli/src/commands/chat-tui*`, `src/apps/cli/src/commands/palette.ts`, `src/packages/command-system`, `src/plugins/builtin`, and tests under `tests/contracts`, `tests/integration`, and `tests/matrix`.
- Affected product surfaces: full-screen TUI, command bar, command palette JSON/JSONL, plugin shelf, activity feed, Repo Navigator, extension inspection.
- No new runtime dependency. Execution remains host-owned and uses existing platform/runtime adapters.
