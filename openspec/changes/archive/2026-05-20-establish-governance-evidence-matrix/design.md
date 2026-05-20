## Context

Contracts prove boundary shape. They do not prove the CLI product path, live providers, remote/update behavior, plugin safety, or multi-agent writes are ready. A matrix makes the difference visible.

Contracts 证明边界形状。它们不能证明 CLI 产品路径、live providers、remote/update behavior、plugin safety 或 multi-agent writes 已就绪。矩阵让差异可见。

## Goals / Non-Goals

**Goals:**

- Track evidence per package, capability, and host surface. / 按 package、capability 与 host surface 跟踪证据。
- Distinguish contract, integration, golden, matrix, e2e, live smoke, acceptance, and readiness evidence. / 区分 contract、integration、golden、matrix、e2e、live smoke、acceptance 与 readiness evidence。
- Surface missing evidence as promotion gates. / 将缺失证据暴露为推广门禁。

**Non-Goals:**

- Do not require every package to have every test type. / 不要求每个 package 都有所有测试类型。
- Do not make live-provider tests mandatory for offline-only packages. / 不让 offline-only packages 强制需要 live-provider tests。

## Decisions

1. Evidence requirements are risk-based. / 证据要求基于风险。

   Runtime, policy, contracts, protocols, CLI, and extension boundaries need stronger evidence than static utility packages.

   Runtime、policy、contracts、protocols、CLI 与 extension boundaries 比静态 utility packages 需要更强证据。

2. Missing evidence is a first-class state. / 缺失证据是一等状态。

   A capability can be implemented but not product-ready if required evidence is missing.

   某能力可以已实现但因缺少必需证据而不是 product-ready。

3. Matrix output feeds readiness. / Matrix 输出供 readiness 使用。

   The matrix should be machine-readable and consumable by CLI diagnostics.

   矩阵应机器可读，并可被 CLI diagnostics 消费。

4. Implementation is test-first. / 实现必须测试先行。

   Non-documentation implementation work must start by adding or updating focused unit, contract, regression, golden, matrix, integration, or e2e coverage. If no practical test can be written first, the task must record the reason, risk, and substitute verification before implementation begins.

   非文档实现工作必须先增加或更新聚焦的 unit、contract、regression、golden、matrix、integration 或 e2e 覆盖。如果确实无法先写测试，task 必须在实现开始前记录原因、风险和替代验证方式。

## Rollout

1. Define evidence categories and thresholds. / 定义证据类别与阈值。
2. Generate or validate package evidence records. / 生成或校验 package evidence records。
3. Add acceptance fixtures and readiness integration. / 增加 acceptance fixtures 与 readiness integration。

## Open Questions

- Which package categories need live smoke before stable release? / 哪些 package categories 在 stable release 前需要 live smoke？
