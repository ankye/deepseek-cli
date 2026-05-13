## Why

`@deepseek/platform-contracts` 把 `PluginManifest` 定义成带 `integrity`/`source`/`version`/`permissions` 的结构，`PluginManager.install` 签名返回 `PermissionDiff`，roadmap R3 明确写「Plugin install shows permission diff and writes lock metadata」——但当前唯一的实现 `src/packages/platform-abstraction/src/placeholders/agent-plugin.ts` 就是一个 18 行的 `Map.set` 占位：没有 integrity 校验、没有 lockfile、没有跨 install 的 permission diff 追踪、`list()` 也不按任何稳定顺序返回。`plugin-system` spec 的「Install locked plugin version」「Reject integrity mismatch」「Plugin update requests broader permission」三条 scenario 在代码里都是 dead letter。

`PluginManifest` in `@deepseek/platform-contracts` declares `integrity` / `source` / `version` / `permissions`, `PluginManager.install` returns `PermissionDiff`, and the R3 acceptance gate explicitly says "Plugin install shows permission diff and writes lock metadata" — yet the only implementation is the 18-line `InMemoryPluginManager` placeholder that does nothing but `Map.set`. No integrity verification, no lockfile, no cross-install diff tracking, no stable `list()` ordering. Three plugin-system scenarios (locked install, integrity mismatch reject, broader-permission diff on update) have zero enforcement behind them.

后果 / Consequences:

- R3 acceptance gate 未达标：`roadmap` 声称 R3 scope 覆盖「plugin install → permission diff + lock metadata」，但实际代码里 install 既不拒绝篡改的 artifact，也不产生可复现的 lock entry。
- Spec drift：`plugin-system` spec 的三条 scenario 是文档层的断言，runtime 一侧没有任何契约兑现它们；未来接真实 marketplace 时会 silent regress。
- 依赖下游锁死：`implement-mcp-and-plugin-auth-boundaries` 需要靠 plugin manifest 的 integrity + permission diff 驱动 auth 决策，没有 lockfile 就没有 reproducible baseline。

## What Changes

- `@deepseek/platform-contracts`:
  - 新增 `PluginLockfileEntry { pluginId, version, source, integrity, permissions, installedAt }` 与 `PluginLockfile { version: 1, entries: readonly PluginLockfileEntry[] }` 两个只读契约。
  - `PluginManager` 扩展三个新方法：`verify(manifest): Promise<IntegrityVerdict>`、`snapshot(): Promise<PluginLockfile>`、`applyLockfile(lockfile): Promise<ReadonlyArray<PermissionDiff>>`（后两者等幂）。`install` 返回值从 `PermissionDiff` 扩为 `{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }`，保留旧字段位置避免调用方破坏。
  - `IntegrityVerdict = { ok: true } | { ok: false; reason: "missing" | "mismatch"; expected: string; actual: string }`。
- `@deepseek/platform-abstraction`:
  - `InMemoryPluginManager` 重写为：
    - 内部维护 `Map<PluginId, PluginLockfileEntry>`（按插入顺序稳定，`list()` / `snapshot()` 按 `pluginId` 升序返回保证跨进程一致）。
    - `install` 流程：先 `verify(manifest)` → 不通过则 throw `IntegrityMismatchError`，通过则计算 `PermissionDiff`（与已有 entry 对比，新增/移除 permission 明确区分）并写入 lockfile。
    - `applyLockfile` 按 entry 顺序逐条 install；对已存在且 integrity 一致的条目 no-op；对 integrity 不一致的条目抛错并在 audit 里记录。
    - `verify` 默认使用 `manifest.integrity` 的 `sha256:…` 前缀格式：如果 manifest 本身的 integrity 与已 snapshot 过的 entry 不一致 → mismatch；无 snapshot → 缺省 ok（trust-on-first-use，后续 `applyLockfile` 会锁死）。
- `testing-regression/src/fakes/index.ts`:`createDeterministicRuntimeDependencies` 维持 `plugins: new InMemoryPluginManager()`——无侵入。
- Spec deltas:
  - `plugin-system`:为 `Plugin Manifest, Integrity, and Lockfile` 与 `Plugin Permission Diff and Audit` 各补 scenario，新增 `Plugin Lockfile Reproducibility` requirement。
  - `platform-contracts`:新增 `Plugin Lockfile Contract` requirement（契约位置 + 字段 + 只读约束）。

## Impact

- 受影响规范:`plugin-system`、`platform-contracts`（新增一条 requirement）。
- 受影响代码:
  - `src/packages/platform-contracts/src/plugin.ts`（新增 3 个 type + 2 个方法签名 + 1 个错误类型 + `install` 返回值扩展）。
  - `src/packages/platform-abstraction/src/placeholders/agent-plugin.ts`（重写为有实际语义的实现）。
  - `src/packages/testing-regression/src/fakes/index.ts`（只在必要时调整 import，不变动 wiring）。
- 测试:
  - `tests/contracts/plugin-manager.test.ts`（新建）:install 产生 lock entry、integrity mismatch 拒绝、permission diff 区分 added/removed、applyLockfile 幂等、snapshot 顺序稳定、verify TOFU 语义。
  - `tests/integration/plugin-lockfile-roundtrip.test.ts`（新建）:install → snapshot → 新建 manager → applyLockfile，所有 entry 恢复到一致的 permission 集合。
- Docs:
  - `docs/architecture/execution-model.md` 补「Plugin Lockfile」小节（紧贴 `Code Intelligence Auto-Enrichment` 下方），描述 install/verify/snapshot/applyLockfile 决策树 + integrity mismatch 的 fail-closed 行为。
  - `docs/product/product-roadmap.md` R3 下 `implement-plugin-lockfile-v1` 节点:追加现状说明「`PluginManager` 已有 `install` lock metadata、`snapshot`、`applyLockfile`、`verify` 契约；marketplace signed packages 与远程 integrity fetch 留到后续 pack」。

## Non-Goals

- 不做真正的 sha256 下载流水线（`integrity` 字段当前是 caller 传入的字符串；hash 校验形状已约定但 body 仍是 equality 比较，真正的 fetch + 计算留给 marketplace pack）。
- 不做 plugin signed packages（另一条 roadmap 节点）。
- 不做 plugin rollback / update 流（`install` 的语义只覆盖首次 + 同 id 复装，专门的 update/rollback 是后续 pack）。
- 不把 plugin lifecycle 事件接入 governed execution envelope（roadmap R3 的 "Plugin lifecycle is scheduled work" 由独立 pack 兑现）。
