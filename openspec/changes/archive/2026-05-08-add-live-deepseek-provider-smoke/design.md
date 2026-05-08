## Context

`add-deepseek-ai-provider` introduced provider-neutral contracts, a DeepSeek OpenAI-like provider adapter, deterministic fixture transport, normalization tests, and tool intent preflight integration. The next useful validation is a narrow live smoke that proves the real API stream fits those contracts.

`add-deepseek-ai-provider` 已引入 provider-neutral contracts、DeepSeek OpenAI-like provider adapter、deterministic fixture transport、normalization tests 和 tool intent preflight integration。下一步有价值的验证，是用一个很窄的 live smoke 证明真实 API stream 能适配这些 contracts。

The live path must not become the default test path. Default tests must remain deterministic, offline, and safe for CI without credentials. The user can provide a local `.env` token for manual smoke validation.

live path 不能成为默认测试路径。默认 tests 必须保持 deterministic、offline，并且在没有 credentials 的 CI 中安全运行。用户可以提供本地 `.env` token 进行手动 smoke validation。

## Goals / Non-Goals

**Goals:**

- Add an opt-in live DeepSeek API smoke command gated by `DEEPSEEK_LIVE_TESTS=1`.
- 增加由 `DEEPSEEK_LIVE_TESTS=1` 显式启用的 live DeepSeek API smoke command。
- Use OpenAI-like `/chat/completions` as the DeepSeek provider live path.
- 使用 OpenAI-like `/chat/completions` 作为 DeepSeek provider live path。
- Load `DEEPSEEK_API_KEY` or `DEEPSEEK_TOKEN` from `.env` or environment without printing raw secrets.
- 从 `.env` 或 environment 加载 `DEEPSEEK_API_KEY` 或 `DEEPSEEK_TOKEN`，不打印 raw secrets。
- Verify streamed text, finish/done, optional usage, provider metadata, and credential redaction.
- 验证 streamed text、finish/done、optional usage、provider metadata 和 credential redaction。

**Non-Goals:**

- Do not add live tests to default `npm test`.
- 不把 live tests 加入默认 `npm test`。
- Do not execute file, shell, edit, MCP, plugin, or tool side effects against the live model.
- 不让 live model 执行 file、shell、edit、MCP、plugin 或 tool side effects。
- Do not persist live responses as golden fixtures.
- 不把 live responses 持久化为 golden fixtures。
- Do not expose OpenAI SDK types through platform contracts or runtime contracts.
- 不通过 platform contracts 或 runtime contracts 暴露 OpenAI SDK types。

## Decisions

### Decision: Use OpenAI SDK transport for live DeepSeek smoke

DeepSeek documents the OpenAI SDK as the primary client path for its OpenAI-like API. The live smoke should therefore use an `OpenAIModelProviderTransport` as the live transport implementation, while the model gateway continues to expose provider-neutral contracts and normalized events.

DeepSeek 文档把 OpenAI SDK 作为其 OpenAI-like API 的主要 client path。因此 live smoke 应使用 `OpenAIModelProviderTransport` 作为 live transport 实现，同时 model gateway 继续暴露 provider-neutral contracts 和 normalized events。

Alternative considered: use only hand-written fetch/SSE. Rejected for live smoke because the official SDK path is more likely to match DeepSeek compatibility behavior. Low-level fetch/SSE parser coverage remains in deterministic tests.

备选方案：只使用手写 fetch/SSE。该方案对 live smoke 不采用，因为官方 SDK 路径更可能匹配 DeepSeek compatibility behavior。低层 fetch/SSE parser coverage 保留在 deterministic tests 中。

### Decision: Gate live smoke with environment flags

The live smoke exits as skipped unless `DEEPSEEK_LIVE_TESTS=1` and a credential are present. This makes it safe to keep in the repository while preventing accidental cost, network calls, or CI failures.

live smoke 在未设置 `DEEPSEEK_LIVE_TESTS=1` 或缺少 credential 时以 skipped 结束。这样可以安全放入仓库，同时避免意外成本、网络调用或 CI failure。

### Decision: Print only redacted summaries

The smoke command prints event kinds, model/provider metadata, token counts when available, and a short text preview. It never prints authorization headers, raw credential values, or complete provider request bodies.

smoke command 只打印 event kinds、model/provider metadata、可用 token counts 和短 text preview。它永不打印 authorization headers、raw credential values 或完整 provider request bodies。

## Risks / Trade-offs

- [Risk] Live provider shape changes. -> Mitigation: keep the smoke narrow and report normalized event kinds plus redacted provider errors.
- [风险] live provider shape 变化。-> 缓解：保持 smoke 范围很窄，并报告 normalized event kinds 与脱敏 provider errors。
- [Risk] Users accidentally run live tests. -> Mitigation: require both dedicated script and `DEEPSEEK_LIVE_TESTS=1`.
- [风险] 用户意外运行 live tests。-> 缓解：同时要求专用 script 和 `DEEPSEEK_LIVE_TESTS=1`。
- [Risk] Response text is nondeterministic. -> Mitigation: assert structural events and non-empty text rather than exact output.
- [风险] response text 不确定。-> 缓解：断言结构事件和非空文本，而不是精确输出。

## Migration Plan

1. Add OpenAI SDK transport and keep `.env` helper in live test code.
2. Add optional live smoke under `tests/live`.
3. Add `npm run smoke:live:deepseek` script.
4. Validate deterministic tests still pass without live flags.

迁移计划：

1. 增加 OpenAI SDK transport，并把 `.env` helper 保留在 live test code。
2. 在 `tests/live` 下增加 optional live smoke。
3. 增加 `npm run smoke:live:deepseek` script。
4. 验证没有 live flags 时 deterministic tests 仍然通过。
