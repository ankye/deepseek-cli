## MODIFIED Requirements

### Requirement: Vi-Inspired CLI Composition

The CLI SHALL model vi-inspired interactions as typed actions and targets that can drive result-list navigation, command execution, references, and TUI workbench panel focus without relying on prompt text. Workbench focus actions MUST remain local and deterministic.

CLI 必须将 vi-inspired interactions 建模为 typed actions 与 targets，可驱动 result-list navigation、command execution、references 与 TUI workbench panel focus，且不依赖 prompt text。Workbench focus actions 必须保持本地且确定性。

#### Scenario: Vi keys drive workbench focus

- **WHEN** a compatible TUI dispatches panel navigation keys
- **THEN** the focused panel changes through typed local state, command bar and inspector projections update, and model-visible commands remain unchanged
- **中文** 当兼容 TUI 分发 panel navigation keys 时，focused panel 必须通过 typed local state 改变，command bar 与 inspector projections 必须更新，model-visible commands 保持不变。

#### Scenario: Existing result-list actions keep working

- **WHEN** the focused panel is a result list and the user dispatches j, k, gg, G, Enter, or reference actions
- **THEN** existing vi-inspired result-list behavior remains deterministic and compatible with palette references and jump history
- **中文** 当 focused panel 是 result list 且用户触发 j、k、gg、G、Enter 或 reference actions 时，既有 vi-inspired result-list 行为必须保持确定性，并兼容 palette references 与 jump history。
