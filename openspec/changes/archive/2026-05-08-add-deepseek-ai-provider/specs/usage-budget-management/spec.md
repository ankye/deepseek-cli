## ADDED Requirements

### Requirement: Provider Usage Normalization

Model provider adapters SHALL report normalized usage metadata for input tokens, output tokens, reasoning tokens, cache hit tokens, cache miss tokens, provider name, model name, and provider request id when available.

model provider adapters 必须在可用时报告 normalized usage metadata，包括 input tokens、output tokens、reasoning tokens、cache hit tokens、cache miss tokens、provider name、model name 和 provider request id。

#### Scenario: DeepSeek usage is mapped

- **WHEN** DeepSeek returns prompt, completion, reasoning, and cache token usage
- **THEN** the model gateway emits a usage event that maps those fields to platform-neutral metadata without provider-shaped leakage

#### Scenario: Missing usage remains explicit

- **WHEN** a provider response completes without usage metadata
- **THEN** the model gateway emits completion events without inventing token counts and tests can assert the absence explicitly
