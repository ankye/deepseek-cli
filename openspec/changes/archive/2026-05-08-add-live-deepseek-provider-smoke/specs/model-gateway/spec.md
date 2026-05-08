## ADDED Requirements

### Requirement: OpenAI SDK DeepSeek Live Transport / OpenAI SDK DeepSeek Live Transport

The model gateway SHALL provide an OpenAI SDK-backed transport that executes provider-neutral DeepSeek OpenAI-like chat completion requests and converts SDK completion objects or stream chunks into `ModelProviderResponseChunk` values.

model gateway 必须提供基于 OpenAI SDK 的 transport，用于执行 provider-neutral DeepSeek OpenAI-like chat completion requests，并把 SDK completion objects 或 stream chunks 转换为 `ModelProviderResponseChunk` values。

#### Scenario: Transport uses DeepSeek base URL / Transport 使用 DeepSeek base URL

- **WHEN** the live transport receives a provider-neutral request for `https://api.deepseek.com/chat/completions`
- **THEN** it configures the OpenAI SDK with DeepSeek base URL and API key derived from the injected credential header
- **中文** 当 live transport 收到指向 `https://api.deepseek.com/chat/completions` 的 provider-neutral request 时，它必须用 DeepSeek base URL 和来自注入 credential header 的 API key 配置 OpenAI SDK。

#### Scenario: SDK output remains provider-neutral / SDK 输出保持 provider-neutral

- **WHEN** the OpenAI SDK returns a non-stream completion or stream chunks
- **THEN** the transport yields `ModelProviderResponseChunk` values without exposing OpenAI SDK types beyond the model-gateway package boundary
- **中文** 当 OpenAI SDK 返回 non-stream completion 或 stream chunks 时，transport 必须 yield `ModelProviderResponseChunk` values，且不得在 model-gateway package boundary 之外暴露 OpenAI SDK types。

#### Scenario: Transport fails with redacted error / Transport 以脱敏错误失败

- **WHEN** the SDK request fails
- **THEN** the transport throws an error that does not include authorization headers or raw credentials
- **中文** 当 SDK request 失败时，transport 抛出的错误不得包含 authorization headers 或 raw credentials。
