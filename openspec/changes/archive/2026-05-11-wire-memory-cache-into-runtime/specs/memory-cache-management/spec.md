## ADDED Requirements

### Requirement: Projection Cache Key Authority / 投影缓存键唯一权威

The `@deepseek/memory-cache-management` package SHALL be the single authoritative definition of the projection cache namespace (`PROJECTION_CACHE_NAMESPACE = "context.projection"`), the projection cache key function `projectionCacheKey(input: ProjectionCacheInput): CacheKey`, and the projection cache entry factory `createProjectionCacheEntry(input, value, createdAt)`. The key function SHALL hash `input.requestFingerprint` together with a stable-sorted copy of `input.dependencyFingerprints`, so that identical inputs produce identical keys regardless of the insertion order of dependency fingerprints. No other package in the workspace SHALL re-declare the namespace string, the key function, or the entry factory.

`@deepseek/memory-cache-management` 包必须作为投影缓存命名空间(`PROJECTION_CACHE_NAMESPACE = "context.projection"`)、投影缓存键函数 `projectionCacheKey(input: ProjectionCacheInput): CacheKey` 与投影缓存条目工厂 `createProjectionCacheEntry(input, value, createdAt)` 的唯一权威定义。键函数必须将 `input.requestFingerprint` 与 `input.dependencyFingerprints` 的稳定排序副本一起哈希,使相同输入无论 dependency fingerprints 以何种顺序写入都产出相同 key。workspace 中其他包不得重新声明该命名空间字符串、键函数或条目工厂。

#### Scenario: projectionCacheKey is stable under dependency reordering / dependency 顺序重排不改 key

- **WHEN** `projectionCacheKey` is called twice with the same `requestFingerprint` and the same multiset of `dependencyFingerprints` but in different orderings
- **THEN** both calls SHALL return the exact same `CacheKey` string
- **中文** 当 `projectionCacheKey` 以相同的 `requestFingerprint` 和相同多重集合但不同顺序的 `dependencyFingerprints` 调用两次时,两次调用必须返回完全相同的 `CacheKey` 字符串。

#### Scenario: projectionCacheKey differs when request fingerprint differs / 请求指纹变化改 key

- **WHEN** `projectionCacheKey` is called with two inputs that share identical `dependencyFingerprints` but differ in `requestFingerprint`
- **THEN** the two returned keys SHALL be distinct
- **中文** 当 `projectionCacheKey` 被以相同 `dependencyFingerprints` 但不同 `requestFingerprint` 的两个输入调用时,返回的两个 key 必须不同。

#### Scenario: No duplicate declaration in workspace / workspace 不得重复声明

- **WHEN** the repository is scanned for exports named `projectionCacheKey` or `PROJECTION_CACHE_NAMESPACE`
- **THEN** only `@deepseek/memory-cache-management` SHALL export them; any other package that needs the key or namespace SHALL import from `@deepseek/memory-cache-management`
- **中文** 当仓库被扫描 `projectionCacheKey` 或 `PROJECTION_CACHE_NAMESPACE` 的导出时,只有 `@deepseek/memory-cache-management` 可导出;其他包若需使用 key 或 namespace,必须从 `@deepseek/memory-cache-management` 导入。

### Requirement: `InMemoryCacheManager.set` Idempotent Overwrite / InMemoryCacheManager.set 幂等覆盖

`InMemoryCacheManager.set(entry)` SHALL overwrite any pre-existing entry that shares the same `key` with the new entry's `value`, `createdAt`, and `invalidation` without throwing or requiring an explicit delete, so consumers can refresh a projection cache slot by calling `set` again with the same key. The subsequent `get(key)` SHALL return the latest set's value and invalidation, never a stale pre-overwrite snapshot.

`InMemoryCacheManager.set(entry)` 必须以新 entry 的 `value`、`createdAt`、`invalidation` 覆盖任何已存在且共享相同 `key` 的条目,不得抛错或要求先显式删除,使消费者能通过再次 `set` 同一 key 刷新投影缓存槽。随后 `get(key)` 必须返回最新 set 的 value 与 invalidation,不得返回覆盖前的陈旧快照。

#### Scenario: set with existing key overwrites in-place / 同 key set 原地覆盖

