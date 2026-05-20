## Why

The review surfaced ghost aliases, placeholder implementations, roadmap/code drift, and package-map ambiguity. / 审查暴露了 ghost aliases、placeholder implementations、roadmap/code drift 与 package-map 歧义。

This change opens the guardrail track that keeps workspace aliases, manifests, package maps, roadmap status, and implementation evidence aligned. / 本变更打开护栏专项，用于保持 workspace aliases、manifests、package maps、roadmap status 与 implementation evidence 一致。

## What Changes

- Detect `@deepseek/*` path aliases whose package directories do not exist. / 检测 package 目录不存在的 `@deepseek/*` path aliases。
- Require retired or merged aliases to be explicit governance records. / 要求 retired 或 merged aliases 具备显式治理记录。
- Detect drift between roadmap maturity labels, package-map ownership, package manifests, and source evidence. / 检测 roadmap maturity labels、package-map ownership、package manifests 与 source evidence 之间的漂移。
- Require placeholder ownership and promotion gates to be visible in diagnostics. / 要求 placeholder ownership 与 promotion gates 在 diagnostics 中可见。

## Capabilities

### New Capabilities

### Modified Capabilities

- `architecture-scale-guardrails`: Add ghost alias, manifest drift, placeholder ownership, and roadmap/code drift requirements. / 增加 ghost alias、manifest drift、placeholder ownership 与 roadmap/code drift 要求。
- `product-roadmap`: Add roadmap alignment requirements for governance maturity and evidence links. / 增加治理成熟度与证据链接的路线图对齐要求。

## Impact

- Owner packages / 责任包: `scripts/lint-framework`, `tsconfig.base.json`, workspace package manifests, docs package map, product roadmap, CLI diagnostics.
- Release policy / 发布策略: ghost or stale architecture claims become visible and can block release when product claims depend on them. / 当产品声明依赖 ghost 或 stale architecture claims 时，它们会可见并可阻止发布。
