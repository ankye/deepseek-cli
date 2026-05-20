# plugin-system Specification

## Purpose
Define plugin system requirements for loading, validation, manifests, permissions, module boundaries, lifecycle, and diagnostics.

定义 plugin system 对 loading、validation、manifests、permissions、module boundaries、lifecycle 与 diagnostics 的要求。

## Requirements
### Requirement: Plugin Package Model

The platform SHALL define plugins as distributable packages that bundle extensions, skills, tools, agents, hooks, MCP connectors, resources, renderers, workflow templates, model profiles, and configuration fragments without becoming a privileged runtime boundary.

平台必须把 plugins 定义为可分发 packages，用于打包 extensions、skills、tools、agents、hooks、MCP connectors、resources、renderers、workflow templates、model profiles 和 configuration fragments，但 plugin 本身不能成为特权 runtime boundary。

#### Scenario: Plugin contributes multiple package items

- **WHEN** a plugin package is validated and enabled
- **THEN** each contribution is converted into the corresponding platform contract and registered with its owning subsystem

#### Scenario: Plugin cannot mutate runtime internals

- **WHEN** a plugin package loads
- **THEN** it can only affect runtime through declared contribution points, policy-approved commands, and governed platform contracts

### Requirement: Plugin Manifest, Integrity, and Lockfile

The plugin system SHALL define plugin manifests with identity, version, publisher, source, integrity metadata, dependency metadata, contribution declarations, permissions, compatibility ranges, activation conditions, and optional install options, and SHALL support a lockfile for reproducible installs. Every successful `install` SHALL record a `PluginLockfileEntry`, and `verify(manifest)` SHALL detect integrity mismatches against the current lockfile without mutating any state.

plugin system 必须定义 plugin manifest，包含 identity、version、publisher、source、integrity metadata、dependency metadata、contribution declarations、permissions、compatibility ranges、activation conditions 和可选 install options，并且必须支持 lockfile 以实现可复现安装。每次成功的 `install` 必须写入 `PluginLockfileEntry`；`verify(manifest)` 必须在不改动任何状态的前提下检测 integrity 与当前 lockfile 的不一致。

#### Scenario: Install locked plugin version

- **WHEN** a plugin is installed from a lockfile entry
- **THEN** the plugin manager resolves the exact version, source, integrity hash, dependency set, and compatibility metadata before activation

#### Scenario: Reject integrity mismatch

- **WHEN** a downloaded or cached plugin artifact does not match declared integrity metadata
- **THEN** the plugin system rejects the artifact and records an audit event

#### Scenario: Install records lock entry / 安装记录 lock 条目

- **WHEN** `install(manifest)` completes successfully for any plugin
- **THEN** a `PluginLockfileEntry` is appended or replaced atomically such that a subsequent `snapshot()` surfaces the entry
- **中文** 当 `install(manifest)` 对任意 plugin 成功完成时，必须原子地追加或替换一条 `PluginLockfileEntry`，以便后续 `snapshot()` 能看到该条目。

#### Scenario: Verify detects integrity mismatch without snapshot drift / Verify 检测不一致但不改动 snapshot

- **WHEN** `verify(manifest)` is called against a manager that already holds a lock entry for the same `pluginId` with a different `integrity`
- **THEN** the result is `{ ok: false, reason: "mismatch", expected, actual }` and `await manager.snapshot()` remains identical before and after the call
- **中文** 当对同 `pluginId` 但不同 `integrity` 的 manifest 调用 `verify` 时，结果必须为 `{ ok: false, reason: "mismatch", expected, actual }`，调用前后 `await manager.snapshot()` 必须保持一致。

### Requirement: Plugin Sources, Marketplace, and Installation Scopes

The plugin system SHALL model built-in, local directory, workspace, user, enterprise-managed, registry, and future marketplace sources with explicit installation scopes and trust levels.

plugin system 必须建模 built-in、local directory、workspace、user、enterprise-managed、registry 和未来 marketplace sources，并为它们定义显式 installation scopes 与 trust levels。

#### Scenario: Managed plugin overrides user preference

- **WHEN** an enterprise-managed policy requires or blocks a plugin
- **THEN** the plugin system applies the managed policy before user or workspace enablement settings

#### Scenario: Workspace plugin requires trust

- **WHEN** a workspace plugin is discovered
- **THEN** it remains disabled until workspace trust, policy, and versioning checks allow it

