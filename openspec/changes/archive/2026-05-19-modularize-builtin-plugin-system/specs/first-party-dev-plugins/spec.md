## ADDED Requirements

### Requirement: Modular Built-In Plugin Directories / 模块化内置插件目录

The first-party development plugin pack SHALL be authored from a built-in plugin workspace where each bundled plugin has its own directory containing manifest and contribution declarations.

一方开发插件包必须从内置 plugin workspace 编写，每个 bundled plugin 拥有独立目录，目录内包含 manifest 与 contribution declarations。

#### Scenario: Each bundled plugin has an owned directory / 每个内置插件拥有目录
- **WHEN** the first-party plugin pack is built or projected
- **THEN** `@deepseek/plugin-context-compactor`, `@deepseek/plugin-dev-checks`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-repo-navigator` are sourced from separate built-in plugin directories rather than a single monolithic definition file
- **中文** 当一方 plugin pack 被构建或投影时，`@deepseek/plugin-context-compactor`、`@deepseek/plugin-dev-checks`、`@deepseek/plugin-git-review` 与 `@deepseek/plugin-repo-navigator` 必须来自独立内置插件目录，而不是单个单体 definition 文件。

#### Scenario: Surface files stay inside plugin directory / Surface 文件保留在插件目录内
- **WHEN** a built-in plugin has TUI, command, target, reasoning, or future VSCode-specific declarations
- **THEN** those declarations are split into surface-specific contribution files inside the plugin's own directory rather than top-level `tui`, `cli`, or `vscode` plugin roots
- **中文** 当内置 plugin 拥有 TUI、command、target、reasoning 或未来 VSCode-specific declarations 时，这些声明必须拆在该 plugin 自己目录内的 surface-specific contribution files 中，而不是放入顶层 `tui`、`cli` 或 `vscode` plugin roots。

#### Scenario: Compatibility facade preserves public exports / 兼容 Facade 保持公开导出
- **WHEN** existing callers import `@deepseek/first-party-dev-plugins`
- **THEN** the package exposes the same public functions for listing manifests, validating the pack, producing command/TUI contributions, producing reasoning contributions, and snapshotting the pack
- **中文** 当现有调用方导入 `@deepseek/first-party-dev-plugins` 时，该 package 必须继续暴露用于列出 manifests、验证 pack、生成 command/TUI contributions、生成 reasoning contributions 与 snapshot pack 的相同公开函数。

### Requirement: Built-In Plugin Layout Prepares Native Navigation Plugins / 内置插件布局预备原生导航插件

The first-party plugin layout SHALL make file manager and jump navigator plugins addable as first-party built-ins without introducing a second TUI extension system.

一方插件布局必须让 file manager 与 jump navigator 能作为 first-party built-ins 加入，而无需引入第二套 TUI extension system。

#### Scenario: Future navigation plugins reuse contribution points / 未来导航插件复用贡献点
- **WHEN** a future file manager or jump navigator plugin is added
- **THEN** it uses the same command, palette, keymap, result-list provider, target resolver, renderer hint, permission, and owner-route contribution points as existing built-in plugins
- **中文** 当未来加入 file manager 或 jump navigator plugin 时，它必须使用与现有内置插件相同的 command、palette、keymap、result-list provider、target resolver、renderer hint、permission 与 owner-route contribution points。
