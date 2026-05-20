## Context

Architecture drift is cheap to create and expensive to untangle. A path alias can outlive a package, a placeholder can look real in a roadmap, and a package map can imply ownership that source code no longer supports.

架构漂移很容易产生，但清理代价高。path alias 可以比 package 活得更久，placeholder 可以在 roadmap 中看起来像真实能力，package map 也可能暗示源码不再支持的 ownership。

## Goals / Non-Goals

**Goals:**

- Detect ghost aliases and missing workspace packages. / 检测 ghost aliases 与缺失 workspace packages。
- Make placeholder ownership and replacement triggers explicit. / 让 placeholder ownership 与 replacement triggers 显式化。
- Keep roadmap, package map, manifests, and source evidence aligned. / 保持 roadmap、package map、manifests 与 source evidence 对齐。

**Non-Goals:**

- Do not remove aliases automatically in this change. / 本专项不自动删除 aliases。
- Do not decide product priorities beyond reporting drift. / 除报告漂移外，不决定产品优先级。

## Decisions

1. Ghost aliases are governance failures. / Ghost aliases 是治理失败。

   An alias must resolve to an existing workspace package, plugin package, or explicit retired/merged record.

   alias 必须解析到现有 workspace package、plugin package 或显式 retired/merged record。

2. Roadmap status must match evidence. / Roadmap 状态必须匹配证据。

   `implemented`, `partial`, `rollout-gated`, `deferred`, `placeholder`, and `unsupported` labels need support from source, tests, diagnostics, or OpenSpec records.

   `implemented`、`partial`、`rollout-gated`、`deferred`、`placeholder` 与 `unsupported` 标签需要 source、tests、diagnostics 或 OpenSpec records 支撑。

3. Placeholders need owners. / Placeholders 需要 owners。

   A placeholder without owner, allowed consumers, blocked claims, and replacement trigger is treated as a release risk.

   缺少 owner、allowed consumers、blocked claims 与 replacement trigger 的 placeholder 视为发布风险。

## Rollout

1. Add lint-framework conventions for aliases, packages, placeholders, and retired records. / 为 aliases、packages、placeholders 与 retired records 增加 lint-framework conventions。
2. Add drift scanners for roadmap and package map. / 增加 roadmap 与 package map drift scanners。
3. Add diagnostics and acceptance fixtures. / 增加 diagnostics 与 acceptance fixtures。

## Open Questions

- Should retired aliases be allowed for one release with warning severity, or removed immediately? / retired aliases 应允许一个版本以 warning 存在，还是立即移除？
