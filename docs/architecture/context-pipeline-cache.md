# Context Pipeline And Prefix Cache / 上下文管道与前缀缓存

This document defines the cache-optimized context pipeline design for DeepSeek CLI. It complements the archived OpenSpec change `openspec/changes/archive/2026-05-20-introduce-context-pipeline-prefix-cache` and the canonical spec `openspec/specs/context-pipeline-prefix-cache/spec.md`.

本文定义 DeepSeek CLI 的缓存优化上下文管道设计。它配合已归档 OpenSpec 变更 `openspec/changes/archive/2026-05-20-introduce-context-pipeline-prefix-cache` 与规范 spec `openspec/specs/context-pipeline-prefix-cache/spec.md`。

## Core Thesis / 核心判断

Do not optimize prompt strings first. Define a stable context pipe ABI first.

不要先优化 prompt 字符串。先定义稳定的 context pipe ABI。

Model prefix caching rewards one thing: the longest unchanged prefix token sequence. A monolithic prompt builder makes that prefix fragile because any new evidence, reordered section, or large tool output can shift tokens near the top. A layered pipeline makes stable upstream context reusable and keeps volatile turn data at the tail.

模型前缀缓存奖励的是最长的不变前缀 token 序列。整体式 prompt builder 会让此前缀很脆弱，因为任何新证据、section 重排或大型工具输出都可能移动顶部 token。分层管道让稳定上游 context 可复用，并把易变 turn 数据留在尾部。

The Linux analogy is useful because pipes and page cache share the same discipline:

Linux 类比之所以有用，是因为 pipe 与 page cache 共享同一种约束：

- stable identity / 稳定身份
- ordered delivery / 有序传递
- bounded buffers / 有界 buffer
- backpressure / 背压
- append-only history where possible / 尽量追加式历史
- content reuse by reference rather than copying / 通过引用复用内容，而不是复制内容

## Goals / 目标

- Preserve stable prefix ordering across turns. / 跨 turn 保持稳定前缀顺序。
- Increase provider prefix-cache hit opportunity. / 提高 provider 前缀缓存命中机会。
- Represent reusable context as immutable content-addressed blocks. / 将可复用 context 表示为不可变内容寻址块。
- Keep current-turn volatility at the tail. / 将当前回合易变内容保持在尾部。
- Prevent raw large tool results from polluting stable session context. / 防止大型 raw tool results 污染稳定 session context。
- Make cache behavior measurable through prefix hashes and usage evidence. / 通过 prefix hash 与 usage evidence 让缓存行为可度量。

## Non-Goals / 非目标

- Do not require any single provider to support explicit cache-control fields. / 不要求任何单一 provider 支持显式 cache-control 字段。
- Do not move provider-specific request shape into runtime or prompt assembly. / 不把 provider-specific request shape 移入 runtime 或 prompt assembly。
- Do not make prompt assembly read files, query PageIndex, call ZVec, or inspect host UI state directly. / 不让 prompt assembly 直接读文件、查询 PageIndex、调用 ZVec 或检查 host UI state。
- Do not globally reorder all evidence by one-turn relevance if it breaks prefix stability. / 如果会破坏前缀稳定性，不按单回合相关性全局重排全部证据。

## Layer Model / 分层模型

The model-visible request is assembled from four canonical layers:

模型可见请求由四个规范层组装：

```text
┌─────────────────────────────────────────────────────────────┐
│ Layer 0: Kernel Prefix                                      │
│ system rules, runtime contracts, stable tool schema summary │
│ 系统规则、runtime 契约、稳定工具 schema 摘要                 │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Project Prefix                                     │
│ AGENTS.md, package map, repo facts, project memory          │
│ AGENTS.md、package map、仓库事实、项目记忆                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Session Pipe                                       │
│ append-only turn summaries, compacted tool evidence         │
│ 追加式回合摘要、压缩后的工具证据                            │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Current Turn Tail                                  │
│ user input, selection, volatile full tool result            │
│ 用户输入、选择区、易变完整工具结果                          │
└─────────────────────────────────────────────────────────────┘
```

