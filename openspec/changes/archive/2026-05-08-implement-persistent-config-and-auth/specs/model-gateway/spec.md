## ADDED Requirements

### Requirement: Live Connectivity Verification / Live 连接验证

The model gateway SHALL provide a provider-neutral live connectivity verification operation for DeepSeek that uses injected credential resolution, configured model profile metadata, and redacted structural assertions.

model gateway 必须为 DeepSeek 提供 provider-neutral live connectivity verification operation，使用 injected credential resolution、configured model profile metadata 和 redacted structural assertions。

#### Scenario: Live verification uses configured profile / live verification 使用配置 profile

- **WHEN** readiness requests live DeepSeek verification
- **THEN** model-gateway builds the request from resolved config profile metadata, injected credential reference, provider capability metadata, and explicit live-check options
- **中文** 当 readiness 请求 DeepSeek live verification 时，model-gateway 必须从 resolved config profile metadata、injected credential reference、provider capability metadata 和显式 live-check options 构建请求。

#### Scenario: Live verification returns structural evidence / live verification 返回结构化证据

- **WHEN** the DeepSeek provider responds to a live verification request
- **THEN** model-gateway returns provider reachability, model id, event structure, token usage when available, terminal status, latency metadata, and redacted diagnostics without snapshotting exact generated text
- **中文** 当 DeepSeek provider 响应 live verification request 时，model-gateway 必须返回 provider reachability、model id、event structure、可用时的 token usage、terminal status、latency metadata 和 redacted diagnostics，且不 snapshot 精确生成文本。

### Requirement: Live Verification Failure Semantics / Live 验证失败语义

The model gateway SHALL fail live verification with typed, redacted errors for missing credentials, unsupported model capabilities, provider errors, network failures, rate limits, and account or quota failures.

model gateway 必须针对 missing credentials、unsupported model capabilities、provider errors、network failures、rate limits 以及 account 或 quota failures，以 typed、redacted errors 失败 live verification。

#### Scenario: Missing credential is typed / 缺少凭证是类型化错误

- **WHEN** live verification runs without a resolvable DeepSeek credential reference
- **THEN** model-gateway returns a missing-credential error with suggested actions and no provider request is sent
- **中文** 当 live verification 在没有可解析 DeepSeek credential reference 的情况下运行时，model-gateway 必须返回 missing-credential error 和 suggested actions，且不得发送 provider request。

#### Scenario: Provider error is redacted / provider 错误被脱敏

- **WHEN** the DeepSeek provider or OpenAI SDK transport fails during live verification
- **THEN** model-gateway returns a redacted diagnostic that excludes authorization headers, raw credentials, request bodies with secrets, and exact provider stack traces
- **中文** 当 DeepSeek provider 或 OpenAI SDK transport 在 live verification 中失败时，model-gateway 必须返回脱敏 diagnostic，排除 authorization headers、raw credentials、带 secret 的 request bodies 和精确 provider stack traces。
