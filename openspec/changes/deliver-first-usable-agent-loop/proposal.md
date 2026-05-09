## Why

DeepSeek CLI already has the platform kernel, provider boundary, governed tools, skills, hooks, MCP gateway, and host-neutral contracts, but users still need a single visible product loop that turns those platform pieces into a usable coding-agent experience.

DeepSeek CLI 目前已经具备 platform kernel、provider boundary、governed tools、skills、hooks、MCP gateway 和 host-neutral contracts，但用户仍然需要一个可见的产品闭环，把这些平台能力串成真正可用的 coding-agent experience。

This change defines the first usable agent loop so the project can move from framework infrastructure to a testable product surface comparable to Claude Code and Codex while preserving DeepSeek's future-ready governance boundaries.

本变更定义第一个可用 agent loop，使项目从基础设施框架进入可测试的产品界面，并在对标 Claude Code 与 Codex 的同时保留 DeepSeek 面向未来的治理边界。

## What Changes

- Add `deepseek chat` as an interactive session command that streams one or more turns through the governed runtime.
- Add `deepseek run "<task>"` as a non-interactive one-shot task command suitable for scripts, CI, and regression tests.
- Route model dispatch, model events, tool-call intents, tool execution, tool results, retries, terminal events, and trace metadata through one canonical agent loop.
- Require model-visible tool projection to be derived from registered executable capabilities and policy state, not from host-local command lists.
- Require tool-call repair and preflight validation before execution, including provider-specific normalization for DeepSeek OpenAI-compatible outputs.
- Expose a stable CLI event presentation contract with human-readable streaming output and machine-readable JSON/JSONL modes.
- Add deterministic tests, golden replay fixtures, live-provider smoke gates, and CLI e2e coverage for the first usable agent loop.
- Because the product is pre-release, no legacy CLI compatibility is preserved: old prompt flags and stream names are replaced by the explicit `run`/`chat` and `text`/`json`/`jsonl` contracts.
- Legacy/direct execution paths remain forbidden by lint and tests.

- 新增 `deepseek chat` 交互式会话命令，通过受治理 runtime 串流一个或多个 turn。
- 新增 `deepseek run "<task>"` 非交互一次性任务命令，面向脚本、CI 和回归测试。
- 通过唯一 canonical agent loop 路由 model dispatch、model events、tool-call intents、tool execution、tool results、retry、terminal events 和 trace metadata。
- 要求 model-visible tool projection 来源于已注册 executable capabilities 与 policy state，而不是 host-local command lists。
- 要求工具调用执行前经过 repair 与 preflight validation，包括 DeepSeek OpenAI-compatible outputs 的 provider-specific normalization。
- 暴露稳定 CLI event presentation contract，支持 human-readable streaming output 与 machine-readable JSON/JSONL modes。
- 增加 deterministic tests、golden replay fixtures、live-provider smoke gates 和 CLI e2e 覆盖。
- 因为产品仍处于 pre-release，不保留旧 CLI 兼容：旧 prompt flags 与 stream names 被显式 `run`/`chat` 和 `text`/`json`/`jsonl` 契约替换。
- lint 与测试继续禁止 legacy/direct execution paths。

## Capabilities

### New Capabilities

- `agent-loop`: Product-level user turn loop covering chat/run entry points, model/tool iteration, event presentation, and acceptance semantics.

### Modified Capabilities

- `runtime-event-loop`: Require runtime turns to execute the full model-tool loop through the kernel and emit canonical loop events.
- `model-gateway`: Require DeepSeek tool-call intent normalization, repair hooks, and live provider behavior needed by the usable loop.
- `core-coding-tools`: Require built-in tools to be projectable and executable from model tool calls with preflight evidence.
- `command-system`: Require CLI commands for interactive chat and one-shot run to use runtime/protocol boundaries only.
- `testing-regression`: Require deterministic, golden, e2e, and optional live-provider coverage for the agent loop.
- `observability-privacy`: Require trace correlation, redaction, and user-safe event presentation for agent loop runs.
- `capability-execution-governance`: Require every model-requested tool execution to pass through envelope, policy, scheduler, timeout, retry, and evidence boundaries.

## Impact

- Affected apps: `src/apps/cli`.
- Affected packages: `runtime`, `model-gateway`, `core-coding-tools`, `command-system`, `capability-registry`, `capability-execution-governance`, `testing-regression`, `observability`, `platform-contracts`.
- Affected specs and docs: runtime event loop, model gateway, command system, testing/regression, observability/privacy, product roadmap, README and developer docs.
- Dependencies: no new provider SDK is required beyond the existing OpenAI SDK-backed DeepSeek transport unless implementation finds a missing streaming capability.
- Operational impact: default tests remain deterministic and network-free; live DeepSeek API tests must be opt-in and gated by explicit environment variables.