### Requirement: Plugin Lifecycle Management

The plugin system SHALL support discovery, validation, install, enable, disable, update, rollback, uninstall, cache refresh, orphan detection, dependency resolution, and startup health checks.

plugin system 必须支持 discovery、validation、install、enable、disable、update、rollback、uninstall、cache refresh、orphan detection、dependency resolution 和 startup health checks。

#### Scenario: Startup health check quarantines plugin

- **WHEN** a plugin fails validation, dependency resolution, versioning checks, or policy checks during startup
- **THEN** it is quarantined or disabled without preventing the base runtime from starting

#### Scenario: Plugin update has rollback path

- **WHEN** a plugin update is applied
- **THEN** the previous enabled version remains recoverable according to retention and compatibility policy

### Requirement: Plugin Permission Diff and Audit

The plugin system SHALL present and record permission diffs when installing, enabling, or updating plugins, and SHALL maintain audit records for plugin lifecycle actions and contribution activation. Each `install` SHALL return a `PermissionDiff` computed against the existing lockfile entry (if any), distinguishing `added` and `removed` permissions exactly.

plugin system 必须在 install、enable 或 update plugins 时呈现并记录 permission diff，并且必须为 plugin lifecycle actions 和 contribution activation 维护 audit records。每次 `install` 必须基于已存在的 lock entry（若有）计算 `PermissionDiff`，精确区分 `added` 与 `removed` 两类 permission。

#### Scenario: Plugin update requests broader permission

- **WHEN** a plugin update adds filesystem, process, network, memory, cache, model, host, or workspace permissions
- **THEN** the plugin system requires policy approval before enabling the updated contribution set

#### Scenario: Contribution is traceable to plugin

- **WHEN** a plugin-contributed capability, skill, hook, agent, connector, or renderer is used
- **THEN** audit metadata identifies the plugin id, plugin version, source, trust level, and contribution id

#### Scenario: Install returns permission diff relative to lockfile baseline / 相对 lockfile 计算 permission diff

- **WHEN** `install(manifest)` targets a `pluginId` that already has a lock entry, and the manifest's `permissions` differ from that entry's `permissions`
- **THEN** the returned `PermissionDiff.added` lists exactly the permissions present in the new manifest but absent from the prior entry, and `PermissionDiff.removed` lists exactly the permissions present in the prior entry but absent from the new manifest
- **中文** 当 `install(manifest)` 目标 `pluginId` 已有 lock 条目，且 manifest 的 `permissions` 与旧条目不同时，返回的 `PermissionDiff.added` 必须精确列出新 manifest 有、旧条目没有的 permission，`PermissionDiff.removed` 必须精确列出旧条目有、新 manifest 没有的 permission。

### Requirement: Headless and Host-Agnostic Plugin Operations

The plugin system SHALL expose plugin operations through shared protocol contracts so CLI, VSCode, tests, CI, and future server modes can manage plugins without depending on terminal UI flows.

plugin system 必须通过共享 protocol contracts 暴露 plugin operations，使 CLI、VSCode、tests、CI 和未来 server modes 能管理 plugins，而不依赖 terminal UI flows。

#### Scenario: Headless plugin validation

- **WHEN** a headless caller validates a plugin package
- **THEN** it receives structured validation results, warnings, permission summaries, and compatibility decisions

#### Scenario: Plugin management UI is an adapter

- **WHEN** CLI or VSCode renders plugin management
- **THEN** it uses shared plugin protocol events and host renderers instead of embedding plugin lifecycle logic in the host UI

### Requirement: Plugin Contributions Are Not Execution Authority

The plugin system SHALL treat plugin packages as contribution containers, not privileged execution boundaries, and SHALL normalize every executable plugin contribution into its owning subsystem and governed execution pipeline.

plugin system 必须把 plugin packages 作为 contribution containers，而不是特权 execution boundaries，并且必须将每个 executable plugin contribution 规范化到其 owning subsystem 和 governed execution pipeline。

#### Scenario: Plugin contributes executable tool

- **WHEN** a plugin contributes a tool, skill, hook, command, MCP connector, workflow template, model profile, renderer, context provider, memory/cache provider, or agent definition
- **THEN** the owning subsystem validates and registers the contribution, and any execution uses the governed execution envelope rather than plugin-private execution

#### Scenario: Plugin lifecycle is scheduled work

