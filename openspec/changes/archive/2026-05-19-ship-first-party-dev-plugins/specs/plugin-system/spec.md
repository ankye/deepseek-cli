## ADDED Requirements

### Requirement: Built-In First-Party Plugin Manifests / 内置一方插件 Manifest

The plugin system SHALL represent bundled first-party plugins as normal plugin manifests with built-in source metadata, deterministic integrity, compatibility ranges, permission declarations, credential declarations, contribution declarations, and lockfile-compatible state.

plugin system 必须将 bundled first-party plugins 表示为普通 plugin manifests，包含 built-in source metadata、deterministic integrity、compatibility ranges、permission declarations、credential declarations、contribution declarations 与 lockfile-compatible state。

#### Scenario: Built-in manifest applies deterministically / 内置 Manifest 确定性应用

- **WHEN** a plugin manager applies the built-in first-party plugin pack to an empty or existing plugin state
- **THEN** the resulting snapshot is sorted by plugin id and stable across repeated apply operations
- **AND** repeated apply operations are idempotent and do not duplicate lifecycle audit records
- **中文** 当 plugin manager 将 built-in first-party plugin pack 应用到空状态或已有 plugin state 时，结果 snapshot 必须按 plugin id 排序，并在重复 apply 中保持稳定；重复 apply 必须幂等，且不得重复 lifecycle audit records。

#### Scenario: Built-in permissions remain visible / 内置权限保持可见

- **WHEN** a built-in first-party plugin is installed, enabled, listed, or projected
- **THEN** plugin lifecycle evidence includes declared permissions, side-effect metadata, auth requirements, source, integrity, trust, and provenance without resolving raw credentials
- **中文** 当 built-in first-party plugin 被 install、enable、list 或 project 时，plugin lifecycle evidence 必须包含 declared permissions、side-effect metadata、auth requirements、source、integrity、trust 与 provenance，且不得解析 raw credentials。

### Requirement: First-Party Projection Is Inert / 一方插件投影惰性

The plugin system SHALL keep first-party plugin projection side-effect free; projecting a first-party plugin to command, palette, TUI, extension, JSON, JSONL, or diagnostics surfaces SHALL NOT execute plugin code or owning command handlers.

plugin system 必须保持一方插件 projection 无副作用；将一方插件投影到 command、palette、TUI、extension、JSON、JSONL 或 diagnostics surfaces 时，不得执行 plugin code 或 owning command handlers。

#### Scenario: Projection does not execute / 投影不执行

- **WHEN** a host requests first-party plugin contribution summaries
- **THEN** the plugin system returns manifest metadata and normalized contribution records only
- **AND** it does not invoke command handlers, capability executors, hooks, MCP connectors, context providers, git, npm, filesystem mutation, model calls, or process APIs
- **中文** 当 host 请求一方插件 contribution summaries 时，plugin system 只能返回 manifest metadata 与 normalized contribution records；不得调用 command handlers、capability executors、hooks、MCP connectors、context providers、git、npm、filesystem mutation、model calls 或 process APIs。

#### Scenario: Execution requires owning route / 执行需要 Owner 路由

- **WHEN** a user invokes a first-party plugin command
- **THEN** the plugin system resolves the contribution to an owning command or capability descriptor and execution proceeds through the governed owner pipeline rather than plugin-private execution
- **中文** 当用户调用一方 plugin command 时，plugin system 必须将 contribution 解析为 owning command 或 capability descriptor，并通过受治理 owner pipeline 执行，而不是 plugin-private execution。
