## API Surface Model

The change separates DeepSeek API support into protocol lanes rather than hiding every feature behind the current chat-completions loop. The main agent loop continues to use OpenAI chat-completions. Beta chat prefix completion and FIM completion are separate execution shapes. Anthropic-compatible requests are a separate provider protocol lane, not a silent fallback inside the OpenAI lane.

本 change 将 DeepSeek API support 按 protocol lanes 拆开，而不是把所有功能都藏在当前 chat-completions loop 后面。主 agent loop 继续使用 OpenAI chat-completions。Beta chat prefix completion 与 FIM completion 是独立 execution shapes。Anthropic-compatible requests 是独立 provider protocol lane，不是 OpenAI lane 内部的静默 fallback。

## Thinking Mode

The runtime records the user-facing effort and provider-facing effort separately. The provider request must serialize only values accepted by the DeepSeek lane. If thinking is disabled, the provider request must not include a stale effort parameter.

runtime 分开记录 user-facing effort 与 provider-facing effort。provider request 只能序列化 DeepSeek lane 接受的 values。如果 thinking 被关闭，provider request 不得携带陈旧 effort 参数。

## Stateless Multi-Round Chat

DeepSeek chat-completions does not keep server-side conversational state. The CLI runtime owns message history selection, tool-result continuation, and lossless recovery. This means compaction, projection, and lossless context retrieval must produce the messages sent on each request; the provider must not assume DeepSeek remembers a previous request.

DeepSeek chat-completions 不保存 server-side conversational state。CLI runtime 负责 message history selection、tool-result continuation 与 lossless recovery。因此 compaction、projection 与 lossless context retrieval 必须产出每次请求发送的 messages；provider 不得假设 DeepSeek 记得之前的 request。

Codex/Claude-style runtimes make this concrete by treating memory, instructions, and tool state as client-side context engineering. DeepSeek CLI should follow the same principle: when a session resumes, the runtime must rebuild the provider request from persisted session records, selected history, lossless context references, and tool-result continuation records. A resumed request without replayable evidence is not a completed stateless-chat implementation.

Codex/Claude 风格 runtime 将 memory、instructions 与 tool state 视为 client-side context engineering。DeepSeek CLI 应遵循同一原则：session resume 时，runtime 必须从 persisted session records、selected history、lossless context references 与 tool-result continuation records 重建 provider request。没有 replayable evidence 的 resumed request 不能算完成 stateless-chat implementation。

## Cache Observability

Context disk cache is default server behavior, not a CLI toggle. The model gateway should normalize cache hit/miss usage fields when the provider returns them, and diagnostics should expose them as cost/latency signals. Cache metrics must not be scored as memory correctness.

Context disk cache 是默认 server behavior，不是 CLI toggle。model gateway 应在 provider 返回 cache hit/miss usage fields 时规范化这些字段，diagnostics 将其作为 cost/latency signals 展示。Cache metrics 不得被计为 memory correctness。

Provider request evidence should store redacted serialization summaries: lane, model, thinking control, effort mapping, message role sequence, tool-call/tool-result linkage, cache usage, and unsupported-feature diagnostics. It must not store raw API keys, raw reasoning traces, or full private prompt content unless a separate redacted evidence policy allows it.

provider request evidence 应存储脱敏 serialization summaries：lane、model、thinking control、effort mapping、message role sequence、tool-call/tool-result linkage、cache usage 与 unsupported-feature diagnostics。不得存储 raw API keys、raw reasoning traces 或完整 private prompt content，除非单独的脱敏 evidence policy 允许。

## Beta Features

Strict tool schemas, chat prefix completion, and FIM completion require explicit beta configuration and feature status. They must not be enabled implicitly for the normal agent loop. JSON output requires both provider parameter support and prompt-level guardrails because a response format flag alone is not enough to guarantee a usable JSON artifact.

Strict tool schemas、chat prefix completion 与 FIM completion 需要明确 beta configuration 与 feature status。它们不得在普通 agent loop 中被隐式开启。JSON output 同时需要 provider parameter support 与 prompt-level guardrails，因为仅靠 response format flag 不足以保证可用 JSON artifact。

## Anthropic Compatibility

The Anthropic-compatible DeepSeek endpoint is useful for ecosystem compatibility, but its supported content blocks and fields differ from full Anthropic behavior. The CLI must represent those gaps explicitly in contracts and diagnostics instead of silently accepting unsupported content blocks.

Anthropic-compatible DeepSeek endpoint 对生态兼容有价值，但其支持的 content blocks 与 fields 不等同于完整 Anthropic behavior。CLI 必须在 contracts 与 diagnostics 中显式表达这些差异，而不是静默接受 unsupported content blocks。