- **WHEN** a plugin install, update, migration, rollback, health check, or uninstall runs
- **THEN** the action is represented as governed executable work with permission diff, resource locks, policy decision, audit, and replay metadata

### Requirement: Plugin Lockfile Reproducibility / 插件 Lockfile 可复现

The plugin system SHALL provide a lockfile snapshot + apply round-trip so two managers starting from the same lockfile end up with byte-identical enabled-plugin state. `PluginManager.snapshot()` SHALL return a frozen `PluginLockfile` with entries sorted by `pluginId` for deterministic hashing, and `applyLockfile(lockfile)` SHALL replay entries in lockfile order. Re-applying the same lockfile SHALL be idempotent — entries already matching by `pluginId` + `integrity` produce an empty `PermissionDiff` and do not duplicate install events.

plugin system 必须提供 lockfile snapshot + apply 闭环，让任意两个 manager 从同一 lockfile 出发都能得到 byte-identical 的启用态。`PluginManager.snapshot()` 必须返回 frozen `PluginLockfile`，entries 按 `pluginId` 升序以保证可哈希的确定性；`applyLockfile(lockfile)` 必须按 lockfile 顺序重放 entries。重复 apply 同一 lockfile 必须幂等 —— 已存在且 integrity 匹配的 entry 返回空 `PermissionDiff`，不重复触发 install 事件。

#### Scenario: Install writes lock entry / 安装写入 lock 条目

- **WHEN** a caller invokes `install(manifest)` for a new plugin
- **THEN** the return value includes `{ diff, lockEntry }` where `lockEntry.pluginId`, `lockEntry.version`, `lockEntry.source`, `lockEntry.integrity`, and `lockEntry.permissions` mirror the manifest, and `lockEntry.installedAt` is an ISO-8601 timestamp
- **中文** 当调用方对新 plugin 执行 `install(manifest)` 时，返回值必须包含 `{ diff, lockEntry }`，`lockEntry` 的 `pluginId` / `version` / `source` / `integrity` / `permissions` 与 manifest 对应，`installedAt` 为 ISO-8601 时间戳。

#### Scenario: Snapshot round-trips through applyLockfile / snapshot 可通过 applyLockfile 还原

- **WHEN** manager A has installed a set of plugins and produces `lockfile = await A.snapshot()`, and manager B (a fresh empty manager) calls `await B.applyLockfile(lockfile)`
- **THEN** `await B.snapshot()` equals `lockfile` entry-for-entry and `await B.list()` returns the same manifests as `await A.list()` sorted by `pluginId`
- **中文** 当 manager A 已安装一组 plugin 并产生 `lockfile = await A.snapshot()`，另一空 manager B 执行 `await B.applyLockfile(lockfile)` 后，`await B.snapshot()` 必须与 `lockfile` 逐条相等，且 `await B.list()` 返回按 `pluginId` 升序排列、与 A 一致的 manifest 集合。

#### Scenario: Integrity mismatch rejects install / Integrity 不一致拒绝安装

- **WHEN** a manager already has a lock entry for `pluginId = X` with `integrity = "sha256:abc"` and a caller invokes `install({ id: X, integrity: "sha256:def", ... })`
- **THEN** `install` rejects with `IntegrityMismatchError` carrying `expected: "sha256:abc"` and `actual: "sha256:def"`, and the existing lock entry remains unchanged
- **中文** 当 manager 已有 `pluginId = X`、`integrity = "sha256:abc"` 的 lock 条目，调用方以 `integrity = "sha256:def"` 的同 id manifest 调用 `install` 时，必须抛 `IntegrityMismatchError`（字段 `expected` / `actual` 与 lock 对应），已有 lock 条目保持不变。

### Requirement: Plugin Permission Expansion Pit Fixtures / 插件权限扩张坑位 Fixtures

Plugin install and lockfile behavior SHALL include deterministic fixtures that make permission expansion, integrity mismatch, and rollback metadata visible.

plugin install 与 lockfile 行为必须包含确定性 fixtures，使 permission expansion、integrity mismatch 和 rollback metadata 可见。

#### Scenario: Permission expansion is explicit / 权限扩张显式化

- **WHEN** a plugin install or reinstall adds permissions compared with the existing lock entry
- **THEN** the install result reports the precise added and removed permissions before callers treat the plugin as accepted
- **中文** 当 plugin install 或 reinstall 相比现有 lock entry 增加权限时，install result 必须在调用方将 plugin 视为已接受前报告精确的 added 和 removed permissions。

