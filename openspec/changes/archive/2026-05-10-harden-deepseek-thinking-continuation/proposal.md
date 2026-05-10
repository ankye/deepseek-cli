## Why

Running `deepseek run --live` with a DeepSeek thinking-mode model produces a successful first turn: the model emits `reasoning_content` chunks, then a tool call, and the runtime executes the tool through the real platform. On the second (continuation) turn the provider returns HTTP 400 with `The \`reasoning_content\` in the thinking mode must be passed back to the API.` DeepSeek requires the assistant turn's `reasoning_content` to be echoed back in the chat history when the next request references that turn's tool call, but our runtime drops reasoning chunks after emitting them as events. The result is a guaranteed failure on every real DeepSeek thinking-mode multi-turn session once a tool is invoked.

`deepseek run --live` 用 DeepSeek thinking 模型时：第一轮模型发出 `reasoning_content` chunk，然后是一次工具调用，runtime 通过真实平台执行完工具。第二轮 continuation 请求时 provider 返回 HTTP 400，错误是 `The reasoning_content in the thinking mode must be passed back to the API.` DeepSeek 规定：下一轮请求引用某个 assistant turn 的 tool call 时，该 turn 的 `reasoning_content` 必须出现在 chat history 中。但我们的 runtime 把 reasoning chunk 发成事件后就丢弃了。结果是：任何真实 DeepSeek thinking 模式下带工具的多轮会话都必然失败。

## What Changes

- Extend `ModelChatMessage` in `@deepseek/platform-contracts` with an optional `reasoningContent` field and an optional `reasoningRedaction` tag; leave all existing consumers unaffected.
- Have the DeepSeek provider's `providerMessagesFrom` include `reasoning_content` in the outgoing assistant message body whenever `reasoningContent` is present on the source message, so continuation requests satisfy DeepSeek's thinking-mode contract.
- In the runtime agent loop, accumulate per-iteration `reasoning` chunks and attach the concatenated text to the `assistant` message that records the tool call, so the continuation request includes the reasoning the provider requires.
- Emit a new runtime event kind `model.reasoning.persisted` only when reasoning text is actually carried into the continuation history, so hosts, replay, and observability can see that thinking-mode state left the turn without relying on buffered `model.reasoning` events.
- Add a deterministic provider unit test covering the round-trip: a thinking-mode fixture with reasoning and a tool call must produce an outgoing continuation body whose assistant message carries `reasoning_content`.
- Add a runtime-level test that a deterministic model gateway emitting reasoning chunks before a tool call causes the next user-facing messages array to include `reasoningContent` on the assistant record.
- Re-run the gated live tool smoke against the real DeepSeek API and expect the previous 400 to disappear.
- No breaking changes: messages without reasoning behave exactly as today; the `reasoningContent` field is additive on `ModelChatMessage`.

- 给 `@deepseek/platform-contracts` 的 `ModelChatMessage` 增加可选 `reasoningContent` 和可选 `reasoningRedaction`；现有消费方零影响。
- DeepSeek provider 的 `providerMessagesFrom` 在源 message 带 `reasoningContent` 时，把 `reasoning_content` 写入出站 assistant message body，让 continuation 请求满足 DeepSeek thinking-mode 契约。
- runtime agent loop 按 iteration 累积 `reasoning` chunk，并在记录 tool call 的 `assistant` message 上附加拼接后的 reasoning 文本，让 continuation 请求包含 provider 要求的 reasoning。
- 新增 runtime event kind `model.reasoning.persisted`，只在 reasoning 文本真的带进 continuation 历史时触发；host、replay 与 observability 可以据此感知 thinking-mode 状态跨轮保留，而不用依赖缓冲的 `model.reasoning` 事件。
- 新增 provider 单元测试：thinking-mode fixture 的 reasoning + tool call 必须产生一条 outgoing continuation body，其中 assistant message 携带 `reasoning_content`。
- 新增 runtime 层测试：deterministic model gateway 在 tool call 前发出 reasoning chunk 后，下一次用户可见的 messages 数组必须在 assistant 记录上带有 `reasoningContent`。
- gated live tool smoke 重跑真实 DeepSeek API，验证之前的 400 消失。
- 无破坏性变化：没有 reasoning 的消息行为与现在完全一致；`reasoningContent` 是 `ModelChatMessage` 上的 additive 字段。

## Capabilities

### Modified Capabilities

- `model-gateway`: Require `reasoningContent` on `ModelChatMessage` to round-trip through OpenAI/DeepSeek chat-completions body serialization as `reasoning_content`.
- `runtime-event-loop`: Require the agent loop to accumulate per-iteration reasoning text and carry it on the assistant chat message that records the tool call so the continuation request satisfies DeepSeek thinking-mode.

## Impact

- `src/packages/platform-contracts/src/model.ts`: add `reasoningContent` and `reasoningRedaction` to `ModelChatMessage`.
- `src/packages/model-gateway/src/index.ts`: serialize `reasoningContent` into `reasoning_content` in the outgoing assistant body.
- `src/packages/runtime/src/agent-loop.ts`: accumulate reasoning per iteration, attach to the assistant tool-call message, emit `model.reasoning.persisted` when applied.
- `src/packages/platform-contracts/src/runtime.ts`: declare `model.reasoning.persisted` in the `RuntimeEventKind` union.
- `src/packages/model-gateway/test/deepseek-provider.test.ts` and `src/packages/runtime/test/runtime-tool-feedback.test.ts`: new cases for round-trip and accumulation.
- `tests/live/deepseek-agent-tool-live-smoke.test.ts`: keeps structural assertions; tighten with an assertion that no `PROVIDER_TRANSPORT_FAILED` with message matching `reasoning_content` appears in the event stream.
- `docs/development/testing-and-acceptance.md`: document the thinking-mode continuation contract and the new event kind.
