## ADDED Requirements

### Requirement: Provider-Neutral Cache Hint Projection / Provider-Neutral 缓存提示投影

The model gateway SHALL accept provider-neutral cache hints from prompt assembly and translate them into provider-specific request metadata only when the selected provider declares support.

Model gateway 必须接受来自 prompt assembly 的 provider-neutral cache hints，并且只有当选中 provider 声明支持时，才将其转换为 provider-specific request metadata。

#### Scenario: Supported provider receives cache metadata / 支持的 Provider 接收缓存 Metadata

- **WHEN** the selected provider capability metadata declares explicit prefix cache hint support
- **THEN** the provider adapter may serialize stable or ephemeral cache hints according to that provider's wire contract without exposing provider-specific fields to runtime callers
- **中文** 当选中 provider capability metadata 声明显式支持 prefix cache hint 时，provider adapter 可以按该 provider 的 wire contract 序列化 stable 或 ephemeral cache hints，且不得向 runtime callers 暴露 provider-specific fields。

#### Scenario: Unsupported provider ignores hints safely / 不支持的 Provider 安全忽略提示

- **WHEN** the selected provider does not support explicit cache hints
- **THEN** the model gateway omits provider-specific cache-control fields while preserving stable message ordering and recording a diagnostic that hints were not projected
- **中文** 当选中 provider 不支持显式 cache hints 时，model gateway 必须省略 provider-specific cache-control fields，同时保持稳定 message ordering，并记录 hints 未被投影的 diagnostic。

### Requirement: Cache Usage Normalization With Prefix Evidence / 带前缀证据的缓存用量归一化

The model gateway SHALL normalize provider cache hit/miss token metrics and attach them to request prefix evidence when available.

Model gateway 必须归一化 provider cache hit/miss token metrics，并在可用时将其绑定到 request prefix evidence。

#### Scenario: Usage includes hit and miss tokens / Usage 包含命中和未命中 Tokens

- **WHEN** a provider response includes prompt cache hit or miss token counts
- **THEN** the gateway emits normalized usage metadata with hit tokens, miss tokens, provider source, and the request pipeline fingerprint
- **中文** 当 provider response 包含 prompt cache hit 或 miss token counts 时，gateway 必须输出 normalized usage metadata，包含 hit tokens、miss tokens、provider source 与 request pipeline fingerprint。

#### Scenario: Cache metric absence is explicit / 缓存指标缺失显式化

- **WHEN** the provider does not return cache usage metrics
- **THEN** the gateway records cache metric status as unavailable rather than fabricating hit or miss counts
- **中文** 当 provider 未返回 cache usage metrics 时，gateway 必须将 cache metric status 记录为 unavailable，而不得伪造 hit 或 miss counts。
