## Context

Linux isolates work through process identity, namespaces, cgroups, ownership, and signals. DeepSeek needs the same idea for subagents: clear authority, bounded resources, cancellation, and lineage.

Linux 通过 process identity、namespaces、cgroups、ownership 与 signals 隔离工作。DeepSeek 的 subagents 也需要同样思想：清晰权限、有界资源、取消机制与 lineage。

## Goals / Non-Goals

**Goals:**

- Define agent scopes and quotas before default write execution. / 在默认写执行前定义 agent scopes 与 quotas。
- Make parent/child lineage and ownership auditable. / 让 parent/child lineage 与 ownership 可审计。
- Coordinate with policy-sandbox for risky operations. / 与 policy-sandbox 协同治理风险操作。

**Non-Goals:**

- Do not implement full TaskGraph v1 here. / 本专项不实现完整 TaskGraph v1。
- Do not choose model routing strategies here. / 本专项不选择模型路由策略。

## Decisions

1. Every write-capable agent has a namespace. / 每个可写 agent 都有 namespace。

   Namespace includes allowed paths, tools, memory, scratchpad, checkpoints, environment, and output ownership.

   Namespace 包含 allowed paths、tools、memory、scratchpad、checkpoints、environment 与 output ownership。

2. Quotas are required for concurrency. / 并发需要 quotas。

   Token budget, tool budget, wall-clock deadline, file mutation budget, and retry budget prevent runaway execution.

   token budget、tool budget、wall-clock deadline、file mutation budget 与 retry budget 防止 runaway execution。

3. Repair and verifier agents inherit limited authority. / Repair 与 verifier agents 继承受限权限。

   Child agents may receive narrower scopes than their parent, but not broader scopes without an explicit policy decision.

   child agents 可获得比 parent 更窄的 scope，但没有显式 policy decision 不得获得更宽 scope。

## Rollout

1. Define scope DTOs and diagnostics. / 定义 scope DTOs 与 diagnostics。
2. Add runtime event-loop enforcement points. / 增加 runtime event-loop enforcement points。
3. Add tests for scope denial, quota exhaustion, and lineage. / 增加 scope denial、quota exhaustion 与 lineage 测试。

## Open Questions

- Should scoped agent writes use worktree overlay by default once overlay execution exists? / 一旦 overlay execution 存在，scoped agent writes 是否默认使用 worktree overlay？
