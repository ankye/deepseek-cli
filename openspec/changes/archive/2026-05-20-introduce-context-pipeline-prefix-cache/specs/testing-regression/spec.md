## ADDED Requirements

### Requirement: Prefix Stability Regression Coverage / 前缀稳定性回归覆盖

The regression suite SHALL cover deterministic prefix stability, cache opportunity preservation, cache opportunity loss, compaction, and replay for context pipeline manifests.

回归套件必须覆盖 context pipeline manifests 的确定性 prefix stability、cache opportunity preservation、cache opportunity loss、compaction 与 replay。

#### Scenario: Stable layers produce same prefix hash / 稳定层产生相同 Prefix Hash

- **WHEN** two deterministic turns differ only in current user input
- **THEN** regression tests assert that kernel and project prefix hashes remain unchanged and current-turn hashes differ
- **中文** 当两个确定性 turn 仅当前用户输入不同，回归测试必须断言 kernel 与 project prefix hashes 保持不变，current-turn hashes 发生变化。

#### Scenario: Project change invalidates project prefix / 项目变化使 Project Prefix 失效

- **WHEN** a project rule, package map, or project memory block changes
- **THEN** regression tests assert that project prefix hash changes while kernel prefix hash remains unchanged
- **中文** 当 project rule、package map 或 project memory block 变化时，回归测试必须断言 project prefix hash 变化，而 kernel prefix hash 保持不变。

### Requirement: Pipeline Backpressure Fixtures / 管道 Backpressure Fixtures

The regression suite SHALL include fixtures for bounded context streams and backpressure behavior.

回归套件必须包含有界 context streams 与 backpressure 行为的 fixtures。

#### Scenario: Oversized tool result is summarized / 超大工具结果被摘要

- **WHEN** a fixture tool result exceeds the stable session-layer threshold
- **THEN** tests assert that only bounded summary/reference blocks enter the session layer and raw content remains out of stable prefix evidence
- **中文** 当 fixture tool result 超过稳定 session-layer 阈值时，测试必须断言只有有界 summary/reference blocks 进入 session layer，raw content 不进入稳定 prefix evidence。

### Requirement: Provider Cache Metrics Fixtures / Provider 缓存指标 Fixtures

The regression suite SHALL cover provider cache metric normalization without requiring live provider access by default.

回归套件必须覆盖 provider cache metric normalization，默认不需要 live provider access。

#### Scenario: Mock provider returns cache usage / Mock Provider 返回缓存用量

- **WHEN** a deterministic provider fixture returns cache hit and miss token counts
- **THEN** tests assert that model-gateway records normalized cache usage and attaches it to the pipeline fingerprint
- **中文** 当确定性 provider fixture 返回 cache hit 与 miss token counts 时，测试必须断言 model-gateway 记录 normalized cache usage，并将其绑定到 pipeline fingerprint。