#### Scenario: Integrity mismatch is fail-closed / 完整性不匹配 Fail Closed

- **WHEN** a plugin manifest or lockfile entry conflicts with a previously locked integrity value
- **THEN** plugin management rejects the change without mutating the existing trusted lock entry
- **中文** 当 plugin manifest 或 lockfile entry 与先前锁定的 integrity value 冲突时，plugin management 必须拒绝该变更，且不修改现有 trusted lock entry。

### Requirement: CLI-Consumable Plugin Lifecycle Evidence / CLI 可消费的插件生命周期证据

Plugin lifecycle operations SHALL expose permission diff, lockfile, integrity, audit, and redaction evidence in a shape that CLI and future hosts can render without invoking plugin internals.

Plugin lifecycle operations 必须暴露 permission diff、lockfile、integrity、audit 和 redaction evidence，使 CLI 和未来 hosts 能渲染，而不调用 plugin internals。

#### Scenario: CLI install evidence comes from plugin result / CLI 安装证据来自插件结果
- **WHEN** CLI installs a local plugin manifest
- **THEN** the CLI renders `PluginInstallResult.diff` and `PluginInstallResult.lockEntry` rather than recomputing permission changes from terminal state
- **中文** 当 CLI 安装本地 plugin manifest 时，CLI 必须渲染 `PluginInstallResult.diff` 与 `PluginInstallResult.lockEntry`，而不是从 terminal state 重新计算权限变化。

#### Scenario: Snapshot output is deterministic / Snapshot 输出确定
- **WHEN** CLI snapshots plugin lockfile state
- **THEN** entries are sorted by plugin id and safe to hash or replay
- **中文** 当 CLI snapshot plugin lockfile state 时，entries 必须按 plugin id 排序，并且可安全 hash 或 replay。

### Requirement: Plugin Permission Pit Evidence / 插件权限坑位证据

Plugin install, update, and apply-lockfile results SHALL identify permission expansion evidence with `pit.extension-permission-expansion.permission-diff` whenever permissions change from a baseline.

Plugin install、update 和 apply-lockfile results 只要相对 baseline 发生权限变化，就必须用 `pit.extension-permission-expansion.permission-diff` 标识 permission expansion evidence。

#### Scenario: Permission expansion pit is cited / 权限扩张坑位被引用
- **WHEN** a plugin manifest adds permissions compared with the previous lock entry
- **THEN** the lifecycle evidence includes exact added permissions and `pit.extension-permission-expansion.permission-diff`
- **中文** 当 plugin manifest 相比旧 lock entry 增加权限时，lifecycle evidence 必须包含精确 added permissions 和 `pit.extension-permission-expansion.permission-diff`。

#### Scenario: Removed permissions are explicit / 移除权限显式化
- **WHEN** a plugin manifest removes permissions compared with the previous lock entry
- **THEN** the lifecycle evidence includes exact removed permissions and keeps the audit trail addressable
- **中文** 当 plugin manifest 相比旧 lock entry 移除权限时，lifecycle evidence 必须包含精确 removed permissions，并保持 audit trail 可寻址。

### Requirement: Plugin Contributions Preserve Provenance In Composition / 插件贡献在组合中保留来源

Plugin-contributed commands, skills, hooks, MCP connectors, and workflow templates SHALL preserve plugin id, version, source, trust, integrity, and permission metadata when normalized into composition records.

Plugin-contributed commands、skills、hooks、MCP connectors 和 workflow templates 归一化为 composition records 时，必须保留 plugin id、version、source、trust、integrity 和 permission metadata。

#### Scenario: Plugin command projection cites plugin source / 插件命令投影引用插件来源
- **WHEN** a plugin contributes a command to composition
- **THEN** the record includes plugin provenance, declared permissions, target id, and permission pit evidence when permissions are broader than the baseline
- **中文** 当 plugin 向 composition 贡献 command 时，record 必须包含 plugin provenance、declared permissions、target id，并在权限相对 baseline 扩张时包含 permission pit evidence。

### Requirement: Plugin Credential Requirement Evidence / 插件凭证需求证据

The plugin system SHALL model plugin credential requirements as lifecycle and contribution metadata that can be diffed, audited, and rendered without creating or resolving raw credentials during install, apply-lockfile, verify, enable, or list operations.

