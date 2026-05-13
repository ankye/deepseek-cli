## ADDED Requirements

### Requirement: Large CLI OpenSpecs Include Interaction Impact / 大型 CLI OpenSpec 包含交互影响

The product roadmap SHALL require large CLI-facing OpenSpecs to declare terminal capability impact, vi-inspired composition impact, and request/turn revert impact when they affect input, rendering, navigation, command ergonomics, multi-file context, recovery, or extension UX.

产品路线图必须要求大型 CLI-facing OpenSpec 在影响 input、rendering、navigation、command ergonomics、多文件上下文、recovery 或 extension UX 时声明 terminal capability impact、vi-inspired composition impact 和 request/turn revert impact。

#### Scenario: Host UX proposal includes terminal impact / Host UX 提案包含终端影响

- **WHEN** a future roadmap item or OpenSpec changes CLI input, rendering, prompts, approvals, diagnostics, result navigation, or command surfaces
- **THEN** it identifies affected terminal profiles, input strategies, renderer profiles, fallback behavior, fixtures, and parity evidence
- **中文** 当后续 roadmap item 或 OpenSpec 修改 CLI input、rendering、prompts、approvals、diagnostics、result navigation 或 command surfaces 时，必须标识受影响的 terminal profiles、input strategies、renderer profiles、fallback behavior、fixtures 和 parity evidence。

#### Scenario: Multi-file workflow includes composition impact / 多文件工作流包含组合模型影响

- **WHEN** a future CLI capability adds file references, search results, diagnostics, code intelligence results, diffs, sessions, tasks, or extension-provided objects
- **THEN** it states how those objects participate in reference sets, result lists, jump history, actions, targets, command palette entries, keymaps, and plugin contribution contracts
- **中文** 当后续 CLI capability 增加 file references、search results、diagnostics、code intelligence results、diffs、sessions、tasks 或 extension-provided objects 时，必须说明这些对象如何参与 reference sets、result lists、jump history、actions、targets、command palette entries、keymaps 和 plugin contribution contracts。

#### Scenario: Recovery workflow includes revert impact / 恢复工作流包含回退影响

- **WHEN** a future CLI capability adds or changes workspace mutations, session turns, context projection, checkpointing, tool evidence, or recovery commands
- **THEN** it states whether request/turn-scoped revert applies, what can be restored automatically, what must be reported as stale or non-reversible, and which evidence proves original history remains immutable
- **中文** 当后续 CLI capability 增加或修改 workspace mutations、session turns、context projection、checkpointing、tool evidence 或 recovery commands 时，必须说明 request/turn-scoped revert 是否适用、哪些内容可自动恢复、哪些内容必须报告为 stale 或 non-reversible，以及哪些 evidence 证明原始历史保持不可变。
