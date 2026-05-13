## ADDED Requirements

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

## MODIFIED Requirements

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
