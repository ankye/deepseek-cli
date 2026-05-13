## Context

R3 now has inert command/skill/hook/MCP/plugin/extension/workflow composition records and typed CLI composition DTOs for modes, actions, targets, reference sets, result lists, jump history, keymaps, and palette entries. What is missing is the bridge that turns composition records into a discoverable command palette and turns result-list selections into deterministic actions without parsing rendered text.

R3 现在已经有惰性的 command/skill/hook/MCP/plugin/extension/workflow composition records，也有 modes、actions、targets、reference sets、result lists、jump history、keymaps 和 palette entries 的 CLI composition DTO。缺口是把 composition records 变成可发现 command palette，并把 result-list selection 转成确定性 actions，而不是解析渲染文本。

## Goals / Non-Goals

**Goals:**

- Project composition records into stable command palette entries and command result lists. / 将 composition records 投影为稳定 command palette entries 和 command result lists。
- Resolve result-list actions over typed targets and return state deltas for focus, jump history, and reference sets. / 基于 typed targets 解析 result-list actions，并返回 focus、jump history 和 reference sets 的状态增量。
- Provide a minimal vi keymap profile that maps keys to existing actions without creating a Vim runtime dependency. / 提供最小 vi keymap profile，将按键映射到既有 actions，不引入 Vim runtime dependency。
- Keep projection and action preview inert unless an explicit governed command/action request is produced. / projection 和 action preview 保持惰性，除非显式产生 governed command/action request。
- Keep implementation in focused `command-system` modules, with `index.ts` export-only. / 实现放入聚焦的 `command-system` modules，并保持 `index.ts` 只做导出。

**Non-Goals:**

- Do not build a full-screen TUI, fuzzy finder UI, interactive readline overhaul, macros, registers, marks, visual mode, or complete Vim text objects. / 不构建 full-screen TUI、fuzzy finder UI、interactive readline overhaul、macros、registers、marks、visual mode 或完整 Vim text objects。
- Do not execute commands from palette projection in this pack. / 本包不从 palette projection 执行 commands。
- Do not promote palette behavior to VSCode/server. / 不将 palette 行为推广到 VSCode/server。
- Do not change runtime execution ownership or policy routing. / 不改变 runtime execution ownership 或 policy routing。

## Decisions

### Decision: Palette entries are derived, inert records

`@deepseek/command-system` will add a focused `palette.ts` that maps `CommandCompositionRecord` to `CliPaletteEntry` and optional `CliResultList` items. The projection preserves target ids, source metadata, side effects, permissions, and redaction metadata in `metadata`, but it does not invoke handlers or owner subsystems.

`@deepseek/command-system` 增加聚焦的 `palette.ts`，把 `CommandCompositionRecord` 映射到 `CliPaletteEntry` 和可选 `CliResultList` items。projection 在 `metadata` 中保留 target ids、source metadata、side effects、permissions 和 redaction metadata，但不调用 handlers 或 owner subsystems。

Alternative considered: let CLI render command help directly from composition records. Rejected because palette entries need action metadata, categories, search keys, result-list ids, and conflict diagnostics that should be testable outside a host renderer.

备选方案：让 CLI 直接从 composition records 渲染 command help。拒绝原因是 palette entries 需要 action metadata、categories、search keys、result-list ids 和 conflict diagnostics，这些应能脱离 host renderer 测试。

### Decision: Action resolution returns state patches, not side effects

`actions.ts` will resolve `CliActionRequest` over a `CliCompositionSnapshot` and return a typed result with updated active target, result list focus, jump history, optional reference set update, and optional command/action envelope metadata. `open`, `inspect`, `copy`, `explain`, and navigation actions are inert. `apply`, `retry`, and `revert` remain request construction or preview only in this pack.

`actions.ts` 会基于 `CliCompositionSnapshot` 解析 `CliActionRequest`，返回 typed result，包含更新后的 active target、result list focus、jump history、可选 reference set update 和可选 command/action envelope metadata。`open`、`inspect`、`copy`、`explain` 与导航 actions 保持惰性。`apply`、`retry` 和 `revert` 在本包只构造 request 或 preview。

Alternative considered: mutate CLI state directly. Rejected because action resolution must be reusable by tests and future hosts.

备选方案：直接修改 CLI state。拒绝原因是 action resolution 必须可被 tests 与未来 hosts 复用。

### Decision: Minimal vi profile is a keymap preset

`keymap.ts` will expose core and vi profile keymap entries such as `j/k`, `gg/G`, `Enter`, `i`, `:`, and `q` mapped to existing modes/actions/targets. Conflict validation reuses `validateCliInteractionContributions` and reports deterministic diagnostics.

`keymap.ts` 会暴露 core 与 vi profile keymap entries，例如 `j/k`、`gg/G`、`Enter`、`i`、`:` 和 `q`，映射到已有 modes/actions/targets。冲突校验复用 `validateCliInteractionContributions`，并报告确定性 diagnostics。

Alternative considered: import a Vim emulator. Rejected because this layer is an action model, not an editor buffer.

