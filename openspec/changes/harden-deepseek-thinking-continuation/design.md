## Context

`enable-real-platform-in-live-mode` landed the real-filesystem wiring. A follow-up live run against the DeepSeek API immediately surfaced the next failure mode:

1. Turn 1: model streams `reasoning_content` chunks (thinking), then a `tool_calls` chunk with `core.file.read`. Runtime: executes tool via real platform, captures real file content, emits typed `ToolResultFeedback { status: "success" }`.
2. Turn 2 (continuation): runtime builds chat history from its internal `messages` buffer. Assistant message records the tool call but has `content: ""` and no `reasoning_content`. Runtime posts the body to `/chat/completions`.
3. DeepSeek returns HTTP 400: `The \`reasoning_content\` in the thinking mode must be passed back to the API.`
4. Runtime emits `runtime.error` and `agent.loop.failed`.

This is a provider contract we do not currently honor. The DeepSeek thinking-mode API requires the assistant's `reasoning_content` to be present on any assistant turn that is referenced by later user/tool turns. OpenAI's o-series models have a similar reasoning-handle requirement (though they store it server-side via `previous_response_id`); DeepSeek expects the client to echo it back in the chat history.

## Goals / Non-Goals

**Goals:**

- A live DeepSeek thinking-mode tool call completes more than one iteration without 400 `reasoning_content must be passed back`.
- Reasoning text is preserved as a typed field on `ModelChatMessage` rather than leaked through an untyped side channel.
- Deterministic replays and the existing golden event order stay stable; the only new event kind (`model.reasoning.persisted`) fires only when reasoning was actually persisted into continuation history.
- Hosts that do not use thinking-mode models see zero behavior change.

- live DeepSeek thinking 模式工具调用必须能完成多轮 iteration，不再出现 400 `reasoning_content must be passed back`。
- Reasoning 文本作为 `ModelChatMessage` 上的 typed 字段保留，而不是通过无 type 侧信道传递。
- Deterministic replay 与现有 golden 事件顺序保持稳定；新事件 `model.reasoning.persisted` 仅在 reasoning 真的被带进 continuation 历史时触发。
- 不使用 thinking-mode 模型的 host 行为不变。

**Non-Goals:**

- Do not introduce OpenAI o-series `previous_response_id` support. That is a separate provider decision and involves server-side state; DeepSeek expects inline echoing.
- Do not change how reasoning is rendered to the terminal. The CLI still shows `[reasoning]` as before.
- Do not persist reasoning to sessions or replay files beyond what already exists. Reasoning is redaction-class `internal`; do not elevate its exposure.
- Do not try to recover an already-failed 400 turn. This change prevents the failure; retry semantics stay orthogonal.

- 不引入 OpenAI o-series 的 `previous_response_id`。那是另一个 provider 决定，涉及 server-side state；DeepSeek 要求内联回传。
- 不改 reasoning 在终端的渲染。CLI 仍然显示 `[reasoning]`。
- 不额外持久化 reasoning 到 sessions 或 replay 文件。Reasoning 是 redaction class `internal`；不提升其暴露级别。
- 不尝试恢复已经 400 的 turn。这次变更是预防失败；retry 语义与之正交。

## Decisions

### Decision 1: Accumulate reasoning per iteration in the runtime, not in the provider

Reasoning chunks arrive inside `deps.models.stream` but the assistant chat message is written by the runtime. Moving the accumulator into the provider would couple it to a single host's state machine and break the explicit runtime-owned loop contract. The runtime already accumulates `assistantText`; adding per-iteration `iterationReasoning` next to it is the minimal change.

Reasoning chunks 进来时是 provider 层的 stream 事件，但 assistant chat message 是 runtime 写的。把累加器放进 provider 会把它和某个 host 的状态机耦合，也会破坏 runtime-owns-loop 的显式契约。Runtime 已经在累加 `assistantText`；旁边加一个 per-iteration `iterationReasoning` 是最小改动。

Rejected alternative: capture reasoning in the provider and embed it in the `tool-call` stream event. That would conflate provider state with runtime memory and make it unclear who "owns" the reasoning after it is emitted.

拒绝方案：在 provider 端捕获 reasoning 并嵌入 `tool-call` stream 事件。那样会混淆 provider 状态与 runtime 记忆，让 reasoning 的归属模糊不清。

