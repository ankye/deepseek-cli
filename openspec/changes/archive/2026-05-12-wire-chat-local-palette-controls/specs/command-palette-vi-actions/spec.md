## ADDED Requirements

### Requirement: Chat Consumes Palette Actions Locally / Chat 本地消费 Palette Actions

The palette/action layer SHALL be consumable by the chat host as local controls while preserving the same typed projection and dry-run action semantics as scriptable CLI palette commands.

Palette/action layer 必须可被 chat host 作为本地 controls 消费，并保持与可脚本化 CLI palette commands 相同的 typed projection 与 dry-run action 语义。

#### Scenario: Chat palette uses same projection / Chat Palette 使用同一投影
- **WHEN** chat renders `/palette`
- **THEN** it derives entries from the same command composition projection used by `deepseek palette list`
- **中文** 当 chat 渲染 `/palette` 时，必须从 `deepseek palette list` 使用的同一 command composition projection 派生 entries。

#### Scenario: Chat action uses same resolver / Chat Action 使用同一 Resolver
- **WHEN** chat resolves `/palette action <action> <target-id>`
- **THEN** it uses the same typed action resolution semantics as scriptable palette action commands and keeps the result dry-run
- **中文** 当 chat 解析 `/palette action <action> <target-id>` 时，必须使用与可脚本化 palette action commands 相同的 typed action resolution 语义，并保持结果 dry-run。
