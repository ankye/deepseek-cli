## ADDED Requirements

### Requirement: Agent Loop Uses Prompt Assembly Plan / Agent Loop 使用 Prompt Assembly Plan

The agent loop SHALL obtain model-visible messages, prompt text, tool visibility, and prompt metadata from the prompt assembly package before dispatching each model request.

Agent loop 在派发每次 model request 前，必须从 prompt assembly package 获取 model-visible messages、prompt text、tool visibility 与 prompt metadata。

#### Scenario: Assembly occurs before model request / Model Request 前执行 Assembly
- **WHEN** the agent loop is ready to call the model for an iteration
- **THEN** it invokes the configured `PromptAssembler`, receives a provider-neutral assembly result, and builds the `ModelRequest` from that result rather than constructing messages inline
- **中文** 当 agent loop 准备在某次 iteration 调用模型时，必须调用配置的 `PromptAssembler`，接收 provider-neutral assembly result，并从该 result 构建 `ModelRequest`，而不是内联构造 messages。

#### Scenario: Existing prompt semantics are preserved / 保持现有 Prompt 语义
- **WHEN** only the current user prompt and projected reference context are available
- **THEN** the assembled model request preserves the existing behavior of a system context message followed by the exact user prompt message
- **中文** 当只有当前用户 prompt 与 projected reference context 可用时，组装后的 model request 必须保持现有行为：system context message 后跟精确的 user prompt message。

#### Scenario: Assembly failure fails closed / Assembly 失败安全关闭
- **WHEN** prompt assembly rejects a turn due to hard budget, invalid required section, incompatible provider metadata, or policy exclusion of required context
- **THEN** the agent loop emits a typed terminal failure and does not call the model gateway
- **中文** 当 prompt assembly 因 hard budget、invalid required section、incompatible provider metadata 或 required context 被 policy exclusion 而拒绝某个 turn 时，agent loop 必须发出 typed terminal failure，且不得调用 model gateway。

### Requirement: Agent Loop Emits Prompt Assembly Evidence / Agent Loop 发出 Prompt Assembly 证据

The agent loop SHALL emit a host-neutral `prompt.assembled` runtime event before `model.requested` for every model dispatch attempt.

Agent loop 必须在每次 model dispatch attempt 的 `model.requested` 之前发出 host-neutral `prompt.assembled` runtime event。

#### Scenario: Prompt assembled event precedes model requested / Prompt Assembled 事件先于 Model Requested
- **WHEN** a model request is successfully assembled
- **THEN** the runtime event stream includes `prompt.assembled` before `model.requested`, with assembly fingerprint, section summary, budget report summary, tool plan summary, provider target metadata, compatibility metadata, and redaction metadata
- **中文** 当 model request 成功组装时，runtime event stream 必须在 `model.requested` 之前包含 `prompt.assembled`，并带有 assembly fingerprint、section summary、budget report summary、tool plan summary、provider target metadata、compatibility metadata 与 redaction metadata。

#### Scenario: Prompt assembled event is replayable / Prompt Assembled 事件可 Replay
- **WHEN** a golden replay captures a turn that dispatches a model request
- **THEN** the captured `prompt.assembled` event contains enough redacted structural evidence to compare future assembly output without persisting raw unbounded prompt content
- **中文** 当 golden replay 捕获一个派发 model request 的 turn 时，捕获的 `prompt.assembled` event 必须包含足够的脱敏结构证据，用于对比未来 assembly output，且不持久化 raw unbounded prompt content。

#### Scenario: Tool visibility is recorded / Tool Visibility 被记录
- **WHEN** tools are projected into or excluded from a model request
- **THEN** the prompt assembly evidence records visible tool count, excluded tool count, projection policy, and bounded exclusion reasons
- **中文** 当 tools 被投影进或排除出 model request 时，prompt assembly evidence 必须记录 visible tool count、excluded tool count、projection policy 与有界 exclusion reasons。
