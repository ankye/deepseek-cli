## 1. OpenSpec And Contracts / OpenSpec 与契约

- [x] 1.1 Create bilingual proposal, design, and specs for opt-in live DeepSeek provider smoke. / 创建 opt-in live DeepSeek provider smoke 的双语 proposal、design 和 specs。
- [x] 1.2 Validate `add-live-deepseek-provider-smoke` with OpenSpec strict mode. / 使用 OpenSpec strict mode 校验 `add-live-deepseek-provider-smoke`。

## 2. Live Transport Implementation / Live Transport 实现

- [x] 2.1 Add an OpenAI SDK-backed `ModelProviderTransport` for DeepSeek live requests without leaking authorization headers. / 增加基于 OpenAI SDK 的 `ModelProviderTransport` 处理 DeepSeek live requests，且不泄漏 authorization headers。
- [x] 2.2 Add secret-safe `.env` credential loading in the live test for `DEEPSEEK_API_KEY` or `DEEPSEEK_TOKEN`, preferring process environment. / 在 live test 中增加 secret-safe `.env` credential loading，支持 `DEEPSEEK_API_KEY` 或 `DEEPSEEK_TOKEN`，并优先使用 process environment。
- [x] 2.3 Export the live OpenAI SDK transport through package public exports without changing deterministic defaults. / 通过 package public exports 导出 live OpenAI SDK transport，且不改变 deterministic defaults。

## 3. Optional Live Smoke / 可选 Live Smoke

- [x] 3.1 Add `tests/live/deepseek-provider-live-smoke.test.ts` with skip-by-default gating. / 增加默认跳过的 `tests/live/deepseek-provider-live-smoke.test.ts`。
- [x] 3.2 Add `npm run smoke:live:deepseek` script that runs only the live smoke test. / 增加只运行 live smoke test 的 `npm run smoke:live:deepseek` script。
- [x] 3.3 Assert normalized event structure, non-empty text, terminal completion, provider metadata, and redacted credential output. / 断言 normalized event structure、non-empty text、terminal completion、provider metadata 和 redacted credential output。

## 4. Verification / 校验

- [x] 4.1 Run `openspec validate add-live-deepseek-provider-smoke --type change --strict`. / 运行 `openspec validate add-live-deepseek-provider-smoke --type change --strict`。
- [x] 4.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 4.3 Run `npm run lint`, `npm run typecheck`, and `npm test`. / 运行 `npm run lint`、`npm run typecheck` 和 `npm test`。
- [x] 4.4 Run `npm run smoke:live:deepseek` without the live flag and confirm it skips without network. / 不设置 live flag 运行 `npm run smoke:live:deepseek`，确认无网络请求并跳过。
- [x] 4.5 Run `DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek` using local `.env` and confirm a redacted live response. / 使用本地 `.env` 运行 `DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek`，确认获得脱敏 live response。
- [x] 4.6 Review `git status` to confirm `.env` and `参考/` are not tracked or copied. / 检查 `git status`，确认 `.env` 和 `参考/` 未被跟踪或复制。
