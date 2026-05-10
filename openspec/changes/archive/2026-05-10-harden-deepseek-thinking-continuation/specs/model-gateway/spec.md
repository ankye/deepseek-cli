## MODIFIED Requirements

### Requirement: Agent Loop Model Request Shape / Agent Loop 模型请求形态

The model gateway SHALL accept a `ModelRequest` whose `messages` carry role, content, optional tool calls, optional tool call id for tool messages, optional reasoning content for assistant messages in thinking-mode providers, and serialize the request body to the provider's chat-completions schema with `role`, `content`, `reasoning_content` when present, `tool_calls`, and `tool_choice` when present.

model gateway 必须接受 `ModelRequest`，其 `messages` 携带 role、content、可选 tool calls、tool message 的可选 tool call id、thinking-mode provider 场景下 assistant message 的可选 reasoning content；请求 body 必须按 provider chat-completions schema 序列化，顺序为 `role`、`content`、存在时的 `reasoning_content`、`tool_calls`、存在时的 `tool_choice`。

#### Scenario: Assistant reasoning is serialized when present / assistant reasoning 存在时被序列化

- **WHEN** a `ModelChatMessage` for role `assistant` carries a non-empty `reasoningContent`
- **THEN** the outgoing chat-completions body contains `reasoning_content` on that message alongside `role` and `content`, preserving the reasoning bytes verbatim
- **中文** 当某个 `ModelChatMessage`（role 为 `assistant`）携带非空 `reasoningContent` 时，出站 chat-completions body 必须在该消息上与 `role`、`content` 并列出现 `reasoning_content`，并按字节原样携带 reasoning。

#### Scenario: Reasoning field is omitted when absent / reasoning 缺失时字段省略

- **WHEN** a `ModelChatMessage` has no `reasoningContent`
- **THEN** the outgoing chat-completions body for that message must not include a `reasoning_content` key, a blank string, or a null value
- **中文** 当某个 `ModelChatMessage` 没有 `reasoningContent` 时，出站 chat-completions body 不得包含 `reasoning_content` 键、空字符串或 null 值。

#### Scenario: Thinking-mode continuation satisfies provider contract / Thinking-mode 继续满足 provider 契约

- **WHEN** a live DeepSeek thinking-mode turn emits reasoning plus a tool call and the runtime issues a continuation request
- **THEN** the continuation body carries `reasoning_content` on the assistant message that recorded the tool call, satisfying the DeepSeek thinking-mode requirement that reasoning be passed back
- **中文** 当 live DeepSeek thinking-mode turn 发出 reasoning 与 tool call，runtime 再发起 continuation 请求时，continuation body 必须在记录该 tool call 的 assistant message 上携带 `reasoning_content`，满足 DeepSeek thinking-mode 的回传要求。