- **WHEN** `set` is called for `key=K` with `value=V1`, then called again for `key=K` with `value=V2`
- **THEN** `get(K)` SHALL return `V2`
- **中文** 当 `set` 先以 `key=K`、`value=V1` 调用,再以 `key=K`、`value=V2` 调用时,`get(K)` 必须返回 `V2`。

#### Scenario: set overwrite preserves invalidation from latest call / 覆盖保留最新 invalidation

- **WHEN** `set` is called twice for the same key with different `invalidation` objects
- **THEN** the subsequent `get(key)` SHALL expose the invalidation from the latest `set` call
- **中文** 当 `set` 对同一 key 以不同 `invalidation` 对象调用两次时,后续 `get(key)` 必须暴露最新一次 `set` 的 invalidation。

### Requirement: `InMemoryCacheManager.get` Returns Frozen Entry / get 返回冻结条目

`InMemoryCacheManager.get<T>(key)` SHALL return either `undefined` when the key is absent, or a shallowly frozen `CacheEntry<T>` whose top-level object and whose `invalidation` array have been passed through `Object.freeze`, so downstream consumers cannot mutate cached state through the returned reference. Freezing SHALL NOT be applied recursively to `value`, since `T` is opaque to the cache manager.

`InMemoryCacheManager.get<T>(key)` 必须在 key 不存在时返回 `undefined`,或返回一个浅冻结的 `CacheEntry<T>`,其顶层对象与 `invalidation` 数组都已经过 `Object.freeze`,使下游消费者无法通过返回引用修改缓存状态。冻结不得递归作用于 `value`,因为 `T` 对 cache manager 不透明。

#### Scenario: get returns frozen entry / get 返回值被冻结

- **WHEN** `get(key)` returns a defined `CacheEntry`
- **THEN** `Object.isFrozen(entry) === true` and `Object.isFrozen(entry.invalidation) === true`
- **中文** 当 `get(key)` 返回已定义 `CacheEntry` 时,必须满足 `Object.isFrozen(entry) === true` 且 `Object.isFrozen(entry.invalidation) === true`。

#### Scenario: get returns undefined for missing key / 缺失 key 返回 undefined

- **WHEN** `get(key)` is called with a key that was never set or has been invalidated
- **THEN** the method SHALL return `undefined`
- **中文** 当 `get(key)` 以从未 set 过或已 invalidate 的 key 调用时,该方法必须返回 `undefined`。

### Requirement: `InMemoryMemoryManager.query` Deterministic Insertion Order / InMemoryMemoryManager.query 按插入顺序

`InMemoryMemoryManager.query(scope)` SHALL return the matching records in the same order they were `put` into the manager (first-in first-out per matching scope), so that agents and tests observing memory state can assert a deterministic sequence from the physical `put` order. Because `MemoryEntry` carries no timestamp field, the manager SHALL NOT attempt to sort by any derived timestamp; insertion order is the sole ordering contract.

`InMemoryMemoryManager.query(scope)` 必须按各条记录被 `put` 进管理器的顺序返回匹配记录(对匹配 scope 做先入先出),使观察 memory 状态的 agent 与测试能从物理 `put` 顺序断言确定序列。由于 `MemoryEntry` 不携带时间戳字段,管理器不得尝试按任何派生时间戳排序;插入顺序是唯一的排序契约。

#### Scenario: query preserves put order within matching scope / query 保留同 scope 的 put 顺序

- **WHEN** three records `A`, `B`, `C` with the same `scope` are put in order `A`, `B`, `C`, and `query(scope)` is called
- **THEN** the returned array SHALL be `[A, B, C]`
- **中文** 当三条同 `scope` 记录 `A`、`B`、`C` 按 `A`、`B`、`C` 顺序 put,并调用 `query(scope)` 时,返回数组必须为 `[A, B, C]`。

#### Scenario: query filters out other scopes without reordering / query 过滤其他 scope 且不乱序

- **WHEN** records `A(scope=s1)`, `X(scope=s2)`, `B(scope=s1)` are put in that order and `query(s1)` is called
- **THEN** the returned array SHALL be `[A, B]` in that order, with `X` absent
- **中文** 当记录 `A(scope=s1)`、`X(scope=s2)`、`B(scope=s1)` 按该顺序 put,并调用 `query(s1)` 时,返回数组必须为 `[A, B]`,`X` 必须不出现。
