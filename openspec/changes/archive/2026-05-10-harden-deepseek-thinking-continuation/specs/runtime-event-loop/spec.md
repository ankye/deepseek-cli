## ADDED Requirements

### Requirement: Runtime Preserves Reasoning Across Tool Turns / Runtime 跨工具回合保留 Reasoning

The runtime agent loop SHALL accumulate per-iteration reasoning text emitted by the model provider and attach it to the assistant chat message that records the tool call, so the continuation request carries the reasoning required by thinking-mode providers. The runtime SHALL emit a typed `model.reasoning.persisted` event exactly when reasoning is attached, reporting the iteration number, byte length, and redaction tag, without emitting the reasoning text itself.

runtime agent loop 必须按 iteration 累积 model provider 发出的 reasoning 文本，并附加到记录 tool call 的 assistant chat message 上，让 continuation 请求携带 thinking-mode provider 所需的 reasoning。Runtime 在 reasoning 被附加时必须发出 typed `model.reasoning.persisted` 事件，携带 iteration、byte length 和 redaction tag，不得携带 reasoning 文本本身。

#### Scenario: Reasoning persists into continuation history / Reasoning 进入 continuation 历史

- **WHEN** the model emits one or more reasoning chunks and then a tool call in the same iteration
- **THEN** the assistant chat message recording the tool call carries `reasoningContent` equal to the concatenated reasoning text, and the next provider request body includes that reasoning
- **中文** 当模型在同一 iteration 中发出一个或多个 reasoning chunk 后紧跟一次 tool call 时，记录该 tool call 的 assistant chat message 必须携带与拼接 reasoning 相等的 `reasoningContent`，下一次 provider 请求 body 必须包含该 reasoning。

#### Scenario: Persistence event fires once per persisted iteration / 持久化事件每次持久化 iteration 触发一次

- **WHEN** reasoning is attached to an assistant chat message for a given iteration
- **THEN** the runtime emits exactly one `model.reasoning.persisted` event for that iteration with `{ iteration, byteLength, redaction }` fields and no raw reasoning text
- **中文** 当某个 iteration 的 reasoning 被附加到 assistant chat message 时，runtime 必须对该 iteration 发出恰好一个 `model.reasoning.persisted` 事件，字段为 `{ iteration, byteLength, redaction }`，不得包含 reasoning 原文。

#### Scenario: Non-thinking turns emit no persistence event / 非 thinking 回合不触发持久化事件

- **WHEN** an iteration contains no reasoning chunks
- **THEN** no `model.reasoning.persisted` event is emitted and the assistant message carries no `reasoningContent`
- **中文** 当某个 iteration 没有 reasoning chunk 时，不得发出 `model.reasoning.persisted` 事件，且 assistant message 不得携带 `reasoningContent`。
