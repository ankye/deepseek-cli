## Why

The CLI-first route now depends on turning known reference CLI failure modes into deterministic guardrails before permission, diagnostics, extension, and release UX expands. If these pitfalls remain only in planning prose, later product work can unknowingly recreate bypasses around policy, paths, headless trust, config precedence, remote identity, and redaction.

CLI-first 路线现在依赖在 permissions、diagnostics、extension 和 release UX 扩张前，把参考 CLI 中已知失败模式转成确定性护栏。如果这些坑位只停留在规划文字里，后续产品工作很容易无意重建 policy、path、headless trust、config precedence、remote identity 和 redaction 的绕过路径。

## What Changes

- Add a first-class reference pit fixture catalog in `testing-regression` that enumerates the negative cases DeepSeek must keep covered. / 在 `testing-regression` 中增加一等 reference pit fixture catalog，列出 DeepSeek 必须持续覆盖的负向用例。
- Backfill deterministic tests for bypass permissions, headless approval/trust defaults, shell wrapper/parser fallback risks, path canonicalization, config precedence, plugin permission expansion, remote identity separation, immutable env snapshots, and diagnostic redaction. / 回填确定性测试，覆盖 bypass permissions、headless approval/trust defaults、shell wrapper/parser fallback risks、path canonicalization、config precedence、plugin permission expansion、remote identity separation、immutable env snapshots 和 diagnostic redaction。
- Connect the fixture catalog to product docs and OpenSpec requirements so future CLI-facing changes must classify relevant pit coverage. / 将 fixture catalog 连接到产品文档和 OpenSpec requirements，使后续 CLI-facing 变更必须归类相关坑位覆盖。
- Keep this as a regression and governance pack; do not add new user-facing workflows. / 本变更保持为 regression 与 governance 包，不新增用户可见 workflow。

## Capabilities

### New Capabilities

- `reference-pit-fixtures`: Deterministic negative fixture catalog and regression gates derived from reference CLI pitfalls, expressed in DeepSeek-owned terms. / 基于参考 CLI 坑位提炼、以 DeepSeek 自身术语表达的确定性负向 fixture catalog 与回归门禁。

### Modified Capabilities

- `testing-regression`: Require the regression framework to expose and validate reference pit fixture coverage across unit, contract, matrix, golden, and e2e layers. / 要求 regression framework 暴露并校验 reference pit fixture coverage，覆盖 unit、contract、matrix、golden 和 e2e 层。
- `policy-sandbox`: Require permission bypass, headless trust, shell analysis fallback, and hard safety checks to have negative fixtures. / 要求 permission bypass、headless trust、shell analysis fallback 和 hard safety checks 具备负向 fixtures。
- `platform-abstraction`: Require cross-platform path canonicalization pitfalls to be covered by deterministic fixtures. / 要求跨平台 path canonicalization 坑位由确定性 fixtures 覆盖。
- `config`: Require source precedence and immutable env snapshot pitfalls to be covered by deterministic fixtures. / 要求 source precedence 和 immutable env snapshot 坑位由确定性 fixtures 覆盖。
- `plugin-system`: Require extension permission expansion and lockfile provenance pitfalls to be covered by deterministic fixtures. / 要求 extension permission expansion 和 lockfile provenance 坑位由确定性 fixtures 覆盖。
- `remote-runtime-connectivity`: Require remote/session/display/audit identity separation pitfalls to be covered before host promotion. / 要求 remote/session/display/audit identity separation 坑位在 host promotion 前被 fixture 覆盖。
- `observability-privacy`: Require diagnostic/support bundle redaction pitfalls to be covered by deterministic fixtures. / 要求 diagnostic/support bundle redaction 坑位由确定性 fixtures 覆盖。

## Impact

- Affects `src/packages/testing-regression` by adding shared fixture catalog APIs. / 影响 `src/packages/testing-regression`，新增共享 fixture catalog APIs。
- Adds focused tests under `tests/contracts`, package tests, and matrix/integration tests where owners already exist. / 在已有 owner 下增加聚焦测试，包括 `tests/contracts`、package tests 和 matrix/integration tests。
- May add small helper functions to owner packages to make existing safety decisions easier to assert; no public runtime behavior change is intended. / 可能给 owner packages 增加小型 helper，便于断言现有 safety decisions；不意图改变 public runtime behavior。
- Updates OpenSpec specs and product documentation in bilingual form. / 以双语形式更新 OpenSpec specs 与产品文档。
