# context-engine Specification

## Purpose
Define how DeepSeek gathers, normalizes, budgets, redacts, and projects runtime context for model requests and host/runtime evidence.

定义 DeepSeek 如何为模型请求以及 host/runtime evidence 收集、规范化、预算、脱敏并投影 runtime context。
## Requirements
### Requirement: Context Graph Nodes

The system SHALL represent runtime context as context nodes with id, type, source, priority, lifecycle, visibility, token estimate, redaction policy, and dependency metadata.

#### Scenario: Add user message context node

- **WHEN** the runtime receives a user input
- **THEN** the context engine stores it as a context node with user-message metadata

### Requirement: Context Projection

The context engine SHALL project context nodes into a model request context according to purpose, model, and budget constraints.

context engine 必须根据 purpose、model 和 budget constraints 将 context nodes 投影为 model request context。

#### Scenario: Project context for model request

- **WHEN** the runtime prepares a model request
- **THEN** the context engine returns an ordered projection of context nodes for that request

### Requirement: Context Lifecycle

The context engine SHALL distinguish turn, session, project, and global lifecycle scopes for context nodes.

context engine 必须区分 context nodes 的 turn、session、project 和 global lifecycle scopes。

#### Scenario: Preserve session context

- **WHEN** a new turn begins in the same session
- **THEN** session-lifecycle context remains eligible for projection

### Requirement: Future Compaction Boundary

The context engine SHALL expose extension points for compaction, retrieval, and rehydration without requiring runtime loop changes.

context engine 必须暴露 compaction、retrieval 和 rehydration 扩展点，且不要求修改 runtime loop。

#### Scenario: Add compaction strategy later

- **WHEN** a compaction strategy is registered in a future change
- **THEN** it can operate through the context engine projection boundary

### Requirement: Memory Reference Nodes

The context engine SHALL represent selected memory entries as context nodes or memory references with provenance and redaction metadata.

context engine 必须将被选中的 memory entries 表示为带 provenance 和 redaction metadata 的 context nodes 或 memory references。

#### Scenario: Project memory reference

- **WHEN** memory manager returns eligible memory for a turn
- **THEN** context projection can include memory reference nodes without copying unmanaged memory state into prompt assembly

### Requirement: Concrete Projection Engine Contract / 具体 Projection Engine 契约

The context engine SHALL expose concrete ContextGraph projection contracts for candidate collection, eligibility filtering, ordering, budget fitting, and projection result creation.

context engine 必须为 candidate collection、eligibility filtering、ordering、budget fitting 和 projection result creation 暴露具体 ContextGraph projection contracts。

#### Scenario: Projection engine accepts typed request / Projection engine 接受类型化请求

- **WHEN** runtime asks for model context
- **THEN** the context engine accepts a typed projection request and returns a serializable projection result
- **中文** 当 runtime 请求 model context 时，context engine 必须接受 typed projection request 并返回 serializable projection result。

### Requirement: Context Node Metadata Completeness / Context Node 元数据完整

Context nodes SHALL include enough metadata for deterministic projection without inspecting host UI state or implementation objects.

context nodes 必须包含足够 metadata，以便在不检查 host UI state 或 implementation objects 的情况下进行 deterministic projection。

#### Scenario: Node metadata drives selection / 节点元数据驱动选择

- **WHEN** the projection engine evaluates a node
- **THEN** it uses node id, type, source, lifecycle, scope, priority, token estimate, content reference, redaction class, provenance, dependency fingerprints, and compatibility metadata
- **中文** 当 projection engine 评估节点时，必须使用 node id、type、source、lifecycle、scope、priority、token estimate、content reference、redaction class、provenance、dependency fingerprints 和 compatibility metadata。

### Requirement: Projection Output Does Not Expose Raw Internals / Projection 输出不暴露原始内部状态

The context engine SHALL return normalized projection slices and references instead of implementation-owned mutable state.

context engine 必须返回 normalized projection slices 与 references，而不是实现拥有的 mutable state。

#### Scenario: Result is immutable to callers / 结果对调用方不可变

- **WHEN** runtime or tests receive a projection result
- **THEN** they cannot mutate context engine internal node state through the returned object
- **中文** 当 runtime 或 tests 收到 projection result 时，不得通过返回对象修改 context engine 内部 node state。

### Requirement: Code Intelligence Node Consumption / 代码智能节点消费

Context projection SHALL accept code-intelligence context graph nodes and apply the same budget, ordering, redaction, cache, and exclusion rules as other context nodes.

context projection 必须接受 code-intelligence context graph nodes，并对其应用与其他 context nodes 相同的 budget、ordering、redaction、cache 和 exclusion rules。

#### Scenario: Diagnostic nodes project under budget / diagnostic node 在预算内投影

- **WHEN** candidate context includes code-intelligence diagnostic nodes within budget
- **THEN** projection may select them using normal priority and redaction rules
- **中文** 当 candidate context 包含预算内的 code-intelligence diagnostic nodes 时，projection 可以使用普通 priority 与 redaction rules 选择它们。

### Requirement: Skill Context Projection / Skill 上下文投影

The context engine SHALL accept governed skill context segments as regular context evidence with source, provenance, compatibility, budget, and redaction metadata.

