## Overview / 概览

ContextGraph projection is the R2 boundary that decides what evidence may enter a model request. It should sit between runtime turn preparation and model gateway dispatch, consuming session events, workspace evidence, tool results, memory references, and host-provided context through typed contracts.

ContextGraph projection 是 R2 中决定哪些证据可以进入 model request 的边界。它位于 runtime turn preparation 与 model gateway dispatch 之间，通过类型化契约消费 session events、workspace evidence、tool results、memory references 和 host-provided context。

## Architecture / 架构

```text
Host / CLI / VSCode
        |
        v
Runtime turn request
        |
        v
Runtime kernel envelope
        |
        v
Context projection request
        |
        +--> ContextGraph store / node registry
        +--> Memory references
        +--> Projection cache
        +--> Usage budget token estimator
        +--> Policy/redaction classification
        |
        v
Projection result
        |
        v
Model gateway request
        |
        v
Runtime events + protocol projection events + golden trace
```

The runtime remains the execution owner. Projection is a governed preparation stage and must not execute tools, mutate workspace files, or call model providers.

runtime 仍然是 execution owner。Projection 是受治理的准备阶段，不得执行工具、修改 workspace files 或调用 model providers。

## Contract Shape / 契约形态

Core serializable DTOs should live in `platform-contracts`:

- `ContextGraphNode`: id, type, source, lifecycle, scope, priority, estimated tokens, content reference, redaction class, provenance, invalidation dependencies, and compatibility metadata.
- `ContextProjectionRequest`: session id, turn id, model target, purpose, budget, policy scope, host scope, selected node hints, denied node hints, trace metadata, and schema version.
- `ContextProjectionResult`: selected nodes, excluded nodes, degraded reason, estimated tokens, budget decision, redaction summary, cache metadata, ordering metadata, and replay fingerprint.
- `ContextProjectionEvent`: started, cache-hit, node-selected, node-excluded, degraded, rejected, completed.

核心可序列化 DTO 应放在 `platform-contracts` 中：

- `ContextGraphNode`：id、type、source、lifecycle、scope、priority、estimated tokens、content reference、redaction class、provenance、invalidation dependencies 和 compatibility metadata。
- `ContextProjectionRequest`：session id、turn id、model target、purpose、budget、policy scope、host scope、selected node hints、denied node hints、trace metadata 和 schema version。
- `ContextProjectionResult`：selected nodes、excluded nodes、degraded reason、estimated tokens、budget decision、redaction summary、cache metadata、ordering metadata 和 replay fingerprint。
- `ContextProjectionEvent`：started、cache-hit、node-selected、node-excluded、degraded、rejected、completed。

## Projection Pipeline / 投影管线

1. Normalize candidate context nodes from current turn, session history, workspace evidence, tool results, and memory references.
2. Filter candidates by lifecycle, host scope, agent scope, policy, redaction class, freshness, and invalidation state.
3. Estimate tokens with deterministic estimator fakes by default.
4. Rank by priority, recency, dependency relevance, explicit user intent, and product purpose.
5. Fit into hard/soft budget with deterministic degradation.
6. Return selected and excluded evidence with reasons.
7. Emit projection events and cache metadata for replay.

1. 从 current turn、session history、workspace evidence、tool results 和 memory references 归一化 candidate context nodes。
2. 按 lifecycle、host scope、agent scope、policy、redaction class、freshness 和 invalidation state 过滤 candidates。
3. 默认使用 deterministic estimator fakes 估算 tokens。
4. 按 priority、recency、dependency relevance、explicit user intent 和 product purpose 排序。
5. 在 hard/soft budget 内确定性降级。
6. 返回 selected 与 excluded evidence，并附带原因。
7. 发出 projection events 与 cache metadata 供 replay 使用。

## Boundaries / 边界

- Runtime calls projection before model dispatch; model gateway never builds context from raw session state.
- Projection returns references and normalized content slices; it does not own durable memory storage.
- Projection cache is disposable and invalidated by dependency fingerprints; cache eviction must not delete memory.
- Secret-like content is either excluded or redacted before it can appear in projection result, events, traces, or snapshots.
- Host adapters render projection summaries only through protocol events and must not inspect internal context-engine state.

- Runtime 在 model dispatch 前调用 projection；model gateway 不得从 raw session state 组装上下文。
- Projection 返回 references 与 normalized content slices；它不拥有 durable memory storage。
- Projection cache 是 disposable，并由 dependency fingerprints 失效；cache eviction 不得删除 memory。
- secret-like content 在进入 projection result、events、traces 或 snapshots 前必须被排除或脱敏。
- host adapters 只能通过 protocol events 渲染 projection summaries，不得检查 context-engine 内部状态。

## Testing Strategy / 测试策略

- Unit tests for node filtering, ranking, budget fitting, degradation, redaction, and cache invalidation.
- Contract tests for DTO serializability, schema versions, fake substitutability, and no implementation imports in contracts.
- Integration tests proving runtime model turns consume projection results before provider request construction.
- Golden replay tests for selected/excluded nodes, budget decisions, cache hit/miss, and redacted projection events.
- Compatibility tests for additive projection schema changes and unsupported schema rejection.
- Matrix tests for empty workspace, large session, secret fixture, stale cache, hard budget exceeded, missing memory provider, and degraded host scope.
- E2E smoke tests ensuring CLI/headless turns complete without live provider access and without leaking projection internals or raw secrets.

- node filtering、ranking、budget fitting、degradation、redaction 和 cache invalidation 的单元测试。
- DTO serializability、schema versions、fake substitutability，以及 contracts 不导入实现包的合同测试。
- 证明 runtime model turns 在 provider request construction 前消费 projection results 的集成测试。
- selected/excluded nodes、budget decisions、cache hit/miss 和 redacted projection events 的 golden replay 测试。
- additive projection schema changes 与 unsupported schema rejection 的 compatibility 测试。
- empty workspace、large session、secret fixture、stale cache、hard budget exceeded、missing memory provider 和 degraded host scope 的 matrix 测试。
- 确保 CLI/headless turns 在无 live provider 下完成，且不泄漏 projection internals 或 raw secrets 的 e2e smoke。

## Risks / 风险

- Overly broad context selection can leak secrets or exceed model limits; hard budget and redaction must fail closed.
- Projection ranking can become nondeterministic if it depends on filesystem order, wall clock, or provider text; tests must use fake clocks and stable ordering.
- Cache reuse can serve stale evidence; every cache entry needs dependency fingerprints and invalidation metadata.
- If hosts assemble context themselves, CLI and VSCode will drift; architecture lint should reject direct prompt assembly outside approved projection owners.

- 过宽的 context selection 可能泄漏 secrets 或超过 model limits；hard budget 与 redaction 必须 fail closed。
- 如果 projection ranking 依赖 filesystem order、wall clock 或 provider text，会变得不确定；测试必须使用 fake clocks 与 stable ordering。
- cache reuse 可能返回 stale evidence；每个 cache entry 都需要 dependency fingerprints 和 invalidation metadata。
- 如果 hosts 自行组装上下文，CLI 与 VSCode 会漂移；architecture lint 应拒绝 approved projection owners 之外的 direct prompt assembly。
