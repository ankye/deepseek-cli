# first-party-dev-plugins Specification

## Purpose
TBD - created by archiving change ship-first-party-dev-plugins. Update Purpose after archive.
## Requirements
### Requirement: Built-In Development Plugin Pack / 内置开发插件包

The platform SHALL ship a built-in first-party development plugin pack with stable plugin identities, versions, integrity metadata, compatibility metadata, permissions, side-effect metadata, contribution declarations, and release readiness diagnostics.

平台必须交付 built-in first-party development plugin pack，包含稳定的 plugin identities、versions、integrity metadata、compatibility metadata、permissions、side-effect metadata、contribution declarations 与 release readiness diagnostics。

#### Scenario: Release profile lists first-party plugins / Release Profile 列出一方插件

- **WHEN** the CLI release profile enumerates built-in plugins
- **THEN** it includes `@deepseek/plugin-dev-checks`, `@deepseek/plugin-repo-navigator`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-context-compactor` in deterministic plugin id order
- **AND** each manifest declares `source=built-in`, a stable integrity value, compatibility range, permissions, and contribution metadata
- **中文** 当 CLI release profile 枚举 built-in plugins 时，必须按确定性 plugin id 顺序包含 `@deepseek/plugin-dev-checks`、`@deepseek/plugin-repo-navigator`、`@deepseek/plugin-git-review` 与 `@deepseek/plugin-context-compactor`，并且每个 manifest 必须声明 `source=built-in`、稳定 integrity、compatibility range、permissions 与 contribution metadata。

#### Scenario: Built-in plugin pack is diagnosable / 内置插件包可诊断

- **WHEN** release readiness or doctor diagnostics run
- **THEN** diagnostics report enabled, disabled, incompatible, or degraded state for each first-party plugin without importing or executing plugin-private code
- **中文** 当 release readiness 或 doctor diagnostics 运行时，diagnostics 必须报告每个一方插件的 enabled、disabled、incompatible 或 degraded 状态，且不得 import 或执行 plugin-private code。

### Requirement: First-Party Plugin Scope / 一方插件范围

The first release SHALL limit first-party plugin functionality to bounded developer checks, repository navigation, git review, and lossless context compaction.

第一版必须将一方插件功能限制在有界 developer checks、repository navigation、git review 与 lossless context compaction。

#### Scenario: Unsupported plugin families are absent / 不支持的插件族缺席

- **WHEN** the first-party plugin pack is projected to help, palette, TUI, JSON, JSONL, or extension management
- **THEN** it does not expose browser automation, arbitrary shell execution, marketplace installation, remote plugin registry, cloud sync, or automatic update contributions
- **中文** 当一方插件包投影到 help、palette、TUI、JSON、JSONL 或 extension management 时，不得暴露 browser automation、arbitrary shell execution、marketplace installation、remote plugin registry、cloud sync 或 automatic update contributions。

#### Scenario: Dev checks are predeclared / 开发检查预声明

- **WHEN** `@deepseek/plugin-dev-checks` contributes executable checks
- **THEN** every check has a stable command id, fixed argument set, fixed workspace policy, timeout metadata, output redaction metadata, and side-effect classification
- **AND** the plugin does not accept free-form shell fragments from the user or model
- **中文** 当 `@deepseek/plugin-dev-checks` 贡献可执行 checks 时，每个 check 必须具备 stable command id、固定 argument set、固定 workspace policy、timeout metadata、output redaction metadata 与 side-effect classification；该插件不得接收来自用户或模型的 free-form shell fragments。

### Requirement: Context Compactor Plugin / 上下文压缩插件

The first-party plugin pack SHALL include `@deepseek/plugin-context-compactor` as the canonical first-release interface for lossless context status, grep, describe, summarize, expand, budget, and pin/reference workflows.

一方插件包必须包含 `@deepseek/plugin-context-compactor`，作为第一版 lossless context status、grep、describe、summarize、expand、budget 与 pin/reference workflows 的标准入口。

#### Scenario: Context commands are structured / Context 命令结构化

- **WHEN** the context compactor contributes `/context` commands or palette entries
- **THEN** each contribution declares stable ids, input schemas, output schemas, permissions, side effects, host support, redaction metadata, and owner subsystem metadata
- **中文** 当 context compactor 贡献 `/context` commands 或 palette entries 时，每个 contribution 必须声明 stable ids、input schemas、output schemas、permissions、side effects、host support、redaction metadata 与 owner subsystem metadata。

#### Scenario: Context pin feeds references / Context Pin 进入引用

- **WHEN** a user pins a context result from grep, describe, expand, or summarize output
- **THEN** the plugin produces a typed reference target that can be added to the active palette reference set with provenance and redaction metadata
- **中文** 当用户从 grep、describe、expand 或 summarize 输出中 pin 一个 context result 时，插件必须生成 typed reference target，可带 provenance 与 redaction metadata 加入 active palette reference set。

### Requirement: Built-in plugin projections carry execution metadata
First-party built-in plugin TUI and palette projections SHALL carry owner route metadata sufficient for host execution while remaining declarative and inert.

First-party built-in plugin TUI 与 palette projections 必须携带足够 host execution 使用的 owner route metadata，同时保持声明式与惰性。

#### Scenario: Projection includes execution request metadata
- **WHEN** first-party built-in plugin command contributions are projected into TUI or palette surfaces
- **THEN** implemented routes include command id, route id, dispatch availability, owner subsystem, permissions, side effects, and plugin/contribution identifiers
- **中文** 当 first-party built-in plugin command contributions 投影到 TUI 或 palette surfaces 时，implemented routes 必须包含 command id、route id、dispatch availability、owner subsystem、permissions、side effects 与 plugin/contribution identifiers。

#### Scenario: Projection remains handler-free
- **WHEN** first-party built-in plugin projections are listed or inspected
- **THEN** no handler, callback, execute, host function, process primitive, filesystem primitive, model client, MCP client, or hook callback is exposed or executed
- **中文** 当 first-party built-in plugin projections 被列出或 inspect 时，不得暴露或执行 handler、callback、execute、host function、process primitive、filesystem primitive、model client、MCP client 或 hook callback。

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

### Requirement: Built-In Plugin Owner Route Coverage / 内置插件 Owner Route 覆盖
The first-party development plugin pack SHALL validate owner route readiness for every built-in command contribution.

First-party development plugin pack 必须为每个 built-in command contribution 校验 owner route readiness。

#### Scenario: Pack validates command routes / 插件包校验命令路由
- **WHEN** first-party plugin manifests are validated
- **THEN** validation reports no duplicate ids, source/integrity errors, executable metadata, or missing owner routes
- **中文** 当 first-party plugin manifests 被校验时，validation 不得报告 duplicate ids、source/integrity errors、executable metadata 或 missing owner routes。

#### Scenario: Pack projection stays inert / 插件包投影保持惰性
- **WHEN** first-party plugin command, TUI, and reasoning contributions are listed
- **THEN** projection returns metadata only and does not execute command handlers, shell processes, model calls, hook handlers, MCP calls, or host callbacks
- **中文** 当 first-party plugin command、TUI 与 reasoning contributions 被列出时，projection 只能返回 metadata，不得执行 command handlers、shell processes、model calls、hook handlers、MCP calls 或 host callbacks。

### Requirement: Navigation plugins ship in first-party pack
The first-party development plugin pack SHALL include `@deepseek/plugin-file-manager` and `@deepseek/plugin-jump-navigator` as built-in plugins with stable manifests, permissions, command contributions, TUI contributions, and visible reasoning contributions.

First-party development plugin pack 必须包含 `@deepseek/plugin-file-manager` 与 `@deepseek/plugin-jump-navigator`，作为具备稳定 manifests、permissions、command contributions、TUI contributions 与 visible reasoning contributions 的 built-in plugins。

#### Scenario: Plugin pack lists navigation plugins
- **WHEN** the first-party plugin pack is listed, validated, snapshotted, or projected
- **THEN** the file manager and jump navigator plugins appear in deterministic plugin id order with no executable metadata
- **中文** 当 first-party plugin pack 被 list、validate、snapshot 或 project 时，file manager 与 jump navigator plugins 必须按确定性 plugin id 顺序出现，且不包含 executable metadata。

#### Scenario: Navigation plugin directories are owned
- **WHEN** the built-in plugin source tree is inspected
- **THEN** each navigation plugin has its own manifest, commands, TUI, and reasoning contribution files
- **中文** 当 built-in plugin source tree 被检查时，每个 navigation plugin 必须拥有自己的 manifest、commands、TUI 与 reasoning contribution files。

### Requirement: First-party plugin slash projections include argument awareness
First-party built-in plugin TUI and owner-route projections SHALL expose enough declarative metadata for host surfaces to inject slash aliases and identify whether a slash alias requires user arguments.

一方内置插件 TUI 与 owner-route projections 必须暴露足够的声明式 metadata，使 host surfaces 能注入 slash aliases，并识别某个 slash alias 是否需要用户参数。

#### Scenario: Owner route fallback advertises placeholders
- **WHEN** a first-party built-in plugin command alias maps to an owner route that requires a query, path, node id, or target id
- **THEN** the TUI projection metadata includes the owner route fallback command with its placeholder, while remaining free of executable handler metadata
- **中文** 当一方内置插件 command alias 映射到需要 query、path、node id 或 target id 的 owner route 时，TUI projection metadata 必须包含带 placeholder 的 owner route fallback command，同时不得包含 executable handler metadata。

#### Scenario: Complete aliases remain submit-ready
- **WHEN** a first-party built-in plugin command alias maps to an owner route that requires no additional user arguments
- **THEN** the TUI projection can be accepted as a complete local slash command without adding synthetic placeholders
- **中文** 当一方内置插件 command alias 映射到不需要额外用户参数的 owner route 时，TUI projection 可作为完整 local slash command 被接受，且不得添加 synthetic placeholder。

#### Scenario: Slash alias registry is declarative
- **WHEN** the CLI builds the injected plugin slash command registry
- **THEN** it uses plugin owner route descriptors and aliases without importing plugin-private handlers, callbacks, model clients, filesystem primitives, process primitives, or hook callbacks
- **中文** 当 CLI 构建 injected plugin slash command registry 时，必须使用 plugin owner route descriptors 与 aliases，且不得 import plugin-private handlers、callbacks、model clients、filesystem primitives、process primitives 或 hook callbacks。

