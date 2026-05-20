## Why

DeepSeek already has context projection, prompt assembly, model usage cache metadata, memory/cache managers, and a runtime message bus, but the model request is still effectively assembled as one volatile prompt shape. / DeepSeek 已有 context projection、prompt assembly、model usage cache metadata、memory/cache managers 与 runtime message bus，但模型请求实际上仍被组装成一个易变的整体 prompt 形态。

To get Linux-pipe-like data flow and materially improve model prefix-cache hit rates, DeepSeek needs an immutable layered context pipeline where stable upstream blocks are content-addressed, ordered, replayable, and never reshuffled by volatile downstream turns. / 为了获得类似 Linux pipe 的数据流并显著提高模型前缀缓存命中率，DeepSeek 需要一套不可变分层 context pipeline：稳定上游块必须 content-addressed、有序、可 replay，且绝不被易变下游回合重排。

## What Changes

- Add a context pipeline and prefix cache capability that models context as immutable ordered blocks across kernel, project, session, and current-turn layers. / 增加 context pipeline 与 prefix cache 能力，把 context 建模为跨 kernel、project、session 与 current-turn 层的不可变有序块。
- Add content-addressable `ContextBlock`/pipeline manifest contracts with block hash, layer id, token estimate, dependency fingerprints, cache hints, redaction metadata, and replay metadata. / 增加 content-addressable `ContextBlock`/pipeline manifest 契约，包含 block hash、layer id、token estimate、dependency fingerprints、cache hints、redaction metadata 与 replay metadata。
- Change context projection from monolithic selection output toward pipeline stage output that preserves stable prefix order and reports prefix hashes per layer. / 将 context projection 从整体 selection output 推向 pipeline stage output，保持稳定前缀顺序并按层报告 prefix hashes。
- Change prompt assembly to consume pipeline manifests and preserve layer ordering rather than rebuilding or reordering upstream context. / 改造 prompt assembly，使其消费 pipeline manifest 并保持层顺序，而不是重建或重排上游 context。
- Extend model gateway request planning so provider adapters can translate provider-neutral cache hints into supported provider cache controls and always normalize cache hit/miss usage metrics. / 扩展 model gateway request planning，使 provider adapter 能将 provider-neutral cache hints 转换为受支持 provider 的 cache controls，并始终归一化 cache hit/miss usage metrics。
- Extend communication protocol/runtime event metadata with prefix hashes and pipeline fingerprints so hosts, replay, diagnostics, and tests can reason about cache stability. / 用 prefix hashes 与 pipeline fingerprints 扩展 communication protocol/runtime event metadata，使 host、replay、diagnostics 与 tests 能判断缓存稳定性。
- Expose cache and context telemetry for CLI/TUI status surfaces, including cache hit rate, selected model, thinking mode, context size, and context budget pressure. / 为 CLI/TUI 状态表面暴露 cache 与 context telemetry，包括缓存命中率、当前模型、思考模式、上下文大小与 context budget pressure。
- Add runtime-message-bus backpressure semantics for large context/tool-result streams so volatile data does not pollute stable prefix layers. / 为大型 context/tool-result streams 增加 runtime-message-bus backpressure 语义，避免易变数据污染稳定前缀层。
- No breaking CLI behavior in the first slice; initial implementation can run behind diagnostics and deterministic tests before provider-specific cache controls are enabled. / 第一阶段不破坏 CLI 行为；初始实现可先在 diagnostics 与确定性测试后面运行，再启用 provider-specific cache controls。

## Capabilities

### New Capabilities

- `context-pipeline-prefix-cache`: Immutable layered context pipeline, content-addressable context blocks, prefix hash manifests, cache hints, backpressure, and cache-hit evidence for model request assembly. / 不可变分层 context pipeline、content-addressable context blocks、prefix hash manifests、cache hints、backpressure 与模型请求组装的 cache-hit evidence。

### Modified Capabilities

