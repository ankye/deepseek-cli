## 1. Contracts

- [x] 1.1 `src/packages/platform-contracts/src/plugin.ts` 新增 `PluginLockfileEntry`、`PluginLockfile`、`IntegrityVerdict`、`IntegrityMismatchError` 四个只读类型/错误。
- [x] 1.2 同文件扩展 `PluginManager`:`install` 返回值改为 `Promise<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>`;新增 `verify(manifest): Promise<IntegrityVerdict>`、`snapshot(): Promise<PluginLockfile>`、`applyLockfile(lockfile): Promise<ReadonlyArray<{ diff: PermissionDiff; lockEntry: PluginLockfileEntry }>>`。
- [x] 1.3 `src/packages/platform-contracts/src/index.ts` 导出新增类型。

## 2. Implementation

- [x] 2.1 重写 `src/packages/platform-abstraction/src/placeholders/agent-plugin.ts`:
  - 内部用 `Map<PluginId, PluginLockfileEntry>` 维护状态;`list()` 与 `snapshot()` 都按 `pluginId` 升序返回 frozen 数组。
  - `install(manifest)`:先 `verify(manifest)`,`{ ok: false }` 抛 `IntegrityMismatchError`;否则计算 `PermissionDiff`(added = manifest 中而 entry 中没有的 permission,removed = entry 中而 manifest 中没有的 permission),写入/覆盖 lock entry,返回 `{ diff, lockEntry }`。
  - `verify(manifest)`:若已有同 `id` 的 entry 且 `integrity` 不一致 → `{ ok: false, reason: "mismatch", expected: entry.integrity, actual: manifest.integrity }`;否则 `{ ok: true }`。
  - `applyLockfile(lockfile)`:按 `lockfile.entries` 顺序,对每个 entry 构造一个等价 `PluginManifest` 再调 `install`;已有 entry 且 integrity 一致则 no-op(返回 empty diff);integrity 不一致则抛错。
  - `snapshot()` 返回 `{ version: 1, entries: sortedFrozenEntries }`,`Object.freeze` 两层(entries 数组 + 每个 entry)。
- [x] 2.2 `src/packages/platform-abstraction/src/placeholders/index.ts` 若未显式 re-export `InMemoryPluginManager` 则确认(不改签名)。

## 3. Tests

- [x] 3.1 新建 `tests/contracts/plugin-manager.test.ts`:
  - `install` 首次:返回 `diff.added == manifest.permissions`,`diff.removed.length === 0`,`lockEntry.integrity === manifest.integrity`,`lockEntry.installedAt` 是单调递增的 ISO string。
  - `install` 同 id 扩权:返回 `diff.added` 精确为新增的 permission,`diff.removed` 精确为移除的 permission。
  - `install` integrity 不一致:抛 `IntegrityMismatchError`(`error.expected` / `error.actual` 字段正确)。
  - `snapshot()` 返回按 `pluginId` 升序的 frozen 数组,`Object.isFrozen` 对数组与每个 entry 均为 true。
  - `applyLockfile` 幂等:同 lockfile 二次 apply 返回 all-empty diff。
  - `verify(manifest)` TOFU:manager 为空时对任意 manifest 返回 `{ ok: true }`。
- [x] 3.2 新建 `tests/integration/plugin-lockfile-roundtrip.test.ts`:
  - 场景 A:在 manager A 上 install 两个不同 id 的 plugin → `snapshot()` 得到 `lockfile` → 新建 manager B → `applyLockfile(lockfile)` → B 的 `list()` 与 A 的 `list()` 按 `id` 一致,permission 集合一致。
  - 场景 B:在 A 上 install plugin p1 v1 → snapshot → 在 B 上 apply → 再用 p1 v1 但 integrity 不同的 manifest 直接 install → 抛 `IntegrityMismatchError`。
- [x] 3.3 全量 `npm test`:零 fail / 零新增 skipped;tests 数从 333 提升到 342+(contracts 6 + integration 2 新增)。

## 4. Spec Deltas

- [x] 4.1 `openspec/changes/implement-plugin-lockfile-v1/specs/plugin-system/spec.md`:
  - `ADDED Requirements` 新增 `Plugin Lockfile Reproducibility`,scenario 覆盖 `install writes lock entry` / `snapshot round-trips through applyLockfile` / `integrity mismatch rejects`。
  - `MODIFIED Requirements` 替换 `Plugin Manifest, Integrity, and Lockfile`,scenario 补 `Install records lock entry` / `Verify detects integrity mismatch without snapshot drift`。
  - `MODIFIED Requirements` 替换 `Plugin Permission Diff and Audit`,scenario 补 `Install returns permission diff relative to lockfile baseline`。
- [x] 4.2 `openspec/changes/implement-plugin-lockfile-v1/specs/platform-contracts/spec.md`:
  - `ADDED Requirements` 新增 `Plugin Lockfile Contract`(字段形状 + 只读 + `PluginManager` 方法签名)。

## 5. Docs

- [x] 5.1 `docs/architecture/execution-model.md` 在 `Code Intelligence Auto-Enrichment` 小节后插入 `Plugin Lockfile` 小节,覆盖 install / verify / snapshot / applyLockfile 四态决策树 + integrity mismatch fail-closed。
- [x] 5.2 `docs/product/product-roadmap.md` R3 `implement-plugin-lockfile-v1` 节点:追加现状说明「`PluginManager` 已具备 install lock metadata、snapshot、applyLockfile、verify 四项契约;remote marketplace fetch 与 signed packages 留到后续 pack」。

## 6. Verification

- [x] 6.1 `npm run typecheck`。
- [x] 6.2 `npm run lint`。
- [x] 6.3 `node scripts/check-boundaries.mjs`。
- [x] 6.4 `npm test`(预期 333 → 342+;零 fail、零新增 skipped)。
- [x] 6.5 `openspec validate implement-plugin-lockfile-v1 --strict`。
- [x] 6.6 `openspec validate --specs --strict`。
- [x] 6.7 刷新 `tests/acceptance/latest/`。
