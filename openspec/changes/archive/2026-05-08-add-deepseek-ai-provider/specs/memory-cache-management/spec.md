## ADDED Requirements

### Requirement: Provider Cache Metadata Boundary

Model provider adapters SHALL expose provider cache hit/miss metadata as normalized usage/cache metadata and SHALL NOT persist durable memory or cache entries directly from provider responses.

model provider adapters 必须把 provider cache hit/miss metadata 暴露为 normalized usage/cache metadata，不得直接从 provider responses 持久化 durable memory 或 cache entries。

#### Scenario: DeepSeek cache metadata remains event data

- **WHEN** DeepSeek returns cache hit or miss token metadata
- **THEN** the provider emits normalized cache metadata in model events and leaves cache persistence decisions to platform cache governance

#### Scenario: Provider does not write memory

- **WHEN** provider code receives text, reasoning, tool call, or usage output
- **THEN** it does not write durable memory or disposable cache entries directly
