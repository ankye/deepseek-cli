## Why

DeepSeek CLI is now close enough to real live delivery that API-level mismatches become product blockers, not polish issues. The official DeepSeek API surface includes thinking-mode controls, stateless multi-round chat, tool calls and beta strict schemas, JSON output, context disk-cache usage metadata, beta chat prefix completion, beta FIM completion, and an Anthropic-compatible endpoint. Some of these are already partially implemented in the model gateway, while others are not implemented and must not be counted as delivered.

DeepSeek CLI 已经接近真实 live 交付，因此 API 层面的不一致不再是细节问题，而是产品阻塞。DeepSeek 官方 API surface 包含 thinking-mode controls、无状态 multi-round chat、tool calls 与 beta strict schemas、JSON output、context disk-cache usage metadata、beta chat prefix completion、beta FIM completion，以及 Anthropic-compatible endpoint。其中一部分已在 model gateway 中部分实现，另一部分尚未实现，不能计入已交付。

## What Changes

- Align thinking-mode request serialization with DeepSeek's supported OpenAI-format controls: `thinking.type` plus provider-supported `reasoning_effort` values.
- 将 thinking-mode request serialization 与 DeepSeek 支持的 OpenAI 格式控制对齐：`thinking.type` 加 provider 支持的 `reasoning_effort` values。
- Treat DeepSeek `/chat/completions` as stateless: runtime-owned multi-round history, tool-call messages, tool results, and required thinking continuations must be serialized by the CLI on every request.
- 将 DeepSeek `/chat/completions` 视为无状态：runtime 必须在每次请求中自行序列化 multi-round history、tool-call messages、tool results 与必要的 thinking continuations。
- Preserve context disk-cache metadata as observability only. Cache hit/miss evidence may improve cost and latency visibility, but it does not prove memory, correctness, or delivery completion by itself.
- 将 context disk-cache metadata 仅作为 observability。Cache hit/miss evidence 可以改善成本与延迟可见性，但不能单独证明 memory、correctness 或 delivery completion。
- Add explicit contracts for beta-only features: strict tool schemas, chat prefix completion, FIM completion, JSON output guardrails, and Anthropic-compatible requests.
- 为 beta-only features 增加明确契约：strict tool schemas、chat prefix completion、FIM completion、JSON output guardrails 与 Anthropic-compatible requests。
- Keep delivery reporting honest: features without implementation and live evidence remain `planned` or `not_assessed`, not passed.
- 保持交付报告诚实：没有 implementation 与 live evidence 的功能保持 `planned` 或 `not_assessed`，不得标记为 passed。

## Current Implementation Notes

- OpenAI chat-completions streaming, basic tool calls, reasoning chunks, reasoning continuation for tool-call turns, and DeepSeek cache usage normalization already exist.
- OpenAI chat-completions streaming、基础 tool calls、reasoning chunks、tool-call turns 的 reasoning continuation，以及 DeepSeek cache usage normalization 已经存在。
- Thinking effort mapping is being corrected so user-facing `low` and `medium` do not leak to the DeepSeek request as unsupported provider values.
- Thinking effort mapping 正在修正，确保 user-facing `low` 与 `medium` 不会作为不支持的 provider values 泄漏到 DeepSeek request。
- FIM completion, chat prefix completion, JSON output as a first-class guarded mode, strict beta tool schema gating, and Anthropic-compatible request mode are not yet complete.
- FIM completion、chat prefix completion、作为一等 guarded mode 的 JSON output、strict beta tool schema gating，以及 Anthropic-compatible request mode 尚未完成。

## Codex/Claude Reference Lessons / Codex 与 Claude 参考经验

- Treat provider APIs as stateless execution lanes. Codex/Claude-style agent runtimes keep recoverable conversation state, tool-result continuity, and memory/retrieval policy on the client side instead of assuming the model provider remembers prior requests.
- 将 provider APIs 视为无状态 execution lanes。Codex/Claude 风格 agent runtime 将可恢复 conversation state、tool-result continuity 与 memory/retrieval policy 放在 client side，而不是假设模型 provider 记得之前请求。
- Keep model cache metrics separate from memory and correctness. Cache hits can explain cost/latency, but cannot prove that the next request contains the right history or that the agent can recover old tool results.
- 将 model cache metrics 与 memory/correctness 分离。cache hits 可以解释成本/延迟，但不能证明下一次 request 包含正确历史，也不能证明 agent 能恢复旧 tool results。
- Preserve redacted request/response replay evidence. For live delivery, the team needs enough bounded evidence to reproduce provider serialization choices without leaking credentials or raw reasoning text.
- 保留脱敏后的 request/response replay evidence。真实交付需要足够有界的证据来复现 provider serialization choices，同时不泄漏 credentials 或 raw reasoning text。
- Keep beta and compatibility lanes explicit. Do not hide prefix/FIM/Anthropic-compatible behavior behind the normal chat loop.
- 保持 beta 与 compatibility lanes 显式。不要把 prefix/FIM/Anthropic-compatible behavior 藏在普通 chat loop 后面。

## Reference Docs / 参考文档

- DeepSeek Thinking Mode: https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
- DeepSeek Multi-round Chat: https://api-docs.deepseek.com/zh-cn/guides/multi_round_chat
- DeepSeek Tool Calls: https://api-docs.deepseek.com/zh-cn/guides/tool_calls
- DeepSeek Context Disk Cache: https://api-docs.deepseek.com/zh-cn/guides/kv_cache
- DeepSeek Chat Prefix Completion: https://api-docs.deepseek.com/zh-cn/guides/chat_prefix_completion
- DeepSeek FIM Completion: https://api-docs.deepseek.com/zh-cn/guides/fim_completion
- DeepSeek JSON Output: https://api-docs.deepseek.com/zh-cn/guides/json_mode
- DeepSeek Anthropic API: https://api-docs.deepseek.com/zh-cn/guides/anthropic_api

## Impact

- Affected packages: `src/packages/model-gateway`, `src/packages/runtime`, `src/packages/prompt-assembly`, `src/packages/platform-contracts`, `src/apps/cli`, `src/packages/testing-regression`.
- 影响包：`src/packages/model-gateway`、`src/packages/runtime`、`src/packages/prompt-assembly`、`src/packages/platform-contracts`、`src/apps/cli`、`src/packages/testing-regression`。
- Affected evidence: provider request tests, reasoning continuation tests, live provider smoke evidence, live tool-loop evidence, diagnostics delivery reports, and package scorecards.
- 影响证据：provider request tests、reasoning continuation tests、live provider smoke evidence、live tool-loop evidence、diagnostics delivery reports 与 package scorecards。
- Live execution remains opt-in and must never leak raw credentials or raw reasoning text into public logs.
- Live execution 仍然必须显式开启，并且绝不能向 public logs 泄漏 raw credentials 或 raw reasoning text。
