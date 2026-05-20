# implement-layered-pipeline-cache

## Why

当前 context-engine 一次性投影整个上下文，prompt-assembly 一次性拼装完整请求。这导致：

1. **模型缓存命中率低** — 每次 turn 的 prompt 前缀都因节点重排或微小变化而失效，provider 侧 prefix cache 几乎无法命中。
2. **无管道背压** — tool result 过大时直接撑爆 budget，没有分层降级机制。
3. **不可组合** — 多宿主（CLI/VSCode/Server）无法复用同一套分层前缀，每个宿主都要重新拼装。

Unix 管道的核心是：上游不变，下游增量。LLM prefix cache 的条件是：前缀 token 序列完全一致。这两件事本质相同 — 把 context 按稳定性分层，每层是一个不可变 block，只有最末端是流动的。

The current context-engine projects the entire context in one shot, and prompt-assembly assembles the full request monolithically. This causes low model cache hit rates (prefix invalidation on every turn), no backpressure for oversized tool results, and poor composability across host surfaces.

The Unix pipe principle — upstream immutable, downstream incremental — maps directly to LLM prefix caching: a stable token prefix yields cache hits. By layering context into immutable blocks ordered by stability, we achieve both pipeline composability and high cache hit rates.

## What Changes

引入四层管道模型（Layered Context Pipeline），将 context projection → prompt assembly 改造为分层、不可变、内容寻址的管道架构。

Introduce a four-layer context pipeline that restructures context projection and prompt assembly into a layered, immutable, content-addressable pipeline architecture.

## Capabilities

### New Capabilities

| Capability | Description |
|-----------|-------------|
| `context.pipeline.layer-projection` | 按稳定性分层投影 context nodes 到 L0-L3 四层 |
| `context.pipeline.immutable-block` | 内容寻址的不可变 context block，带 hash 和 token count |
| `context.pipeline.prefix-stability` | 保证上层 block 不因下层变化而重排，最大化 prefix cache hit |
| `context.pipeline.backpressure` | 管道背压：下层超 budget 时降级而非拒绝整个投影 |
| `prompt.assembly.layered-weave` | prompt-assembly 按层拼装 messages，保持 cache_control 标记 |
| `model.gateway.cache-hint` | model-gateway 感知层级 hash，向 provider 传递 cache hint |

### Modified Capabilities

| Capability | Change |
|-----------|--------|
| `context.projection` | 输出从 flat `selectedNodes[]` 扩展为 `layers[0..3].blocks[]` |
| `prompt.assembly.section-pipeline` | section provider 改为 layer-aware，声明自己属于哪一层 |
| `memory.cache.projection-cache` | cache key 改为 per-layer fingerprint，支持部分命中 |

## Impact

### Affected Packages

| Package | Impact |
|---------|--------|
| `@deepseek/context-engine` | 核心改造：增加 layer classification + immutable block 输出 |
| `@deepseek/prompt-assembly` | 改造：section provider 声明 layer，weave 按层拼装 |
| `@deepseek/model-gateway` | 增强：传递 cache_control 标记到 provider request |
| `@deepseek/memory-cache-management` | 增强：per-layer cache key，部分命中支持 |
| `@deepseek/runtime` | 适配：agent-loop 传递 layer context 到 prompt-assembly |
| `@deepseek/platform-contracts` | 新增：LayerBlock, PipelineProjectionResult 类型 |
| `@deepseek/communication-protocol` | 新增：envelope 增加 prefix_hash 字段 |

### Affected APIs

- `ContextEngine.projectGraph()` — 返回值扩展 `layers` 字段
- `PromptAssembly.assemble()` — 输入接受 layered projection
- `ModelGateway.request()` — 请求体携带 cache_control

### Out of Scope

- 多模型 fork/join 管道（后续 openspec）
- 跨会话 layer 持久化（依赖 session-store 改造）
- Provider-specific cache API 对接（各 provider 实现不同，本期只做 hint 标记）
