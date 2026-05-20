## Context

Linux makes system state inspectable through stable diagnostic files. DeepSeek should similarly expose governance state through deterministic CLI diagnostics so release decisions can see risk without spelunking through implementation files.

Linux 通过稳定 diagnostic files 让系统状态可检查。DeepSeek 也应通过确定性 CLI diagnostics 暴露治理状态，让发布决策无需深入实现文件就能看到风险。

## Goals / Non-Goals

**Goals:**

- Add stable diagnostics sections for governance health. / 增加治理健康状态的稳定 diagnostics sections。
- Support text, JSON, and JSONL output. / 支持 text、JSON 与 JSONL 输出。
- Link findings to evidence, owners, severity, and next action. / 将 findings 链接到 evidence、owners、severity 与 next action。

**Non-Goals:**

- Do not implement every underlying scanner here. / 本专项不实现每个底层 scanner。
- Do not add interactive dashboards. / 不增加交互式 dashboard。

## Decisions

1. Diagnostics is the product-facing governance API. / Diagnostics 是面向产品的治理 API。

   CLI is the current product surface, so readiness must summarize system health there first.

   CLI 是当前产品表面，因此 readiness 必须先在那里汇总系统健康状态。

2. Sections mirror kernel governance. / Sections 对应 kernel governance。

   Initial sections cover kernel, UAPI, context/cache, bus, policy, agents, modules, roadmap drift, and evidence matrix.

   初始 sections 覆盖 kernel、UAPI、context/cache、bus、policy、agents、modules、roadmap drift 与 evidence matrix。

3. Machine-readable output is required. / 必须有机器可读输出。

   JSON and JSONL enable acceptance fixtures and CI gating.

   JSON 与 JSONL 支持 acceptance fixtures 与 CI gating。

## Rollout

1. Define diagnostics schema and section ids. / 定义 diagnostics schema 与 section ids。
2. Add rendering in CLI readiness. / 在 CLI readiness 中增加渲染。
3. Add acceptance fixtures for stable output. / 增加稳定输出 acceptance fixtures。

## Open Questions

- Which diagnostics are informational during early rollout and which are release-blocking for CLI stable? / 初期哪些 diagnostics 是 informational，哪些对 CLI stable 是 release-blocking？
