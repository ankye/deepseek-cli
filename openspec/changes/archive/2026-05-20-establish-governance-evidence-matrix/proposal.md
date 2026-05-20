## Why

The platform currently relies heavily on contract tests and golden replay, but product readiness needs an explicit package-level evidence matrix. / 平台当前很依赖 contract tests 与 golden replay，但产品就绪需要显式的包级 evidence matrix。

This change opens the governance track that distinguishes contract coverage from integration, e2e, live smoke, matrix, acceptance, and release-readiness evidence. / 本变更打开治理专项，用于区分 contract coverage 与 integration、e2e、live smoke、matrix、acceptance、release-readiness evidence。

## What Changes

- Define package-level evidence categories and readiness thresholds. / 定义包级 evidence categories 与 readiness thresholds。
- Require governance records to list missing evidence and promotion blockers. / 要求 governance records 列出 missing evidence 与 promotion blockers。
- Add acceptance fixtures for evidence matrix output. / 增加 evidence matrix 输出的 acceptance fixtures。

## Capabilities

### New Capabilities

### Modified Capabilities

- `testing-regression`: Add package-level evidence matrix and coverage classification requirements. / 增加包级 evidence matrix 与 coverage classification 要求。
- `platform-governance`: Add evidence status, missing-evidence, and promotion-blocker requirements. / 增加 evidence status、missing-evidence 与 promotion-blocker 要求。

## Impact

- Owner packages / 责任包: `testing-regression`, `platform-governance`, `apps/cli`, CI scripts.
- Release policy / 发布策略: product-ready claims must cite evidence beyond contract existence. / 产品就绪声明必须引用 contract 存在之外的证据。