Plugin system 必须将 plugin credential requirements 建模为 lifecycle 与 contribution metadata，可用于 diff、audit 与 rendering，且 install、apply-lockfile、verify、enable 或 list operations 期间不得创建或解析 raw credentials。

#### Scenario: Install returns auth requirement evidence / Install 返回认证需求证据

- **WHEN** a plugin manifest declares credential requirements
- **THEN** `install(manifest)` returns auth requirement evidence alongside permission diff and lock entry metadata without prompting for or resolving raw credentials
- **中文** 当 plugin manifest 声明 credential requirements 时，`install(manifest)` 必须在 permission diff 与 lock entry metadata 旁返回 auth requirement evidence，且不提示输入或解析 raw credentials。

#### Scenario: Apply lockfile preserves auth metadata / Apply Lockfile 保留认证元数据

- **WHEN** a plugin lockfile entry includes credential requirement metadata
- **THEN** `applyLockfile(lockfile)` preserves the metadata in deterministic lifecycle evidence and does not treat the credential as satisfied unless a scoped grant exists
- **中文** 当 plugin lockfile entry 包含 credential requirement metadata 时，`applyLockfile(lockfile)` 必须在 deterministic lifecycle evidence 中保留该 metadata，且除非存在 scoped grant，否则不得将 credential 视为已满足。

### Requirement: Plugin Contribution Activation Checks Credential Grants / 插件贡献激活检查凭证 Grant

Plugin-contributed commands, hooks, skills, MCP connectors, tools, workflow templates, and context providers SHALL check scoped credential grants before activation when they declare credential-backed operations.

Plugin-contributed commands、hooks、skills、MCP connectors、tools、workflow templates 与 context providers 在声明 credential-backed operations 时，必须在 activation 前检查 scoped credential grants。

#### Scenario: Contribution denied before activation / 贡献激活前被拒绝

- **WHEN** a plugin contribution declares a credential-backed operation but no matching scoped grant exists
- **THEN** activation returns typed auth-denied evidence and the owning subsystem is not asked to execute or register the credential-backed contribution
- **中文** 当 plugin contribution 声明 credential-backed operation 但不存在匹配 scoped grant 时，activation 必须返回 typed auth-denied evidence，且不得要求 owning subsystem 执行或注册该 credential-backed contribution。

#### Scenario: Permission and auth expansion are both visible / 权限与认证扩张均可见

- **WHEN** a plugin update adds permissions or credential requirements compared with the lockfile baseline
- **THEN** lifecycle evidence reports both permission diff and auth requirement diff with pit fixture ids, audit metadata, and replay fingerprint
- **中文** 当 plugin update 相比 lockfile baseline 增加 permissions 或 credential requirements 时，lifecycle evidence 必须同时报告 permission diff 与 auth requirement diff，并包含 pit fixture ids、audit metadata 与 replay fingerprint。

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

### Requirement: Built-In Plugin Workspace Registry / 内置插件 Workspace Registry

The plugin system SHALL support built-in plugin manifests discovered from the repository's built-in plugin workspace and normalize them through the same manifest, lifecycle, and projection contracts used for other plugin sources.

plugin system 必须支持从仓库内置 plugin workspace 发现 built-in plugin manifests，并通过与其他 plugin sources 相同的 manifest、lifecycle 与 projection contracts 进行归一化。

#### Scenario: Built-in workspace manifests apply deterministically / 内置 Workspace Manifest 确定性应用
- **WHEN** the built-in plugin registry returns bundled plugin manifests
- **THEN** the manifests are sorted by plugin id, declare `source=built-in`, include deterministic integrity metadata, and can be applied to plugin lockfile-compatible state without duplicate entries
- **中文** 当内置 plugin registry 返回 bundled plugin manifests 时，manifests 必须按 plugin id 排序，声明 `source=built-in`，包含确定性 integrity metadata，并可应用到 plugin lockfile-compatible state 且不产生重复条目。

#### Scenario: Built-in registry does not execute plugins / 内置 Registry 不执行插件
- **WHEN** a host requests built-in plugin manifests, command projections, TUI projections, reasoning projections, or diagnostics
- **THEN** the registry returns normalized metadata only and does not run command handlers, owner subsystem work, shell commands, filesystem mutation, model calls, MCP calls, hooks, or renderer callbacks
- **中文** 当 host 请求 built-in plugin manifests、command projections、TUI projections、reasoning projections 或 diagnostics 时，registry 只能返回归一化 metadata，不得运行 command handlers、owner subsystem work、shell commands、filesystem mutation、model calls、MCP calls、hooks 或 renderer callbacks。

