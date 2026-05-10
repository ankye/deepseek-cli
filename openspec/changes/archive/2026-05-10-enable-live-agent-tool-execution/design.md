## Context

The first usable agent loop established the offline and deterministic product surface. It proves the runtime can call a model gateway, expose tools, execute governed tool calls, and render host-neutral events. The remaining gap is live DeepSeek behavior: real providers may produce partial tool calls, provider-specific argument shapes, malformed JSON, unsafe paths, unsupported tool names, or ambiguous continuation signals.

第一个可用 agent loop 已经建立 offline 与 deterministic 产品界面，证明 runtime 可以调用 model gateway、暴露 tools、执行受治理 tool calls，并渲染 host-neutral events。剩余缺口是真实 DeepSeek 行为：真实 provider 可能产生 partial tool calls、provider-specific argument shapes、malformed JSON、unsafe paths、unsupported tool names 或 ambiguous continuation signals。

This change turns the tool loop into a live-product contract without weakening the kernel boundary. Provider adapters still normalize only; runtime still owns iteration; kernel still owns executable work; CLI/VSCode/server hosts still render the same canonical event stream.

本变更把 tool loop 提升为 live-product contract，同时不削弱 kernel boundary。Provider adapters 仍然只做归一化；runtime 仍然拥有 iteration；kernel 仍然拥有 executable work；CLI/VSCode/server hosts 仍然渲染同一套 canonical event stream。

## Goals / Non-Goals

**Goals:**

- Support live DeepSeek tool-call turns that can continue after one or more tool results.
- Keep every executable tool call inside capability projection, preflight, policy/sandbox, scheduler, event bus, replay, and observability boundaries.
- Provide deterministic tests for every live-path behavior without requiring credentials.
- Provide gated live tests that exercise real DeepSeek tool-call structure only when explicitly enabled.
- Make unsafe tool requests visible to the model as bounded feedback when continuation is safe, while failing closed for terminal safety violations.
- Keep CLI command surface modern and pre-release clean; no legacy flags or compatibility aliases.

- 支持 live DeepSeek tool-call turns，在一次或多次 tool results 后继续模型对话。
- 每个 executable tool call 都必须保持在 capability projection、preflight、policy/sandbox、scheduler、event bus、replay 和 observability boundaries 内。
- 为所有 live-path behavior 提供无需 credentials 的 deterministic tests。
- 提供 gated live tests，仅在显式启用时验证真实 DeepSeek tool-call structure。
- 当 continuation 安全时，把 unsafe tool requests 以有界 feedback 返回给模型；对于终态安全违规则 fail closed。
- 保持 CLI command surface 面向未来且 pre-release 干净；不增加 legacy flags 或 compatibility aliases。

**Non-Goals:**

- Do not add autonomous multi-agent planning or background daemon behavior.
- Do not let provider adapters execute tools, decide policy, publish runtime events, or mutate session state.
- Do not require live tests in default CI.
- Do not implement rich TUI approval UX; approval prompts remain a future host presentation layer over existing policy decisions.
- Do not support arbitrary shell tool projection to the model in the first live tool execution pass.

- 不增加 autonomous multi-agent planning 或 background daemon behavior。
- 不允许 provider adapters 执行 tools、决定 policy、发布 runtime events 或修改 session state。
- 默认 CI 不要求 live tests。
- 不实现 rich TUI approval UX；approval prompts 仍是未来 host presentation layer，基于现有 policy decisions。
- 第一阶段 live tool execution 不向模型投影任意 shell tool。

## Architecture

```text
User / CLI / VSCode / Server
        |
        v
Runtime Agent Loop
  - session + turn state
  - context projection
  - model-visible capability projection
  - iteration limits
        |
        v
Model Gateway
  - DeepSeek OpenAI-like request
  - provider-neutral streaming events
  - tool-call intent normalization only
        |
        v
Tool Intent Pipeline
  - provider-specific repair
  - schema validation
  - path/platform normalization
  - capability visibility check
        |
        v
Runtime Kernel
  - execution envelope
  - workflow boundary
  - policy + sandbox
  - scheduler + locks
  - event bus + replay
        |
        v
Core Tool / MCP / Future Capability Executor
        |
        v
Bounded Tool Result Feedback
        |
        v
Model Gateway continuation request
```

