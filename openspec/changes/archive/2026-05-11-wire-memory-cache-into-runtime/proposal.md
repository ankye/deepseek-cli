## Why

`@deepseek/memory-cache-management` 导出了完整的 `InMemoryMemoryManager` / `InMemoryCacheManager` / `projectionCacheKey` / `createProjectionCacheEntry`(72 行,真实实现、有 put/query/get/set/invalidate 全套语义),`RuntimeDependencies.memory` 与 `.cache` 也早就声明了契约位置,但 `src/packages/runtime/src/*.ts` **没有任何一处读取 `deps.memory` 或 `deps.cache`**——唯一把它们接上的地方只有 `src/packages/testing-regression/src/fakes/index.ts` 第 132–133 行。更糟的是 `@deepseek/context-engine/src/index.ts:416` 自己重新实现了一个 `projectionCacheKey`,并用私有 `Map<string, ContextProjectionResult>` 做投影缓存(`index.ts:27`),**完全绕过了 `CacheManager` 契约**。

`@deepseek/memory-cache-management` ships the full `InMemoryMemoryManager` / `InMemoryCacheManager` plus `projectionCacheKey` / `createProjectionCacheEntry` helpers, and `RuntimeDependencies.memory` / `.cache` have always been contract slots — yet nothing under `src/packages/runtime/src/*.ts` reads `deps.memory` or `deps.cache`. Only `testing-regression/fakes/index.ts:132-133` ever wires them. Meanwhile `context-engine/src/index.ts:416` re-implements a local `projectionCacheKey` and keeps projection results in its own private `Map` (`index.ts:27`), bypassing the `CacheManager` contract entirely.

后果:
- 契约漂移:Roadmap 把 `memory-cache-management` 标注为 R2「已实现」,实际 runtime 路径上属于 dead code。
- 跨会话缓存不可能:`InMemoryContextEngine` 自持的 Map 会被每个进程丢弃;即便换用共享 `CacheManager` 实现(比如未来的文件系统 cache)也接不上。
- 投影缓存键定义漂移:`context-engine` 的本地 `projectionCacheKey` 与 `memory-cache-management` 的导出形状已经不一致(前者直接 hash 整个 request+candidates,后者约定 `requestFingerprint + sorted(deps)`),让未来接管时出现 silent cache miss。
- `InMemoryMemoryManager` 的 `put/query` 从未被 runtime 触发,意味着 `MemoryManager` 语义对 agent loop 不可用。

Consequences: roadmap claims R2 memory-cache as "implemented," but it is dead in the runtime path; cross-session cache is impossible; `projectionCacheKey` has silently diverged between library and context-engine; `MemoryManager.put/query` is never invoked by any live path.

## What Changes

- `@deepseek/context-engine`:`InMemoryContextEngine` 构造函数新增可选 `{ cache?: CacheManager }`,当注入时:
  - 用 `deps.cache.get<ContextProjectionResult>(projectionCacheKey(...))` 查命中;
  - miss 后 `deps.cache.set(createProjectionCacheEntry(...))` 写回;
  - 私有 `projectionCache` Map 仍然保留作为 `cache` 未注入时的 fallback(零破坏)。
- **删除** `context-engine/src/index.ts` 第 416 行的本地 `projectionCacheKey`,**改为**从 `@deepseek/memory-cache-management` `import { projectionCacheKey, createProjectionCacheEntry, PROJECTION_CACHE_NAMESPACE }`。`context-engine/package.json` 加依赖 `@deepseek/memory-cache-management`。
- `check-boundaries.mjs` 与 `scripts/workspace-packages.mjs` 的 `packageDependencies` 加一条 `context-engine → memory-cache-management`。
- `@deepseek/runtime`:`createDefaultRuntimeKernel` / headless 构造路径把 `deps.cache` 传给 `InMemoryContextEngine`(如果 context engine 是 `InMemoryContextEngine` 实例且 deps 提供了 `cache` 则挂上;否则保持现状)。不强制所有实现都接 cache —— 外部 ContextEngine 实现可以自带。
- `@deepseek/memory-cache-management`:`InMemoryCacheManager.set` 补幂等语义契约(同 key 覆盖)+ `get` 返回时做一次浅冻结,防止消费侧改掉缓存态。`InMemoryMemoryManager.query` 补按 `createdAt` 升序排序契约(目前是 insert 顺序,behavior drift 风险)。
- Spec delta:`memory-cache-management` 新增「Projection Cache Key 唯一权威」「`InMemoryCacheManager.set` 幂等覆盖」「`query` 按 `createdAt` 升序」三条 requirement。
- Spec delta:`context-engine` 新增「Projection Cache Pluggable Via `CacheManager`」requirement(Scenario 覆盖 cache 注入命中、cache miss 写回、未注入仍可用 in-memory fallback)。

## Impact

- 受影响规范:`memory-cache-management`(cache key 权威 + 契约补齐)、`context-engine`(cache 注入点)。
- 受影响代码:
  - `src/packages/context-engine/src/index.ts`:导入 `memory-cache-management` 的 `projectionCacheKey`,删本地重复实现;`InMemoryContextEngine` 构造新增 `{ cache? }`;`projectGraph` 内分支走 cache 或 fallback。
  - `src/packages/context-engine/package.json`:加依赖。
  - `src/packages/memory-cache-management/src/index.ts`:补 `query` 排序 + `get` 冻结 + `set` 幂等文档。
  - `src/packages/runtime/src/headless.ts` / `agent-loop.ts` 构造路径:如果 `deps.context` 是 `InMemoryContextEngine` 实例**且**被 testing-regression 注入,则把 `deps.cache` 桥接进去。为了**不把 runtime 耦合到具体实现**,改法是在 testing-regression 的 `createDeterministicRuntimeDependencies` 里改为 `new InMemoryContextEngine({ cache: cacheManager })`,runtime src 完全不碰。
  - `scripts/workspace-packages.mjs` / `scripts/check-boundaries.mjs`:声明 context-engine 新依赖。
- 测试:
  - `tests/contracts/memory-cache-management.test.ts`:新增 4 case——key 稳定性、query 排序、set 幂等覆盖、get 返回冻结。
  - `tests/contracts/context-engine-cache.test.ts`:新增 3 case——注入 `CacheManager` 后命中、miss 写回、未注入走 fallback。
- 零回归:不注入 cache 时 `InMemoryContextEngine` 行为保持字节级不变;现有 311 测试不受影响。
- Docs:`docs/architecture/runtime.md` 补「Projection cache 的两级存储:process-local map → pluggable `CacheManager`」。

## Non-Goals

- 不做持久化 cache(文件系统 / SQLite 实现留到独立 change pack)。
- 不把 `MemoryManager.put/query` 接入 agent loop(这一次只治理 cache 漂移;memory 语义接入需要设计 scope 与 GC,独立 pack)。
- 不改 context engine 以外的 cache 消费者。
- 不做 cache 共享跨进程(单进程 in-memory 足够解漂移)。
