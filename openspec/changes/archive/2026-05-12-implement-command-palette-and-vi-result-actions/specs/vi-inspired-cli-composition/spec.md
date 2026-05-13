## ADDED Requirements

### Requirement: Palette And Result-List Actions Use Composition Model / 面板与结果列表动作使用组合模型

The vi-inspired CLI composition model SHALL expose command palette entries and result-list actions as typed actions over typed targets, reference sets, and jump history.

Vi-inspired CLI composition model 必须把 command palette entries 和 result-list actions 暴露为 typed actions over typed targets、reference sets 和 jump history。

#### Scenario: Palette entry target is structured / 面板条目 Target 结构化
- **WHEN** a command palette entry is created from a composition record
- **THEN** its action and target fields reference typed CLI targets instead of rendered command prose
- **中文** 当 command palette entry 从 composition record 创建时，其 action 和 target fields 必须引用 typed CLI targets，而不是 rendered command prose。

#### Scenario: Result-list action updates shared state / 结果列表动作更新共享状态
- **WHEN** a vi-style action navigates or acts on a result-list item
- **THEN** the composition snapshot records active target, result-list focus, reference set updates, and jump history changes as structured state
- **中文** 当 vi-style action 导航或操作 result-list item 时，composition snapshot 必须以结构化状态记录 active target、result-list focus、reference set updates 和 jump history changes。

### Requirement: Full Vim Emulation Remains Deferred / 完整 Vim 模拟继续延后

The vi-inspired profile SHALL remain a keymap/action profile and SHALL NOT require Vim buffers, registers, macros, marks, visual mode, or text-object semantics.

Vi-inspired profile 必须保持为 keymap/action profile，不得要求 Vim buffers、registers、macros、marks、visual mode 或 text-object semantics。

#### Scenario: Unsupported Vim feature is out of scope / 不支持的 Vim 功能不进入范围
- **WHEN** a keymap or action request requires registers, macros, marks, visual mode, or text-object editing
- **THEN** the CLI records it as an unsupported profile capability rather than adding runtime/editor dependencies
- **中文** 当 keymap 或 action request 需要 registers、macros、marks、visual mode 或 text-object editing 时，CLI 必须将其记录为 unsupported profile capability，而不是增加 runtime/editor dependencies。