Layer order is an ABI. Lower layers must not depend on higher layers, and higher layers must not cause lower layers to be reordered.

层顺序就是 ABI。低层不得依赖高层，高层也不得导致低层重排。

## Data Model / 数据模型

The names below are architectural names. Exact TypeScript DTO names are defined by the OpenSpec implementation.

以下名称是架构名称。精确 TypeScript DTO 名由 OpenSpec 实现确定。

```ts
type ContextPipelineLayerId = "kernel" | "project" | "session" | "current-turn";

interface ContextBlock {
  id: string;
  layerId: ContextPipelineLayerId;
  hash: string;
  contentRef: string;
  tokenEstimate: number;
  dependencyFingerprints: readonly string[];
  cacheHint: ContextCacheHint;
  provenance: Record<string, unknown>;
  redaction: Record<string, unknown>;
  replayFingerprint: string;
}

interface ContextCacheHint {
  mode: "stable" | "ephemeral" | "no-store";
  ttlSeconds?: number;
  freshness?: "fresh" | "stale" | "unknown";
}

interface ContextPrefixHash {
  layerId: ContextPipelineLayerId;
  blockCount: number;
  tokenEstimate: number;
  hash: string;
}

interface ContextPipelineManifest {
  schemaVersion: string;
  sessionId: string;
  turnId: string;
  layers: readonly {
    id: ContextPipelineLayerId;
    blocks: readonly string[];
    prefixHash: ContextPrefixHash;
  }[];
  pipelineFingerprint: string;
  includedBlockCount: number;
  excludedBlockCount: number;
  tokenEstimate: number;
  cacheHintSummary: Record<string, unknown>;
  redaction: Record<string, unknown>;
}
```

## Pipeline Flow / 管道流

The runtime turn should move context through a deterministic pipeline:

runtime 回合应通过确定性管道移动 context：

```text
candidate collection
  -> context projection
  -> immutable block projection
  -> prefix manifest
  -> prompt assembly
  -> model gateway request planning
  -> provider response usage normalization
  -> cache evidence and diagnostics
```

Package responsibilities:

包责任：

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `platform-contracts` | Defines pipeline DTOs, cache hints, prefix hashes, and manifest shapes. / 定义 pipeline DTO、cache hints、prefix hashes 与 manifest 形态。 |
| `context-engine` | Selects nodes, assigns layers, creates immutable block metadata and prefix hashes. / 选择 nodes、分配层、创建不可变 block metadata 与 prefix hashes。 |
| `memory-cache-management` | Stores content-addressed blocks and pipeline manifests. / 存储内容寻址 blocks 与 pipeline manifests。 |
| `prompt-assembly` | Consumes manifests and preserves layer order in model-visible sections. / 消费 manifests，并在模型可见 sections 中保持层顺序。 |
| `runtime` | Builds model requests from manifests and keeps volatile data at the tail. / 从 manifests 构建模型请求，并将易变数据留在尾部。 |
| `model-gateway` | Maps cache hints to provider-specific fields only when supported, then normalizes cache usage. / 仅在 provider 支持时映射 cache hints 到 provider-specific 字段，并归一化缓存用量。 |
| `communication-protocol` | Carries prefix hashes and cache evidence as additive metadata. / 以 additive metadata 携带 prefix hashes 与 cache evidence。 |
| `runtime-message-bus` | Provides ordered delivery and backpressure for context streams. / 为 context streams 提供有序传递与背压。 |
| `testing-regression` | Proves prefix stability, compaction, and cache evidence through deterministic fixtures. / 通过确定性 fixtures 证明 prefix stability、compaction 与 cache evidence。 |

## Cache Strategy / 缓存策略

### Stable Prefixes / 稳定前缀

