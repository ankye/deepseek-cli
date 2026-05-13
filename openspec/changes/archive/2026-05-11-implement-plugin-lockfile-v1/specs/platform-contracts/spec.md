## ADDED Requirements

### Requirement: Plugin Lockfile Contract / 插件 Lockfile 契约

`@deepseek/platform-contracts` SHALL declare the plugin lockfile shapes and `PluginManager` lockfile methods as readonly value types with structural, pluginId-sorted determinism. The contracts SHALL include `PluginLockfileEntry`, `PluginLockfile`, `IntegrityVerdict`, and `IntegrityMismatchError`, and `PluginManager` SHALL expose `install`, `verify`, `snapshot`, and `applyLockfile` with exactly the signatures below. Every array returned from a lockfile-shaped method SHALL be `readonly`; every entry SHALL be structurally immutable at the TypeScript type level.

`@deepseek/platform-contracts` 必须把 plugin lockfile 的字段形状和 `PluginManager` 的 lockfile 方法声明为只读的值类型，并且按 `pluginId` 排序保持结构性确定性。契约必须包含 `PluginLockfileEntry`、`PluginLockfile`、`IntegrityVerdict`、`IntegrityMismatchError` 四项；`PluginManager` 必须精确导出 `install` / `verify` / `snapshot` / `applyLockfile` 四个方法（签名如下）。任何 lockfile 相关方法返回的数组必须是 `readonly`，每个 entry 在 TypeScript 类型层面必须结构不可变。

#### Scenario: Contracts package exports lockfile types / contracts 包导出 lockfile 类型

- **WHEN** `@deepseek/platform-contracts` is imported by any downstream package
- **THEN** the module exports `PluginLockfileEntry`, `PluginLockfile`, `IntegrityVerdict`, and `IntegrityMismatchError` as named type/class exports, and each entry field (`pluginId`, `version`, `source`, `integrity`, `permissions`, `installedAt`) is declared `readonly` with `permissions` typed as `readonly string[]`
- **中文** 当任意下游包 import `@deepseek/platform-contracts` 时，模块必须以具名导出方式暴露 `PluginLockfileEntry`、`PluginLockfile`、`IntegrityVerdict`、`IntegrityMismatchError`；entry 的每个字段（`pluginId` / `version` / `source` / `integrity` / `permissions` / `installedAt`）必须为 `readonly`，其中 `permissions` 类型为 `readonly string[]`。

#### Scenario: PluginManager exposes install/verify/snapshot/applyLockfile / PluginManager 暴露四方法

- **WHEN** a type-level consumer inspects the `PluginManager` interface
- **THEN** the interface declares:
  - `install(manifest: PluginManifest): Promise<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>`
  - `verify(manifest: PluginManifest): Promise<IntegrityVerdict>`
  - `snapshot(): Promise<PluginLockfile>`
  - `applyLockfile(lockfile: PluginLockfile): Promise<ReadonlyArray<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>>`
  - `uninstall(id: PluginId): Promise<void>`
  - `list(): Promise<readonly PluginManifest[]>`
- **中文** 当类型层消费者检查 `PluginManager` 接口时，接口必须精确声明上述六个方法签名（`install` 返回 `{ diff, lockEntry }`；`verify` / `snapshot` / `applyLockfile` 为新增方法；`uninstall` / `list` 保留旧签名）。

#### Scenario: IntegrityVerdict models missing vs mismatch / IntegrityVerdict 区分 missing 与 mismatch

- **WHEN** `IntegrityVerdict` is used to communicate a verification result
- **THEN** the type is a discriminated union `{ ok: true } | { ok: false; reason: "missing" | "mismatch"; expected: string; actual: string }`, with `reason: "missing"` reserved for "no lock entry yet" and `reason: "mismatch"` reserved for "lock entry exists but integrity differs"
- **中文** 当 `IntegrityVerdict` 用于传达校验结果时，类型必须为辨识联合 `{ ok: true } | { ok: false; reason: "missing" | "mismatch"; expected: string; actual: string }`，其中 `reason: "missing"` 专用于「尚无 lock entry」，`reason: "mismatch"` 专用于「lock entry 存在但 integrity 不一致」。

#### Scenario: IntegrityMismatchError carries expected and actual / IntegrityMismatchError 携带 expected 与 actual

- **WHEN** `install` or `applyLockfile` rejects due to integrity mismatch
- **THEN** the thrown value is an `IntegrityMismatchError` whose `name === "IntegrityMismatchError"` and which exposes readonly string fields `expected` and `actual` copied from the conflicting lock entry and manifest
- **中文** 当 `install` 或 `applyLockfile` 因 integrity 不一致而 reject 时，抛出的值必须是 `IntegrityMismatchError`，其 `name === "IntegrityMismatchError"`，并对外暴露只读字符串字段 `expected` 与 `actual`（取自冲突的 lock entry 与 manifest）。
