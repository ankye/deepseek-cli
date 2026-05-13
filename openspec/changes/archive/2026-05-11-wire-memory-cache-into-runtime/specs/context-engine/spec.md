## ADDED Requirements

### Requirement: Projection Cache Pluggable Via `CacheManager` / 投影缓存可通过 CacheManager 插接

`InMemoryContextEngine` SHALL accept an optional constructor parameter `{ cache?: CacheManager }`. When a `cache` is injected, every `projectGraph(request, candidates)` invocation SHALL:
(1) build a `ProjectionCacheInput` whose `requestFingerprint` is the stable hash of the request shape and whose `dependencyFingerprints` is the list of candidate dependency fingerprints;
(2) compute the cache key via `projectionCacheKey(input)` imported from `@deepseek/memory-cache-management`;
(3) attempt `cache.get<ContextProjectionResult>(key)` and return the cached result (with `cache.hit = true` and `replayFingerprint` suffixed by `":cache-hit"`) on hit;
(4) on miss, compute the projection and persist it via `cache.set(createProjectionCacheEntry(input, result, now))` before returning.

When no `cache` is injected, `InMemoryContextEngine` SHALL fall back to the existing process-local `Map<string, ContextProjectionResult>` using the same `projectionCacheKey(input)` as the map key, preserving zero-regression behavior relative to the pre-change implementation. The local `projectionCacheKey` function previously defined in `context-engine/src/index.ts` SHALL be removed; any remaining local namespace constant (e.g. `CONTEXT_PROJECTION_CACHE_NAMESPACE`) SHALL be re-exported as an alias of `PROJECTION_CACHE_NAMESPACE` from `@deepseek/memory-cache-management`, not as an independent literal.

`InMemoryContextEngine` 必须接受可选构造参数 `{ cache?: CacheManager }`。当注入 `cache` 时,每次 `projectGraph(request, candidates)` 调用都必须:
(1) 构造 `ProjectionCacheInput`,其 `requestFingerprint` 为 request 形状的稳定哈希,其 `dependencyFingerprints` 为 candidate 依赖指纹列表;
(2) 通过从 `@deepseek/memory-cache-management` 导入的 `projectionCacheKey(input)` 计算缓存键;
(3) 尝试 `cache.get<ContextProjectionResult>(key)`,命中时返回缓存结果(`cache.hit = true`,`replayFingerprint` 追加 `":cache-hit"` 后缀);
(4) miss 时计算 projection,并在返回前通过 `cache.set(createProjectionCacheEntry(input, result, now))` 写回。

当未注入 `cache` 时,`InMemoryContextEngine` 必须回退到现有的进程内 `Map<string, ContextProjectionResult>`,并以相同的 `projectionCacheKey(input)` 作为 map key,相对改动前的实现保持零回归行为。原先在 `context-engine/src/index.ts` 定义的本地 `projectionCacheKey` 函数必须移除;任何残留的本地命名空间常量(例如 `CONTEXT_PROJECTION_CACHE_NAMESPACE`)必须作为 `@deepseek/memory-cache-management` 的 `PROJECTION_CACHE_NAMESPACE` 的再导出别名,而不是独立字面量。

#### Scenario: Cache-backed hit returns cached projection / cache 注入命中返回缓存

- **WHEN** an `InMemoryContextEngine` is constructed with `{ cache: new InMemoryCacheManager() }` and `projectGraph(request, candidates)` is called twice with identical inputs
- **THEN** the second call SHALL return a result whose `selectedNodes` are byte-equal to the first call's, whose `cache.hit === true`, and whose `replayFingerprint` ends with `":cache-hit"`
- **中文** 当 `InMemoryContextEngine` 以 `{ cache: new InMemoryCacheManager() }` 构造,并以相同输入两次调用 `projectGraph(request, candidates)` 时,第二次必须返回一个 `selectedNodes` 与首次字节相同、`cache.hit === true` 且 `replayFingerprint` 以 `":cache-hit"` 结尾的结果。

#### Scenario: Cache-backed miss writes back via createProjectionCacheEntry / cache miss 通过工厂写回

- **WHEN** an `InMemoryContextEngine` is constructed with an injected `CacheManager` and `projectGraph` is called for a previously-unseen input
- **THEN** after the call the injected cache SHALL contain an entry at `projectionCacheKey(input)` whose `value` matches the returned projection and whose `invalidation` was produced by `createProjectionCacheEntry`
- **中文** 当 `InMemoryContextEngine` 以注入的 `CacheManager` 构造,并对此前未见输入调用 `projectGraph` 时,调用后被注入的 cache 必须在 `projectionCacheKey(input)` 处包含一条 entry,其 `value` 与返回的 projection 对齐,其 `invalidation` 由 `createProjectionCacheEntry` 产出。

#### Scenario: No-cache fallback preserves in-memory hit behavior / 未注入 cache 走 in-memory fallback

- **WHEN** an `InMemoryContextEngine` is constructed without any `cache` argument and `projectGraph` is called twice with identical inputs
- **THEN** the second call SHALL still observe `cache.hit === true` via the private `Map` fallback, and SHALL NOT require any `CacheManager` to have been registered on `RuntimeDependencies`
- **中文** 当 `InMemoryContextEngine` 不带任何 `cache` 参数构造,并以相同输入两次调用 `projectGraph` 时,第二次必须仍通过私有 `Map` fallback 观察到 `cache.hit === true`,且不得要求 `RuntimeDependencies` 上已注册任何 `CacheManager`。

#### Scenario: Dependency fingerprint change invalidates cache / 依赖指纹变化使缓存失效

- **WHEN** an `InMemoryContextEngine` is constructed with an injected `CacheManager`, `projectGraph` is called once with candidates `C1` whose dependency fingerprints are `[d1,d2]`, and then called again with candidates `C1'` whose dependency fingerprints are `[d1,d2,d3]` (same request fingerprint otherwise)
- **THEN** the second call SHALL compute a different `projectionCacheKey`, the cache lookup SHALL miss, and the projection SHALL be recomputed and written back under the new key
- **中文** 当 `InMemoryContextEngine` 以注入的 `CacheManager` 构造,先以依赖指纹为 `[d1,d2]` 的 candidates `C1` 调用 `projectGraph`,再以依赖指纹为 `[d1,d2,d3]` 的 candidates `C1'` 调用(其余 request 指纹相同)时,第二次必须计算出不同的 `projectionCacheKey`,缓存必须 miss,projection 必须被重算并以新 key 写回。