Layer 0 and Layer 1 should change rarely. Their block order and serialized message form must remain stable across ordinary turns.

Layer 0 与 Layer 1 应很少变化。它们的 block 顺序和序列化 message 形态必须在普通回合之间保持稳定。

Layer 2 is append-only where possible. New session summaries are appended. Compaction replaces a bounded contiguous range with a summary block and records the covered source hashes.

Layer 2 尽量追加式。新的 session summaries 被追加。压缩只能用 summary block 替换有界连续区间，并记录被覆盖的 source hashes。

Layer 3 is expected to miss cache. It contains current user input, active selection, and volatile full tool output.

Layer 3 预期不命中缓存。它包含当前用户输入、活动选择与易变完整工具输出。

### Content Addressing / 内容寻址

Every reusable block is addressed by content and dependencies. If the content or dependencies change, the hash changes. The previous block remains valid for replay and historical comparison.

每个可复用 block 都按内容与依赖寻址。内容或依赖变化时，hash 变化。旧 block 仍可用于 replay 与历史比较。

This gives DeepSeek a page-cache-like behavior:

这给 DeepSeek 带来类似 page cache 的行为：

- same block, same hash / 同一 block，同一 hash
- same layer order, same prefix hash / 同一层顺序，同一 prefix hash
- same prefix hash, cache hit opportunity / 同一 prefix hash，存在缓存命中机会

### Provider Cache Hints / Provider 缓存提示

Pipeline cache hints are provider-neutral:

Pipeline cache hints 是 provider-neutral：

| Hint / 提示 | Meaning / 含义 |
| --- | --- |
| `stable` | Suitable for long-lived prefix caching if provider supports it. / 如果 provider 支持，适合长期前缀缓存。 |
| `ephemeral` | May be cached briefly, usually current-turn or short session material. / 可短暂缓存，通常是当前回合或短 session 材料。 |
| `no-store` | Must not be persisted or marked cacheable. / 不得持久化或标记为可缓存。 |

`model-gateway` owns provider-specific translation. Runtime and prompt assembly must not emit provider wire fields.

`model-gateway` 负责 provider-specific 翻译。Runtime 与 prompt assembly 不得输出 provider wire fields。

## Tool Result Policy / 工具结果策略

Tool results are split into two forms:

工具结果拆成两种形态：

| Form / 形态 | Layer / 层 | Rule / 规则 |
| --- | --- | --- |
| Full raw output / 完整原始输出 | `current-turn` or artifact storage | Visible only while needed for immediate continuation; not stable prefix material. / 仅在当前继续执行需要时可见；不是稳定前缀材料。 |
| Bounded summary or evidence reference / 有界摘要或证据引用 | `session` | Redacted, content-addressed, replayable, and safe to append. / 脱敏、内容寻址、可 replay，且可安全追加。 |

This prevents one noisy shell command, search result, or generated file dump from invalidating the long-lived prefix.

这可以防止一次嘈杂 shell 命令、搜索结果或生成文件 dump 让长期前缀失效。

## Compaction Policy / 压缩策略

Compaction must preserve pipe order.

压缩必须保持管道顺序。

Allowed:

允许：

```text
[A, B, C, D, E] -> [A, summary(B,C,D), E]
```

Not allowed:

不允许：

```text
[A, B, C, D, E] -> [A, E, summary(B,C,D)]
[A, B, C, D, E] -> [summary(D,E), A, B, C]
```

Every compaction summary records:

每个压缩摘要记录：

- covered block range / 覆盖的 block 区间
- source block hashes / 来源 block hashes
- summary block hash / 摘要 block hash
- compaction strategy / 压缩策略
- replay fingerprint / replay fingerprint
- redaction metadata / redaction metadata

## Protocol And Events / 协议与事件

Pipeline metadata is additive protocol metadata. Hosts may render it, ignore it, or use it for diagnostics, but hosts must not own execution.

