## ADDED Requirements

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
