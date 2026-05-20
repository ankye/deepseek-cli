## Context

DeepSeek already has the right ingredients: `ContextGraphNode` selection in `context-engine`, prompt section assembly in `prompt-assembly`, normalized provider usage in `model-gateway`, cache and memory records in `memory-cache-management`, and replayable runtime events. The missing constraint is that context is not yet treated as an ordered stream of immutable blocks whose stable prefix can survive across turns.

DeepSeek 已经具备关键材料：`context-engine` 里的 `ContextGraphNode` selection、`prompt-assembly` 的 prompt section assembly、`model-gateway` 的 provider usage 归一化、`memory-cache-management` 的 cache/memory records，以及可 replay 的 runtime events。缺失的约束是：context 尚未被视为一条由不可变块组成的有序流，稳定前缀无法自然跨 turn 保持。

The Linux-style lesson is not “pipe bytes between modules” by itself. The useful lesson is stronger: stable upstream data has a small ABI, stable identity, ordered delivery, bounded buffers, and backpressure. Model prefix caching rewards the same shape because the first unchanged token sequence is the cacheable unit.

Linux 风格的启发不只是“在模块间传字节”。真正有用的是更强的约束：稳定上游数据拥有小 ABI、稳定身份、有序传递、有界 buffer 和 backpressure。模型前缀缓存奖励的也是同一种形态，因为首段不变 token 序列就是可缓存单元。

```text
Layer 0: Kernel Prefix       system/runtime contracts/tool schema skeletons
Layer 1: Project Prefix      AGENTS.md, package map, repo facts, project memory
Layer 2: Session Pipe        append-only turn summaries, compacted tool evidence
Layer 3: Current Turn Tail   user input, active selection, volatile full tool result
```

## Goals / Non-Goals

**Goals:**

- Preserve stable prefix ordering across turns to improve provider prefix-cache hit opportunities. / 跨 turn 保持稳定前缀顺序，提高 provider prefix-cache 命中机会。
- Represent context as immutable content-addressed blocks with layer ids, hashes, token estimates, cache hints, dependency fingerprints, redaction metadata, and replay metadata. / 将 context 表示为不可变 content-addressed blocks，包含 layer ids、hashes、token estimates、cache hints、dependency fingerprints、redaction metadata 与 replay metadata。
- Keep volatile current-turn content at the tail and prevent large tool results from polluting stable prefix layers. / 将易变 current-turn content 保持在尾部，并防止大型 tool results 污染稳定前缀层。
- Add provider-neutral cache hints while keeping provider-specific cache controls inside `model-gateway`. / 增加 provider-neutral cache hints，同时把 provider-specific cache controls 留在 `model-gateway` 内。
- Make cache behavior measurable through prefix hashes, cache usage metrics, diagnostics, golden replay, and acceptance evidence. / 通过 prefix hashes、cache usage metrics、diagnostics、golden replay 与 acceptance evidence 让缓存行为可度量。
- Feed bounded cache/context telemetry into CLI status surfaces so users can see cache hit rate, active model, thinking mode, context size, and budget pressure while working. / 将有界 cache/context telemetry 输入 CLI 状态表面，让用户工作时能看到缓存命中率、当前模型、思考模式、上下文大小与预算压力。

**Non-Goals:**

- Do not depend on any single provider supporting explicit cache-control markers. / 不依赖任何单一 provider 支持显式 cache-control markers。
- Do not make prompt assembly retrieve workspace files, PageIndex, ZVec, or host UI state directly. / 不让 prompt assembly 直接检索 workspace files、PageIndex、ZVec 或 host UI state。
- Do not implement multi-model fork/join orchestration in the first slice; only define how pipeline manifests can support it later. / 第一阶段不实现多模型 fork/join orchestration；只定义 pipeline manifest 以后如何支撑它。
- Do not reorder historical session turns for better local scoring if that breaks prefix stability. / 不为了局部评分更好而重排历史 session turns，因为这会破坏前缀稳定性。

## Decisions