### Requirement: Plugin Author API Boundary / 插件作者 API 边界

The plugin system SHALL accept manifests authored through `@deepseek/plugin-api` while preserving `platform-contracts` as the canonical DTO boundary and rejecting plugin contributions that bypass declared contribution points.

plugin system 必须接受通过 `@deepseek/plugin-api` 编写的 manifests，同时保持 `platform-contracts` 作为标准 DTO 边界，并拒绝绕过声明式 contribution points 的 plugin contributions。

#### Scenario: Author API output is normal manifest / 作者 API 输出普通 Manifest
- **WHEN** a plugin is defined through `@deepseek/plugin-api`
- **THEN** plugin-system validation treats the output as a normal `PluginManifest` and records provenance, permissions, integrity, source, and compatibility metadata
- **中文** 当 plugin 通过 `@deepseek/plugin-api` 定义时，plugin-system validation 必须将输出视为普通 `PluginManifest`，并记录 provenance、permissions、integrity、source 与 compatibility metadata。

#### Scenario: Undeclared executable handles are rejected / 未声明可执行句柄被拒绝
- **WHEN** a plugin contribution contains host-private callbacks, executable renderer functions, raw shell fragments, runtime kernel handles, or undeclared owner routes
- **THEN** validation returns deterministic diagnostics and the contribution is not projected as active
- **中文** 当 plugin contribution 包含 host-private callbacks、executable renderer functions、raw shell fragments、runtime kernel handles 或未声明 owner routes 时，validation 必须返回确定性 diagnostics，且该 contribution 不得被投影为 active。

### Requirement: Complete Plugin Lifecycle State Machine / 完整插件生命周期状态机

The plugin system SHALL model plugin lifecycle as a deterministic state machine covering discovered, validated, resolved, installed, enabled, activated, degraded, disabled, uninstalled, quarantined, update-staged, updated, rollback-ready, rolled-back, and health-checked states.

plugin system 必须将 plugin lifecycle 建模为确定性状态机，覆盖 discovered、validated、resolved、installed、enabled、activated、degraded、disabled、uninstalled、quarantined、update-staged、updated、rollback-ready、rolled-back 与 health-checked 状态。

#### Scenario: Transition requires evidence / 状态转换需要证据
- **WHEN** a plugin transitions between lifecycle states
- **THEN** the transition records previous state, next state, trigger, actor, policy decision, permission diff, auth diff, dependency decision, compatibility decision, diagnostics, audit metadata, and replay fingerprint
- **中文** 当 plugin 在 lifecycle states 之间转换时，transition 必须记录 previous state、next state、trigger、actor、policy decision、permission diff、auth diff、dependency decision、compatibility decision、diagnostics、audit metadata 与 replay fingerprint。

#### Scenario: Activation is not execution / 激活不是执行
- **WHEN** a plugin reaches activated state
- **THEN** activation only registers valid contribution descriptors with owner subsystems and does not invoke command handlers, hooks, tools, MCP calls, model calls, process execution, filesystem mutation, or host callbacks
- **中文** 当 plugin 达到 activated 状态时，activation 只能把有效 contribution descriptors 注册到 owner subsystems，不得调用 command handlers、hooks、tools、MCP calls、model calls、process execution、filesystem mutation 或 host callbacks。

#### Scenario: Quarantine preserves base runtime / 隔离不影响基础运行时
- **WHEN** validation, dependency resolution, compatibility, integrity, permission policy, credential readiness, or health checks fail
- **THEN** the plugin is quarantined or degraded with diagnostics while base runtime, built-in safe plugins, and host startup continue
- **中文** 当 validation、dependency resolution、compatibility、integrity、permission policy、credential readiness 或 health checks 失败时，该 plugin 必须被 quarantined 或 degraded 并带 diagnostics，同时 base runtime、built-in safe plugins 与 host startup 继续运行。

### Requirement: Plugin Dependency and Conflict Resolution / 插件依赖与冲突解析

The plugin system SHALL resolve plugin dependencies, optional dependencies, extension-point conflicts, command/keymap/palette conflicts, version ranges, host requirements, and capability requirements before activation.

