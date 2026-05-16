# deepseek-api-alignment Specification

## Purpose
TBD - created by archiving change align-deepseek-api-capabilities. Update Purpose after archive.
## Requirements
### Requirement: Thinking Mode Serialization Matches DeepSeek Provider Values / 思考模式序列化匹配 DeepSeek Provider Values

The model gateway SHALL serialize DeepSeek thinking mode using an explicit `thinking.type` control and only provider-supported thinking effort values for the active protocol lane.

model gateway 必须使用明确的 `thinking.type` control 序列化 DeepSeek thinking mode，并且只发送 active protocol lane 支持的 provider thinking effort values。

#### Scenario: User effort is mapped before provider dispatch / 用户 Effort 在 Provider Dispatch 前映射

- **WHEN** a runtime request asks for user-facing `low` or `medium` thinking effort on the DeepSeek OpenAI lane
- **THEN** the provider request uses provider effort `high`
- **AND** the runtime evidence records both requested and provider effort values
- **中文** 当 runtime request 在 DeepSeek OpenAI lane 请求 user-facing `low` 或 `medium` thinking effort 时，provider request 必须使用 provider effort `high`；runtime evidence 必须同时记录 requested 与 provider effort values。

#### Scenario: Disabled thinking omits stale effort / 关闭思考时不携带陈旧 Effort

- **WHEN** thinking is disabled for a DeepSeek request
- **THEN** the provider request sets thinking disabled and omits reasoning effort
- **中文** 当 DeepSeek request 关闭 thinking 时，provider request 必须设置 thinking disabled，并且省略 reasoning effort。

### Requirement: Runtime Owns Stateless Multi-Round History / Runtime 负责无状态多轮历史

The runtime SHALL treat DeepSeek chat-completions as stateless and send the selected conversation history, assistant tool calls, tool results, and required reasoning continuation fields on every model request.

runtime 必须将 DeepSeek chat-completions 视为无状态，并在每次 model request 中发送选中的 conversation history、assistant tool calls、tool results 与必要的 reasoning continuation fields。

#### Scenario: Tool-call thinking continuation survives later requests / Tool-Call 思考续传保留到后续请求

- **WHEN** a DeepSeek thinking-mode response performs a tool call
- **THEN** the assistant tool-call message retained for continuation includes the required reasoning content with internal redaction metadata
- **AND** later requests include that continuation content when needed for provider validity
- **中文** 当 DeepSeek thinking-mode response 执行 tool call 时，保留用于 continuation 的 assistant tool-call message 必须包含所需 reasoning content 与 internal redaction metadata；后续请求在 provider validity 需要时必须包含该 continuation content。

#### Scenario: Resumed session rebuilds stateless request / 恢复会话重建无状态请求

- **WHEN** a CLI session is resumed after process restart
- **AND** the next DeepSeek request depends on prior user turns, assistant tool calls, tool results, or lossless context references
- **THEN** the runtime rebuilds the provider request from persisted client-side records
- **AND** emits redacted replay evidence for message role sequence, tool-call/tool-result linkage, selected history, lossless context references, and reasoning continuation status
- **中文** 当 CLI session 在进程重启后恢复，且下一次 DeepSeek request 依赖 prior user turns、assistant tool calls、tool results 或 lossless context references 时，runtime 必须从持久化 client-side records 重建 provider request，并发出脱敏 replay evidence，包含 message role sequence、tool-call/tool-result linkage、selected history、lossless context references 与 reasoning continuation status。

### Requirement: Cache Metrics Are Observability, Not Memory Correctness / 缓存指标是可观测性而非记忆正确性

The system SHALL normalize DeepSeek context disk-cache hit/miss usage fields when present, but SHALL NOT treat cache hits as proof that the model remembered prior instructions, tool results, or decisions.

系统必须在 DeepSeek 返回 context disk-cache hit/miss usage fields 时将其规范化，但不得将 cache hits 当作模型记住 prior instructions、tool results 或 decisions 的证明。

#### Scenario: Cache hit does not pass memory gate / Cache Hit 不通过记忆门禁

- **WHEN** a live response reports prompt cache hit tokens
- **THEN** diagnostics may report cache usage for cost and latency visibility
- **BUT** delivery memory gates still require durable context, request history, or retrieval evidence
- **中文** 当 live response 报告 prompt cache hit tokens 时，diagnostics 可以展示 cache usage 以说明成本与延迟；但 delivery memory gates 仍必须要求 durable context、request history 或 retrieval evidence。

### Requirement: Beta DeepSeek Features Require Explicit Lanes / Beta DeepSeek 功能需要显式通道

The CLI SHALL expose beta-only DeepSeek features only through explicit contracts and configuration, and SHALL NOT silently count those features as available in the normal agent loop.

CLI 必须仅通过明确 contracts 与 configuration 暴露 beta-only DeepSeek features，并且不得在普通 agent loop 中静默将这些功能计为可用。

#### Scenario: Prefix and FIM are not chat-loop fallbacks / Prefix 与 FIM 不是 Chat Loop Fallback

- **WHEN** a task requires chat prefix completion or FIM completion
- **THEN** the request uses the corresponding beta execution lane or reports the feature as unavailable
- **AND** the normal agent loop does not claim it completed that API capability
- **中文** 当任务需要 chat prefix completion 或 FIM completion 时，request 必须使用对应 beta execution lane，或报告该 feature unavailable；普通 agent loop 不得声称已经完成该 API capability。

### Requirement: JSON Output Requires Provider Parameter And Prompt Guard / JSON 输出需要 Provider 参数与 Prompt Guard

The system SHALL only enable DeepSeek JSON output mode when it can set the provider response format and verify the prompt contains an explicit JSON instruction and expected shape.

系统只有在可以设置 provider response format，并验证 prompt 包含明确 JSON instruction 与 expected shape 时，才可启用 DeepSeek JSON output mode。

#### Scenario: JSON flag alone is insufficient / 仅有 JSON Flag 不足

- **WHEN** a caller requests JSON output but the prompt lacks an explicit JSON instruction or output shape
- **THEN** prompt assembly or preflight rejects or repairs the request before provider dispatch
- **中文** 当 caller 请求 JSON output 但 prompt 缺少明确 JSON instruction 或 output shape 时，prompt assembly 或 preflight 必须在 provider dispatch 前拒绝或修复该请求。

### Requirement: Anthropic Compatibility Is Separate And Honest / Anthropic 兼容独立且诚实

The system SHALL represent DeepSeek Anthropic-compatible support as a separate provider lane with explicit field and content-block compatibility diagnostics.

系统必须将 DeepSeek Anthropic-compatible support 表示为独立 provider lane，并提供明确 field 与 content-block compatibility diagnostics。

#### Scenario: Unsupported Anthropic content is blocked before dispatch / 不支持的 Anthropic Content Dispatch 前阻止

- **WHEN** a request contains Anthropic content blocks or fields unsupported by the DeepSeek Anthropic lane
- **THEN** the provider lane returns a typed unsupported-feature diagnostic instead of silently dropping the content
- **中文** 当 request 包含 DeepSeek Anthropic lane 不支持的 Anthropic content blocks 或 fields 时，provider lane 必须返回 typed unsupported-feature diagnostic，而不是静默丢弃内容。

