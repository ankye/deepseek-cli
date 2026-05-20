# Governance Evidence Matrix / 治理证据矩阵

The governance evidence matrix is the package-level ledger for product readiness. It records which evidence types exist for each risk-bearing package or capability, and it prevents contract-only coverage from being mistaken for product readiness.

治理证据矩阵是产品就绪的包级账本。它记录每个有风险 package 或 capability 已具备哪些证据类型，并防止把 contract-only 覆盖误当成产品就绪。

## Evidence Types / 证据类型

| Type / 类型 | Meaning / 含义 |
| --- | --- |
| `contract` | DTO, boundary, and API shape tests. / DTO、边界与 API 形状测试。 |
| `integration` | Cross-package or workflow integration evidence. / 跨包或 workflow 集成证据。 |
| `golden` | Deterministic replay evidence. / 确定性 replay 证据。 |
| `matrix` | Platform, terminal, mode, or host matrix coverage. / 平台、终端、mode 或 host 矩阵覆盖。 |
| `e2e` | Product-path end-to-end evidence. / 产品路径端到端证据。 |
| `live-smoke` | Live provider or live CLI smoke evidence. / live provider 或 live CLI 冒烟证据。 |
| `acceptance` | Accepted release evidence under `tests/acceptance/`. / `tests/acceptance/` 下的验收证据。 |
| `readiness` | CLI release/readiness diagnostics evidence. / CLI release/readiness diagnostics 证据。 |

## Risk Tiers / 风险等级

Evidence requirements are risk-based. Runtime kernel, platform contracts, CLI release surface, host promotion, remote/update behavior, semantic indexing, multi-agent writes, and plugin/module execution require stronger evidence than support-only packages.

证据要求基于风险。runtime kernel、platform contracts、CLI release surface、host promotion、remote/update 行为、semantic indexing、多 agent 写执行与 plugin/module execution 比 support-only package 需要更强证据。

| Tier / 等级 | Examples / 示例 |
| --- | --- |
| `critical` | `runtime`, `platform-contracts`, protocol and policy boundaries. / `runtime`、`platform-contracts`、协议与 policy 边界。 |
| `product` | CLI release surface, VSCode host promotion, remote/update features. / CLI 发布面、VSCode host 推广、remote/update 功能。 |
| `platform` | semantic indexing, multi-agent write defaults. / 语义索引、多 agent 默认写执行。 |
| `extension` | plugin/module boundaries and third-party execution gates. / plugin/module 边界与第三方执行门禁。 |
| `support` | testing and diagnostics infrastructure. / 测试与诊断基础设施。 |

## Readiness Rules / 就绪规则

A matrix record is `ready` only when all required evidence types are present and the capability is not `placeholder`, `deferred`, `rollout-gated`, or `unsupported`.

只有当所有必需证据类型都存在，且能力不是 `placeholder`、`deferred`、`rollout-gated` 或 `unsupported` 时，matrix record 才是 `ready`。

Missing evidence becomes a promotion gate. If a user or release metadata claims a gated capability is product-ready, the matrix emits a release-blocking finding.

缺失证据会成为推广门禁。如果用户或 release metadata 声称受门禁能力已经 product-ready，矩阵会输出 release-blocking finding。

## CLI Surface / CLI 表面

`deepseek diagnostics release|doctor|verify` includes `governanceEvidenceMatrix` in JSON output and emits JSONL records:

`deepseek diagnostics release|doctor|verify` 会在 JSON 输出中包含 `governanceEvidenceMatrix`，并输出 JSONL 记录：

- `diagnostics.governance.evidence-matrix.summary`
- `diagnostics.governance.evidence-matrix.record`
- `diagnostics.governance.evidence-matrix.finding`

Text output summarizes record counts, ready/gated totals, blockers, and per-record missing evidence.

Text 输出会摘要 record 数量、ready/gated 总数、blocker 数量，以及每条 record 缺失的证据。

## Evidence / 证据

- `src/packages/testing-regression/src/matrix/index.test.ts`: evidence categories, risk tiers, fixtures, and product-ready blockers. / 证据类型、风险等级、fixtures 与 product-ready blocker。
- `tests/contracts/governance-evidence-matrix.test.ts`: release-readiness consumption and contract shape. / release-readiness 消费与契约形状。
- `tests/golden/governance-evidence-matrix-replay.test.ts`: deterministic replay stability. / 确定性 replay 稳定性。
- `tests/acceptance/latest/governance-evidence-matrix.json`: acceptance fixture. / 验收 fixture。
