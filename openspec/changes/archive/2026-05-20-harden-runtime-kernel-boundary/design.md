## Context

The runtime should behave like a small kernel: it schedules turns, emits canonical events, delegates risky execution to policy, and calls subsystem packages through public contracts. It should not become a warehouse for context retrieval, prompt assembly, plugin internals, provider SDK logic, or host rendering.

Runtime 应像一个小内核运行：调度 turn、发出规范事件、把风险执行交给 policy，并通过公共契约调用子系统 package。它不应变成 context retrieval、prompt assembly、plugin internals、provider SDK logic 或 host rendering 的仓库。

## Goals / Non-Goals

**Goals:**

- Define a small, stable runtime responsibility set. / 定义小而稳定的 runtime 职责集合。
- Make forbidden imports and dependency directions machine-checkable. / 让禁止导入与依赖方向可机器检查。
- Require every cross-subsystem call to pass through a public contract or injected dependency. / 要求每个跨子系统调用通过公共契约或注入依赖。
- Produce readiness evidence before dependent governance tracks can rely on runtime guarantees. / 在依赖专项依赖 runtime 保证前产出 readiness 证据。

**Non-Goals:**

- Do not implement remote networking, plugins, agent orchestration, or context caching here. / 本专项不实现 remote networking、plugins、agent orchestration 或 context caching。
- Do not move large subsystem code in this proposal step. / 提案阶段不迁移大块子系统代码。

## Decisions

1. Runtime owns lifecycle, not subsystem policy. / Runtime 负责 lifecycle，而不是子系统 policy。

   Runtime may orchestrate a turn, call policy, call scheduler, emit events, and continue model/tool loops. Subsystem-owned rules stay in their packages.

   Runtime 可以编排 turn、调用 policy、调用 scheduler、发出 events 并继续 model/tool loop。子系统规则留在各自 package。

2. Handoffs are explicit kernel interfaces. / Handoff 是显式 kernel interface。

   Context, prompt, model, tool, policy, scheduler, memory/cache, and bus interactions must be visible as injected dependencies, public package APIs, or platform contracts.

   Context、prompt、model、tool、policy、scheduler、memory/cache 与 bus 交互必须表现为注入依赖、公共 package API 或 platform contracts。

3. Compatibility shims are allowed but expiring. / 允许 compatibility shim，但必须可过期。

   A shim is acceptable only when it has an owner, reason, extraction target, expiration trigger, diagnostic id, and release severity.

   只有具备 owner、原因、抽取目标、过期触发条件、diagnostic id 与发布严重度的 shim 才可接受。

## Rollout

1. Inventory current runtime files and imports. / 盘点当前 runtime 文件与 imports。
2. Encode allowed kernel responsibilities and forbidden dependencies in lint conventions. / 在 lint conventions 中编码允许 kernel 职责与禁止依赖。
3. Add diagnostics and acceptance fixtures for violations. / 为违规增加 diagnostics 与 acceptance fixtures。
4. Use the diagnostics as closure evidence for downstream governance tracks. / 将 diagnostics 作为下游专项关闭证据。

## Open Questions

- What file-size and ownership thresholds should classify central runtime files as warning versus release-blocking? / 中心 runtime 文件达到何种规模与 ownership 阈值时应从 warning 升为 release-blocking？
- Which current runtime helpers are acceptable compatibility shims for one release? / 当前哪些 runtime helper 可作为一个版本内的 compatibility shim？