### Decision 2: Reasoning is carried on the assistant chat message, not separately

DeepSeek expects the reasoning to appear alongside the assistant message's `content` and `tool_calls` in the same JSON record. Adding `reasoningContent` as an optional field on `ModelChatMessage` mirrors OpenAI's on-wire shape and keeps message serialization a single hop. Any future host that composes messages manually sees one consistent structure.

DeepSeek 期望 reasoning 与 assistant message 的 `content` 和 `tool_calls` 一起出现在同一条 JSON 记录中。在 `ModelChatMessage` 上增加可选 `reasoningContent` 字段，和 OpenAI 在线 shape 对齐，消息序列化保持一跳。未来任何手动组装消息的 host 看到的结构都一致。

Rejected alternative: put reasoning on a separate `role: "reasoning"` message. That is not a role DeepSeek accepts, and it would require runtime/provider to invent a shape the API does not recognize.

拒绝方案：单独一个 `role: "reasoning"` 的消息。DeepSeek 不接受这个 role，会逼 runtime/provider 造一个 API 不认的形状。

### Decision 3: Emit a dedicated persistence event instead of reusing `model.reasoning`

`model.reasoning` fires per chunk during a streaming turn and is purely observational. A single `model.reasoning.persisted` event at the point where reasoning is attached to a continuation history tells replay, observability, and future audit tooling that thinking-mode state crossed the turn boundary deliberately. Without this event, the only signal would be the presence of a field inside a private runtime buffer.

`model.reasoning` 在流式 turn 中按 chunk 触发，只是观察性。单独的 `model.reasoning.persisted` 事件出现在 reasoning 被附加到 continuation 历史那一刻，让 replay、observability 和未来审计工具都能看出 thinking-mode 状态"有意"跨过了 turn 边界。没有这个事件的话，唯一信号就是 runtime 内部 buffer 里的字段，不可观测。

### Decision 4: Keep the deterministic smoke happy; do not assert reasoning persistence in existing golden

Existing `live-tool-execution-replay.test.ts` uses a deterministic model that emits no reasoning chunks, so no persistence event should fire there. That test's canonical event order therefore stays unchanged. The new event is asserted in a new dedicated test that pipes reasoning chunks through a custom `ModelGateway` fixture.

现有 `live-tool-execution-replay.test.ts` 用的 deterministic model 不发 reasoning chunk，因此不会触发 persistence event。该测试的 canonical event 顺序不变。新事件在专门的新测试里断言，通过自定义 `ModelGateway` fixture 注入 reasoning chunk。

## Safety Model

- `reasoningContent` inherits redaction class `internal`, same as the `model.reasoning` event. Provider bodies already flow through HTTPS to DeepSeek; no new exposure surface.
- The new field is optional; provider body serialization omits it when absent. No blank string or `null` leakage.
- The new event carries only the reasoning byte length and a redaction tag, not the reasoning text, so observers see that reasoning was persisted without seeing the content.
- Lint rules are unaffected. Provider still does not reach into runtime; runtime still owns the chat history.

- `reasoningContent` 继承 redaction class `internal`，与 `model.reasoning` 事件一致。Provider body 本来就通过 HTTPS 送达 DeepSeek；不产生新的暴露面。
- 新字段是可选的；provider body 序列化在字段缺失时直接省略。不会漏空字符串或 `null`。
- 新事件只携带 reasoning 的字节长度和 redaction tag，不带 reasoning 文本，观察者能看到 reasoning 被持久化，但看不到内容。
- Lint 规则不受影响。Provider 依旧不触 runtime，runtime 依旧拥有聊天历史。

## Acceptance Strategy

- Unit: provider test asserts that a `ModelChatMessage` with `reasoningContent` is serialized to `reasoning_content` in the chat-completions body; a message without `reasoningContent` omits the field entirely.
- Runtime: a deterministic model gateway emitting `reasoning` + `tool-call` is observed via a recording kernel, and the subsequent `assistant` chat message carries `reasoningContent` equal to the concatenated reasoning text.
- Runtime event: the `model.reasoning.persisted` event fires exactly once per iteration that had reasoning chunks preceding a tool call.
- Live gated: `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools` executes end-to-end against the real API and no `PROVIDER_TRANSPORT_FAILED` with a `reasoning_content` diagnostic appears.
- Deterministic regression: 252+ tests stay green; no golden replay or matrix disturbance.
