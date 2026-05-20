## ADDED Requirements

### Requirement: Context Pipeline DTOs / 上下文管道 DTO

`@deepseek/platform-contracts` SHALL define provider-neutral serializable DTOs for context blocks, pipeline layers, prefix hashes, cache hints, pipeline manifests, pipeline exclusions, and cache evidence.

`@deepseek/platform-contracts` 必须定义 provider-neutral、可序列化的 DTO，覆盖 context blocks、pipeline layers、prefix hashes、cache hints、pipeline manifests、pipeline exclusions 与 cache evidence。

#### Scenario: DTOs are host-neutral / DTO 与 Host 无关

- **WHEN** CLI, runtime, tests, or future hosts exchange pipeline metadata
- **THEN** the DTOs do not import CLI, VSCode, Node filesystem/process APIs, provider SDKs, or implementation packages
- **中文** 当 CLI、runtime、tests 或未来 host 交换 pipeline metadata 时，DTO 不得导入 CLI、VSCode、Node filesystem/process APIs、provider SDKs 或 implementation packages。

#### Scenario: DTOs preserve compatibility / DTO 保留兼容性

- **WHEN** a pipeline manifest is emitted
- **THEN** it includes schema version, compatibility metadata, redaction metadata, and stable ids for blocks, layers, and prefix hashes
- **中文** 当 pipeline manifest 被发出时，必须包含 schema version、compatibility metadata、redaction metadata，以及 blocks、layers 与 prefix hashes 的稳定 ids。

### Requirement: Provider-Neutral Cache Hints / Provider-Neutral 缓存提示

Platform contracts SHALL model cache hints without depending on a provider-specific request field.

平台契约必须以不依赖 provider-specific request field 的方式建模 cache hints。

#### Scenario: Cache hint is declarative / 缓存提示是声明式

- **WHEN** a context block is marked stable, ephemeral, no-store, or TTL-bound
- **THEN** the hint is represented as provider-neutral metadata that model-gateway may map only when provider capability metadata allows it
- **中文** 当 context block 被标记为 stable、ephemeral、no-store 或 TTL-bound 时，该 hint 必须表示为 provider-neutral metadata，只有在 provider capability metadata 允许时 model-gateway 才能映射它。