```text
User / CLI / VSCode / Server
        |
        v
Runtime Agent Loop
  - session + turn state
  - context projection
  - model-visible capability projection
  - iteration limits
        |
        v
Model Gateway
  - DeepSeek OpenAI-like request
  - provider-neutral streaming events
  - 只归一化 tool-call intent
        |
        v
Tool Intent Pipeline
  - provider-specific repair
  - schema validation
  - path/platform normalization
  - capability visibility check
        |
        v
Runtime Kernel
  - execution envelope
  - workflow boundary
  - policy + sandbox
  - scheduler + locks
  - event bus + replay
        |
        v
Core Tool / MCP / Future Capability Executor
        |
        v
Bounded Tool Result Feedback
        |
        v
Model Gateway continuation request
```

## Decisions

### Decision 1: Live tool calls remain intents until the runtime accepts them

DeepSeek/OpenAI SDK chunks are normalized into `ModelToolIntent` records. A tool intent is not executable until runtime validates the provider shape, repairs deterministic provider quirks, validates capability schema, checks model visibility, and creates a governed kernel invocation.

DeepSeek/OpenAI SDK chunks 会归一化为 `ModelToolIntent` records。Tool intent 只有在 runtime 校验 provider shape、修复 deterministic provider quirks、校验 capability schema、检查 model visibility，并创建受治理 kernel invocation 后，才可执行。

Rejected alternative: provider-executed tools. That would be simpler but would break platform policy, sandbox, replay, and host-neutral event contracts.

拒绝的方案：provider 直接执行 tools。它更简单，但会破坏 platform policy、sandbox、replay 和 host-neutral event contracts。

### Decision 2: Tool result feedback is a model-facing artifact, not raw executor output

Runtime converts tool execution outcomes into bounded `ToolResultFeedback` records. The feedback contains tool call id, normalized status, bounded preview, diagnostics, trace ids, and redaction metadata. Raw filesystem content, process output, stack traces, and secret-like fields stay in replay/audit evidence rather than unbounded model messages.

Runtime 会把 tool execution outcomes 转换为有界 `ToolResultFeedback` records。Feedback 包含 tool call id、normalized status、bounded preview、diagnostics、trace ids 和 redaction metadata。Raw filesystem content、process output、stack traces 和 secret-like fields 保留在 replay/audit evidence 中，而不是作为无界 model messages。

Rejected alternative: send raw executor output back to the provider. That would leak data and make model context budgets non-deterministic.

拒绝的方案：把 raw executor output 直接回传 provider。这会泄漏数据，并让 model context budgets 不确定。

### Decision 3: Continuation is explicit and bounded

After each model tool-call finish reason, runtime either sends tool feedback back to the model or emits a terminal failure. Continuation is limited by `maxModelIterations`, `maxToolCalls`, turn timeout, tool timeout, output byte limits, and policy decisions.

每次模型以 tool-call finish reason 结束后，runtime 要么把 tool feedback 回传模型，要么发出终态失败。Continuation 受 `maxModelIterations`、`maxToolCalls`、turn timeout、tool timeout、output byte limits 和 policy decisions 限制。

Rejected alternative: free-running tool loops. That would risk runaway cost, infinite loops, repeated file mutation, and unclear cancellation semantics.

拒绝的方案：无限制 tool loop。这会带来失控成本、无限循环、重复文件修改和不清晰 cancellation semantics。

### Decision 4: Live tests are structural and gated

Default tests use deterministic fixture transports that simulate DeepSeek tool calls, partial arguments, malformed inputs, provider errors, and continuation. Live tests are opt-in via explicit environment flags and assert event structure, tool-call normalization, redaction, and terminal status rather than exact generated text.

默认测试使用 deterministic fixture transports，模拟 DeepSeek tool calls、partial arguments、malformed inputs、provider errors 和 continuation。Live tests 通过显式环境变量 opt-in，只断言 event structure、tool-call normalization、redaction 和 terminal status，不断言精确生成文本。

Rejected alternative: make live tests the main acceptance path. That would be costly, flaky, and unsuitable for offline development.

拒绝的方案：把 live tests 作为主要验收路径。这会带来成本、脆弱性，并且不适合离线开发。

### Decision 5: Provider-specific repair is narrow and observable

DeepSeek-specific repair may unwrap `arguments`, normalize JSON strings, map known aliases, and normalize path separators. It must not invent tool permissions, bypass schema validation, or silently execute repaired calls without emitting repair evidence.

DeepSeek-specific repair 可以 unwrap `arguments`、normalize JSON strings、映射已知 aliases，并 normalize path separators。它不得发明 tool permissions、绕过 schema validation，也不得在没有 repair evidence 的情况下静默执行 repaired calls。