plugin system 必须在 activation 前解析 plugin dependencies、optional dependencies、extension-point conflicts、command/keymap/palette conflicts、version ranges、host requirements 与 capability requirements。

#### Scenario: Dependency graph is deterministic / 依赖图确定
- **WHEN** multiple plugins declare dependencies and optional dependencies
- **THEN** resolution produces a sorted dependency graph, activation order, skipped optional edges, conflicts, and diagnostics with stable replay fingerprints
- **中文** 当多个 plugins 声明 dependencies 与 optional dependencies 时，解析必须产生排序后的 dependency graph、activation order、skipped optional edges、conflicts 与 diagnostics，并带稳定 replay fingerprints。

#### Scenario: Conflict never silently wins / 冲突不静默获胜
- **WHEN** plugins conflict on command ids, aliases, keymaps, palette titles, target resolvers, render hints, hook ordering, provider ids, or config fragments
- **THEN** validation returns winner, loser, precedence source, affected hosts/modes, suggested overrides, and whether the losing contribution is hidden, degraded, or rejected
- **中文** 当 plugins 在 command ids、aliases、keymaps、palette titles、target resolvers、render hints、hook ordering、provider ids 或 config fragments 上冲突时，validation 必须返回 winner、loser、precedence source、affected hosts/modes、suggested overrides，以及失败 contribution 是 hidden、degraded 还是 rejected。

### Requirement: Plugin Health and Rollback / 插件健康检查与回滚

The plugin system SHALL run startup and on-demand health checks and provide rollback evidence for updates, failed activations, and degraded plugins.

plugin system 必须运行 startup 与 on-demand health checks，并为 updates、failed activations 与 degraded plugins 提供 rollback evidence。

#### Scenario: Health check is bounded / 健康检查有边界
- **WHEN** a plugin health check runs
- **THEN** it uses declared probes, timeout, side-effect class, permissions, redaction, and policy; unknown probes are rejected or marked inactive
- **中文** 当 plugin health check 运行时，必须使用声明的 probes、timeout、side-effect class、permissions、redaction 与 policy；未知 probes 必须被拒绝或标记 inactive。

#### Scenario: Update can roll back / 更新可回滚
- **WHEN** a plugin update changes manifest, integrity, permissions, auth requirements, dependency graph, or contribution set
- **THEN** the previous lockfile entry and activation snapshot remain addressable until rollback retention expires
- **中文** 当 plugin update 改变 manifest、integrity、permissions、auth requirements、dependency graph 或 contribution set 时，旧 lockfile entry 与 activation snapshot 必须在 rollback retention 过期前保持可寻址。

### Requirement: Plugin Host Projection Contract / 插件 Host 投影契约

The plugin system SHALL project plugin state and contributions to CLI, TUI, JSON, JSONL, diagnostics, VSCode, and future hosts through host-neutral descriptors.

plugin system 必须通过 host-neutral descriptors 将 plugin state 与 contributions 投影到 CLI、TUI、JSON、JSONL、diagnostics、VSCode 与未来 hosts。

#### Scenario: Host owns layout / Host 拥有布局
- **WHEN** a plugin contributes render hints or host surface metadata
- **THEN** host adapters decide layout and interaction while preserving plugin provenance, permissions, side effects, diagnostics, and conflict state
- **中文** 当 plugin 贡献 render hints 或 host surface metadata 时，host adapters 决定 layout 与 interaction，同时保留 plugin provenance、permissions、side effects、diagnostics 与 conflict state。

#### Scenario: Plugin inspector is complete / 插件检查器完整
- **WHEN** a user inspects a plugin or contribution
- **THEN** the host renders lifecycle state, API levels used, source, trust, version, integrity, permissions, credentials, dependencies, contribution list, conflicts, health, audit links, and owner execution routes
- **中文** 当用户检查 plugin 或 contribution 时，host 必须渲染 lifecycle state、API levels used、source、trust、version、integrity、permissions、credentials、dependencies、contribution list、conflicts、health、audit links 与 owner execution routes。

### Requirement: Governed Module Boundary / 受治理模块边界

Plugins, extensions, MCP bridges, skills, and hooks SHALL behave as governed modules that interact through manifests, contribution records, public contracts, policy decisions, and runtime events.

