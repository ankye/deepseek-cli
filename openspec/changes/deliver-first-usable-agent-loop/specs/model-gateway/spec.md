## ADDED Requirements

### Requirement: Model Tool Intent Repair Contract / 模型工具意图修复契约

The model gateway SHALL expose provider-neutral tool-call intents and provider metadata needed by runtime repair without executing capabilities or mutating tool inputs directly.

model gateway 必须暴露 provider-neutral tool-call intents 与 runtime repair 所需 provider metadata，且不得执行 capabilities 或直接修改工具输入。

#### Scenario: DeepSeek tool call includes repair metadata / DeepSeek 工具调用包含修复元数据

- **WHEN** DeepSeek returns an OpenAI-compatible tool call with JSON arguments, streamed argument fragments, provider-specific ids, or recoverable shape differences
- **THEN** the gateway emits a provider-neutral tool intent with raw digest, parsed input when available, parse diagnostics, provider metadata, and repair eligibility
- **中文** 当 DeepSeek 返回包含 JSON arguments、streamed argument fragments、provider-specific ids 或 recoverable shape differences 的 OpenAI-compatible tool call 时，gateway 必须发出 provider-neutral tool intent，包含 raw digest、可用时的 parsed input、parse diagnostics、provider metadata 和 repair eligibility。

#### Scenario: Gateway does not repair by execution / Gateway 不通过执行来修复

- **WHEN** a provider tool call is malformed
- **THEN** the gateway reports intent diagnostics and leaves repair, rejection, or model feedback decisions to runtime governance
- **中文** 当 provider tool call 格式错误时，gateway 必须报告 intent diagnostics，并把 repair、rejection 或 model feedback decisions 留给 runtime governance。

### Requirement: Agent Loop Model Request Shape / Agent Loop 模型请求形态

The model gateway SHALL accept agent-loop model requests containing projected context, visible tool schemas, tool result messages, reasoning options, model profile metadata, credential references, timeout metadata, and trace context.

model gateway 必须接受 agent-loop model requests，包含 projected context、visible tool schemas、tool result messages、reasoning options、model profile metadata、credential references、timeout metadata 和 trace context。

#### Scenario: Tool result is sent provider-neutrally / 工具结果以 provider-neutral 方式发送

- **WHEN** runtime feeds a tool result back to the model
- **THEN** the gateway converts provider-neutral tool result messages into the selected provider protocol without exposing provider wire types to runtime callers
- **中文** 当 runtime 把工具结果回传模型时，gateway 必须把 provider-neutral tool result messages 转换为所选 provider protocol，且不得向 runtime callers 暴露 provider wire types。

#### Scenario: Unsupported provider feature fails before network / 不支持的 provider feature 在网络前失败

- **WHEN** an agent loop request requires tools, reasoning, streaming, or context features unsupported by the configured model profile
- **THEN** the gateway returns a typed unsupported-capability error before sending a provider request
- **中文** 当 agent loop request 要求 tools、reasoning、streaming 或 context features，而配置的 model profile 不支持时，gateway 必须在发送 provider request 前返回 typed unsupported-capability error。

### Requirement: Live Agent Loop Smoke Compatibility / Live Agent Loop Smoke 兼容性

The model gateway SHALL support opt-in live DeepSeek smoke checks for the agent loop that validate provider reachability, streaming shape, tool-call shape when requested, usage metadata, and redacted diagnostics without asserting exact generated text.

model gateway 必须支持 agent loop 的 opt-in live DeepSeek smoke checks，验证 provider reachability、streaming shape、请求时的 tool-call shape、usage metadata 和 redacted diagnostics，且不断言精确生成文本。

#### Scenario: Live smoke validates structure / Live smoke 验证结构

- **WHEN** live agent-loop smoke is enabled with credentials and a compatible model profile
- **THEN** the gateway returns structural evidence for stream events, terminal status, latency, usage when available, and redacted provider metadata
- **中文** 当启用 live agent-loop smoke 且具备凭证与兼容 model profile 时，gateway 必须返回 stream events、terminal status、latency、可用时的 usage 和 redacted provider metadata 的结构化证据。
