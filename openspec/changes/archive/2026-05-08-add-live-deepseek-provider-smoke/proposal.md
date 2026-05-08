## Why

DeepSeek provider integration currently has deterministic fake and fixture coverage, but it does not prove that the real DeepSeek OpenAI-like API can stream through the model gateway without leaking credentials.

DeepSeek provider integration 当前已有 deterministic fake 和 fixture 覆盖，但还没有证明真实 DeepSeek OpenAI-like API 能通过 model gateway streaming，且不会泄漏凭证。

This change adds an explicit opt-in live smoke path for R0/R1 validation while keeping default test and CI paths deterministic, offline, and free of provider cost.

本变更增加显式 opt-in live smoke 路径，用于 R0/R1 验证，同时保持默认测试和 CI 路径 deterministic、offline 且不产生 provider cost。

## What Changes

- Add a live DeepSeek provider smoke command that is disabled unless `DEEPSEEK_LIVE_TESTS=1` is set.
- 增加 live DeepSeek provider smoke command，只有设置 `DEEPSEEK_LIVE_TESTS=1` 时才启用。
- Load the API key from `.env` or process environment without printing, persisting, or serializing the raw secret.
- 从 `.env` 或 process environment 读取 API key，不打印、不持久化、不序列化 raw secret。
- Add an OpenAI SDK-backed transport for DeepSeek's OpenAI-like `/chat/completions` API, while retaining low-level fetch/SSE coverage for parser behavior.
- 增加基于 OpenAI SDK 的 transport，用于 DeepSeek 的 OpenAI-like `/chat/completions` API，同时保留低层 fetch/SSE 覆盖来验证 parser behavior。
- Verify text streaming, usage/finish/done event normalization, provider metadata, and secret redaction behavior.
- 验证 text streaming、usage/finish/done event normalization、provider metadata 和 secret redaction behavior。
- Keep live tests out of default `npm test`; expose a dedicated script for manual or gated CI use.
- live tests 不进入默认 `npm test`；提供专用 script 供手动或 gated CI 使用。

## Capabilities

### New Capabilities / 新增能力

- `live-provider-smoke`: Opt-in live provider smoke tests, secret-safe `.env` loading, live transport validation, and redacted event output.
- `live-provider-smoke`: 显式 opt-in 的 live provider smoke tests、安全 `.env` 加载、live transport validation 和脱敏事件输出。

### Modified Capabilities / 修改能力

- `model-gateway`: Add an opt-in live DeepSeek OpenAI-like transport smoke path without changing default deterministic provider behavior.
- `model-gateway`: 增加 opt-in live DeepSeek OpenAI-like transport smoke 路径，不改变默认 deterministic provider behavior。
- `credential-auth-management`: Require live smoke credentials to resolve as scoped secret references and never appear in output, traces, or thrown errors.
- `credential-auth-management`: 要求 live smoke credentials 作为 scoped secret references 解析，且不得出现在 output、traces 或 thrown errors 中。
- `testing-regression`: Add optional live-provider test gating and evidence expectations while preserving offline default tests.
- `testing-regression`: 增加 optional live-provider test gating 和 evidence expectations，同时保持默认 tests offline。

## Impact

- Affects `src/packages/model-gateway`, `tests/live`, package scripts, and OpenSpec artifacts.
- 影响 `src/packages/model-gateway`、`tests/live`、package scripts 和 OpenSpec artifacts。
- Adds the `openai` dependency to `@deepseek/model-gateway` as an implementation detail for the live DeepSeek transport.
- 向 `@deepseek/model-gateway` 增加 `openai` dependency，作为 live DeepSeek transport 的实现细节。
- Requires network access and a DeepSeek API key only when the dedicated live smoke script is invoked with `DEEPSEEK_LIVE_TESTS=1`.
- 只有在使用 `DEEPSEEK_LIVE_TESTS=1` 调用专用 live smoke script 时，才需要网络访问和 DeepSeek API key。
- Does not change default `npm test`, deterministic fakes, golden tests, or provider-neutral runtime contracts.
- 不改变默认 `npm test`、deterministic fakes、golden tests 或 provider-neutral runtime contracts。
