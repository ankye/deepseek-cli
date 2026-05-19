## ADDED Requirements

### Requirement: First-Party Palette Projection / 一方插件面板投影

The command palette SHALL project first-party plugin commands, result-list providers, keymaps, renderer hints, and reference targets as inert metadata with stable provenance and permissions.

command palette 必须将一方 plugin commands、result-list providers、keymaps、renderer hints 与 reference targets 投影为惰性 metadata，并保留稳定 provenance 与 permissions。

#### Scenario: Plugin palette entries are inert / 插件面板条目惰性

- **WHEN** `/palette`, `deepseek palette list`, TUI startup, or extension management requests first-party plugin entries
- **THEN** projection returns stable entries with ids, titles, categories, actions, target metadata, permissions, side effects, source metadata, and diagnostics
- **AND** projection does not execute the command owner or plugin owner
- **中文** 当 `/palette`、`deepseek palette list`、TUI startup 或 extension management 请求一方插件条目时，projection 必须返回包含 ids、titles、categories、actions、target metadata、permissions、side effects、source metadata 与 diagnostics 的稳定 entries；projection 不得执行 command owner 或 plugin owner。

#### Scenario: First-party keymap conflicts are typed / 一方快捷键冲突类型化

- **WHEN** a first-party plugin contributes a keymap entry that conflicts with core, user, or another plugin contribution in the same mode and key
- **THEN** validation returns deterministic conflict diagnostics naming the winner, loser, mode, key, and contribution provenance
- **中文** 当一方插件贡献的 keymap entry 与同一 mode 和 key 下的 core、user 或另一个 plugin contribution 冲突时，validation 必须返回确定性 conflict diagnostics，包含 winner、loser、mode、key 与 contribution provenance。

### Requirement: First-Party Result Lists / 一方插件结果列表

First-party plugin result lists SHALL use typed targets so vi-inspired navigation, inspection, references, jumps, and dry-run actions work consistently across repo navigation, git review, dev checks, and context compaction results.

一方 plugin result lists 必须使用 typed targets，使 vi-inspired navigation、inspection、references、jumps 与 dry-run actions 在 repo navigation、git review、dev checks 与 context compaction results 中保持一致。

#### Scenario: Result list supports vi navigation / 结果列表支持 Vi 导航

- **WHEN** a first-party plugin result list is active and the user invokes `next`, `previous`, `first`, `last`, `back`, `forward`, `inspect`, or `add-to-reference-set`
- **THEN** action resolution updates the shared composition snapshot or returns a governed request descriptor without mutating workspace, sessions, checkpoints, plugins, or runtime state during projection
- **中文** 当一方 plugin result list 处于 active 状态且用户调用 `next`、`previous`、`first`、`last`、`back`、`forward`、`inspect` 或 `add-to-reference-set` 时，action resolution 必须更新共享 composition snapshot 或返回 governed request descriptor，projection 阶段不得修改 workspace、sessions、checkpoints、plugins 或 runtime state。

#### Scenario: Context result can be referenced / Context 结果可引用

- **WHEN** a context compactor result-list item represents a lossless node, summary node, expanded node, budget finding, or pinned context target
- **THEN** the item includes a typed target id, redacted title/snippet, source class, session id when available, provenance, and action metadata for inspect, expand, and add-to-reference-set
- **中文** 当 context compactor result-list item 表示 lossless node、summary node、expanded node、budget finding 或 pinned context target 时，该 item 必须包含 typed target id、脱敏 title/snippet、source class、可用时的 session id、provenance，以及 inspect、expand 和 add-to-reference-set 的 action metadata。