- `platform-contracts`: Add provider-neutral DTOs for context blocks, pipeline layers, prefix hashes, cache hints, and pipeline manifests. / 增加 context blocks、pipeline layers、prefix hashes、cache hints 与 pipeline manifests 的 provider-neutral DTO。
- `context-engine`: Project context into stable pipeline layers and immutable blocks while preserving existing selection, budget, redaction, cache, and exclusion rules. / 将 context 投影为稳定 pipeline layers 与不可变 blocks，同时保留现有 selection、budget、redaction、cache 与 exclusion rules。
- `prompt-assembly`: Consume pipeline manifests and maintain stable prefix ordering for model-visible sections. / 消费 pipeline manifests，并维护 model-visible sections 的稳定前缀顺序。
- `model-gateway`: Translate provider-neutral cache hints into provider-specific request metadata when supported and normalize cache hit/miss metrics. / 在 provider 支持时将 provider-neutral cache hints 转换为 provider-specific request metadata，并归一化 cache hit/miss metrics。
- `communication-protocol`: Carry prefix hashes, pipeline fingerprint, and cache evidence through host/runtime envelopes without exposing raw context content. / 通过 host/runtime envelopes 携带 prefix hashes、pipeline fingerprint 与 cache evidence，且不暴露 raw context content。
- `runtime-message-bus`: Add bounded context-stream/backpressure events for pipeline block transfer and tool-result projection. / 为 pipeline block transfer 与 tool-result projection 增加有界 context-stream/backpressure events。
- `memory-cache-management`: Store and retrieve immutable context blocks and prefix manifests through content-addressed cache records. / 通过 content-addressed cache records 存取不可变 context blocks 与 prefix manifests。
- `runtime-event-loop`: Build model requests from the layered pipeline so stable upstream blocks remain ordered and current-turn volatility stays last. / 从分层 pipeline 构建模型请求，使稳定上游块保持有序，current-turn 易变内容始终位于最后。
- `chat-tui-workbench-interaction`: Display pipeline telemetry in the CLI statusline without triggering model calls or exposing raw context content. / 在 CLI statusline 展示 pipeline telemetry，且不触发模型调用、不暴露 raw context content。
- `testing-regression`: Add deterministic cache-hit, prefix-stability, compaction, backpressure, and replay fixtures. / 增加确定性 cache-hit、prefix-stability、compaction、backpressure 与 replay fixtures。

## Impact

- Owner packages / 责任包: `platform-contracts`, `context-engine`, `prompt-assembly`, `model-gateway`, `communication-protocol`, `runtime-message-bus`, `memory-cache-management`, `runtime`, `testing-regression`.
- Product surface / 产品表面: CLI-first model request construction and diagnostics; no immediate VSCode/server product surface. / CLI-first 模型请求构建与 diagnostics；不立即扩展 VSCode/server 产品面。
- CLI status surface / CLI 状态表面: statusline should show cache hit rate, selected model, thinking mode, context size/token budget, and prefix stability state from bounded telemetry. / statusline 应从有界 telemetry 展示缓存命中率、当前模型、思考模式、上下文大小/token budget 与 prefix stability 状态。
- Protocol impact / 协议影响: additive metadata for prefix hashes, pipeline fingerprints, and cache evidence. / 对 prefix hashes、pipeline fingerprints 与 cache evidence 做 additive metadata 扩展。
- Provider impact / Provider 影响: provider-neutral cache hints first; provider-specific explicit cache controls only when capability metadata says supported. / 先做 provider-neutral cache hints；只有 capability metadata 声明支持时才启用 provider-specific explicit cache controls。
- Data/privacy class / 数据与隐私等级: local/sensitive; raw context blocks remain governed by redaction metadata, and public events carry hashes/previews rather than raw block content. / local/sensitive；raw context blocks 受 redaction metadata 治理，公开事件携带 hash/preview 而不是 raw block content。