Plugins、extensions、MCP bridges、skills 与 hooks 必须作为受治理 modules 运行，并通过 manifests、contribution records、public contracts、policy decisions 与 runtime events 交互。

#### Scenario: Module cannot access private runtime objects / Module 不能访问私有 Runtime Objects

- **WHEN** a plugin or extension contributes commands, tools, render hints, result-list providers, keymaps, hooks, skills, or MCP routes
- **THEN** it receives only public contract inputs and governed execution routes, never private runtime objects, internal mutable state, or app-specific host objects
- **中文** 当 plugin 或 extension 贡献 commands、tools、render hints、result-list providers、keymaps、hooks、skills 或 MCP routes 时，它只能接收公共契约输入与受治理执行路由，不能接收 private runtime objects、内部 mutable state 或 app-specific host objects。

#### Scenario: Module has disable and audit semantics / Module 具备禁用与审计语义

- **WHEN** a plugin, extension, skill, hook, or MCP server is installed, enabled, disabled, or removed
- **THEN** the platform records manifest identity, version, permissions, dependency summary, policy/audit evidence, and disable/unload state
- **中文** 当 plugin、extension、skill、hook 或 MCP server 被安装、启用、禁用或移除时，平台必须记录 manifest identity、version、permissions、dependency summary、policy/audit evidence 与 disable/unload state。

### Requirement: Module Contribution Projection Is Inert / 模块贡献投影惰性

Module contribution projection SHALL remain inert and SHALL NOT execute module owner code during help, diagnostics, command palette, result-list, or future host projection.

Module contribution projection 必须保持惰性，并且在 help、diagnostics、command palette、result-list 或未来 host projection 期间不得执行 module owner code。

#### Scenario: Command palette projection is inert / Command Palette 投影惰性

- **WHEN** the platform projects plugin or extension contributions to command palette or diagnostics
- **THEN** it emits metadata records with provenance and permissions without invoking handlers, lifecycle code, MCP calls, hooks, or workflow execution
- **中文** 当平台将 plugin 或 extension contributions 投影到 command palette 或 diagnostics 时，必须输出带 provenance 与 permissions 的 metadata records，且不得调用 handlers、lifecycle code、MCP calls、hooks 或 workflow execution。

### Requirement: Governed Module Manifest / 受治理 Module Manifest

Plugins, extensions, MCP bridges, skills, and hooks SHALL declare manifests before contributing behavior.

Plugins、extensions、MCP bridges、skills 与 hooks 在贡献行为前必须声明 manifests。

#### Scenario: Module declares contributions / Module 声明 Contributions

- **WHEN** a module contributes commands, tools, hooks, MCP bridges, UI surfaces, or runtime behavior
- **THEN** its manifest declares contribution ids, permissions, compatibility, owner, lifecycle hooks, and diagnostics surface
- **中文** 当 module 贡献 commands、tools、hooks、MCP bridges、UI surfaces 或 runtime behavior 时，其 manifest 必须声明 contribution ids、permissions、compatibility、owner、lifecycle hooks 与 diagnostics surface。

### Requirement: No Private Runtime Object Access / 禁止访问私有 Runtime Object

Modules SHALL interact through public contracts, capability APIs, events, and policy decisions rather than private runtime objects.

Modules 必须通过公共 contracts、capability APIs、events 与 policy decisions 交互，而不是私有 runtime objects。

#### Scenario: Private object access is blocked / 私有对象访问被阻止

- **WHEN** a module requests or receives a private runtime object, private package path, or host-only object outside its adapter
- **THEN** governance reports a module-boundary violation and readiness blocks product promotion depending on that access
- **中文** 当 module 请求或接收私有 runtime object、private package path 或 adapter 外的 host-only object 时，治理必须报告 module-boundary violation，并阻止依赖该访问的产品推广。

### Requirement: Module Lifecycle Governance / Module Lifecycle 治理

Modules SHALL support deterministic enable, disable, unload, cleanup, and diagnostic states.

Modules 必须支持确定性的 enable、disable、unload、cleanup 与 diagnostic states。

#### Scenario: Module unload is visible / Module Unload 可见

- **WHEN** a module is disabled or unloaded
- **THEN** the system records cleanup outcome, remaining contributions, policy revocation, and diagnostics status
- **中文** 当 module 被禁用或卸载时，系统必须记录 cleanup outcome、remaining contributions、policy revocation 与 diagnostics status。

