# live-agent-tool-execution Specification

## Purpose
TBD - created by archiving change enable-live-agent-tool-execution. Update Purpose after archive.
## Requirements
### Requirement: Live Agent Tool Execution Loop / Live Agent 工具执行循环

The system SHALL support live DeepSeek agent turns where provider-emitted tool calls are normalized, validated, executed through governed runtime boundaries, converted into bounded tool feedback, and sent back to the model for continuation.

系统必须支持 live DeepSeek agent turns：provider 发出的 tool calls 会被归一化、校验、通过受治理 runtime boundaries 执行、转换为有界 tool feedback，并回传给模型继续生成。

#### Scenario: Live tool turn completes / Live 工具回合完成

- **WHEN** a live DeepSeek response requests a registered model-visible read-only tool
- **THEN** runtime validates the intent, executes it through the runtime kernel, sends bounded tool result feedback to the model, and emits a terminal assistant result
- **中文** 当 live DeepSeek response 请求一个已注册且 model-visible 的 read-only tool 时，runtime 必须校验 intent、通过 runtime kernel 执行、把有界 tool result feedback 回传模型，并发出终态 assistant result。

#### Scenario: Provider does not execute tools / Provider 不执行工具

- **WHEN** the DeepSeek provider receives or emits a tool call
- **THEN** it only normalizes the tool-call intent and never invokes capabilities, policy, sandbox, scheduler, bus, workflow, command, skill, hook, MCP, plugin, or session mutation directly
- **中文** 当 DeepSeek provider 接收或发出 tool call 时，它只能归一化 tool-call intent，不得直接调用 capabilities、policy、sandbox、scheduler、bus、workflow、command、skill、hook、MCP、plugin 或 session mutation。

### Requirement: Live Tool Feedback Contract / Live 工具反馈契约

The system SHALL convert every live tool execution outcome into provider-compatible tool feedback with bounded preview, normalized status, diagnostics, trace metadata, and redaction metadata.

系统必须把每个 live tool execution outcome 转换为 provider-compatible tool feedback，包含有界 preview、normalized status、diagnostics、trace metadata 和 redaction metadata。

#### Scenario: Successful tool feedback is bounded / 成功工具反馈有界

- **WHEN** a tool execution succeeds with large output
- **THEN** model-facing feedback includes a bounded redacted preview and replay evidence retains richer structured metadata
- **中文** 当 tool execution 成功但输出很大时，model-facing feedback 必须只包含有界脱敏 preview，replay evidence 保留更丰富的结构化 metadata。

#### Scenario: Failed tool feedback is typed / 失败工具反馈类型化

- **WHEN** a tool execution is rejected, denied, times out, is cancelled, or fails
- **THEN** model-facing feedback carries a normalized non-success status and typed diagnostics without raw stack traces or secrets
- **中文** 当 tool execution 被拒绝、被 deny、超时、取消或失败时，model-facing feedback 必须包含 normalized non-success status 和 typed diagnostics，且不得包含 raw stack traces 或 secrets。

### Requirement: Live Tool Loop Limits / Live 工具循环限制

The live tool loop SHALL enforce explicit limits for model iterations, tool calls, turn timeout, tool timeout, output bytes, retry attempts, and continuation eligibility.

live tool loop 必须强制执行 model iterations、tool calls、turn timeout、tool timeout、output bytes、retry attempts 和 continuation eligibility 的显式限制。

#### Scenario: Iteration limit stops loop / 迭代上限停止循环

- **WHEN** the model continues requesting tools after `maxModelIterations` or `maxToolCalls` is reached
- **THEN** runtime emits a typed terminal failure and does not dispatch more provider requests or tool executions
- **中文** 当模型在达到 `maxModelIterations` 或 `maxToolCalls` 后继续请求 tools 时，runtime 必须发出 typed terminal failure，且不得继续 dispatch provider requests 或 tool executions。

#### Scenario: Timeout prevents continuation / 超时阻止继续

- **WHEN** a turn or tool execution times out
- **THEN** runtime aborts queued or running work and does not send another continuation request to the model
- **中文** 当 turn 或 tool execution 超时时，runtime 必须 abort queued 或 running work，且不得向模型发送另一个 continuation request。

### Requirement: Live Unsafe Tool Handling / Live 不安全工具处理

The live tool loop SHALL fail closed or send bounded corrective feedback for unsafe model tool requests according to safety class.

live tool loop 必须根据 safety class 对不安全 model tool requests fail closed，或发送有界 corrective feedback。

#### Scenario: Unsafe path is rejected before envelope / 不安全路径在 envelope 前被拒绝

- **WHEN** a live model tool call contains traversal, home, absolute, drive-relative, null-byte, or unsupported platform paths
- **THEN** preflight rejects or repairs it before execution envelope creation, emits evidence, and never executes the unsafe original input
- **中文** 当 live model tool call 包含 traversal、home、absolute、drive-relative、null-byte 或 unsupported platform paths 时，preflight 必须在 execution envelope creation 前拒绝或修复，发出 evidence，且不得执行 unsafe original input。

#### Scenario: Unknown tool is not executed / 未知工具不被执行

- **WHEN** a live model requests an unknown, hidden, disabled, or policy-incompatible tool
- **THEN** runtime emits typed rejection evidence and does not schedule executable work
- **中文** 当 live model 请求 unknown、hidden、disabled 或 policy-incompatible tool 时，runtime 必须发出 typed rejection evidence，且不得 schedule executable work。

### Requirement: Live Tool Event Ordering / Live 工具事件顺序

The live tool loop SHALL emit canonical runtime events in deterministic order so CLI, VSCode, tests, and future server hosts can render tool state without owning separate state machines.

live tool loop 必须以确定性顺序发出 canonical runtime events，使 CLI、VSCode、tests 和未来 server hosts 可以渲染 tool state，而不需要拥有独立状态机。

#### Scenario: Successful live tool event order / 成功 Live 工具事件顺序

- **WHEN** a live tool call succeeds and the model continues to final text
- **THEN** events include model request, tool intent, optional repair, envelope, policy, sandbox, scheduler, tool result, continuation model request, model output, and turn completion in order
- **中文** 当 live tool call 成功且模型继续生成最终文本时，events 必须按顺序包含 model request、tool intent、可选 repair、envelope、policy、sandbox、scheduler、tool result、continuation model request、model output 和 turn completion。

#### Scenario: Failed live tool event order / 失败 Live 工具事件顺序

- **WHEN** a live tool call fails at validation, policy, sandbox, scheduler, executor, or provider continuation
- **THEN** events preserve the prefix up to the failing boundary and emit a typed terminal event or bounded model feedback according to the configured continuation policy
- **中文** 当 live tool call 在 validation、policy、sandbox、scheduler、executor 或 provider continuation 阶段失败时，events 必须保留到失败边界为止的前缀，并根据 configured continuation policy 发出 typed terminal event 或有界 model feedback。

