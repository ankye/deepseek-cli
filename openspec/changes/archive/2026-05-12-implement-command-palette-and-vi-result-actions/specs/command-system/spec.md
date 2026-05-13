## ADDED Requirements

### Requirement: Command Palette Helpers / 命令面板 Helpers

The command system SHALL expose helper APIs that derive command palette entries and command result lists from command composition records without executing command owners.

Command system 必须暴露 helper APIs，从 command composition records 派生 command palette entries 和 command result lists，且不执行 command owners。

#### Scenario: Palette helper is deterministic / 面板 Helper 确定性
- **WHEN** the same composition projection is passed to the palette helper
- **THEN** it returns stable palette entry ids, categories, targets, search metadata, and diagnostics in deterministic order
- **中文** 当同一 composition projection 传入 palette helper 时，它必须按确定性顺序返回稳定的 palette entry ids、categories、targets、search metadata 和 diagnostics。

#### Scenario: Palette helper does not invoke / 面板 Helper 不执行
- **WHEN** palette helper receives records backed by commands, skills, hooks, MCP, plugins, extensions, or workflows
- **THEN** it produces palette metadata without invoking handlers, activations, hooks, MCP calls, plugin lifecycle actions, or workflows
- **中文** 当 palette helper 收到由 commands、skills、hooks、MCP、plugins、extensions 或 workflows 支撑的 records 时，它必须只生成 palette metadata，不调用 handlers、activations、hooks、MCP calls、plugin lifecycle actions 或 workflows。
