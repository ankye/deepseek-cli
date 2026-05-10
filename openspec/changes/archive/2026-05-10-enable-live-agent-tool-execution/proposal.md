## Why

DeepSeek CLI can already run deterministic tool-chain smoke tests, but the live product path still needs a strict contract for real model-emitted tool calls: normalize provider output, repair or reject unsafe inputs, execute through the governed runtime pipeline, and feed tool results back to the live model. This is the next launch-critical step because users will judge the product against Claude/Codex by whether it can safely inspect, edit, and test a real workspace rather than only stream text.

DeepSeek CLI 现在已经可以跑 deterministic tool-chain smoke tests，但真实产品路径还需要为 live model 发出的 tool calls 定义严格契约：归一化 provider 输出、修复或拒绝不安全输入、通过受治理 runtime pipeline 执行，并把 tool results 回传给 live model。这是下一个发布关键点，因为用户会用它是否能安全地检查、编辑和测试真实 workspace 来对标 Claude/Codex，而不只是看文本流输出。

## What Changes

- Add a live agent tool execution contract that treats provider tool calls as executable intents only after capability projection, tool preflight, policy/sandbox approval, scheduler execution, and replayable runtime event emission.
- Define live tool result feedback semantics: successful, repaired, rejected, denied, timed out, and failed tool results must be sent back to the model in a bounded provider-compatible format when the loop can continue.
- Add CLI/test entry points for live tool-loop validation that are gated by explicit environment flags and never run network tests by default.
- Add provider-specific repair hooks for DeepSeek OpenAI-like tool-call shapes while keeping common validation in platform-owned preflight rules.
- Add acceptance evidence for deterministic simulated tool calls, live-gated DeepSeek tool calls, unsafe tool rejection, cross-platform path repair, and JSONL event ordering.
- No legacy compatibility is required; old prompt flags or direct execution paths must not be restored.

- 增加 live agent tool execution contract：provider tool calls 只有经过 capability projection、tool preflight、policy/sandbox approval、scheduler execution 和 replayable runtime event emission 后，才能作为 executable intents 执行。
- 定义 live tool result feedback 语义：成功、已修复、已拒绝、被 policy 拒绝、超时和失败的 tool results，在 loop 可继续时都必须以有界 provider-compatible 格式回传给模型。
- 增加 CLI/test 入口用于 live tool-loop validation，并通过显式环境变量开关控制，默认测试不得访问网络。
- 增加 DeepSeek OpenAI-like tool-call shape 的 provider-specific repair hooks，同时把通用校验保留在平台级 preflight rules 中。
- 增加 deterministic simulated tool calls、live-gated DeepSeek tool calls、unsafe tool rejection、cross-platform path repair 和 JSONL event ordering 的验收证据。
- 不需要 legacy compatibility；不得恢复旧 prompt flags 或 direct execution paths。

## Capabilities

### New Capabilities

- `live-agent-tool-execution`: Live DeepSeek agent tool-call loop, including tool intent feedback, continuation rules, live-gated smoke tests, and terminal failure semantics.

### Modified Capabilities

- `model-gateway`: Require live DeepSeek tool-call normalization and provider-compatible tool result feedback without allowing provider adapters to execute tools directly.
- `runtime-event-loop`: Require live agent turns to iterate model -> tool intent -> governed execution -> tool feedback -> model continuation under explicit loop limits.
- `command-system`: Add live tool-loop CLI command behavior and gated test command semantics without restoring legacy CLI compatibility.
- `testing-regression`: Require deterministic and live-gated regression coverage for tool-call continuation, unsafe rejection, event ordering, and provider repair.

## Impact

- `src/packages/model-gateway`: DeepSeek/OpenAI SDK request/response normalization, tool result message formatting, live fixture transport tests.
- `src/packages/runtime`: Agent loop iteration, tool result feedback, terminal failure semantics, loop limits, cancellation/timeout propagation.
- `src/packages/tool-intent-preflight`: DeepSeek-specific repair rules plus platform-independent safety validation.
- `src/packages/core-coding-tools`: Model-visible tool projection and bounded result evidence.
- `src/apps/cli`: Explicit live tool-loop smoke command or `run --live --tools` behavior, JSONL/text rendering, exit codes.
- `tests/integration`, `tests/e2e`, `tests/golden`, `tests/live`, `tests/matrix`, and `tests/acceptance`: deterministic and gated live coverage.
- `docs` and README command references: user-facing explanation of live tool execution, safety boundaries, and how to run gated tests.