1. Context blocks are immutable and content-addressed. / Context blocks 不可变且按内容寻址。

   A `ContextBlock` is the context equivalent of a page-cache page: once created, its hash, content digest, token estimate, dependency fingerprints, redaction class, and layer id are stable. Updating a file, memory entry, tool summary, or project rule creates a new block instead of mutating the old one.

   `ContextBlock` 是 context 版 page-cache page：一旦创建，它的 hash、content digest、token estimate、dependency fingerprints、redaction class 与 layer id 就稳定。更新文件、memory entry、tool summary 或 project rule 时创建新 block，而不是修改旧 block。

   Alternative considered: keep only `ContextGraphNode` and add more metadata. That helps selection, but it does not create a durable, reusable prefix unit for prompt assembly, cache storage, protocol evidence, and replay.

2. Layer order is an ABI. / 层顺序就是 ABI。

   The canonical order is kernel, project, session, current-turn. Lower-numbered layers must not depend on higher-numbered layers, and higher layers must not cause lower layers to be reordered. This is the central cache-hit invariant.

   规范顺序为 kernel、project、session、current-turn。低编号层不得依赖高编号层，高层也不得导致低层重排。这是 cache hit 的核心不变量。

   Alternative considered: sort all evidence globally by priority every turn. That may improve one-turn relevance, but it destroys prefix stability and makes model caching unreliable.

3. Compaction is append-only replacement, not history reordering. / 压缩是追加式替换，不是历史重排。

   Session compaction may replace a bounded contiguous range with a summary block, but it must record the covered range, source block hashes, compaction fingerprint, and replay metadata. It must not move unrelated blocks before or after the summary.

   Session compaction 可以用 summary block 替换一个有界连续区间，但必须记录 covered range、source block hashes、compaction fingerprint 与 replay metadata。不得移动与 summary 无关的 blocks。

4. Tool results split into stable summary and volatile tail. / 工具结果拆成稳定摘要与易变尾部。

   Full raw tool output belongs to current-turn tail or artifact storage. Layer 2 receives only bounded redacted summaries and evidence references. This keeps large noisy output from poisoning the long-lived prefix.

   完整 raw tool output 属于 current-turn tail 或 artifact storage。Layer 2 只接收有界脱敏 summary 与 evidence references。这样可以避免大型噪声输出污染长期稳定前缀。

5. Provider cache hints are declarative. / Provider cache hints 声明式表达。

   Pipeline blocks carry provider-neutral cache hints such as `stable`, `ephemeral`, `no-store`, and TTL/freshness metadata. `model-gateway` decides whether and how to map them to a target provider. Unsupported providers still benefit from stable ordering, diagnostics, and replay evidence.

   Pipeline blocks 携带 provider-neutral cache hints，例如 `stable`、`ephemeral`、`no-store` 与 TTL/freshness metadata。`model-gateway` 决定是否以及如何映射到目标 provider。不支持显式缓存的 provider 仍能受益于稳定排序、diagnostics 与 replay evidence。

6. Prefix hashes are the cache contract. / Prefix hashes 是缓存契约。

   Every manifest records per-layer prefix hashes and an overall pipeline fingerprint. Diagnostics can compare manifests across turns to explain why cache hit opportunities were kept or lost.

   每个 manifest 都记录按层 prefix hashes 与整体 pipeline fingerprint。Diagnostics 可以跨 turn 比较 manifests，解释 cache hit 机会为何保持或丢失。

7. Statusline telemetry is bounded projection, not raw context. / Statusline telemetry 是有界投影，不是 raw context。

   The CLI/TUI statusline should consume a small telemetry summary derived from pipeline manifests, model request metadata, and usage records: cache hit rate, cache hit/miss tokens when available, model id/profile, thinking mode, selected context tokens, hard/soft budget, and prefix stability. It must not render raw context block content or trigger model calls.

   CLI/TUI statusline 应消费由 pipeline manifests、model request metadata 与 usage records 派生的小型 telemetry summary：缓存命中率、可用时的 hit/miss tokens、model id/profile、思考模式、selected context tokens、hard/soft budget 与 prefix stability。它不得渲染 raw context block content，也不得触发模型调用。

