## ADDED Requirements

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
