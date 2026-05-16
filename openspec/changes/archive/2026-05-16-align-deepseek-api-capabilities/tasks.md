## 1. Discovery / 调研

- [x] 1.1 Review DeepSeek official docs for thinking mode, multi-round chat, tool calls, context disk cache, chat prefix completion, FIM completion, JSON output, and Anthropic API compatibility.
- [x] 1.2 Split official API features into delivered, partial, beta planned, and unsupported/unimplemented buckets.

## 2. Thinking Mode / 思考模式

- [x] 2.1 Map user-facing DeepSeek `low` and `medium` efforts to provider `high`, and `xhigh` to provider `max`.
- [x] 2.2 Ensure disabled thinking sends `thinking.type=disabled` without stale `reasoning_effort`.
- [x] 2.3 Add provider and runtime tests for DeepSeek thinking effort mapping.
- [x] 2.4 Add CLI/user-facing controls for enabling/disabling thinking and selecting effort without relying on hard-coded live defaults.

## 3. Stateless Multi-Round And Tool Calls / 无状态多轮与工具调用

- [x] 3.1 Preserve model reasoning content for thinking-mode tool-call continuation.
- [x] 3.2 Serialize assistant tool calls and tool result messages in OpenAI chat-completions format.
- [x] 3.3 Add regression evidence that resumed CLI sessions rebuild the model request history required by DeepSeek's stateless API.
- [x] 3.4 Add a strict beta tool-schema lane with explicit beta base URL, supported-schema validation, and honest diagnostics for unsupported schema keywords.
- [x] 3.5 Add redacted provider-request replay evidence covering message role sequence, tool-call/tool-result linkage, lossless context references, and reasoning continuation status.

## 4. Cache Observability / 缓存可观测性

- [x] 4.1 Normalize DeepSeek `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens` into model usage metadata.
- [x] 4.2 Surface cache hit/miss metrics in diagnostics and live evidence without treating them as memory correctness or delivery score proof.
- [x] 4.3 Add live smoke evidence that `stream_options.include_usage` captures cache fields when the provider returns them.
- [x] 4.4 Add diagnostics proving cache hits do not satisfy resumed-history, lossless-recovery, or permanent-memory gates.

## 5. JSON Output / JSON 输出

- [x] 5.1 Add a typed JSON output request mode that sets `response_format: { type: "json_object" }`.
- [x] 5.2 Add prompt assembly guardrails that require the request prompt to name JSON and include an output shape before enabling JSON output.
- [x] 5.3 Add parser verification and retry/failure evidence for empty content, truncation, and invalid JSON.

## 6. Beta Completion Lanes / Beta 补全通道

- [x] 6.1 Add a contract and provider method for chat prefix completion with an explicit assistant prefix message and beta base URL.
- [x] 6.2 Add a contract and provider method for FIM completion using prefix, optional suffix, and bounded max completion length.
- [x] 6.3 Keep beta completion lanes out of normal agent-loop delivery scoring until implementation and live evidence exist.

## 7. Anthropic Compatibility / Anthropic 兼容

- [x] 7.1 Add an explicit DeepSeek Anthropic-compatible provider lane or mark it `not_assessed` in delivery diagnostics.
- [x] 7.2 Validate unsupported Anthropic content blocks and fields before dispatch.
- [x] 7.3 Add tests proving thinking effort maps to `output_config.effort` for the Anthropic lane when that lane exists.

## 8. Verification / 验证

- [x] 8.1 Run `openspec validate align-deepseek-api-capabilities --strict`.
- [x] 8.2 Run typecheck, lint, focused provider/runtime tests, and the relevant acceptance checks.
- [x] 8.3 Update delivery capability reporting so partial API alignment cannot inflate real DeepSeek delivery scores.