Pipeline metadata 是 additive protocol metadata。Host 可以渲染它、忽略它或用于 diagnostics，但 host 不拥有执行权。

Runtime events should include bounded metadata such as:

Runtime events 应包含有界 metadata，例如：

- `pipelineFingerprint`
- `layerPrefixHashes`
- `includedBlockCount`
- `excludedBlockCount`
- `cacheHintSummary`
- `cacheUsage.hitTokens`
- `cacheUsage.missTokens`
- `cacheMetricStatus`
- `statusTelemetry.modelId`
- `statusTelemetry.thinkingMode`
- `statusTelemetry.contextTokens`
- `statusTelemetry.contextBudgetPressure`
- `statusTelemetry.cacheHitRate`

Raw block content should not appear in protocol events unless redaction policy explicitly permits it.

除非 redaction policy 显式允许，raw block content 不应出现在 protocol events 中。

## Statusline Projection / 状态栏投影

The CLI statusline is a host rendering of context/model telemetry, not a separate cache engine. Runtime and model/context owners publish bounded fields; the CLI only formats them for narrow or wide terminal layouts.

CLI statusline 是 context/model telemetry 的 host 渲染，不是另一套缓存引擎。Runtime 与 model/context 责任方发布有界字段；CLI 只负责按窄屏或宽屏终端布局格式化。

| Field / 字段 | Owner / 责任方 | Rule / 规则 |
| --- | --- | --- |
| Cache hit rate / 缓存命中率 | `model-gateway` via `runtime` | Derived from normalized provider usage when available; otherwise marked estimated or unavailable. / 可用时来自归一化 provider usage；否则标记为 estimated 或 unavailable。 |
| Current model / 当前模型 | `runtime` / `model-gateway` | Uses selected model id/profile from the active dispatch. / 使用当前 dispatch 选中的 model id/profile。 |
| Thinking mode / 思考模式 | `runtime` / model profile | Displays configured provider-neutral mode, not hidden reasoning content. / 显示 provider-neutral 配置模式，不显示隐藏推理内容。 |
| Context size / 上下文大小 | `context-engine` | Uses token estimates from the context pipeline manifest. / 使用 context pipeline manifest 的 token estimates。 |
| Budget pressure / 预算压力 | `usage-budget-management` / `context-engine` | Shows bounded pressure state such as normal, high, compacting, or over budget. / 显示 normal、high、compacting、over budget 等有界压力状态。 |

Statusline events must not include raw prompts, raw tool output, raw context block content, or secret-like paths.

Statusline events 不得包含 raw prompt、raw tool output、raw context block content 或疑似 secret 路径。

## Backpressure / 背压

Context streams and tool-result streams must be bounded.

Context streams 与 tool-result streams 必须有界。

When a producer emits blocks faster than subscribers can consume:

当 producer 发出 blocks 的速度超过 subscriber 消费能力时：

1. Runtime-message-bus emits a structured backpressure event. / runtime-message-bus 发出结构化 backpressure event。
2. The configured overflow policy applies. / 应用配置的 overflow policy。
3. The event records affected block ids and stream id. / 事件记录 affected block ids 与 stream id。
4. Replay can explain which blocks were delivered, summarized, delayed, or dropped. / Replay 能解释哪些 blocks 被传递、摘要、延迟或丢弃。

## Diagnostics / 诊断

Diagnostics should answer four questions:

Diagnostics 应回答四个问题：

1. Which layer first changed? / 哪一层最先变化？
2. Which block changed? / 哪个 block 变化？
3. How many estimated tokens were affected? / 影响了多少估算 tokens？
4. Was provider cache usage observed? / 是否观察到 provider cache usage？

Example diagnostic shape:

诊断示例：

