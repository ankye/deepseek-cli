## ADDED Requirements

### Requirement: First Usable Agent Loop / 第一个可用 Agent Loop

The system SHALL provide a product-grade agent loop that can accept user tasks, call the configured model, normalize model output, execute governed tool calls, feed tool results back to the model, and emit a terminal turn result through host-neutral runtime events.

系统必须提供产品级 agent loop，能够接收用户任务、调用配置模型、归一化模型输出、执行受治理工具调用、把工具结果回灌给模型，并通过 host-neutral runtime events 发出 turn 终态结果。

#### Scenario: One-shot run completes without tools / 无工具的一次性运行完成

- **WHEN** `deepseek run "explain this repository"` is executed with a model response that completes without tool calls
- **THEN** the loop emits session, turn, model, output, and terminal completion events in order
- **中文** 当执行 `deepseek run "explain this repository"` 且模型响应不包含 tool calls 时，loop 必须按顺序发出 session、turn、model、output 和 terminal completion events。

#### Scenario: One-shot run completes with a tool call / 带工具调用的一次性运行完成

- **WHEN** the model requests a registered read-only coding tool during `deepseek run`
- **THEN** the loop validates the request, executes the tool through governed capability execution, sends the tool result back to the model, and emits a terminal assistant result
- **中文** 当模型在 `deepseek run` 中请求已注册 read-only coding tool 时，loop 必须校验请求、通过受治理 capability execution 执行工具、把工具结果回传模型，并发出终态 assistant result。

### Requirement: Chat Session Loop / 交互式 Chat Session Loop

The system SHALL provide a chat loop that preserves session identity across multiple user turns while using the same runtime event loop and governance boundaries as one-shot runs.

系统必须提供 chat loop，在多个 user turns 之间保留 session identity，并与 one-shot runs 使用同一 runtime event loop 和治理边界。

#### Scenario: Chat preserves session id / Chat 保留 session id

- **WHEN** a user submits multiple prompts in `deepseek chat`
- **THEN** each turn uses the same session id unless the user explicitly starts, resumes, or forks another session
- **中文** 当用户在 `deepseek chat` 中提交多个 prompts 时，每个 turn 必须使用相同 session id，除非用户显式 start、resume 或 fork 另一个 session。

#### Scenario: Chat exits cleanly / Chat 干净退出

- **WHEN** a user sends EOF, exit, quit, or the host requests cancellation
- **THEN** the loop emits a terminal session event and does not leave scheduled work running
- **中文** 当用户发送 EOF、exit、quit，或 host 请求 cancellation 时，loop 必须发出 terminal session event，且不得留下仍在运行的 scheduled work。

### Requirement: Agent Loop Event Presentation / Agent Loop 事件呈现

The system SHALL expose human-readable text output and machine-readable JSON/JSONL output for the same canonical runtime events without changing execution behavior.

系统必须针对同一 canonical runtime events 暴露 human-readable text output 与 machine-readable JSON/JSONL output，且不得改变执行行为。

#### Scenario: Text mode streams assistant output / Text mode 串流 assistant output

- **WHEN** a CLI user runs the agent loop in default text mode
- **THEN** assistant text streams as readable output while tool progress and diagnostics remain bounded and traceable
- **中文** 当 CLI 用户以默认 text mode 运行 agent loop 时，assistant text 必须以可读形式串流输出，同时 tool progress 与 diagnostics 保持有界且可追踪。

#### Scenario: JSONL mode emits event records / JSONL mode 发出事件记录

- **WHEN** a caller passes JSONL output mode
- **THEN** each canonical runtime event is emitted as one JSON line with event type, schema version, session id, turn id, trace id, timestamp, redaction metadata, and payload
- **中文** 当 caller 使用 JSONL output mode 时，每个 canonical runtime event 必须作为一行 JSON 输出，包含 event type、schema version、session id、turn id、trace id、timestamp、redaction metadata 和 payload。

### Requirement: Agent Loop Failure Semantics / Agent Loop 失败语义

The agent loop SHALL fail closed with typed terminal events for missing credentials, unsupported model capabilities, unsafe tool requests, policy denial, timeout, cancellation, provider failure, malformed unrepaired tool calls, and scheduler failure.

agent loop 必须针对 missing credentials、unsupported model capabilities、unsafe tool requests、policy denial、timeout、cancellation、provider failure、malformed unrepaired tool calls 和 scheduler failure 以 typed terminal events 安全失败。

#### Scenario: Missing credentials fail before provider call / 缺少凭证在 provider 调用前失败

- **WHEN** no configured credential can be resolved for a live DeepSeek profile
- **THEN** the loop emits a missing-credential terminal event and does not call the provider transport
- **中文** 当 live DeepSeek profile 无法解析配置凭证时，loop 必须发出 missing-credential terminal event，且不得调用 provider transport。

#### Scenario: Unsafe tool request is rejected / 不安全工具请求被拒绝

- **WHEN** a model requests a tool with traversal paths, unsupported platform commands, disabled capabilities, or schema-invalid input
- **THEN** the loop emits validation and terminal or model-feedback events without executing the unsafe request
- **中文** 当模型请求包含 traversal paths、unsupported platform commands、disabled capabilities 或 schema-invalid input 的工具时，loop 必须发出 validation 与 terminal 或 model-feedback events，且不得执行不安全请求。