Rejected alternative: broad heuristic repair. That would create unpredictable behavior and hide provider/model defects.

拒绝的方案：宽泛 heuristic repair。这会产生不可预测行为，并掩盖 provider/model defects。

## Event Contract

The live tool loop must emit these event classes in deterministic order for a successful tool turn:

1. `turn.started`
2. `context.projection.started`
3. `context.projection.completed`
4. `model.requested`
5. `model.tool.intent`
6. optional `model.tool.repaired`
7. `execution.envelope.created`
8. `policy.decided`
9. `sandbox.selected`
10. `scheduler.queued`
11. `scheduler.started`
12. `scheduler.completed`
13. `model.tool.result`
14. continuation `model.requested`
15. `model.delta`
16. `model.finished`
17. `turn.completed`

Live tool loop 在成功 tool turn 中必须按稳定顺序发出以上事件。Rejected, denied, timeout, and provider-failure paths must preserve the same prefix until the failing boundary and then emit typed terminal events.

Rejected、denied、timeout 和 provider-failure 路径必须保留到失败边界为止的相同前缀，然后发出 typed terminal events。

## Safety Model

- Read-only workspace tools may be projected first; write/process/network tools require stricter policy and may be excluded from live default projection.
- Model-supplied absolute paths, traversal paths, home paths, drive-relative paths, unsupported platform commands, and unknown tools must be rejected or repaired before envelope creation.
- Tool feedback must be redacted and bounded before model continuation.
- Policy denial must not execute the tool and must not be hidden as a normal success.
- Cancellation and timeout must abort queued/running tool work and prevent further model continuation.

- 第一阶段可优先投影 read-only workspace tools；write/process/network tools 需要更严格 policy，并可从 live default projection 中排除。
- 模型提供的 absolute paths、traversal paths、home paths、drive-relative paths、unsupported platform commands 和 unknown tools 必须在 envelope creation 前被拒绝或修复。
- Tool feedback 在 model continuation 前必须脱敏并有界。
- Policy denial 不得执行 tool，也不得伪装为普通成功。
- Cancellation 与 timeout 必须 abort queued/running tool work，并阻止后续 model continuation。

## Acceptance Strategy

- Unit tests cover DeepSeek tool-call chunk normalization, argument parsing, provider-specific repair, and result feedback formatting.
- Runtime tests cover no-tool, one-tool, multi-tool, repaired, rejected, denied, timeout, cancellation, provider failure, and loop-limit paths.
- Integration tests verify model -> tool -> continuation through kernel events.
- Golden tests snapshot event order and redaction metadata with deterministic IDs.
- Matrix tests cover Windows/macOS/Linux path repair and unsupported platform alternatives.
- E2E tests run CLI JSONL/text tool loops without network access.
- Live tests run only when `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1` and credentials are available.
- Acceptance evidence records all offline gates plus skipped/live-gated status.

- Unit tests 覆盖 DeepSeek tool-call chunk normalization、argument parsing、provider-specific repair 和 result feedback formatting。
- Runtime tests 覆盖 no-tool、one-tool、multi-tool、repaired、rejected、denied、timeout、cancellation、provider failure 和 loop-limit paths。
- Integration tests 验证 model -> tool -> continuation 经过 kernel events。
- Golden tests 用 deterministic IDs snapshot event order 和 redaction metadata。
- Matrix tests 覆盖 Windows/macOS/Linux path repair 与 unsupported platform alternatives。
- E2E tests 在无网络访问下运行 CLI JSONL/text tool loops。
- Live tests 仅在 `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1` 且 credentials 可用时运行。
- Acceptance evidence 记录所有 offline gates 以及 skipped/live-gated status。

## Open Questions

- Should first live tool projection be read-only by default, with write/process tools enabled behind an explicit policy profile?
- Should rejected tool feedback be sent back to the model for self-correction, or should some rejection classes terminate immediately?
- Should live tool tests use a fixed system prompt that asks DeepSeek to call a specific read-only tool, or should the provider request force tool choice where the API supports it?

- 第一版 live tool projection 是否默认只读，把 write/process tools 放在显式 policy profile 后面？
- 被拒绝的 tool feedback 是否都回传模型以便自我修正，还是部分 rejection classes 应立即终止？
- live tool tests 是否使用固定 system prompt 请求 DeepSeek 调用特定 read-only tool，还是在 API 支持时使用 forced tool choice？
