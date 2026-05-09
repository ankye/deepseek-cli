# memory-cache-management Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Memory Scopes

The system SHALL define separate memory scopes for working memory, session memory, project memory, user memory, and semantic memory.

系统必须定义 working memory、session memory、project memory、user memory 和 semantic memory 等独立 memory scopes。

#### Scenario: Memory entry declares scope

- **WHEN** a memory entry is created
- **THEN** it declares scope, owner, provenance, redaction class, confidence, lifecycle, compatibility metadata, and invalidation rules

#### Scenario: Agent scope filters memory

- **WHEN** context projection requests memory
- **THEN** the memory manager filters memory entries by agent memory scope, policy, redaction class, and user/workspace configuration

### Requirement: Memory Provenance and Redaction

Memory entries SHALL preserve provenance and pass through redaction boundaries before persistence or replay.

memory entries 必须保留 provenance，并在持久化或 replay 前经过 redaction boundaries。

#### Scenario: Tool result memory is redacted

- **WHEN** a tool result is promoted to memory
- **THEN** the memory manager records source capability, session id, timestamp, confidence, and redacted content according to policy

#### Scenario: Sensitive memory is not projected

- **WHEN** memory is classified as unavailable for the current host or agent
- **THEN** it is excluded from context projection and the exclusion can be audited

### Requirement: Cache Namespaces

The system SHALL define cache namespaces for token counts, file snapshots, search indexes, model response fragments, tool results, extension manifests, platform availability, and protocol normalization.

系统必须定义 token counts、file snapshots、search indexes、model response fragments、tool results、extension manifests、platform availability 和 protocol normalization 的 cache namespaces。

#### Scenario: Cache entry includes invalidation metadata

- **WHEN** a cache entry is stored
- **THEN** it includes namespace, key, source version, dependency fingerprints, TTL or invalidation rule, redaction class, and compatibility metadata

#### Scenario: File snapshot invalidates derived caches

- **WHEN** a file snapshot changes
- **THEN** dependent search index, context projection, token count, and tool-result caches can be invalidated

### Requirement: Memory and Cache Separation

The system SHALL keep durable memory and disposable cache as separate contracts and storage paths.

系统必须将 durable memory 和 disposable cache 保持为独立 contracts 和 storage paths。

#### Scenario: Cache eviction does not delete memory

- **WHEN** cache entries are evicted due to TTL, size, or invalidation
- **THEN** durable memory entries are not removed unless a memory policy explicitly removes them

### Requirement: Deterministic Memory and Cache Tests

The framework SHALL include deterministic tests for memory scope isolation, cache invalidation, redaction, provenance, and cache hit behavior.

框架必须包含 memory scope isolation、cache invalidation、redaction、provenance 和 cache hit behavior 的确定性测试。

#### Scenario: Cache hit is deterministic

- **WHEN** the same cacheable request is executed with unchanged dependency fingerprints
- **THEN** the cache manager returns the same cached result and emits cache-hit metadata

### Requirement: Provider Cache Metadata Boundary

Model provider adapters SHALL expose provider cache hit/miss metadata as normalized usage/cache metadata and SHALL NOT persist durable memory or cache entries directly from provider responses.

model provider adapters 必须把 provider cache hit/miss metadata 暴露为 normalized usage/cache metadata，不得直接从 provider responses 持久化 durable memory 或 cache entries。

#### Scenario: DeepSeek cache metadata remains event data

- **WHEN** DeepSeek returns cache hit or miss token metadata
- **THEN** the provider emits normalized cache metadata in model events and leaves cache persistence decisions to platform cache governance

#### Scenario: Provider does not write memory

- **WHEN** provider code receives text, reasoning, tool call, or usage output
- **THEN** it does not write durable memory or disposable cache entries directly

### Requirement: Projection Cache Namespace / Projection Cache 命名空间

The cache system SHALL define a disposable projection cache namespace keyed by projection request fingerprint and dependency fingerprints.

cache system 必须定义 disposable projection cache namespace，并通过 projection request fingerprint 与 dependency fingerprints 建立 key。

#### Scenario: Cache hit preserves evidence / Cache hit 保留证据

- **WHEN** a projection request and its dependencies are unchanged
- **THEN** the cache may return a projection result with cache-hit metadata and replayable provenance
- **中文** 当 projection request 及其 dependencies 未变化时，cache 可以返回带 cache-hit metadata 和 replayable provenance 的 projection result。

#### Scenario: Dependency change invalidates projection / Dependency 变化使 projection 失效

- **WHEN** a file snapshot, session event, memory reference, policy version, model target, or budget input changes
- **THEN** dependent projection cache entries are invalidated before reuse
- **中文** 当 file snapshot、session event、memory reference、policy version、model target 或 budget input 变化时，dependent projection cache entries 必须在复用前失效。

### Requirement: Memory References Remain Bounded / Memory References 保持有界

Memory entries SHALL enter projection as scoped memory references or redacted slices, not as unmanaged durable memory state.

memory entries 必须以 scoped memory references 或 redacted slices 进入 projection，而不是以 unmanaged durable memory state 进入。

#### Scenario: Memory provider unavailable degrades projection / Memory provider 不可用时降级

- **WHEN** memory retrieval is unavailable or outside scope
- **THEN** projection degrades with structured metadata instead of failing the whole turn by default
- **中文** 当 memory retrieval 不可用或超出 scope 时，projection 必须用 structured metadata 降级，而不是默认让整个 turn 失败。
