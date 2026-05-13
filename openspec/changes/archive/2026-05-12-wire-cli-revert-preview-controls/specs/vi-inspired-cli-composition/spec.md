## ADDED Requirements

### Requirement: Revert Preview Has A CLI Surface / 回退预览拥有 CLI Surface

The vi-inspired composable `revert` action SHALL be available through explicit CLI preview controls before any mutating revert/apply command is exposed.

Vi-inspired 可组合 `revert` action 必须先通过显式 CLI preview controls 可用，然后才能暴露任何会修改状态的 revert/apply command。

#### Scenario: Revert target is explicit / 回退 Target 显式化
- **WHEN** a user requests a revert preview
- **THEN** the CLI requires an explicit request, turn, session, or path target and renders the resolved target as structured data
- **中文** 当用户请求 revert preview 时，CLI 必须要求显式 request、turn、session 或 path target，并将 resolved target 渲染为结构化数据。

#### Scenario: Preview precedes mutation / 预览先于修改
- **WHEN** only revert preview controls are implemented
- **THEN** the CLI must not expose a mutating revert command under the same surface
- **中文** 当仅实现 revert preview controls 时，CLI 不得在同一 surface 下暴露会修改状态的 revert command。
