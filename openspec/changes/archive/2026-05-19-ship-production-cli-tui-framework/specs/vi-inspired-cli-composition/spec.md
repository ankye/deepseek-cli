## ADDED Requirements

### Requirement: TUI Dispatch Uses Vi-Inspired Composition / TUI Dispatch 使用 Vi 启发式组合

The production TUI framework SHALL use the vi-inspired composition snapshot as the canonical local state for modes, active targets, result lists, reference sets, jump history, and contributions.

Production TUI framework 必须使用 vi-inspired composition snapshot 作为 modes、active targets、result lists、reference sets、jump history 与 contributions 的 canonical local state。

#### Scenario: Mode state maps to composition snapshot / Mode 状态映射到组合快照

- **WHEN** the TUI enters prompt, normal, command, approval, selection, or result-list behavior
- **THEN** the framework state and composition snapshot expose matching interaction mode and active target metadata
- **中文** 当 TUI 进入 prompt、normal、command、approval、selection 或 result-list behavior 时，framework state 与 composition snapshot 必须暴露一致的 interaction mode 与 active target metadata。

#### Scenario: Contributions are part of composition / Contributions 属于组合模型

- **WHEN** core, user, or plugin contributions are registered with the TUI framework
- **THEN** the accepted contributions are represented as composition contributions with source, kind, ids, priority, keymap or palette metadata, and diagnostics
- **中文** 当 core、user 或 plugin contributions 注册到 TUI framework 时，被接受的 contributions 必须以 composition contributions 表示，包含 source、kind、ids、priority、keymap 或 palette metadata 与 diagnostics。

### Requirement: Vim Emulation Still Does Not Block Production TUI / Vim 模拟不阻塞 Production TUI

The production TUI framework SHALL be complete as a vi-inspired action framework without requiring full Vim emulation.

Production TUI framework 必须作为 vi-inspired action framework 完整可用，但不得要求完整 Vim 模拟。

#### Scenario: Unsupported Vim feature is explicit diagnostic / 不支持的 Vim 功能是显式诊断

- **WHEN** a contribution or key dispatch requests registers, macros, marks, visual mode, text objects, or editor-buffer semantics
- **THEN** the framework records an unsupported capability diagnostic and preserves the prior TUI state
- **中文** 当 contribution 或 key dispatch 请求 registers、macros、marks、visual mode、text objects 或 editor-buffer semantics 时，framework 必须记录 unsupported capability diagnostic，并保留之前的 TUI state。