## Risks / Trade-offs

- [Risk] Stable prefixes may keep less relevant older context ahead of newer high-priority evidence. / 稳定前缀可能让较旧上下文排在较新的高优先级证据前。 → Mitigation: keep current-turn tail highly relevant, allow bounded contiguous compaction, and require diagnostics for excluded high-priority evidence. / 缓解：保持 current-turn tail 高相关性，允许有界连续压缩，并要求对被排除的高优先级证据提供 diagnostics。
- [Risk] More DTOs and manifests increase implementation complexity. / 更多 DTO 与 manifest 会增加实现复杂度。 → Mitigation: first slice can generate pipeline manifests from existing projection results, then progressively move block storage and prompt assembly onto the manifest. / 缓解：第一阶段可从现有 projection results 生成 pipeline manifests，再逐步将 block storage 与 prompt assembly 迁移到 manifest。
- [Risk] Provider cache-control support differs across providers. / 不同 provider 的 cache-control 支持不同。 → Mitigation: keep cache hints provider-neutral and require model capability metadata before adapter-specific mapping. / 缓解：保持 cache hints provider-neutral，并要求在 adapter-specific mapping 前具备 model capability metadata。
- [Risk] Hash-only events may be hard to debug. / 仅 hash 的事件不易调试。 → Mitigation: include bounded redacted previews and source/provenance metadata where policy allows, never raw unbounded content. / 缓解：在 policy 允许时包含有界脱敏 preview 与 source/provenance metadata，绝不包含 raw unbounded content。

## Migration Plan

1. Add contracts for `ContextBlock`, `ContextPipelineLayer`, `ContextPipelineManifest`, `ContextPrefixHash`, cache hints, and backpressure events. / 增加 `ContextBlock`、`ContextPipelineLayer`、`ContextPipelineManifest`、`ContextPrefixHash`、cache hints 与 backpressure events 契约。
2. Build a compatibility projector that converts current `ContextProjectionResult.selectedNodes` into layer-ordered immutable blocks. / 构建兼容 projector，把当前 `ContextProjectionResult.selectedNodes` 转换为按层排序的不可变 blocks。
3. Add prompt assembly support for pipeline manifests while preserving existing section assembly as a fallback. / 为 prompt assembly 增加 pipeline manifest 支持，同时保留现有 section assembly 作为 fallback。
4. Persist block and manifest records through `memory-cache-management` and emit prefix diagnostics. / 通过 `memory-cache-management` 持久化 block 与 manifest records，并发出 prefix diagnostics。
5. Extend `model-gateway` request planning to carry cache hints and normalize cache hit/miss evidence. / 扩展 `model-gateway` request planning，携带 cache hints 并归一化 cache hit/miss evidence。
6. Add golden and integration tests for prefix stability, cache hit preservation, compaction, volatile tail isolation, and provider unsupported fallback. / 增加 prefix stability、cache hit preservation、compaction、volatile tail isolation 与 provider unsupported fallback 的 golden/integration 测试。
7. Project bounded telemetry into CLI/TUI statusline state after pipeline/model usage evidence exists. / 在 pipeline/model usage evidence 存在后，将有界 telemetry 投影到 CLI/TUI statusline state。

## Open Questions

- Should Layer 0 include full tool schemas, or only stable tool schema fingerprints with provider-side expansion? / Layer 0 应包含完整 tool schemas，还是只包含稳定 tool schema fingerprints 并由 provider-side expansion？
- What is the first supported compaction policy: contiguous range summary, LRU block eviction, or explicit user-triggered compact only? / 第一种支持的 compaction policy 应是连续区间摘要、LRU block eviction，还是仅显式用户触发 compact？
- Should provider cache hints default to `stable` for Layer 0/1 and `ephemeral` for Layer 3, or should every block require explicit policy? / provider cache hints 是否应默认 Layer 0/1 为 `stable`、Layer 3 为 `ephemeral`，还是每个 block 都要求显式 policy？
