## ADDED Requirements

### Requirement: Content-Addressed Context Block Store / 内容寻址上下文块存储

Memory/cache management SHALL provide cache records for immutable context blocks and pipeline manifests addressed by stable content hashes and dependency fingerprints.

Memory/cache management 必须为不可变 context blocks 与 pipeline manifests 提供 cache records，并通过稳定 content hashes 与 dependency fingerprints 寻址。

#### Scenario: Block cache hit returns immutable block / 块缓存命中返回不可变块

- **WHEN** a context block with an existing hash is requested
- **THEN** the cache returns the stored block metadata and content reference without mutating the block or changing its replay fingerprint
- **中文** 当请求已有 hash 的 context block 时，cache 必须返回存储的 block metadata 与 content reference，且不修改该 block 或改变其 replay fingerprint。

#### Scenario: Dependency change changes key / 依赖变化改变 Key

- **WHEN** a block's dependency fingerprints change
- **THEN** the block store computes a different content-addressed key and does not overwrite the previous block
- **中文** 当 block 的 dependency fingerprints 变化时，block store 必须计算不同的 content-addressed key，且不得覆盖旧 block。

### Requirement: Prefix Manifest Cache / 前缀 Manifest 缓存

Memory/cache management SHALL store pipeline manifests and prefix hashes so adjacent turns can compare cache stability and reuse stable blocks.

Memory/cache management 必须存储 pipeline manifests 与 prefix hashes，使相邻 turn 可以比较缓存稳定性并复用稳定 blocks。

#### Scenario: Adjacent manifest comparison / 相邻 Manifest 比较

- **WHEN** runtime finishes assembling a turn
- **THEN** the latest manifest can be persisted and later compared with the next turn by session id and pipeline fingerprint metadata
- **中文** 当 runtime 完成某 turn 的组装时，最新 manifest 必须可被持久化，并随后可通过 session id 与 pipeline fingerprint metadata 与下一 turn 比较。