context engine 必须接受受治理的 skill context segments，把它们作为普通 context evidence，并带有 source、provenance、compatibility、budget 和 redaction metadata。

#### Scenario: Trusted skill segment enters projection / trusted skill segment 进入投影

- **WHEN** a trusted context-only skill produces bounded instruction or example segments for a session
- **THEN** the context engine can project those segments alongside file, memory, diagnostic, and tool evidence without a separate prompt injection path
- **中文** 当 trusted context-only skill 为某个 session 产生有界 instruction 或 example segments 时，context engine 可以将这些 segments 与 file、memory、diagnostic 和 tool evidence 一起投影，不新增独立 prompt injection path。

#### Scenario: Untrusted skill segment is excluded / untrusted skill segment 被排除

- **WHEN** an untrusted or disabled skill attempts to contribute context
- **THEN** the projection excludes the segment and records redacted exclusion metadata
- **中文** 当 untrusted 或 disabled skill 尝试贡献 context 时，projection 必须排除该 segment，并记录脱敏 exclusion metadata。

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

### Requirement: Chat Reference Candidate Projection / Chat 引用候选投影

The context engine SHALL project runtime-supplied chat reference candidates with the same eligibility, budget, redaction, cache, and replay rules as other context graph nodes.

Context engine 必须用与其他 context graph nodes 相同的 eligibility、budget、redaction、cache 与 replay 规则投影 runtime-supplied chat reference candidates。

#### Scenario: File reference candidate is selected / 文件引用候选被选中

- **WHEN** runtime submits a file reference candidate whose content is within policy and budget
- **THEN** context projection may select it as a `file` node with provenance, dependency fingerprints, redaction metadata, and deterministic ordering
- **中文** 当 runtime 提交内容符合 policy 与 budget 的 file reference candidate 时，context projection 可以将其作为带 provenance、dependency fingerprints、redaction metadata 与 deterministic ordering 的 `file` node 选中。

#### Scenario: Unsafe reference candidate is excluded / 不安全引用候选被排除

- **WHEN** a chat reference candidate contains secret-like content, has unavailable redaction class, is outside scope, or exceeds budget
- **THEN** context projection excludes it with a structured reason and without exposing raw content in externally visible events
- **中文** 当 chat reference candidate 包含疑似 secret content、redaction class 不可用、超出 scope 或超过 budget 时，context projection 必须用 structured reason 排除它，且不得在 externally visible events 中暴露 raw content。

### Requirement: Runtime Memory Candidate Projection / Runtime 记忆候选投影

The context engine SHALL project runtime-supplied memory candidates with the same eligibility, ordering, budget, redaction, cache, and replay rules as other context graph nodes.

Context engine 必须用与其他 context graph nodes 相同的 eligibility、ordering、budget、redaction、cache 与 replay rules 投影 runtime-supplied memory candidates。

#### Scenario: Scoped memory is selected under budget / 作用域记忆在预算内被选中

- **WHEN** runtime submits working, session, or project memory candidates whose redaction class and scope are eligible for the turn
- **THEN** context projection may select them as `memory-ref` nodes with provenance, dependency fingerprints, deterministic priority, and redaction metadata
- **中文** 当 runtime 提交 working、session 或 project memory candidates，且其 redaction class 与 scope 对当前回合 eligible 时，context projection 可以将其作为带 provenance、dependency fingerprints、deterministic priority 与 redaction metadata 的 `memory-ref` nodes 选中。

#### Scenario: Memory provider degradation is structured / 记忆提供者降级结构化

- **WHEN** memory retrieval is unavailable, out of scope, or redaction-ineligible
- **THEN** context projection records structured exclusion or degradation metadata without failing model dispatch by default
- **中文** 当 memory retrieval 不可用、超出 scope 或 redaction-ineligible 时，context projection 必须记录结构化 exclusion 或 degradation metadata，默认不得让 model dispatch 失败。

### Requirement: Code References And Definitions Projection / 代码引用与定义投影

The context engine SHALL accept code-intelligence reference and definition candidates as regular context evidence with bounded content, provenance, redaction metadata, and deterministic dependency fingerprints.

Context engine 必须接受 code-intelligence reference 与 definition candidates，并把它们作为带 bounded content、provenance、redaction metadata 与 deterministic dependency fingerprints 的普通 context evidence。

#### Scenario: References project as language-aware evidence / 引用作为语言感知证据投影

- **WHEN** code intelligence provides references or definitions related to the turn
- **THEN** projection may select them using the same budget and ordering rules as diagnostics, symbols, files, memory, and PageIndex recall
- **中文** 当 code intelligence 为当前回合提供 references 或 definitions 时，projection 可以用与 diagnostics、symbols、files、memory 和 PageIndex recall 相同的 budget 与 ordering rules 选择它们。

#### Scenario: Reference lookup fallback is non-fatal / 引用查找失败不致命

- **WHEN** references or definitions cannot be resolved
- **THEN** projection emits degraded evidence or exclusions and continues with other context candidates
- **中文** 当 references 或 definitions 无法解析时，projection 必须发出 degraded evidence 或 exclusions，并继续处理其他 context candidates。