```json
{
  "kind": "context.pipeline.prefix-drift",
  "sessionId": "session-123",
  "previousPipelineFingerprint": "pipe:a1",
  "currentPipelineFingerprint": "pipe:b2",
  "firstChangedLayer": "session",
  "firstChangedBlockId": "ctxblk:tool-summary-7",
  "affectedTokenEstimate": 842,
  "cacheMetricStatus": "provider-reported",
  "cacheUsage": {
    "hitTokens": 12000,
    "missTokens": 1300
  }
}
```

## Success Metrics / 成功指标

The implementation should be evaluated with deterministic and live metrics:

实现应通过确定性与 live 指标评估：

| Metric / 指标 | Target / 目标 |
| --- | --- |
| Kernel prefix stability / Kernel 前缀稳定性 | 100 percent across ordinary turns. / 普通回合间 100%。 |
| Project prefix stability / Project 前缀稳定性 | Stable until project rules, repo facts, or project memory changes. / 直到项目规则、仓库事实或项目记忆变化前保持稳定。 |
| Current-turn isolation / 当前回合隔离 | Volatile full outputs never enter stable layers unbounded. / 易变完整输出绝不无界进入稳定层。 |
| Projection determinism / 投影确定性 | Same inputs produce same pipeline fingerprint. / 相同输入产生相同 pipeline fingerprint。 |
| Cache evidence availability / 缓存证据可用性 | Every model dispatch emits prefix hashes; provider usage attached when available. / 每次 model dispatch 输出 prefix hashes；可用时绑定 provider usage。 |
| Statusline freshness / 状态栏新鲜度 | CLI statusline refreshes from local telemetry after dispatch, compaction, and cache usage updates. / CLI statusline 在 dispatch、compaction 与 cache usage 更新后基于本地 telemetry 刷新。 |

## Rollout Plan / 推进计划

### Phase 1: Manifest-Only Compatibility / 第一阶段：仅 Manifest 兼容

- Derive pipeline manifests from existing `ContextProjectionResult`. / 从现有 `ContextProjectionResult` 派生 pipeline manifests。
- Emit prefix hashes and diagnostics. / 发出 prefix hashes 与 diagnostics。
- Keep existing prompt assembly path as fallback. / 保留现有 prompt assembly 路径作为 fallback。

### Phase 2: Prompt Assembly Integration / 第二阶段：Prompt Assembly 接入

- Make prompt assembly consume manifests directly. / 让 prompt assembly 直接消费 manifests。
- Preserve layer order in model-visible sections. / 在模型可见 sections 中保持层顺序。
- Include manifest evidence in `prompt.assembled`. / 在 `prompt.assembled` 中包含 manifest evidence。

### Phase 3: Cache Store And Provider Hints / 第三阶段：缓存存储与 Provider Hints

- Persist context blocks and manifests in `memory-cache-management`. / 在 `memory-cache-management` 中持久化 context blocks 与 manifests。
- Carry cache hints through `model-gateway`. / 通过 `model-gateway` 携带 cache hints。
- Map hints only for providers with declared support. / 仅对声明支持的 providers 映射 hints。

### Phase 4: Backpressure And Compaction / 第四阶段：背压与压缩

- Add context-stream backpressure events. / 增加 context-stream backpressure events。
- Add contiguous session compaction summaries. / 增加连续 session 压缩摘要。
- Add golden replay for prefix stability and compaction. / 为 prefix stability 与 compaction 增加 golden replay。

## Open Questions / 开放问题

- Should Layer 0 include full tool schemas or only stable schema fingerprints? / Layer 0 应包含完整工具 schema，还是只包含稳定 schema fingerprints？
- Should project prefix include full `AGENTS.md` content or a governed summary plus hash? / Project prefix 应包含完整 `AGENTS.md` 内容，还是包含受治理摘要加 hash？
- Should cache hints default by layer, or require explicit policy on every block? / Cache hints 应按层默认，还是每个 block 都要求显式 policy？
- What launch gate turns sparse live provider cache metrics from warning into release-blocking? / 什么发布门禁会把稀疏 live provider cache metrics 从 warning 升为 release-blocking？
