## ADDED Requirements

### Requirement: Runtime Owns Model Tool Iteration / Runtime 拥有模型工具迭代

The runtime event loop SHALL own the complete model-tool iteration for agent turns and SHALL NOT delegate loop state to CLI, VSCode, server adapters, provider adapters, hooks, skills, MCP servers, or plugins.

runtime event loop 必须拥有 agent turns 的完整 model-tool iteration，且不得把 loop state 委托给 CLI、VSCode、server adapters、provider adapters、hooks、skills、MCP servers 或 plugins。

#### Scenario: Runtime repeats after tool result / Runtime 在工具结果后继续迭代

- **WHEN** a model response requests a tool and the governed execution returns a result
- **THEN** runtime appends a provider-neutral tool result message to the turn context and dispatches the next model request through the model gateway
- **中文** 当 model response 请求工具且受治理执行返回结果时，runtime 必须把 provider-neutral tool result message 追加到 turn context，并通过 model gateway 派发下一次 model request。

#### Scenario: Host does not execute loop / Host 不执行 loop

- **WHEN** CLI or VSCode starts an agent turn
- **THEN** it submits user input to runtime and renders returned events without directly controlling model-tool iteration
- **中文** 当 CLI 或 VSCode 启动 agent turn 时，它只向 runtime 提交 user input 并渲染返回 events，不得直接控制 model-tool iteration。

### Requirement: Runtime Emits Canonical Agent Loop Events / Runtime 发出标准 Agent Loop Events

The runtime event loop SHALL emit canonical events for session lifecycle, turn lifecycle, model request, model output, reasoning output, tool intent, tool repair, tool preflight, tool execution, tool result, retry, cancellation, error, and terminal completion.

runtime event loop 必须为 session lifecycle、turn lifecycle、model request、model output、reasoning output、tool intent、tool repair、tool preflight、tool execution、tool result、retry、cancellation、error 和 terminal completion 发出 canonical events。

#### Scenario: Tool turn event order is stable / 工具 turn 事件顺序稳定

- **WHEN** a turn contains one model-requested tool execution
- **THEN** runtime emits turn started, model requested, model output or reasoning, tool intent, tool preflight, tool execution started, tool result, model requested again, assistant output, and turn completed in stable order
- **中文** 当 turn 包含一次模型请求的工具执行时，runtime 必须按稳定顺序发出 turn started、model requested、model output 或 reasoning、tool intent、tool preflight、tool execution started、tool result、再次 model requested、assistant output 和 turn completed。

#### Scenario: Terminal event closes every turn / 每个 turn 都有终态事件

- **WHEN** an agent turn succeeds, fails, times out, or is cancelled
- **THEN** runtime emits exactly one terminal turn event with status, typed reason, trace id, and replay metadata
- **中文** 当 agent turn 成功、失败、超时或取消时，runtime 必须发出恰好一个 terminal turn event，包含 status、typed reason、trace id 和 replay metadata。

### Requirement: Runtime Bounds Agent Loop Iteration / Runtime 限制 Agent Loop 迭代

The runtime event loop SHALL enforce configured limits for maximum model iterations, maximum tool calls per turn, total turn duration, tool timeout, output size, retry attempts, and token or budget metadata before and during execution.

runtime event loop 必须在执行前与执行期间强制 maximum model iterations、maximum tool calls per turn、total turn duration、tool timeout、output size、retry attempts 以及 token 或 budget metadata 限制。

#### Scenario: Iteration limit fails closed / 迭代限制安全失败

- **WHEN** a model keeps requesting tools beyond the configured maximum iterations
- **THEN** runtime stops the loop and emits a typed iteration-limit terminal event without scheduling further tools
- **中文** 当模型持续请求工具并超过配置的 maximum iterations 时，runtime 必须停止 loop 并发出 typed iteration-limit terminal event，且不得继续调度工具。
