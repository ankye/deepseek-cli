## 1. Contracts & Boundaries

- [x] 1.1 `context-engine/package.json` 新增 `"@deepseek/memory-cache-management": "0.1.0"` dependency。
- [x] 1.2 `scripts/workspace-packages.mjs` `packageDependencies["context-engine"]` 加 `"memory-cache-management"`,并确认 `check-boundaries.mjs` 通过。
- [x] 1.3 `platform-contracts`:**不改**(`CacheManager` / `MemoryManager` / `ContextProjectionCacheMetadata` 已足够)。此任务为 alignment check。

## 2. memory-cache-management

- [x] 2.1 `InMemoryMemoryManager.query` 保证返回值按 put 插入顺序返回(MemoryEntry 不带时间戳字段,插入顺序是唯一确定序列)。
- [x] 2.2 `InMemoryCacheManager.set` 文档化「同 key 覆盖」语义,补单测。
- [x] 2.3 `InMemoryCacheManager.get` 返回前 `Object.freeze` + `Object.freeze(entry.invalidation)`,防止消费侧改掉缓存态。
- [x] 2.4 保持 `projectionCacheKey(input: ProjectionCacheInput)` 单一签名为**唯一权威**,并把 `PROJECTION_CACHE_NAMESPACE` / `createProjectionCacheEntry` 保持 public API。

## 3. context-engine

- [x] 3.1 从 `@deepseek/memory-cache-management` 导入 `projectionCacheKey` / `createProjectionCacheEntry` / `PROJECTION_CACHE_NAMESPACE`,替换 `context-engine/src/index.ts:416` 本地 `projectionCacheKey` 与 `line 23` 的 `CONTEXT_PROJECTION_CACHE_NAMESPACE` 常量(后者导出为兼容 re-export,内部改为引用库常量)。
- [x] 3.2 `InMemoryContextEngine` 构造函数新增可选参数 `{ cache?: CacheManager }`。
- [x] 3.3 `projectGraph`:
  - 构造 `ProjectionCacheInput = { requestFingerprint, dependencyFingerprints }`,其中 `requestFingerprint = stableHash(JSON.stringify({schemaVersion,sessionId,turnId,purpose,prompt,budget,scope,candidates}))`。
  - 若 `this.cache` 存在:`const cached = await this.cache.get<ContextProjectionResult>(projectionCacheKey(input))`,命中则返回 `{...cached, cache: {...cached.cache, hit: true}, replayFingerprint: cached.replayFingerprint + ":cache-hit"}`。
  - 若 miss(或未注入 cache):计算 projection 后,若 `this.cache` 存在,`await this.cache.set(createProjectionCacheEntry(input, result, now))`;若未注入,走 `this.projectionCache` in-memory fallback(保持现行)。
- [x] 3.4 保留 `this.projectionCache: Map<string, ContextProjectionResult>`,用作 `cache` 未注入时的 fallback;不再走本地 key function,改用库 `projectionCacheKey(input)` 作 Map key。
- [x] 3.5 `InMemoryContextEngine` 构造不接 cache 时行为与当前逐字节一致(用现有 test 确认)。

## 4. Runtime / Testing Wiring

- [x] 4.1 `testing-regression/src/fakes/index.ts`:在 `createDeterministicRuntimeDependencies` 里把 `cache` 先建出来,再传进 context:
  ```
  const cache = new InMemoryCacheManager();
  // ...
  context: new InMemoryContextEngine({ cache }),
  memory: new InMemoryMemoryManager(),
  cache,
  ```
- [x] 4.2 `runtime/src/*.ts` **不新增** `deps.cache` / `deps.memory` 直接消费(本 pack 只治理 context-engine 的 cache 路径)。
- [x] 4.3 `createLiveCliDependencies` 继承 base 即可,无额外动作(它 `spread ...base`,已自动拿到接了 cache 的 context-engine)。

## 5. Tests

- [x] 5.1 `tests/contracts/memory-cache-management.test.ts`:
  - `projectionCacheKey` 对相同 input 幂等;对 deps 顺序重排仍返回同 key(库已保证 `sort()`)。
  - `InMemoryCacheManager.set` 同 key 后 get 得到最新 value。
  - `InMemoryCacheManager.get` 返回对象被冻结(`Object.isFrozen` 为 true)。
  - `InMemoryMemoryManager.query` 按插入顺序(MemoryEntry 无 createdAt,插入顺序是唯一确定序列)。
- [x] 5.2 `tests/contracts/context-engine-cache.test.ts`:
  - 注入 `InMemoryCacheManager` + 连续两次 `projectGraph` 同 input → 第二次 `cache.hit === true`、`selectedNodes` 与首次等价。
  - 未注入 cache 时连续两次 → 行为走 in-memory fallback(命中)、`cache.hit === true`(现行行为保持)。
  - 注入 cache 且 candidate 的 `dependencyFingerprints` 变动 → 产生不同 key,不命中。
- [x] 5.3 `tests/contracts/context-engine.test.ts` 现有 4 case 保持通过(零行为回归)。
- [x] 5.4 全量 `npm test` 从 311 → 318+,零 fail/零 skipped 新增。

## 6. Spec Deltas

- [x] 6.1 `memory-cache-management` spec 新增三条 requirement:
  - `Projection Cache Key Authority`
  - `InMemoryCacheManager.set Idempotent Overwrite`
  - `InMemoryMemoryManager.query Deterministic Order`
- [x] 6.2 `context-engine` spec 新增一条 requirement:`Projection Cache Pluggable Via CacheManager`。

## 7. Docs

- [x] 7.1 `docs/architecture/execution-model.md` 补「Projection cache 的两级存储」小节(紧贴 Runtime Turn Lifecycle)。
- [x] 7.2 `docs/product/product-roadmap.md` R2 `memory-cache-management` 节点:标注「context-engine 接入、runtime 主路径尚未消费 memory(后续 pack)」,把此前过度声明的「已实现」纠成更准确的状态。

## 8. Verification

- [x] 8.1 `npm run typecheck`。
- [x] 8.2 `npm run lint`。
- [x] 8.3 `node scripts/check-boundaries.mjs`。
- [x] 8.4 `npm test`(311 → 322: 318 pass / 4 skipped / 0 fail)。
- [x] 8.5 `openspec validate wire-memory-cache-into-runtime --strict`。
- [x] 8.6 `openspec validate --specs --strict`。
- [x] 8.7 刷新 `tests/acceptance/latest/`。
