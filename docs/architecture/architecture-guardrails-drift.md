# Architecture Guardrails Drift / 架构护栏漂移

This document defines how DeepSeek keeps aliases, package maps, roadmap labels, placeholders, and readiness evidence aligned.

本文定义 DeepSeek 如何保持 alias、package map、roadmap label、placeholder 与 readiness evidence 对齐。

## Rule

An `@deepseek/*` alias is valid only when one of these is true:

`@deepseek/*` alias 只有在以下条件之一成立时才有效：

1. It resolves to an existing workspace package, app, or plugin manifest.
2. It has an explicit governance record with owner, allowed consumers, blocked product claims, replacement trigger, and evidence ids.

1. 它解析到现有 workspace package、app 或 plugin manifest。
2. 它具备显式 governance record，包含 owner、allowed consumers、blocked product claims、replacement trigger 与 evidence ids。

Ungoverned ghost aliases are release risks because they let roadmap or package-map text imply a real subsystem that does not exist.

未治理的 ghost alias 是发布风险，因为它会让 roadmap 或 package-map 文本暗示一个并不存在的真实子系统。

## Current Governed Ghost Aliases

| Alias | State | Owner | Blocked product claims |
| --- | --- | --- | --- |
| `@deepseek/distribution-update-management` | `placeholder` | `platform-abstraction` | update catalog, release channel management |
| `@deepseek/evolution-engine` | `placeholder` | `platform-abstraction` | feedback loops, managed rollout |
| `@deepseek/extension-system` | `placeholder` | `plugin-system` | third-party extension runtime, host marketplace |
| `@deepseek/remote-runtime-connectivity` | `placeholder` | `platform-abstraction` | server runtime, remote control API |

These aliases may remain only while diagnostics and docs describe them as placeholder or future landings. They must not be used as evidence for product readiness.

这些 alias 只能在 diagnostics 与 docs 中被描述为 placeholder 或 future landing 时保留。它们不能作为 product readiness 的证据。

## Enforcement

- `scripts/lint-framework/rules/architecture-drift.mjs` rejects ghost aliases without complete governance metadata.
- `deepseek diagnostics release` emits `governance.architecture-drift` and projects it into `/proc/deepseek/governance.roadmap-drift`.
- `tests/acceptance/latest/architecture-drift-guardrails.json` records the current governed alias set.
- Product-ready claims remain blocked when they depend on placeholder, deferred, rollout-gated, or missing evidence states.

- `scripts/lint-framework/rules/architecture-drift.mjs` 会拒绝缺少完整治理元数据的 ghost alias。
- `deepseek diagnostics release` 输出 `governance.architecture-drift`，并投影到 `/proc/deepseek/governance.roadmap-drift`。
- `tests/acceptance/latest/architecture-drift-guardrails.json` 记录当前受治理 alias 集合。
- 当 product-ready claim 依赖 placeholder、deferred、rollout-gated 或 missing evidence 状态时，仍会被阻止。

## Promotion Path

To promote a placeholder alias into a real subsystem:

要将 placeholder alias 推进为真实子系统：

1. Create the workspace package and manifest.
2. Move implementation into the owner package.
3. Add contract, integration, golden or matrix coverage before source implementation changes.
4. Update package-map and roadmap labels to match evidence.
5. Remove the placeholder alias governance record once lint proves the alias resolves to a real workspace.

1. 创建 workspace package 与 manifest。
2. 将实现移动到责任包。
3. 在改实现代码前补 contract、integration、golden 或 matrix 覆盖。
4. 更新 package-map 与 roadmap label，使其匹配证据。
5. 当 lint 证明 alias 已解析到真实 workspace 后，移除 placeholder alias governance record。