备选方案：引入 Vim emulator。拒绝原因是这一层是 action model，不是 editor buffer。

## Directory Plan / 目录计划

- `src/packages/platform-contracts/src/cli-composition.ts`: additive DTOs for action resolution results and palette projection metadata. / 增量 DTO。
- `src/packages/command-system/src/palette.ts`: composition-to-palette/result-list projection. / composition 到 palette/result-list projection。
- `src/packages/command-system/src/actions.ts`: result-list and target action resolution. / result-list 和 target action resolution。
- `src/packages/command-system/src/keymap.ts`: core/vi keymap presets and conflict diagnostics. / core/vi keymap presets 与 conflict diagnostics。
- Tests: `tests/contracts/cli-palette-actions.test.ts` and package tests under `src/packages/command-system/test`. / 测试放在 contracts 与 package-local tests。

Split triggers: each new module should stay under 350 lines; if action resolution grows, split navigation/reference/revert helpers.

拆分触发：每个新模块应低于 350 行；如果 action resolution 增长，拆 navigation/reference/revert helpers。

## Terminal Capability Impact / 终端能力影响

This pack adds structured records and deterministic text/JSON-safe data, but no full-screen rendering. Structured modes must not contain ANSI. Text renderers may show palette/result-list summaries later, but the contract is host-neutral.

本包增加结构化记录和 deterministic text/JSON-safe data，但不增加全屏渲染。structured modes 不得包含 ANSI。后续 text renderer 可以展示 palette/result-list summaries，但契约保持 host-neutral。

## Vi-Inspired Composition Impact / Vi 启发式组合影响

This pack makes vi-inspired behavior concrete through keymap presets and action resolution over result-list targets. It still treats Vim-like keys as a profile over modes/actions/targets, not as full Vim emulation.

本包通过 keymap presets 和 result-list targets 上的 action resolution，把 vi-inspired 行为具体化。它仍把 Vim-like keys 视为 modes/actions/targets 上的 profile，而不是完整 Vim 模拟。

## Request/Turn Revert Impact / 请求/回合回退影响

`revert` action resolution may identify request/turn targets and produce a dry-run request descriptor, but it does not mutate sessions or checkpoints in this pack. Original history remains immutable; actual revert execution stays with checkpoint/session contracts.

`revert` action resolution 可以识别 request/turn targets 并产生 dry-run request descriptor，但本包不修改 sessions 或 checkpoints。原始 history 保持 immutable；实际 revert execution 仍归 checkpoint/session contracts。

## Reference Pit Fixtures / 参考坑位 Fixtures

- `pit.legacy-contribution-normalization.manifest-boundary`: palette entries must derive from composition records, not raw extension strings. / palette entries 必须来自 composition records，而不是 raw extension strings。
- `pit.mcp-plugin-precedence.enterprise-deny`: palette metadata must preserve source/trust so future managed deny can act after projection. / palette metadata 必须保留 source/trust，供后续 managed deny 在 projection 后生效。
- `pit.extension-permission-expansion.permission-diff`: plugin-contributed palette commands preserve permission metadata. / plugin-contributed palette commands 保留 permission metadata。

## Risks / Trade-offs

- [Risk] Palette APIs can become a hidden command executor. -> Mitigation: projection returns entries and action resolution returns state patches or request descriptors only. / [风险] Palette APIs 可能变成隐藏命令执行器。-> 缓解：projection 只返回 entries，action resolution 只返回 state patches 或 request descriptors。
- [Risk] Vi profile expectations can expand quickly. -> Mitigation: document full Vim emulation as a non-goal and test only profile-to-action mappings. / [风险] Vi profile 期望容易膨胀。-> 缓解：明确完整 Vim 模拟不在范围内，只测试 profile-to-action mappings。
- [Risk] Result-list mutation can become host-specific. -> Mitigation: action resolver returns immutable snapshots and typed deltas. / [风险] Result-list mutation 可能变成 host-specific。-> 缓解：action resolver 返回 immutable snapshots 与 typed deltas。

## Migration Plan

1. Add additive CLI composition DTOs. / 增加 CLI composition 增量 DTO。
2. Implement palette projection, action resolution, and keymap presets in focused modules. / 在聚焦模块中实现 palette projection、action resolution 和 keymap presets。
3. Add tests for inert projection, action deltas, keymap conflicts, pit metadata, and no owner execution. / 增加惰性 projection、action deltas、keymap conflicts、坑位 metadata 和不执行 owner 的测试。
4. Update docs only if visible CLI command behavior is exposed. / 只有暴露可见 CLI command 行为时才更新文档。
5. Run OpenSpec validation, typecheck, lint, targeted tests, npm test, boundary checks, and git hygiene. / 运行 OpenSpec validation、typecheck、lint、定向测试、npm test、边界检查和 git hygiene。

Rollback: remove the new focused modules and DTO additions; existing composition records and CLI controls remain compatible.

回滚：移除新聚焦模块与 DTO 增量；现有 composition records 和 CLI controls 保持兼容。
